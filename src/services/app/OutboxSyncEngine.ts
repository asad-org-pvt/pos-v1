import { OutboxOperation, OutboxStatus } from "../../domain/models/OutboxOperation";
import {
  IndexedDbOutboxRepository,
  indexedDbOutboxRepository,
} from "../../repositories/IndexedDbOutboxRepository";
import { OrderRepository, orderRepository } from "../../repositories/OrderRepository";
import { ConnectivityService, connectivityService } from "./ConnectivityService";
import { Order } from "../../domain/models/Order";

export interface SyncSummary {
  total: number;
  synced: number;
  failed: number;
  conflicts: number;
  blocked: number;
}

export class OutboxSyncEngine {
  private isSyncing: boolean = false;
  private syncListeners: Array<(isSyncing: boolean, summary?: SyncSummary) => void> = [];

  constructor(
    private outboxRepo: IndexedDbOutboxRepository = indexedDbOutboxRepository,
    private orderRepo: OrderRepository = orderRepository,
    private connectivity: ConnectivityService = connectivityService
  ) {}

  public isBusy(): boolean {
    return this.isSyncing;
  }

  public subscribe(listener: (isSyncing: boolean, summary?: SyncSummary) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(isSyncing: boolean, summary?: SyncSummary): void {
    this.syncListeners.forEach((l) => {
      try {
        l(isSyncing, summary);
      } catch (_) {}
    });
  }

  /**
   * Synchronize all pending operations for a tenant in deterministic chronological sequence.
   * Uses concurrency locking to prevent race conditions.
   */
  public async syncQueue(tenantId?: string): Promise<SyncSummary> {
    if (this.isSyncing) {
      return { total: 0, synced: 0, failed: 0, conflicts: 0, blocked: 0 };
    }

    if (this.connectivity.isOffline()) {
      return { total: 0, synced: 0, failed: 0, conflicts: 0, blocked: 0 };
    }

    this.isSyncing = true;
    this.connectivity.setState("SYNCING");
    this.notifyListeners(true);

    const summary: SyncSummary = {
      total: 0,
      synced: 0,
      failed: 0,
      conflicts: 0,
      blocked: 0,
    };

    try {
      const pendingOperations = await this.outboxRepo.getPending(tenantId);
      summary.total = pendingOperations.length;

      for (const op of pendingOperations) {
        // Skip operations scheduled for future retry
        if (op.nextRetryAt && new Date(op.nextRetryAt).getTime() > Date.now()) {
          continue;
        }

        const res = await this.processOperation(op, tenantId);
        if (res.status === "SYNCED") {
          summary.synced++;
        } else if (res.status === "CONFLICT") {
          summary.conflicts++;
        } else if (res.status === "BLOCKED") {
          summary.blocked++;
        } else {
          summary.failed++;
        }
      }
    } finally {
      this.isSyncing = false;
      this.connectivity.setState(this.connectivity.isOffline() ? "OFFLINE" : "ONLINE");
      this.notifyListeners(false, summary);
    }

    return summary;
  }

  /**
   * Process a single outbox operation against authoritative backend transactions.
   */
  public async processOperation(
    op: OutboxOperation,
    tenantId?: string
  ): Promise<OutboxOperation> {
    const targetTenant = tenantId || op.tenantId;

    // 1. Mark as SYNCING
    await this.outboxRepo.updateStatus(
      op.operationId,
      {
        status: "SYNCING",
        attemptCount: op.attemptCount + 1,
        lastAttemptAt: new Date().toISOString(),
      },
      targetTenant
    );

    try {
      if (op.operationType === "CHECKOUT_SALE") {
        // Execute sale atomically reusing OrderRepository.completeSale with idempotency key
        const completedOrder: Order = await this.orderRepo.completeSale(
          {
            ...op.payload,
            idempotencyKey: op.idempotencyKey,
          },
          targetTenant
        );

        // 2. Mark as SYNCED
        return await this.outboxRepo.updateStatus(
          op.operationId,
          {
            status: "SYNCED",
            syncedAt: new Date().toISOString(),
            syncedOrderId: completedOrder.id,
            lastError: undefined,
            conflictReason: undefined,
          },
          targetTenant
        );
      }

      // Unsupported operation types become BLOCKED
      return await this.outboxRepo.updateStatus(
        op.operationId,
        {
          status: "BLOCKED",
          conflictReason: `Unsupported operation type: ${op.operationType}`,
        },
        targetTenant
      );
    } catch (err: any) {
      const errorMsg: string = err?.message || "Unknown synchronization error";
      const isConflict = this.isBusinessConflict(errorMsg);

      if (isConflict) {
        // Business conflicts (e.g. out of stock, closed shift, deleted product) are NOT retried
        return await this.outboxRepo.updateStatus(
          op.operationId,
          {
            status: "CONFLICT",
            lastError: errorMsg,
            conflictReason: errorMsg,
          },
          targetTenant
        );
      }

      // Check if max retries exceeded
      const newAttempts = op.attemptCount + 1;
      if (newAttempts >= op.maxRetries) {
        return await this.outboxRepo.updateStatus(
          op.operationId,
          {
            status: "FAILED",
            lastError: `Max retry limit reached: ${errorMsg}`,
          },
          targetTenant
        );
      }

      // Compute bounded exponential backoff
      const delayMs = Math.min(30000, 1000 * Math.pow(2, newAttempts));
      const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

      return await this.outboxRepo.updateStatus(
        op.operationId,
        {
          status: "PENDING_SYNC",
          lastError: errorMsg,
          nextRetryAt,
        },
        targetTenant
      );
    }
  }

  /**
   * Manually force retry a failed/conflicted operation
   */
  public async retryOperation(operationId: string, tenantId?: string): Promise<OutboxOperation> {
    const op = await this.outboxRepo.getById(operationId, tenantId);
    if (!op) {
      throw new Error(`Operation '${operationId}' not found.`);
    }

    const resetOp = await this.outboxRepo.updateStatus(
      operationId,
      {
        status: "PENDING_SYNC",
        attemptCount: 0,
        nextRetryAt: undefined,
        lastError: undefined,
        conflictReason: undefined,
      },
      tenantId
    );

    return this.processOperation(resetOp, tenantId);
  }

  /**
   * Discard/remove an operation from outbox
   */
  public async discardOperation(operationId: string, tenantId?: string): Promise<void> {
    await this.outboxRepo.remove(operationId, tenantId);
  }

  /**
   * Clear all synced operations
   */
  public async clearSynced(tenantId?: string): Promise<number> {
    return this.outboxRepo.clearSynced(tenantId);
  }

  /**
   * Determines if an error constitutes an unresolvable server business conflict
   */
  private isBusinessConflict(errorMsg: string): boolean {
    const conflictKeywords = [
      "insufficient",
      "out of stock",
      "closed",
      "shift",
      "does not exist",
      "not found",
      "deactivated",
      "unauthorized",
      "permission",
      "validation",
      "invalid",
    ];
    const lower = errorMsg.toLowerCase();
    return conflictKeywords.some((kw) => lower.includes(kw));
  }
}

export const outboxSyncEngine = new OutboxSyncEngine();
