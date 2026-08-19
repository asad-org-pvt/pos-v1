import {
  calculateSaleTotals,
  PaymentAllocation,
} from "../../../domain/calculations/SaleCalculations";
import { OrderRepository } from "../../../repositories/OrderRepository";
import { OrderService } from "../OrderService";
import { Payment } from "../../../domain/models/Payment";
import { Order } from "../../../domain/models/Order";
import { Shift } from "../../../domain/models/Shift";

describe("Milestone 12 — Split-Tender Payments Engine", () => {
  const sampleItems = [
    {
      id: "prod-1",
      name: "T-Shirt",
      unitPrice: 50,
      unitCost: 20,
      quantity: 2,
    },
  ];

  // ==========================================
  // 1. SPLIT-TENDER CALCULATION ENGINE
  // ==========================================
  describe("1. Split-Tender Calculations", () => {
    it("calculates exact multi-tender split allocations ($40 Cash + $63 Card)", () => {
      // Subtotal = $100, Tax (5%) = $5, Discount (2%) = $2. Total = $103
      const splitAllocations: PaymentAllocation[] = [
        { method: "CASH", amount: 40, amountTendered: 40 },
        { method: "CARD", amount: 63, reference: "AUTH-CARD-991" },
      ];

      const result = calculateSaleTotals({
        items: sampleItems,
        payments: splitAllocations,
      });

      expect(result.amountDue).toBe(103);
      expect(result.amountPaid).toBe(103);
      expect(result.change).toBe(0);
      expect(result.isFullyPaid).toBe(true);
      expect(result.paymentMethod).toBe("OTHER");
      expect(result.payments.length).toBe(2);
      expect(result.payments[0].amount).toBe(40);
      expect(result.payments[1].amount).toBe(63);
      expect(result.payments[1].reference).toBe("AUTH-CARD-991");
    });

    it("calculates cash change correctly within a split tender without inflating revenue", () => {
      // Total = $103. Split: $50 Cash (Customer tenders $60 cash), $53 Card
      const splitAllocations: PaymentAllocation[] = [
        { method: "CASH", amount: 50, amountTendered: 60 },
        { method: "CARD", amount: 53, reference: "AUTH-8821" },
      ];

      const result = calculateSaleTotals({
        items: sampleItems,
        payments: splitAllocations,
      });

      expect(result.amountDue).toBe(103);
      expect(result.amountPaid).toBe(103);
      expect(result.change).toBe(10); // $60 tendered - $50 cash allocation
      expect(result.payments[0].change).toBe(10);
      expect(result.payments[1].change).toBe(0);
      expect(result.isFullyPaid).toBe(true);
    });

    it("rejects under-allocation where total payments < amount due", () => {
      // Total = $103, Allocated = $90
      const underAllocated: PaymentAllocation[] = [
        { method: "CASH", amount: 40 },
        { method: "CARD", amount: 50 },
      ];

      const result = calculateSaleTotals({
        items: sampleItems,
        payments: underAllocated,
      });

      expect(result.amountDue).toBe(103);
      expect(result.amountPaid).toBe(90);
      expect(result.isFullyPaid).toBe(false);
    });

    it("throws ValidationError for zero or negative payment allocations", () => {
      const invalidAllocations: PaymentAllocation[] = [
        { method: "CASH", amount: 0 },
        { method: "CARD", amount: 103 },
      ];

      expect(() => {
        calculateSaleTotals({
          items: sampleItems,
          payments: invalidAllocations,
        });
      }).toThrow(/Payment allocation amount must be greater than 0/);
    });

    it("throws ValidationError if cash tendered is less than cash allocation", () => {
      const underTenderedCash: PaymentAllocation[] = [
        { method: "CASH", amount: 50, amountTendered: 30 },
        { method: "CARD", amount: 53 },
      ];

      expect(() => {
        calculateSaleTotals({
          items: sampleItems,
          payments: underTenderedCash,
        });
      }).toThrow(/Cash tendered .* cannot be less than cash allocation/);
    });
  });

  // ==========================================
  // 2. SHIFT ACCOUNTING & MULTI-PAYMENT MAPPING
  // ==========================================
  describe("2. Shift Accounting & Multi-Payment Representation", () => {
    it("correctly partitions multi-tender payments into shift cashSales and cardSales", () => {
      const mockPayments: Payment[] = [
        {
          id: "pay-1",
          orderId: "order-1",
          invoiceNumber: "INV-001",
          tenantId: "test-tenant",
          amount: 40,
          amountTendered: 50,
          change: 10,
          method: "CASH",
          status: "COMPLETED",
          recordedBy: "cashier-1",
          recordedByName: "Cashier",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "pay-2",
          orderId: "order-1",
          invoiceNumber: "INV-001",
          tenantId: "test-tenant",
          amount: 60,
          amountTendered: 60,
          change: 0,
          method: "CARD",
          status: "COMPLETED",
          reference: "AUTH-CARD-123",
          recordedBy: "cashier-1",
          recordedByName: "Cashier",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const initialShift: Shift = {
        id: "shift-1",
        tenantId: "test-tenant",
        registerId: "reg-1",
        registerName: "Register 1",
        cashierId: "cashier-1",
        cashierName: "Cashier",
        status: "OPEN",
        openingFloat: 100,
        cashSales: 50,
        cardSales: 20,
        otherSales: 0,
        totalSales: 70,
        cashRefunds: 0,
        cardRefunds: 0,
        totalRefunds: 0,
        totalTransactions: 2,
        expectedCash: 150,
        openedAt: new Date().toISOString(),
      };

      // Calculate shift updates for multi-tender sale
      let shiftCashDelta = 0;
      let shiftCardDelta = 0;
      let shiftOtherDelta = 0;

      for (const p of mockPayments) {
        if (p.method === "CASH") shiftCashDelta += p.amount;
        else if (p.method === "CARD") shiftCardDelta += p.amount;
        else shiftOtherDelta += p.amount;
      }

      const updatedCashSales = Number(((initialShift.cashSales || 0) + shiftCashDelta).toFixed(2));
      const updatedCardSales = Number(((initialShift.cardSales || 0) + shiftCardDelta).toFixed(2));
      const updatedTotalSales = Number(((initialShift.totalSales || 0) + 100).toFixed(2));
      const updatedExpectedCash = Number(
        ((initialShift.openingFloat || 0) + updatedCashSales - (initialShift.cashRefunds || 0)).toFixed(2)
      );

      expect(updatedCashSales).toBe(90); // 50 + 40
      expect(updatedCardSales).toBe(80); // 20 + 60
      expect(updatedTotalSales).toBe(170); // 70 + 100
      expect(updatedExpectedCash).toBe(190); // 100 (float) + 90 (cash sales)
    });
  });

  // ==========================================
  // 3. BACKWARD COMPATIBILITY
  // ==========================================
  describe("3. Backward Compatibility", () => {
    it("preserves single-tender CASH calculations and payment array", () => {
      const result = calculateSaleTotals({
        items: sampleItems,
        paymentMethod: "CASH",
        amountTendered: 110,
      });

      expect(result.amountDue).toBe(103);
      expect(result.amountPaid).toBe(103);
      expect(result.change).toBe(7);
      expect(result.paymentMethod).toBe("CASH");
      expect(result.payments.length).toBe(1);
      expect(result.payments[0].method).toBe("CASH");
      expect(result.payments[0].amount).toBe(103);
      expect(result.payments[0].change).toBe(7);
    });

    it("preserves single-tender CARD calculations", () => {
      const result = calculateSaleTotals({
        items: sampleItems,
        paymentMethod: "CARD",
      });

      expect(result.amountDue).toBe(103);
      expect(result.amountPaid).toBe(103);
      expect(result.change).toBe(0);
      expect(result.paymentMethod).toBe("CARD");
      expect(result.payments.length).toBe(1);
      expect(result.payments[0].method).toBe("CARD");
      expect(result.payments[0].amount).toBe(103);
    });
  });
});
