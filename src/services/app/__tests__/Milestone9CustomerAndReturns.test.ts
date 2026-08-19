import { CustomerService } from "../CustomerService";
import { ReturnService } from "../ReturnService";
import { ValidationError, NotFoundError } from "../../../domain/errors/AppError";

describe("Milestone 9 — Customer CRM, Returns & Refunds Engine", () => {
  let mockCustomerRepo: any;
  let mockOrderRepo: any;
  let mockReturnRepo: any;
  let customerService: CustomerService;
  let returnService: ReturnService;

  beforeEach(() => {
    mockCustomerRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockOrderRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
    };

    mockReturnRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getByOrderId: jest.fn(),
      processAtomicReturn: jest.fn(),
    };

    customerService = new CustomerService(mockCustomerRepo, mockOrderRepo, mockReturnRepo);
    returnService = new ReturnService(mockReturnRepo);
  });

  // ==========================================
  // 1. CUSTOMER CRM & MANAGEMENT
  // ==========================================
  describe("1. Customer CRM & Profile Management", () => {
    it("creates a customer profile with contact information", async () => {
      const input = {
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1555123456",
        address: "742 Evergreen Terrace",
        city: "Springfield",
        isActive: true,
      };

      mockCustomerRepo.create.mockResolvedValue({ id: "cust-1", ...input });

      const created = await customerService.createCustomer(input, "tenant-a");

      expect(mockCustomerRepo.create).toHaveBeenCalled();
      expect(created.id).toBe("cust-1");
      expect(created.name).toBe("John Doe");
      expect(created.isActive).toBe(true);
    });

    it("rejects customer creation with missing name", async () => {
      const invalid = {
        email: "noname@example.com",
      };

      await expect(customerService.createCustomer(invalid)).rejects.toThrow(ValidationError);
    });

    it("soft-deactivates customer to preserve transaction references", async () => {
      mockCustomerRepo.update.mockResolvedValue({ id: "cust-1", name: "John Doe", isActive: false });

      const deactivated = await customerService.deactivateCustomer("cust-1", "tenant-a");

      expect(mockCustomerRepo.update).toHaveBeenCalledWith(
        "cust-1",
        expect.objectContaining({ isActive: false }),
        "tenant-a"
      );
      expect(deactivated.isActive).toBe(false);
    });

    it("retrieves purchase history filtered by customer ID", async () => {
      const allOrders = [
        { id: "ord-1", customerId: "cust-1", total: 100, status: "COMPLETED" },
        { id: "ord-2", customerId: "cust-2", total: 50, status: "COMPLETED" },
        { id: "ord-3", customerId: "cust-1", total: 75, status: "COMPLETED" },
      ];

      mockOrderRepo.getAll.mockResolvedValue(allOrders);

      const history = await customerService.getCustomerPurchaseHistory("cust-1", "tenant-a");

      expect(history.length).toBe(2);
      expect(history.map((o) => o.id)).toEqual(["ord-1", "ord-3"]);
    });

    it("retrieves return history associated with customer's orders", async () => {
      const allOrders = [{ id: "ord-1", customerId: "cust-1" }];
      const allReturns = [
        { id: "ret-1", originalOrderId: "ord-1", refundTotal: 40 },
        { id: "ret-2", originalOrderId: "ord-2", refundTotal: 25 },
      ];

      mockOrderRepo.getAll.mockResolvedValue(allOrders);
      mockReturnRepo.getAll.mockResolvedValue(allReturns);

      const returnHistory = await customerService.getCustomerReturnHistory("cust-1", "tenant-a");

      expect(returnHistory.length).toBe(1);
      expect(returnHistory[0].id).toBe("ret-1");
      expect(returnHistory[0].refundTotal).toBe(40);
    });
  });

  // ==========================================
  // 2. RETURN WORKFLOW & ATOMIC RECONCILIATION
  // ==========================================
  describe("2. Return Workflow & Validation", () => {
    it("processes a valid return request via processAtomicReturn", async () => {
      const returnInput = {
        orderId: "ord-101",
        items: [{ productId: "prod-1", quantity: 2 }],
        refundMethod: "CASH" as const,
        reason: "Wrong item purchased",
        cashierId: "user-cashier-1",
        cashierName: "Cashier Bob",
      };

      const expectedReturnRecord = {
        id: "ret-101",
        originalOrderId: "ord-101",
        originalInvoiceNumber: "INV-101",
        returnInvoiceNumber: "RET-INV-101-0001",
        items: [{ productId: "prod-1", name: "Cola 500ml", quantity: 2, unitPrice: 50, refundAmount: 100 }],
        refundTotal: 100,
        refundMethod: "CASH",
        reason: "Wrong item purchased",
      };

      mockReturnRepo.processAtomicReturn.mockResolvedValue(expectedReturnRecord);

      const result = await returnService.processReturn(returnInput, "tenant-a");

      expect(mockReturnRepo.processAtomicReturn).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "ord-101",
          reason: "Wrong item purchased",
        }),
        "tenant-a"
      );
      expect(result.returnInvoiceNumber).toBe("RET-INV-101-0001");
      expect(result.refundTotal).toBe(100);
    });

    it("rejects return request with zero or negative quantity", async () => {
      const invalidInput = {
        orderId: "ord-101",
        items: [{ productId: "prod-1", quantity: 0 }],
      };

      await expect(returnService.processReturn(invalidInput as any)).rejects.toThrow(ValidationError);
    });

    it("rejects return request with empty items list", async () => {
      const emptyInput = {
        orderId: "ord-101",
        items: [],
      };

      await expect(returnService.processReturn(emptyInput as any)).rejects.toThrow(ValidationError);
    });

    it("rejects return request missing orderId", async () => {
      const missingOrderInput = {
        orderId: "",
        items: [{ productId: "prod-1", quantity: 1 }],
      };

      await expect(returnService.processReturn(missingOrderInput as any)).rejects.toThrow(ValidationError);
    });
  });
});
