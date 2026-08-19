import { CreateOrderInput, Order } from "../../domain/models/Order";
import { Product } from "../../domain/models/Product";

export interface QueuedSaleMutation {
  id: string;
  tenantId: string;
  idempotencyKey: string;
  payload: CreateOrderInput;
  createdAt: string;
  retryCount: number;
  status: "QUEUED" | "SYNCING" | "SYNCED" | "FAILED";
  lastError?: string;
}

const STORAGE_KEY_QUEUE = "pos_offline_sales_queue";
const STORAGE_KEY_PRODUCTS = "pos_offline_products_cache";

export class OfflineSyncService {
  private isOnlineStatus: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnlineStatus = true;
        this.notifyListeners();
      });
      window.addEventListener("offline", () => {
        this.isOnlineStatus = false;
        this.notifyListeners();
      });
    }
  }

  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.isOnlineStatus));
  }

  // =========================================================================
  // LOCAL PRODUCT CATALOG CACHE
  // =========================================================================

  public cacheProducts(products: Product[], tenantId?: string): void {
    if (typeof localStorage === "undefined") return;
    const key = `${STORAGE_KEY_PRODUCTS}_${tenantId || "default"}`;
    try {
      localStorage.setItem(key, JSON.stringify(products));
    } catch (e) {
      console.warn("Could not cache products locally", e);
    }
  }

  public getCachedProducts(tenantId?: string): Product[] {
    if (typeof localStorage === "undefined") return [];
    const key = `${STORAGE_KEY_PRODUCTS}_${tenantId || "default"}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // =========================================================================
  // DURABLE OFFLINE MUTATION QUEUE
  // =========================================================================

  public enqueueSale(payload: CreateOrderInput, tenantId?: string): QueuedSaleMutation {
    const activeTenant = tenantId || "default";
    const idempotencyKey = payload.idempotencyKey || `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const mutationId = `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const mutation: QueuedSaleMutation = {
      id: mutationId,
      tenantId: activeTenant,
      idempotencyKey,
      payload: {
        ...payload,
        idempotencyKey,
      },
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: "QUEUED",
    };

    const queue = this.getQueue(activeTenant);
    queue.push(mutation);
    this.saveQueue(queue, activeTenant);

    return mutation;
  }

  public getQueue(tenantId?: string): QueuedSaleMutation[] {
    if (typeof localStorage === "undefined") return [];
    const key = `${STORAGE_KEY_QUEUE}_${tenantId || "default"}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private saveQueue(queue: QueuedSaleMutation[], tenantId?: string): void {
    if (typeof localStorage === "undefined") return;
    const key = `${STORAGE_KEY_QUEUE}_${tenantId || "default"}`;
    try {
      localStorage.setItem(key, JSON.stringify(queue));
    } catch (e) {
      console.warn("Could not persist offline queue", e);
    }
  }

  /**
   * Replays all queued sales against live backend using idempotent execution.
   */
  public async replayQueue(
    completeSaleFn: (payload: CreateOrderInput, tenantId?: string) => Promise<Order>,
    tenantId?: string
  ): Promise<{ synced: number; failed: number }> {
    const activeTenant = tenantId || "default";
    const queue = this.getQueue(activeTenant);
    let synced = 0;
    let failed = 0;

    const remainingQueue: QueuedSaleMutation[] = [];

    for (const mutation of queue) {
      if (mutation.status === "SYNCED") continue;

      try {
        mutation.status = "SYNCING";
        await completeSaleFn(mutation.payload, activeTenant);
        mutation.status = "SYNCED";
        synced++;
      } catch (err: any) {
        mutation.status = "FAILED";
        mutation.retryCount += 1;
        mutation.lastError = err.message || "Replay error";
        failed++;
        remainingQueue.push(mutation);
      }
    }

    this.saveQueue(remainingQueue, activeTenant);
    return { synced, failed };
  }

  public clearQueue(tenantId?: string): void {
    if (typeof localStorage === "undefined") return;
    const key = `${STORAGE_KEY_QUEUE}_${tenantId || "default"}`;
    localStorage.removeItem(key);
  }
}

export const offlineSyncService = new OfflineSyncService();
