import { OrderService } from "../OrderService";
import { calculateSaleTotals } from "../../../domain/calculations/SaleCalculations";
import { ValidationError, NotFoundError } from "../../../domain/errors/AppError";
import { generateNextInvoiceNumber } from "../../../utils/utilFunctions";

describe("Milestone 2 - Sales, Orders, Payments & Receipts Engine", () => {
  let mockOrderRepo: any;
  let orderService: OrderService;

  beforeEach(() => {
    mockOrderRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      completeSale: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    orderService = new OrderService(mockOrderRepo);
  });

  describe("1. Successful Cash Sale with Authoritative Calculations", () => {
    it("completes a cash sale with correct subtotal, tax, discount, total and change", async () => {
      mockOrderRepo.completeSale.mockImplementation(async (data: any) => ({
        id: "order-101",
        ...data,
      }));

      const saleInput = {
        invoiceNumber: "AAA0000100",
        idempotencyKey: "idem-sale-1",
        items: [
          { productId: "prod-1", name: "Product A", unitPrice: 100, quantity: 2 },
          { productId: "prod-2", name: "Product B", unitPrice: 200, quantity: 1 },
        ],
        paymentMethod: "CASH" as const,
        amountTendered: 500,
        customerId: "cust-1",
        customerName: "Alice Customer",
        employeeId: "emp-1",
        employeeName: "Bob Cashier",
      };

      const result = await orderService.completeSale(saleInput, "tenant-alpha");

      expect(mockOrderRepo.completeSale).toHaveBeenCalled();
      const passedToRepo = mockOrderRepo.completeSale.mock.calls[0][0];

      // Subtotal: 100*2 + 200*1 = 400
      expect(passedToRepo.subtotal).toBe(400);
      // Tax (5%): 400 * 0.05 = 20
      expect(passedToRepo.tax).toBe(20);
      // Total before discount: 420
      expect(passedToRepo.total).toBe(420);
      // Discount (2%): 420 * 0.02 = 8.4
      expect(passedToRepo.discount).toBe(8.4);
      // Amount Due: round(420 - 8.4) = 412
      expect(passedToRepo.amountDue).toBe(412);
      // Amount Paid: 412
      expect(passedToRepo.amountPaid).toBe(412);
      // Change: 500 - 412 = 88
      expect(passedToRepo.change).toBe(88);
      expect(passedToRepo.status).toBe("COMPLETED");
      expect(passedToRepo.paymentMethod).toBe("CASH");
      expect(result.id).toBe("order-101");
    });
  });

  describe("2. Successful Card Sale", () => {
    it("completes a card sale with zero cash change and exact paid amount", async () => {
      mockOrderRepo.completeSale.mockImplementation(async (data: any) => ({
        id: "order-102",
        ...data,
      }));

      const saleInput = {
        invoiceNumber: "AAA0000101",
        items: [
          { productId: "prod-1", name: "Product A", unitPrice: 500, quantity: 1 },
        ],
        paymentMethod: "CARD" as const,
        paymentReference: "AUTH-998877",
      };

      const result = await orderService.completeSale(saleInput, "tenant-alpha");

      expect(mockOrderRepo.completeSale).toHaveBeenCalled();
      const passedToRepo = mockOrderRepo.completeSale.mock.calls[0][0];

      // Subtotal: 500, Tax: 25, Total: 525, Discount: 10.5, Due: 515
      expect(passedToRepo.subtotal).toBe(500);
      expect(passedToRepo.amountDue).toBe(515);
      expect(passedToRepo.amountPaid).toBe(515);
      expect(passedToRepo.change).toBe(0); // Card sale must NEVER produce cash change
      expect(passedToRepo.paymentMethod).toBe("CARD");
      expect(result.id).toBe("order-102");
    });
  });

  describe("3. Insufficient Stock Validation", () => {
    it("rejects sale when repository detects insufficient stock", async () => {
      mockOrderRepo.completeSale.mockRejectedValue(
        new ValidationError('Insufficient stock for "Product A". Current in stock: 1, Requested: 5')
      );

      const saleInput = {
        invoiceNumber: "AAA0000102",
        items: [
          { productId: "prod-1", name: "Product A", unitPrice: 100, quantity: 5 },
        ],
        amountTendered: 1000,
      };

      await expect(orderService.completeSale(saleInput, "tenant-alpha")).rejects.toThrow(
        /Insufficient stock for "Product A"/
      );
    });
  });

  describe("4. Invalid Item Quantities & Prices", () => {
    it("rejects zero or negative quantities", async () => {
      const invalidQuantity = {
        invoiceNumber: "AAA0000103",
        items: [
          { productId: "prod-1", name: "Product A", unitPrice: 100, quantity: 0 },
        ],
      };

      await expect(orderService.completeSale(invalidQuantity)).rejects.toThrow(ValidationError);
    });

    it("rejects negative unit price", async () => {
      const negativePrice = {
        invoiceNumber: "AAA0000104",
        items: [
          { productId: "prod-1", name: "Product A", unitPrice: -50, quantity: 1 },
        ],
      };

      await expect(orderService.completeSale(negativePrice)).rejects.toThrow(ValidationError);
    });
  });

  describe("5. Payment Validation & Underpayment", () => {
    it("rejects cash underpayment", async () => {
      const underpaidSale = {
        invoiceNumber: "AAA0000105",
        items: [
          { productId: "prod-1", name: "Product A", unitPrice: 1000, quantity: 1 },
        ],
        paymentMethod: "CASH" as const,
        amountTendered: 500, // Due is ~1029
      };

      await expect(orderService.completeSale(underpaidSale)).rejects.toThrow(/Underpayment/);
      expect(mockOrderRepo.completeSale).not.toHaveBeenCalled();
    });
  });

  describe("6. Overpayment and Change Calculation", () => {
    it("correctly calculates change for cash overpayment", () => {
      const calculated = calculateSaleTotals({
        items: [{ name: "Item", unitPrice: 100, quantity: 1 }],
        paymentMethod: "CASH",
        amountTendered: 200,
      });

      // Subtotal 100, Tax 5, Total 105, Discount 2.1, Due 103
      expect(calculated.amountDue).toBe(103);
      expect(calculated.amountPaid).toBe(103);
      expect(calculated.change).toBe(97);
      expect(calculated.isFullyPaid).toBe(true);
    });
  });

  describe("7. Idempotency & Duplicate Submission Protection", () => {
    it("returns existing completed sale when same idempotency key is submitted", async () => {
      const existingOrder = {
        id: "order-existing-99",
        invoiceNumber: "AAA0000099",
        idempotencyKey: "idem-key-99",
        total: 500,
        status: "COMPLETED" as const,
      };

      mockOrderRepo.completeSale.mockResolvedValue(existingOrder);

      const saleInput = {
        invoiceNumber: "AAA0000099",
        idempotencyKey: "idem-key-99",
        items: [{ productId: "prod-1", name: "Product A", unitPrice: 500, quantity: 1 }],
        amountTendered: 600,
      };

      const res = await orderService.completeSale(saleInput, "tenant-alpha");
      expect(res.id).toBe("order-existing-99");
      expect(res.invoiceNumber).toBe("AAA0000099");
    });
  });

  describe("8. Sequential Invoice Numbering Behavior", () => {
    it("correctly generates sequential invoice numbers and increments", () => {
      const generator = generateNextInvoiceNumber("AAA0000001");
      expect(generator()).toBe("AAA0000002");
      expect(generator()).toBe("AAA0000003");
    });

    it("handles rollover from 9999999 to next alphabetic prefix", () => {
      const generator = generateNextInvoiceNumber("AAA9999999");
      expect(generator()).toBe("AAB0000000");
    });
  });

  describe("9. Customer-Linked Sale Association", () => {
    it("preserves customer details across the completed sale", async () => {
      mockOrderRepo.completeSale.mockImplementation(async (data: any) => ({
        id: "order-cust-1",
        ...data,
      }));

      const saleInput = {
        invoiceNumber: "AAA0000108",
        items: [{ productId: "prod-1", name: "Product A", unitPrice: 200, quantity: 1 }],
        customerId: "cust-55",
        customerName: "Jane Doe",
        customerPhone: "03009998877",
        customerEmail: "jane@example.com",
        amountTendered: 300,
      };

      const result = await orderService.completeSale(saleInput, "tenant-alpha");

      expect(mockOrderRepo.completeSale).toHaveBeenCalled();
      const payload = mockOrderRepo.completeSale.mock.calls[0][0];
      expect(payload.customerId).toBe("cust-55");
      expect(payload.customerName).toBe("Jane Doe");
      expect(payload.customerPhone).toBe("03009998877");
      expect(result.customerName).toBe("Jane Doe");
    });
  });
});
