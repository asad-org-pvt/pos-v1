import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductSchema,
} from "../Product";
import {
  CreateOrderSchema,
  OrderSchema,
} from "../Order";
import {
  CreateCustomerSchema,
  CustomerSchema,
} from "../Customer";
import {
  CreateEmployeeSchema,
  EmployeeSchema,
} from "../Employee";
import {
  CreateOrganizationSchema,
  OrganizationSchema,
} from "../Organization";

describe("Domain Models Validation", () => {
  describe("Product Schema", () => {
    it("validates a valid product", () => {
      const valid = {
        id: "prod-1",
        name: "Coca Cola 500ml",
        unitPrice: 120,
        unitsInStock: 50,
        category: "Beverages",
        status: "AVAILABLE",
      };
      const result = ProductSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("coerces string numbers to numbers", () => {
      const input = {
        name: "Chips",
        unitPrice: "50",
        unitsInStock: "20",
      };
      const result = CreateProductSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unitPrice).toBe(50);
        expect(result.data.unitsInStock).toBe(20);
      }
    });

    it("rejects negative unit price or stock", () => {
      const invalid = {
        name: "Chips",
        unitPrice: -10,
        unitsInStock: -5,
      };
      const result = CreateProductSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Order Schema", () => {
    it("validates a valid order", () => {
      const validOrder = {
        id: "ord-1",
        invoiceNumber: "AAA0000001",
        products: [
          {
            name: "Item 1",
            unitPrice: 100,
            quantity: 2,
            total: 200,
          },
        ],
        subtotal: 200,
        tax: 10,
        discount: 4.2,
        total: 210,
        amountDue: 206,
        customerName: "Walk-in Customer",
        status: "CONFIRMED",
      };
      const result = OrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it("requires at least one product in order", () => {
      const emptyOrder = {
        invoiceNumber: "AAA0000001",
        products: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };
      const result = CreateOrderSchema.safeParse(emptyOrder);
      expect(result.success).toBe(false);
    });
  });

  describe("Customer Schema", () => {
    it("validates a valid customer", () => {
      const valid = {
        id: "cust-1",
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "03001234567",
      };
      const result = CustomerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("allows empty email for walk-in customer", () => {
      const valid = {
        name: "Walk-in Customer",
        email: "",
      };
      const result = CreateCustomerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("Employee Schema", () => {
    it("validates a valid employee", () => {
      const valid = {
        id: "emp-1",
        name: "Alice Smith",
        email: "alice@company.com",
        role: "EMPLOYEE",
      };
      const result = EmployeeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email for employee", () => {
      const invalid = {
        name: "Alice",
        email: "not-an-email",
      };
      const result = CreateEmployeeSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Organization Schema", () => {
    it("validates a valid organization", () => {
      const valid = {
        id: "org-1",
        name: "Main Branch",
        email: "admin@mainbranch.com",
        currency: "PKR",
        taxRate: 0.05,
        discountRate: 0.02,
      };
      const result = OrganizationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
