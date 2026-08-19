import { PurchaseOrderService } from "../PurchaseOrderService";
import { SupplierService } from "../SupplierService";
import { ValidationError, NotFoundError } from "../../../domain/errors/AppError";

describe("Milestone 8 — Procurement, Suppliers & Purchase Orders Engine", () => {
  let mockPoRepo: any;
  let mockSupplierRepo: any;
  let poService: PurchaseOrderService;
  let supplierService: SupplierService;

  beforeEach(() => {
    mockPoRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      receiveItemsAtomic: jest.fn(),
      getBySupplierId: jest.fn(),
    };

    mockSupplierRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    poService = new PurchaseOrderService(mockPoRepo);
    supplierService = new SupplierService(mockSupplierRepo);
  });

  // ==========================================
  // 1. SUPPLIER MANAGEMENT
  // ==========================================
  describe("1. Supplier Management", () => {
    it("creates a supplier with complete contact attributes", async () => {
      const input = {
        name: "Beverage Distributors Ltd",
        email: "orders@bevdist.com",
        phoneNumber: "+1234567890",
        address: "123 Industrial Way",
        city: "Metropolis",
        companyName: "BevDist Corp",
        isActive: true,
      };

      mockSupplierRepo.create.mockResolvedValue({ id: "sup-1", ...input });

      const created = await supplierService.createSupplier(input, "tenant-a");

      expect(mockSupplierRepo.create).toHaveBeenCalled();
      expect(created.id).toBe("sup-1");
      expect(created.name).toBe("Beverage Distributors Ltd");
      expect(created.isActive).toBe(true);
    });

    it("rejects supplier creation with missing name", async () => {
      const invalid = {
        email: "test@supplier.com",
      };

      await expect(supplierService.createSupplier(invalid)).rejects.toThrow(ValidationError);
    });

    it("soft-deactivates supplier to preserve historical procurement references", async () => {
      mockSupplierRepo.update.mockResolvedValue({ id: "sup-1", name: "BevDist", isActive: false });

      const deactivated = await supplierService.deactivateSupplier("sup-1", "tenant-a");

      expect(mockSupplierRepo.update).toHaveBeenCalledWith(
        "sup-1",
        expect.objectContaining({ isActive: false }),
        "tenant-a"
      );
      expect(deactivated.isActive).toBe(false);
    });
  });

  // ==========================================
  // 2. PURCHASE ORDER CREATION & CALCULATIONS
  // ==========================================
  describe("2. Purchase Order Creation & Calculation", () => {
    it("creates PO and correctly computes line costs and total", async () => {
      const poInput = {
        supplierId: "sup-1",
        supplierName: "Beverage Distributors Ltd",
        items: [
          { productId: "prod-1", name: "Cola 500ml", sku: "COKE-500", orderedQuantity: 50, unitCost: 80 },
          { productId: "prod-2", name: "Water 1L", sku: "WATER-1L", orderedQuantity: 20, unitCost: 30 },
        ],
        notes: "Restock for weekend rush",
        createdBy: "user-mgr",
        createdByName: "Manager Alice",
      };

      // Subtotal: (50*80) + (20*30) = 4000 + 600 = 4600
      mockPoRepo.create.mockImplementation(async (data: any) => ({
        id: "po-101",
        ...data,
      }));

      const created = await poService.createPurchaseOrder(poInput, "tenant-a");

      expect(mockPoRepo.create).toHaveBeenCalled();
      expect(created.subtotal).toBe(4600);
      expect(created.total).toBe(4600);
      expect(created.status).toBe("ORDERED");
      expect(created.items.length).toBe(2);
    });

    it("rejects PO creation without any items", async () => {
      const emptyPo = {
        supplierId: "sup-1",
        supplierName: "Beverage Distributors Ltd",
        items: [],
      };

      await expect(poService.createPurchaseOrder(emptyPo)).rejects.toThrow(ValidationError);
    });

    it("rejects PO item with negative unit cost or zero quantity", async () => {
      const invalidCostPo = {
        supplierId: "sup-1",
        supplierName: "Beverage Distributors Ltd",
        items: [{ productId: "prod-1", name: "Cola", orderedQuantity: 10, unitCost: -5 }],
      };

      await expect(poService.createPurchaseOrder(invalidCostPo)).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================
  // 3. PURCHASE ORDER LIFECYCLE & CANCELLATION
  // ==========================================
  describe("3. Purchase Order Lifecycle & Cancellation", () => {
    it("cancels an open ORDERED purchase order", async () => {
      const openPo = {
        id: "po-102",
        poNumber: "PO-102",
        status: "ORDERED" as const,
      };

      mockPoRepo.getById.mockResolvedValue(openPo);
      mockPoRepo.update.mockResolvedValue({ ...openPo, status: "CANCELLED" });

      const cancelled = await poService.cancelPurchaseOrder("po-102", "tenant-a");

      expect(mockPoRepo.update).toHaveBeenCalledWith("po-102", expect.objectContaining({ status: "CANCELLED" }), "tenant-a");
      expect(cancelled.status).toBe("CANCELLED");
    });

    it("rejects cancellation of a PARTIALLY_RECEIVED or RECEIVED purchase order", async () => {
      const partialPo = {
        id: "po-103",
        poNumber: "PO-103",
        status: "PARTIALLY_RECEIVED" as const,
      };

      mockPoRepo.getById.mockResolvedValue(partialPo);

      await expect(poService.cancelPurchaseOrder("po-103", "tenant-a")).rejects.toThrow(
        /Cannot cancel a purchase order that has already been partially or fully received/
      );
      expect(mockPoRepo.update).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // 4. GOODS RECEIVING FLOW & PARTIAL DELIVERIES
  // ==========================================
  describe("4. Goods Receiving Flow & Partial Deliveries", () => {
    it("processes partial receiving and updates PO state", async () => {
      const receiveInput = {
        poId: "po-104",
        items: [{ productId: "prod-1", receivedNow: 25, unitCost: 80 }],
        receivedBy: "user-mgr",
        receivedByName: "Manager Alice",
      };

      const partiallyReceivedPo = {
        id: "po-104",
        poNumber: "PO-104",
        status: "PARTIALLY_RECEIVED" as const,
        items: [{ productId: "prod-1", orderedQuantity: 50, receivedQuantity: 25 }],
      };

      mockPoRepo.receiveItemsAtomic.mockResolvedValue(partiallyReceivedPo);

      const res = await poService.receiveItems(receiveInput, "tenant-a");

      expect(mockPoRepo.receiveItemsAtomic).toHaveBeenCalledWith(
        expect.objectContaining({
          poId: "po-104",
          receivedBy: "user-mgr",
          receivedByName: "Manager Alice",
        }),
        "tenant-a"
      );
      expect(res.status).toBe("PARTIALLY_RECEIVED");
      expect(res.items[0].receivedQuantity).toBe(25);
    });

    it("processes final delivery to mark PO as fully RECEIVED", async () => {
      const secondReceiveInput = {
        poId: "po-104",
        items: [{ productId: "prod-1", receivedNow: 25, unitCost: 80 }],
        receivedBy: "user-mgr",
        receivedByName: "Manager Alice",
      };

      const fullyReceivedPo = {
        id: "po-104",
        poNumber: "PO-104",
        status: "RECEIVED" as const,
        items: [{ productId: "prod-1", orderedQuantity: 50, receivedQuantity: 50 }],
      };

      mockPoRepo.receiveItemsAtomic.mockResolvedValue(fullyReceivedPo);

      const res = await poService.receiveItems(secondReceiveInput, "tenant-a");

      expect(res.status).toBe("RECEIVED");
      expect(res.items[0].receivedQuantity).toBe(50);
    });

    it("rejects receiving request with empty items array", async () => {
      const emptyReceive = {
        poId: "po-104",
        items: [],
      };

      await expect(poService.receiveItems(emptyReceive as any)).rejects.toThrow(ValidationError);
    });
  });
});
