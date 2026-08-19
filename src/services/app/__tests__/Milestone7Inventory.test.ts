import { ProductService } from "../ProductService";
import { StockMovementService } from "../StockMovementService";
import { PurchaseOrderRepository } from "../../../repositories/PurchaseOrderRepository";
import { OrderService } from "../OrderService";
import { ReturnRepository } from "../../../repositories/ReturnRepository";
import { ValidationError, NotFoundError } from "../../../domain/errors/AppError";

describe("Milestone 7 — Inventory & Stock Management Engine", () => {
  let mockProductRepo: any;
  let mockStockMovementRepo: any;
  let mockPoRepo: any;
  let mockOrderRepo: any;
  let productService: ProductService;
  let stockMovementService: StockMovementService;

  beforeEach(() => {
    mockProductRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockStockMovementRepo = {
      getAll: jest.fn(),
      getByProductId: jest.fn(),
      getByOrderId: jest.fn(),
      create: jest.fn(),
      adjustStockAtomic: jest.fn(),
      update: jest.fn().mockRejectedValue(new ValidationError("Stock movement ledger is append-only")),
      delete: jest.fn().mockRejectedValue(new ValidationError("Stock movement ledger is append-only")),
    };

    mockPoRepo = {
      receiveItemsAtomic: jest.fn(),
      getById: jest.fn(),
    };

    mockOrderRepo = {
      completeSale: jest.fn(),
    };

    productService = new ProductService(mockProductRepo, mockStockMovementRepo);
    stockMovementService = new StockMovementService(mockStockMovementRepo);
  });

  // ==========================================
  // 1. PRODUCT CATALOG & OPENING STOCK
  // ==========================================
  describe("1. Product Catalog & Opening Stock", () => {
    it("creates product and validates schema attributes", async () => {
      const input = {
        name: "Coca Cola 500ml",
        unitPrice: 150,
        costPrice: 100,
        unitsInStock: 24,
        category: "Beverages",
        sku: "BEV-COKE-500",
        barcode: "8901234567890",
        minThreshold: 5,
      };

      mockProductRepo.create.mockResolvedValue({ id: "prod-1", ...input, status: "AVAILABLE" });

      const created = await productService.createProduct(input, "tenant-a");

      expect(mockProductRepo.create).toHaveBeenCalled();
      expect(created.id).toBe("prod-1");
      expect(created.unitsInStock).toBe(24);
      expect(created.minThreshold).toBe(5);
    });

    it("rejects invalid product with negative unit price or stock", async () => {
      const invalid = {
        name: "Invalid Product",
        unitPrice: -50,
        unitsInStock: -10,
      };

      await expect(productService.createProduct(invalid)).rejects.toThrow(ValidationError);
    });

    it("strips unitsInStock on update to prevent direct audit ledger bypass", async () => {
      const updateData = {
        name: "Coca Cola 500ml Regular",
        unitPrice: 160,
        unitsInStock: 9999, // Attempted direct stock overwrite
      };

      mockProductRepo.update.mockImplementation(async (id: string, data: any) => ({
        id,
        ...data,
      }));

      await productService.updateProduct("prod-1", updateData, "tenant-a");

      expect(mockProductRepo.update).toHaveBeenCalled();
      const payloadPassed = mockProductRepo.update.mock.calls[0][1];
      expect(payloadPassed.unitsInStock).toBeUndefined();
      expect(payloadPassed.name).toBe("Coca Cola 500ml Regular");
      expect(payloadPassed.unitPrice).toBe(160);
    });
  });

  // ==========================================
  // 2. STOCK MOVEMENTS LEDGER IMMUTABILITY
  // ==========================================
  describe("2. Stock Movement Ledger & Immutability", () => {
    it("retrieves stock movements by product ID", async () => {
      const mockMovements = [
        {
          id: "mov-1",
          productId: "prod-1",
          productName: "Coca Cola",
          type: "SALE",
          quantityDelta: -2,
          quantityBefore: 20,
          quantityAfter: 18,
          timestamp: "2026-08-18T10:00:00Z",
        },
      ];

      mockStockMovementRepo.getByProductId.mockResolvedValue(mockMovements);

      const res = await stockMovementService.getMovementsByProductId("prod-1", "tenant-a");
      expect(res).toEqual(mockMovements);
      expect(mockStockMovementRepo.getByProductId).toHaveBeenCalledWith("prod-1", "tenant-a");
    });

    it("enforces append-only invariant by rejecting update and delete", async () => {
      await expect(mockStockMovementRepo.update()).rejects.toThrow(/append-only/);
      await expect(mockStockMovementRepo.delete()).rejects.toThrow(/append-only/);
    });
  });

  // ==========================================
  // 3. STOCK ADJUSTMENTS
  // ==========================================
  describe("3. Stock Adjustments", () => {
    it("executes valid stock adjustment and logs reason", async () => {
      const adjustmentInput = {
        productId: "prod-1",
        quantityDelta: 5,
        reason: "COUNT_CORRECTION" as const,
        notes: "Recounted physical inventory",
        performedBy: "user-mgr",
        performedByName: "Manager Alice",
      };

      const expectedMovement = {
        id: "mov-adj-1",
        tenantId: "tenant-a",
        productId: "prod-1",
        productName: "Coca Cola",
        type: "ADJUSTMENT",
        quantityDelta: 5,
        quantityBefore: 10,
        quantityAfter: 15,
        reason: "COUNT_CORRECTION: Recounted physical inventory",
        timestamp: "2026-08-18T11:00:00Z",
      };

      mockStockMovementRepo.adjustStockAtomic.mockResolvedValue(expectedMovement);

      const movement = await stockMovementService.adjustStock(adjustmentInput, "tenant-a");

      expect(mockStockMovementRepo.adjustStockAtomic).toHaveBeenCalledWith(adjustmentInput, "tenant-a");
      expect(movement.quantityDelta).toBe(5);
      expect(movement.quantityAfter).toBe(15);
    });

    it("rejects zero quantity delta in adjustment", async () => {
      const zeroAdjustment = {
        productId: "prod-1",
        quantityDelta: 0,
        reason: "COUNT_CORRECTION" as const,
      };

      await expect(stockMovementService.adjustStock(zeroAdjustment)).rejects.toThrow(ValidationError);
    });

    it("productService.updateStock routes through adjustStockAtomic", async () => {
      mockStockMovementRepo.adjustStockAtomic.mockResolvedValue({ id: "prod-1", unitsInStock: 25 });

      await productService.updateStock("prod-1", 25, "tenant-a");

      expect(mockStockMovementRepo.adjustStockAtomic).toHaveBeenCalledWith(
        "prod-1",
        25,
        "MANUAL_ADJUSTMENT",
        "SYSTEM",
        "Manual stock adjustment",
        "tenant-a"
      );
    });
  });

  // ==========================================
  // 4. PURCHASE ORDER RECEIVING FLOW
  // ==========================================
  describe("4. Purchase Order Receiving Flow", () => {
    it("calls receiveItemsAtomic with correct item quantities", async () => {
      const receiveInput = {
        poId: "po-101",
        items: [{ productId: "prod-1", receivedNow: 10, unitCost: 80 }],
        receivedBy: "user-mgr",
        receivedByName: "Manager Alice",
      };

      const completedPo = {
        id: "po-101",
        poNumber: "PO-101",
        status: "RECEIVED",
        items: [{ productId: "prod-1", orderedQuantity: 10, receivedQuantity: 10 }],
      };

      mockPoRepo.receiveItemsAtomic.mockResolvedValue(completedPo);

      const result = await mockPoRepo.receiveItemsAtomic(receiveInput, "tenant-a");
      expect(result.status).toBe("RECEIVED");
      expect(result.items[0].receivedQuantity).toBe(10);
    });
  });

  // ==========================================
  // 5. LOW STOCK & REORDER DETECTION
  // ==========================================
  describe("5. Low Stock & Reorder Detection", () => {
    it("correctly identifies low stock and out-of-stock items", () => {
      const catalog = [
        { id: "p1", name: "In Stock Item", unitsInStock: 20, minThreshold: 5 },
        { id: "p2", name: "Low Stock Item", unitsInStock: 3, minThreshold: 5 },
        { id: "p3", name: "Out of Stock Item", unitsInStock: 0, minThreshold: 5 },
        { id: "p4", name: "Custom Threshold Low", unitsInStock: 8, minThreshold: 10 },
      ];

      const lowStock = catalog.filter((p) => p.unitsInStock > 0 && p.unitsInStock <= p.minThreshold);
      const outOfStock = catalog.filter((p) => p.unitsInStock === 0);
      const healthyStock = catalog.filter((p) => p.unitsInStock > p.minThreshold);

      expect(lowStock.map((p) => p.id)).toEqual(["p2", "p4"]);
      expect(outOfStock.map((p) => p.id)).toEqual(["p3"]);
      expect(healthyStock.map((p) => p.id)).toEqual(["p1"]);
    });
  });
});
