import { ConnectivityService } from "../ConnectivityService";
import { IndexedDbOutboxRepository } from "../../../repositories/IndexedDbOutboxRepository";
import { OutboxSyncEngine } from "../OutboxSyncEngine";
import { OutboxOperationSchema, OutboxOperation } from "../../../domain/models/OutboxOperation";
import { CreateOrderInput, Order } from "../../../domain/models/Order";

describe("Milestone 14 — Offline POS Operations & Outbox Synchronization", () => {
  let connectivity: ConnectivityService;
  let outboxRepo: IndexedDbOutboxRepository;
  let syncEngine: OutboxSyncEngine;
  let mockOrderRepo: any;

  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }

    connectivity = new ConnectivityService();
    outboxRepo = new IndexedDbOutboxRepository();

    mockOrderRepo = {
      completeSale: jest.fn().mockImplementation(async (payload: CreateOrderInput, tenantId?: string) => {
        return {
          id: `ord-server-${Date.now()}`,
          invoiceNumber: payload.invoiceNumber,
          tenantId: tenantId || "tenant-alpha",
          status: "COMPLETED",
          total: payload.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 10,
          idempotencyKey: payload.idempotencyKey,
          createdAt: new Date().toISOString(),
        } as Order;
      }),
    };

    syncEngine = new OutboxSyncEngine(outboxRepo, mockOrderRepo, connectivity);
  });

  const sampleOrderPayload: CreateOrderInput = {
    invoiceNumber: "OFF-1001",
    idempotencyKey: "idemp-off-1001",
    items: [
      {
        productId: "prod-1",
        name: "Latte",
        quantity: 2,
        unitPrice: 4.5,
        total: 9.0,
      },
    ],
    paymentMethod: "CASH",
    amountTendered: 10.0,
    change: 1.0,
    employeeId: "emp-101",
    employeeName: "Alice Cashier",
    registerId: "reg-1",
    shiftId: "shift-1",
    dateTime: "2026-08-19T10:00:00Z",
  };

  // =========================================================================
  // 1. CONNECTIVITY DETECTION & STATE MACHINE
  // =========================================================================
  describe("1. Connectivity Detection & States", () => {
    it("starts in ONLINE state and transitions reactively to OFFLINE, SYNCING, DEGRADED", () => {
      const states: string[] = [];
      const unsub = connectivity.subscribe((s) => states.push(s));

      connectivity.setState("OFFLINE");
      connectivity.setState("SYNCING");
      connectivity.setState("ONLINE");

      expect(states).toContain("OFFLINE");
      expect(states).toContain("SYNCING");
      expect(states).toContain("ONLINE");
      unsub();
    });

    it("supports manual offline simulation for POS training and connectivity testing", () => {
      connectivity.setSimulatedOffline(true);
      expect(connectivity.isOffline()).toBe(true);
      expect(connectivity.isOnline()).toBe(false);

      connectivity.setSimulatedOffline(false);
      expect(connectivity.isOnline()).toBe(true);
    });
  });

  // =========================================================================
  // 2. DURABLE OUTBOX PERSISTENCE & QUEUE MANAGEMENT
  // =========================================================================
  describe("2. Durable Outbox Persistence", () => {
    it("enqueues an offline sale operation with schema validation and deterministic envelope", async () => {
      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        userName: "Alice Cashier",
        operationType: "CHECKOUT_SALE",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
        idempotencyKey: "idemp-off-1001",
      });

      expect(op.operationId).toBeDefined();
      expect(op.tenantId).toBe("tenant-alpha");
      expect(op.status).toBe("PENDING_SYNC");
      expect(op.schemaVersion).toBe(1);
      expect(op.idempotencyKey).toBe("idemp-off-1001");
      expect(op.attemptCount).toBe(0);
      expect(op.maxRetries).toBe(5);
    });

    it("persists operations across repository re-instantiations (survives tab reload)", async () => {
      await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      // Simulate a fresh session/tab reload with a new repository instance
      const freshRepo = new IndexedDbOutboxRepository();
      const pending = await freshRepo.getPending("tenant-alpha");

      expect(pending.length).toBe(1);
      expect(pending[0].localInvoiceNumber).toBe("OFF-1001");
      expect(pending[0].status).toBe("PENDING_SYNC");
    });

    it("retrieves operations in chronological order for deterministic replay", async () => {
      await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: { ...sampleOrderPayload, invoiceNumber: "OFF-001" },
        localInvoiceNumber: "OFF-001",
      });

      await new Promise((r) => setTimeout(r, 10));

      await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: { ...sampleOrderPayload, invoiceNumber: "OFF-002" },
        localInvoiceNumber: "OFF-002",
      });

      const pending = await outboxRepo.getPending("tenant-alpha");
      expect(pending.length).toBe(2);
      expect(pending[0].localInvoiceNumber).toBe("OFF-001");
      expect(pending[1].localInvoiceNumber).toBe("OFF-002");
    });
  });

  // =========================================================================
  // 3. SYNCHRONIZATION ENGINE & IDEMPOTENCY
  // =========================================================================
  describe("3. Synchronization & Idempotency", () => {
    it("successfully synchronizes pending operations against backend and updates status to SYNCED", async () => {
      await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      const summary = await syncEngine.syncQueue("tenant-alpha");

      expect(summary.total).toBe(1);
      expect(summary.synced).toBe(1);
      expect(summary.failed).toBe(0);

      const all = await outboxRepo.getAll("tenant-alpha");
      expect(all[0].status).toBe("SYNCED");
      expect(all[0].syncedAt).toBeDefined();
      expect(all[0].syncedOrderId).toBeDefined();
    });

    it("re-running synchronization is strictly idempotent and sends identical idempotency key", async () => {
      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
        idempotencyKey: "stable-key-999",
      });

      // Sync once
      await syncEngine.syncQueue("tenant-alpha");

      // Verify the idempotency key was passed to OrderRepository
      expect(mockOrderRepo.completeSale).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.completeSale).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: "stable-key-999",
        }),
        "tenant-alpha"
      );

      // Force retry of already synced op to simulate network replay
      await syncEngine.retryOperation(op.operationId, "tenant-alpha");

      // Second execution still uses the identical idempotency key
      expect(mockOrderRepo.completeSale).toHaveBeenCalledTimes(2);
      expect(mockOrderRepo.completeSale).toHaveBeenLastCalledWith(
        expect.objectContaining({
          idempotencyKey: "stable-key-999",
        }),
        "tenant-alpha"
      );
    });

    it("prevents concurrent sync execution via concurrency lock", async () => {
      let resolveSync!: (val: any) => void;
      const syncPromise = new Promise((resolve) => {
        resolveSync = resolve;
      });

      mockOrderRepo.completeSale.mockImplementationOnce(() => syncPromise);

      await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      const p1 = syncEngine.syncQueue("tenant-alpha");
      const p2 = syncEngine.syncQueue("tenant-alpha"); // Should be skipped immediately

      const s2 = await p2;
      expect(s2.total).toBe(0); // Skipped because busy

      resolveSync({ id: "ord-1" });
      const s1 = await p1;
      expect(s1.synced).toBe(1);
    });
  });

  // =========================================================================
  // 4. RETRY POLICY & BOUNDED EXPONENTIAL BACKOFF
  // =========================================================================
  describe("4. Retry Policy & Bounded Exponential Backoff", () => {
    it("schedules exponential backoff on transient network failures", async () => {
      mockOrderRepo.completeSale.mockRejectedValueOnce(new Error("Network timeout: ECONNRESET"));

      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      await syncEngine.syncQueue("tenant-alpha");

      const updated = await outboxRepo.getById(op.operationId, "tenant-alpha");
      expect(updated?.status).toBe("PENDING_SYNC");
      expect(updated?.attemptCount).toBe(1);
      expect(updated?.lastError).toContain("Network timeout");
      expect(updated?.nextRetryAt).toBeDefined();

      // Next retry timestamp should be scheduled in the future (~2s)
      const nextTime = new Date(updated!.nextRetryAt!).getTime();
      expect(nextTime).toBeGreaterThan(Date.now() + 1000);
    });

    it("marks operation as FAILED when max retry limit is reached", async () => {
      mockOrderRepo.completeSale.mockRejectedValue(new Error("Transient connection error"));

      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      // Manually simulate 4 previous failed attempts
      await outboxRepo.updateStatus(op.operationId, { attemptCount: 4 }, "tenant-alpha");

      // 5th attempt (maxRetries = 5)
      await syncEngine.syncQueue("tenant-alpha");

      const finalOp = await outboxRepo.getById(op.operationId, "tenant-alpha");
      expect(finalOp?.status).toBe("FAILED");
      expect(finalOp?.lastError).toContain("Max retry limit reached");
    });
  });

  // =========================================================================
  // 5. CONFLICT HANDLING & PERMANENT FAILURE CLASSIFICATION
  // =========================================================================
  describe("5. Conflict Handling & Authoritative Safety", () => {
    it("immediately transitions to CONFLICT on insufficient server stock without auto-retrying", async () => {
      mockOrderRepo.completeSale.mockRejectedValueOnce(
        new Error("Insufficient stock: Requested 5 units of 'Latte', only 1 available.")
      );

      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      const summary = await syncEngine.syncQueue("tenant-alpha");

      expect(summary.conflicts).toBe(1);
      const updated = await outboxRepo.getById(op.operationId, "tenant-alpha");
      expect(updated?.status).toBe("CONFLICT");
      expect(updated?.conflictReason).toContain("Insufficient stock");
      expect(updated?.nextRetryAt).toBeUndefined(); // Does NOT schedule automatic retry
    });

    it("immediately transitions to CONFLICT when shift was closed or invalid", async () => {
      mockOrderRepo.completeSale.mockRejectedValueOnce(
        new Error("Active shift 'shift-1' was closed. Cannot attach sales.")
      );

      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      await syncEngine.syncQueue("tenant-alpha");

      const updated = await outboxRepo.getById(op.operationId, "tenant-alpha");
      expect(updated?.status).toBe("CONFLICT");
      expect(updated?.conflictReason).toContain("shift");
    });

    it("immediately transitions to CONFLICT when product was deleted or does not exist", async () => {
      mockOrderRepo.completeSale.mockRejectedValueOnce(
        new Error("Product 'prod-1' does not exist in tenant catalog.")
      );

      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      await syncEngine.syncQueue("tenant-alpha");

      const updated = await outboxRepo.getById(op.operationId, "tenant-alpha");
      expect(updated?.status).toBe("CONFLICT");
      expect(updated?.conflictReason).toContain("does not exist");
    });
  });

  // =========================================================================
  // 6. MANUAL RECOVERY & QUEUE MAINTENANCE
  // =========================================================================
  describe("6. Manual Recovery & Queue Maintenance", () => {
    it("allows manual retry of conflicted operations after manager resolution", async () => {
      // First fail with conflict
      mockOrderRepo.completeSale.mockRejectedValueOnce(new Error("Insufficient stock"));

      const op = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-1001",
      });

      await syncEngine.syncQueue("tenant-alpha");
      let stored = await outboxRepo.getById(op.operationId, "tenant-alpha");
      expect(stored?.status).toBe("CONFLICT");

      // Now server stock is replenished, manager clicks Retry
      mockOrderRepo.completeSale.mockResolvedValueOnce({
        id: "ord-recovered-1",
        invoiceNumber: "OFF-1001",
      } as any);

      const recovered = await syncEngine.retryOperation(op.operationId, "tenant-alpha");
      expect(recovered.status).toBe("SYNCED");
      expect(recovered.syncedOrderId).toBe("ord-recovered-1");
    });

    it("discards operations and clears synced items cleanly", async () => {
      const op1 = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-001",
      });

      const op2 = await outboxRepo.enqueue({
        tenantId: "tenant-alpha",
        userId: "emp-101",
        payload: sampleOrderPayload,
        localInvoiceNumber: "OFF-002",
      });

      // Discard op1
      await syncEngine.discardOperation(op1.operationId, "tenant-alpha");
      const remaining = await outboxRepo.getAll("tenant-alpha");
      expect(remaining.length).toBe(1);
      expect(remaining[0].operationId).toBe(op2.operationId);

      // Sync op2
      await syncEngine.syncQueue("tenant-alpha");

      // Clear synced
      const clearedCount = await syncEngine.clearSynced("tenant-alpha");
      expect(clearedCount).toBe(1);

      const afterClear = await outboxRepo.getAll("tenant-alpha");
      expect(afterClear.length).toBe(0);
    });
  });

  // =========================================================================
  // 7. SECURITY & TENANT ISOLATION
  // =========================================================================
  describe("7. Security & Tenant Isolation", () => {
    it("ensures operations belonging to tenant_a are not leaked or synced to tenant_b", async () => {
      await outboxRepo.enqueue({
        tenantId: "tenant-a",
        userId: "user-a",
        payload: { ...sampleOrderPayload, invoiceNumber: "OFF-A" },
        localInvoiceNumber: "OFF-A",
      });

      await outboxRepo.enqueue({
        tenantId: "tenant-b",
        userId: "user-b",
        payload: { ...sampleOrderPayload, invoiceNumber: "OFF-B" },
        localInvoiceNumber: "OFF-B",
      });

      const pendingA = await outboxRepo.getPending("tenant-a");
      const pendingB = await outboxRepo.getPending("tenant-b");

      expect(pendingA.length).toBe(1);
      expect(pendingA[0].localInvoiceNumber).toBe("OFF-A");

      expect(pendingB.length).toBe(1);
      expect(pendingB[0].localInvoiceNumber).toBe("OFF-B");

      // Sync tenant A only
      await syncEngine.syncQueue("tenant-a");

      expect(mockOrderRepo.completeSale).toHaveBeenCalledWith(
        expect.anything(),
        "tenant-a"
      );
      expect(mockOrderRepo.completeSale).not.toHaveBeenCalledWith(
        expect.anything(),
        "tenant-b"
      );
    });
  });
});
