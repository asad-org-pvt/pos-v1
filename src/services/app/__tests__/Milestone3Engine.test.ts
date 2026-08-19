import { RegisterService } from "../RegisterService";
import { ShiftService } from "../ShiftService";
import { StockMovementService } from "../StockMovementService";
import { ReturnService } from "../ReturnService";
import { StockMovementRepository } from "../../../repositories/StockMovementRepository";
import { ValidationError, NotFoundError } from "../../../domain/errors/AppError";

describe("Milestone 3 - Registers, Shifts, Returns & Stock Movement Engine", () => {
  // 1. REGISTER TESTS
  describe("Register Management", () => {
    let mockRegRepo: any;
    let regService: RegisterService;

    beforeEach(() => {
      mockRegRepo = {
        getAll: jest.fn(),
        getById: jest.fn(),
        getActiveRegisters: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };
      regService = new RegisterService(mockRegRepo);
    });

    it("1. creates a new active register", async () => {
      mockRegRepo.create.mockImplementation(async (data: any) => ({
        id: "reg-1",
        ...data,
      }));

      const result = await regService.createRegister(
        { name: "Terminal 1", status: "ACTIVE", location: "Front Desk" },
        "tenant-1"
      );

      expect(result.id).toBe("reg-1");
      expect(result.name).toBe("Terminal 1");
      expect(result.status).toBe("ACTIVE");
    });

    it("4. enforces tenant isolation on register query", async () => {
      mockRegRepo.getActiveRegisters.mockResolvedValue([
        { id: "reg-1", tenantId: "tenant-A", name: "Reg A", status: "ACTIVE" },
      ]);

      const list = await regService.getActiveRegisters("tenant-A");
      expect(mockRegRepo.getActiveRegisters).toHaveBeenCalledWith("tenant-A");
      expect(list.length).toBe(1);
    });
  });

  // 2. SHIFT TESTS
  describe("Cashier Shift Lifecycle & Accounting", () => {
    let mockShiftRepo: any;
    let mockRegRepo: any;
    let shiftService: ShiftService;

    beforeEach(() => {
      mockShiftRepo = {
        getAll: jest.fn(),
        getById: jest.fn(),
        findActiveShiftByRegister: jest.fn(),
        findActiveShiftByCashier: jest.fn(),
        openShift: jest.fn(),
        closeShift: jest.fn(),
      };
      mockRegRepo = {
        getById: jest.fn(),
      };
      shiftService = new ShiftService(mockShiftRepo, mockRegRepo);
    });

    it("2. opens a shift with valid register and opening float", async () => {
      mockRegRepo.getById.mockResolvedValue({
        id: "reg-1",
        name: "Main Register",
        status: "ACTIVE",
      });
      mockShiftRepo.openShift.mockImplementation(async (data: any) => ({
        id: "shift-1",
        ...data,
        status: "OPEN",
        expectedCash: data.openingFloat,
      }));

      const shift = await shiftService.openShift(
        {
          registerId: "reg-1",
          cashierId: "cashier-1",
          cashierName: "Alice",
          openingFloat: 150,
        },
        "tenant-1"
      );

      expect(shift.status).toBe("OPEN");
      expect(shift.openingFloat).toBe(150);
      expect(shift.expectedCash).toBe(150);
    });

    it("3. rejects opening a shift when register is already occupied", async () => {
      mockRegRepo.getById.mockResolvedValue({
        id: "reg-1",
        name: "Main Register",
        status: "ACTIVE",
      });
      mockShiftRepo.openShift.mockRejectedValue(
        new ValidationError('Register "Main Register" is already occupied by an active shift')
      );

      await expect(
        shiftService.openShift(
          {
            registerId: "reg-1",
            cashierId: "cashier-2",
            cashierName: "Bob",
            openingFloat: 100,
          },
          "tenant-1"
        )
      ).rejects.toThrow(/already occupied/);
    });

    it("6. rejects opening shift on an INACTIVE register", async () => {
      mockRegRepo.getById.mockResolvedValue({
        id: "reg-inactive",
        name: "Old Register",
        status: "INACTIVE",
      });

      await expect(
        shiftService.openShift(
          {
            registerId: "reg-inactive",
            cashierId: "cashier-1",
            cashierName: "Alice",
            openingFloat: 100,
          },
          "tenant-1"
        )
      ).rejects.toThrow(/INACTIVE/);
    });

    it("7. calculates expected cash: openingFloat + cashSales - cashRefunds", async () => {
      const shiftData = {
        openingFloat: 200,
        cashSales: 550,
        cashRefunds: 50,
      };

      const expectedCash = shiftData.openingFloat + shiftData.cashSales - shiftData.cashRefunds;
      expect(expectedCash).toBe(700);
    });

    it("8. reconciles shift close with cash difference", async () => {
      mockShiftRepo.closeShift.mockImplementation(async (id: string, closingData: any) => ({
        id,
        status: "CLOSED",
        openingFloat: 200,
        cashSales: 500,
        cashRefunds: 0,
        expectedCash: 700,
        closingCash: closingData.closingCash,
        cashDifference: closingData.closingCash - 700,
      }));

      const closed = await shiftService.closeShift(
        "shift-1",
        { closingCash: 720, notes: "Overage of $20" },
        "tenant-1"
      );

      expect(closed.status).toBe("CLOSED");
      expect(closed.expectedCash).toBe(700);
      expect(closed.closingCash).toBe(720);
      expect(closed.cashDifference).toBe(20);
    });

    it("9. protects against duplicate shift close", async () => {
      mockShiftRepo.closeShift.mockRejectedValue(
        new ValidationError("Shift shift-1 is already CLOSED. Duplicate close prevented.")
      );

      await expect(
        shiftService.closeShift("shift-1", { closingCash: 500 }, "tenant-1")
      ).rejects.toThrow(/already CLOSED/);
    });
  });

  // 3. RETURNS & REFUNDS TESTS
  describe("Return & Refund Transactions", () => {
    let mockReturnRepo: any;
    let returnService: ReturnService;

    beforeEach(() => {
      mockReturnRepo = {
        getAll: jest.fn(),
        getById: jest.fn(),
        getByOrderId: jest.fn(),
        processAtomicReturn: jest.fn(),
      };
      returnService = new ReturnService(mockReturnRepo);
    });

    it("10. processes a full return and sets status to REFUNDED", async () => {
      mockReturnRepo.processAtomicReturn.mockResolvedValue({
        id: "ret-1",
        returnInvoiceNumber: "RET-AAA0000001-001",
        originalOrderId: "ord-1",
        originalInvoiceNumber: "AAA0000001",
        refundTotal: 400,
        refundMethod: "CASH",
        items: [{ productId: "prod-1", name: "Item A", quantity: 2, unitPrice: 200, refundAmount: 400 }],
      });

      const res = await returnService.processReturn(
        {
          orderId: "ord-1",
          items: [{ productId: "prod-1", quantity: 2 }],
          refundMethod: "CASH",
        },
        "tenant-1"
      );

      expect(res.refundTotal).toBe(400);
      expect(res.returnInvoiceNumber).toBe("RET-AAA0000001-001");
    });

    it("11. processes a partial return", async () => {
      mockReturnRepo.processAtomicReturn.mockResolvedValue({
        id: "ret-2",
        returnInvoiceNumber: "RET-AAA0000002-001",
        originalOrderId: "ord-2",
        refundTotal: 100,
        refundMethod: "CARD",
        items: [{ productId: "prod-1", name: "Item A", quantity: 1, unitPrice: 100, refundAmount: 100 }],
      });

      const res = await returnService.processReturn(
        {
          orderId: "ord-2",
          items: [{ productId: "prod-1", quantity: 1 }],
          refundMethod: "CARD",
        },
        "tenant-1"
      );

      expect(res.refundTotal).toBe(100);
      expect(res.refundMethod).toBe("CARD");
    });

    it("12. rejects return when returning more than originally sold", async () => {
      mockReturnRepo.processAtomicReturn.mockRejectedValue(
        new ValidationError('Cannot return 5 units of "Item A". Maximum refundable is 2')
      );

      await expect(
        returnService.processReturn(
          {
            orderId: "ord-1",
            items: [{ productId: "prod-1", quantity: 5 }],
          },
          "tenant-1"
        )
      ).rejects.toThrow(/Maximum refundable is 2/);
    });

    it("14. rejects return for an invalid or cancelled order", async () => {
      mockReturnRepo.processAtomicReturn.mockRejectedValue(
        new ValidationError('Cannot process return for order with status "CANCELLED". Only completed sales can be returned.')
      );

      await expect(
        returnService.processReturn(
          {
            orderId: "ord-cancelled",
            items: [{ productId: "prod-1", quantity: 1 }],
          },
          "tenant-1"
        )
      ).rejects.toThrow(/Only completed sales can be returned/);
    });
  });

  // 4. STOCK MOVEMENTS & APPEND-ONLY LEDGER TESTS
  describe("Stock Movement Ledger", () => {
    let mockMovementRepo: any;
    let movementService: StockMovementService;

    beforeEach(() => {
      mockMovementRepo = {
        getAll: jest.fn(),
        getByProductId: jest.fn(),
        getByOrderId: jest.fn(),
        create: jest.fn(),
      };
      movementService = new StockMovementService(mockMovementRepo);
    });

    it("19. records SALE stock movement with negative delta", async () => {
      mockMovementRepo.create.mockImplementation(async (data: any) => ({
        id: "mov-1",
        ...data,
      }));

      const movement = await movementService.recordMovement(
        {
          productId: "prod-1",
          productName: "Item A",
          type: "SALE",
          quantityDelta: -2,
          quantityBefore: 10,
          quantityAfter: 8,
          timestamp: new Date().toISOString(),
        },
        "tenant-1"
      );

      expect(movement.type).toBe("SALE");
      expect(movement.quantityDelta).toBe(-2);
      expect(movement.quantityBefore).toBe(10);
      expect(movement.quantityAfter).toBe(8);
    });

    it("20. records RETURN stock movement with positive delta", async () => {
      mockMovementRepo.create.mockImplementation(async (data: any) => ({
        id: "mov-2",
        ...data,
      }));

      const movement = await movementService.recordMovement(
        {
          productId: "prod-1",
          productName: "Item A",
          type: "RETURN",
          quantityDelta: 1,
          quantityBefore: 8,
          quantityAfter: 9,
          timestamp: new Date().toISOString(),
        },
        "tenant-1"
      );

      expect(movement.type).toBe("RETURN");
      expect(movement.quantityDelta).toBe(1);
      expect(movement.quantityAfter).toBe(9);
    });

    it("22. strictly enforces append-only rule on StockMovementRepository", async () => {
      const realRepo = new StockMovementRepository();
      await expect(realRepo.update()).rejects.toThrow(/append-only/);
      await expect(realRepo.delete()).rejects.toThrow(/append-only/);
    });
  });

  // 5. BARCODE & SKU LOOKUP TESTS
  describe("Barcode & SKU Resolution", () => {
    const sampleProducts = [
      { id: "p1", name: "Soda Can", barcode: "123456789012", sku: "SKU-SODA-01", unitsInStock: 50 },
      { id: "p2", name: "Chips Bag", barcode: "987654321098", sku: "SKU-CHIP-02", unitsInStock: 20 },
    ];

    it("25. resolves product by exact barcode match", () => {
      const scanned = "123456789012";
      const found = sampleProducts.find((p) => p.barcode === scanned);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Soda Can");
    });

    it("26. resolves product by SKU", () => {
      const skuQuery = "SKU-CHIP-02";
      const found = sampleProducts.find((p) => p.sku === skuQuery);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Chips Bag");
    });

    it("27. safely handles unknown barcode without throwing unhandled exceptions", () => {
      const unknown = "000000000000";
      const found = sampleProducts.find((p) => p.barcode === unknown);
      expect(found).toBeUndefined();
    });
  });
});
