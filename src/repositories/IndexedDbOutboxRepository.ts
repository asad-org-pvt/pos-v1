import {
  OutboxOperation,
  OutboxOperationSchema,
  CreateOutboxOperationInput,
  OutboxStatus,
} from "../domain/models/OutboxOperation";
import { ValidationError, formatZodError } from "../domain/errors/AppError";

const DB_NAME = "pos_offline_db";
const STORE_NAME = "outbox_operations";
const DB_VERSION = 1;
const LOCAL_STORAGE_BACKUP_KEY = "pos_offline_outbox_fallback_";

export class IndexedDbOutboxRepository {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private async getDb(): Promise<IDBDatabase | null> {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      return null;
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "operationId" });
            store.createIndex("tenantId", "tenantId", { unique: false });
            store.createIndex("status", "status", { unique: false });
            store.createIndex("createdAt", "createdAt", { unique: false });
          }
        };

        request.onsuccess = (event: any) => {
          resolve(event.target.result);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch (err) {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Enqueue a new offline operation durably into IndexedDB
   */
  async enqueue(input: CreateOutboxOperationInput): Promise<OutboxOperation> {
    const operationId = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey =
      input.idempotencyKey ||
      input.payload?.idempotencyKey ||
      `idemp_${input.tenantId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const rawOp: OutboxOperation = {
      operationId,
      tenantId: input.tenantId,
      userId: input.userId,
      userName: input.userName || "",
      operationType: input.operationType || "CHECKOUT_SALE",
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      payload: {
        ...input.payload,
        idempotencyKey,
      },
      status: "PENDING_SYNC",
      attemptCount: 0,
      maxRetries: 5,
      idempotencyKey,
      localInvoiceNumber: input.localInvoiceNumber,
      affectedProductIds:
        input.affectedProductIds ||
        (input.payload?.products ? input.payload.products.map((p: any) => p.productId) : []),
    };

    const parsed = OutboxOperationSchema.safeParse(rawOp);
    if (!parsed.success) {
      throw new ValidationError(
        `Failed to enqueue outbox operation: ${formatZodError(parsed.error)}`
      );
    }

    const validOp = parsed.data;

    // 1. Save to IndexedDB if available
    const db = await this.getDb();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction([STORE_NAME], "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(validOp);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (e) {
          resolve(); // Fallback to localStorage
        }
      });
    }

    // 2. Always maintain localStorage mirror for extreme durability across tab close/private browsing
    this.saveToLocalStorage(validOp);

    return validOp;
  }

  /**
   * Get pending sync operations for tenant, ordered by creation time
   */
  async getPending(tenantId?: string): Promise<OutboxOperation[]> {
    const all = await this.getAll(tenantId);
    return all
      .filter((op) => op.status === "PENDING_SYNC" || op.status === "SYNCING")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Get all operations (including synced, failed, blocked, conflict)
   */
  async getAll(tenantId?: string): Promise<OutboxOperation[]> {
    const db = await this.getDb();
    if (db) {
      const items = await new Promise<OutboxOperation[]>((resolve) => {
        try {
          const tx = db.transaction([STORE_NAME], "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch (e) {
          resolve([]);
        }
      });

      if (items.length > 0) {
        if (!tenantId || tenantId === "default") return items;
        return items.filter((op) => op.tenantId === tenantId);
      }
    }

    // Fallback to localStorage mirror
    return this.getFromLocalStorage(tenantId);
  }

  /**
   * Get a single operation by ID
   */
  async getById(operationId: string, tenantId?: string): Promise<OutboxOperation | null> {
    const all = await this.getAll(tenantId);
    return all.find((op) => op.operationId === operationId) || null;
  }

  /**
   * Update operation state, status, errors, and retry counts
   */
  async updateStatus(
    operationId: string,
    updates: Partial<OutboxOperation>,
    tenantId?: string
  ): Promise<OutboxOperation> {
    const existing = await this.getById(operationId, tenantId);
    if (!existing) {
      throw new Error(`Outbox operation '${operationId}' not found.`);
    }

    const updated: OutboxOperation = {
      ...existing,
      ...updates,
      lastAttemptAt: updates.lastAttemptAt || new Date().toISOString(),
    };

    const db = await this.getDb();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction([STORE_NAME], "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(updated);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });
    }

    this.saveToLocalStorage(updated);
    return updated;
  }

  /**
   * Remove operation
   */
  async remove(operationId: string, tenantId?: string): Promise<void> {
    const db = await this.getDb();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction([STORE_NAME], "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(operationId);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });
    }

    this.removeFromLocalStorage(operationId, tenantId);
  }

  /**
   * Clear all successfully synced operations to reclaim storage
   */
  async clearSynced(tenantId?: string): Promise<number> {
    const all = await this.getAll(tenantId);
    const synced = all.filter((op) => op.status === "SYNCED");
    for (const op of synced) {
      await this.remove(op.operationId, op.tenantId);
    }
    return synced.length;
  }

  /**
   * Count pending operations
   */
  async countPending(tenantId?: string): Promise<number> {
    const pending = await this.getPending(tenantId);
    return pending.length;
  }

  // =========================================================================
  // LOCAL STORAGE BACKUP MIRROR
  // =========================================================================

  private getLocalStorageKey(tenantId?: string): string {
    return `${LOCAL_STORAGE_BACKUP_KEY}${tenantId || "all"}`;
  }

  private saveToLocalStorage(op: OutboxOperation): void {
    if (typeof localStorage === "undefined") return;
    try {
      const key = this.getLocalStorageKey("all");
      const existing = this.getFromLocalStorage();
      const index = existing.findIndex((o) => o.operationId === op.operationId);
      if (index >= 0) {
        existing[index] = op;
      } else {
        existing.push(op);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}
  }

  private getFromLocalStorage(tenantId?: string): OutboxOperation[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const key = this.getLocalStorageKey("all");
      const data = localStorage.getItem(key);
      if (!data) return [];
      const list: OutboxOperation[] = JSON.parse(data);
      if (!tenantId || tenantId === "default") return list;
      return list.filter((op) => op.tenantId === tenantId);
    } catch (_) {
      return [];
    }
  }

  private removeFromLocalStorage(operationId: string, _tenantId?: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      const key = this.getLocalStorageKey("all");
      const existing = this.getFromLocalStorage();
      const filtered = existing.filter((o) => o.operationId !== operationId);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (_) {}
  }
}

export const indexedDbOutboxRepository = new IndexedDbOutboxRepository();
