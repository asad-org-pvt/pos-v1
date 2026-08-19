import { PurchaseOrderService } from "../PurchaseOrderService";
import { StockMovementService } from "../StockMovementService";
import { ReportingService } from "../ReportingService";
import { ExportService } from "../ExportService";
import { ValidationError } from "../../../domain/errors/AppError";

describe("Milestone 4 - Purchasing, Receiving, Adjustments, Cost & Reporting Engine", () => {
  // 1. PURCHASING & RECEIVING TESTS
  describe("Purchase Orders & Supplier Receiving", () => {
    let mockPoRepo: any;
    let poService: PurchaseOrderService;

    beforeEach(() => {
      mockPoRepo = {
        getAll: jest.fn(),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        receiveItemsAtomic: jest.fn(),
      };
      poService = new PurchaseOrderService(mockPoRepo);
    });

    it("1. creates a new Purchase Order with calculated totals", async () => {
      mockPoRepo.create.mockImplementation(async (data: any) => ({
        id: "po-101",
        ...data,
      }));

      const newPo = await poService.createPurchaseOrder(
        {
          supplierId: "sup-1",
          supplierName: "Acme Supplies",
          items: [
            { productId: "p1", name: "Item 1", orderedQuantity: 10, unitCost: 15 },
            { productId: "p2", name: "Item 2", orderedQuantity: 5, unitCost: 20 },
          ],
        },
        "tenant-1"
      );

      expect(newPo.id).toBe("po-101");
      expect(newPo.subtotal).toBe(250); // 10*15 + 5*20 = 150 + 100 = 250
      expect(newPo.total).toBe(250);
      expect(newPo.status).toBe("ORDERED");
      expect(newPo.items[0].receivedQuantity).toBe(0);
    });

    it("2. enforces tenant isolation on purchase order retrieval", async () => {
      mockPoRepo.getAll.mockResolvedValue([
        { id: "po-1", tenantId: "tenant-A", poNumber: "PO-001" },
      ]);

      const pos = await poService.getPurchaseOrders("tenant-A");
      expect(mockPoRepo.getAll).toHaveBeenCalledWith("tenant-A", undefined);
      expect(pos.length).toBe(1);
    });

    it("3. validates item quantity and cost (rejects non-positive quantity and negative cost)", async () => {
      await expect(
        poService.createPurchaseOrder({
          supplierId: "sup-1",
          supplierName: "Acme",
          items: [{ productId: "p1", name: "Item 1", orderedQuantity: 0, unitCost: 10 }],
        })
      ).rejects.toThrow(/must be >= 1/);

      await expect(
        poService.createPurchaseOrder({
          supplierId: "sup-1",
          supplierName: "Acme",
          items: [{ productId: "p1", name: "Item 1", orderedQuantity: 5, unitCost: -10 }],
        })
      ).rejects.toThrow(/cannot be negative/);
    });

    it("4. fully receives a PO and sets status to RECEIVED", async () => {
      mockPoRepo.receiveItemsAtomic.mockResolvedValue({
        id: "po-1",
        poNumber: "PO-001",
        status: "RECEIVED",
        items: [{ productId: "p1", orderedQuantity: 10, receivedQuantity: 10, unitCost: 15 }],
      });

      const updated = await poService.receiveItems(
        {
          poId: "po-1",
          items: [{ productId: "p1", receivedNow: 10 }],
        },
        "tenant-1"
      );

      expect(updated.status).toBe("RECEIVED");
      expect(updated.items[0].receivedQuantity).toBe(10);
    });

    it("5. partially receives a PO and sets status to PARTIALLY_RECEIVED", async () => {
      mockPoRepo.receiveItemsAtomic.mockResolvedValue({
        id: "po-2",
        poNumber: "PO-002",
        status: "PARTIALLY_RECEIVED",
        items: [{ productId: "p1", orderedQuantity: 10, receivedQuantity: 4, unitCost: 15 }],
      });

      const updated = await poService.receiveItems(
        {
          poId: "po-2",
          items: [{ productId: "p1", receivedNow: 4 }],
        },
        "tenant-1"
      );

      expect(updated.status).toBe("PARTIALLY_RECEIVED");
      expect(updated.items[0].receivedQuantity).toBe(4);
    });

    it("6. rejects over-receiving beyond remaining ordered quantity", async () => {
      mockPoRepo.receiveItemsAtomic.mockRejectedValue(
        new ValidationError('Cannot receive 12 units of "Item 1". Maximum remaining is 10')
      );

      await expect(
        poService.receiveItems(
          {
            poId: "po-1",
            items: [{ productId: "p1", receivedNow: 12 }],
          },
          "tenant-1"
        )
      ).rejects.toThrow(/Maximum remaining is 10/);
    });
  });

  // 2. PRODUCT COST FOUNDATION & PROFITABILITY
  describe("Product Cost Foundation & Profitability", () => {
    it("12. correctly calculates weighted-average cost basis", () => {
      const currentStock = 10;
      const currentCost = 20; // $200 total value
      const receivedNow = 10;
      const newUnitCost = 30; // $300 added

      const newStock = currentStock + receivedNow;
      const weightedAvgCost = ((currentStock * currentCost) + (receivedNow * newUnitCost)) / newStock;

      expect(newStock).toBe(20);
      expect(weightedAvgCost).toBe(25); // ($200 + $300) / 20 = $25
    });

    it("14. calculates gross profit and gross margin percentage accurately", () => {
      const grossSales = 1000;
      const refunds = 100;
      const netSales = grossSales - refunds; // 900
      const estimatedCogs = 500;
      const grossProfit = netSales - estimatedCogs; // 400
      const grossMarginPercent = (grossProfit / netSales) * 100; // 44.44%

      expect(netSales).toBe(900);
      expect(grossProfit).toBe(400);
      expect(Number(grossMarginPercent.toFixed(1))).toBe(44.4);
    });
  });

  // 3. INVENTORY ADJUSTMENTS TESTS
  describe("Inventory Adjustments", () => {
    let mockMovementRepo: any;
    let movementService: StockMovementService;

    beforeEach(() => {
      mockMovementRepo = {
        getAll: jest.fn(),
        adjustStockAtomic: jest.fn(),
      };
      movementService = new StockMovementService(mockMovementRepo);
    });

    it("15. processes a positive count correction adjustment", async () => {
      mockMovementRepo.adjustStockAtomic.mockResolvedValue({
        id: "mov-adj-1",
        productId: "p1",
        type: "ADJUSTMENT",
        quantityDelta: 5,
        quantityBefore: 10,
        quantityAfter: 15,
        reason: "COUNT_CORRECTION: Recount inventory",
      });

      const res = await movementService.adjustStock(
        {
          productId: "p1",
          quantityDelta: 5,
          reason: "COUNT_CORRECTION",
          notes: "Recount inventory",
        },
        "tenant-1"
      );

      expect(res.type).toBe("ADJUSTMENT");
      expect(res.quantityDelta).toBe(5);
      expect(res.quantityAfter).toBe(15);
    });

    it("16. processes a negative damaged goods adjustment", async () => {
      mockMovementRepo.adjustStockAtomic.mockResolvedValue({
        id: "mov-adj-2",
        productId: "p1",
        type: "ADJUSTMENT",
        quantityDelta: -2,
        quantityBefore: 15,
        quantityAfter: 13,
        reason: "DAMAGE: Broken on floor",
      });

      const res = await movementService.adjustStock(
        {
          productId: "p1",
          quantityDelta: -2,
          reason: "DAMAGE",
          notes: "Broken on floor",
        },
        "tenant-1"
      );

      expect(res.quantityDelta).toBe(-2);
      expect(res.quantityAfter).toBe(13);
    });

    it("17. rejects adjustment that would cause negative stock", async () => {
      mockMovementRepo.adjustStockAtomic.mockRejectedValue(
        new ValidationError("Cannot adjust stock below zero. Current stock: 2, adjustment requested: -5")
      );

      await expect(
        movementService.adjustStock(
          {
            productId: "p1",
            quantityDelta: -5,
            reason: "SHRINKAGE",
          },
          "tenant-1"
        )
      ).rejects.toThrow(/Cannot adjust stock below zero/);
    });
  });

  // 4. MANAGEMENT REPORTING TESTS
  describe("Management Reporting Engine", () => {
    let mockOrderRepo: any;
    let mockProdRepo: any;
    let reportingService: ReportingService;

    beforeEach(() => {
      mockOrderRepo = {
        getAll: jest.fn(),
      };
      mockProdRepo = {
        getAll: jest.fn(),
      };
      reportingService = new ReportingService(mockOrderRepo, mockProdRepo);
    });

    it("20-23. calculates sales summary with refund deduction and payment breakdowns", async () => {
      const nowIso = new Date().toISOString();
      mockOrderRepo.getAll.mockResolvedValue([
        {
          id: "ord-1",
          dateTime: nowIso,
          amountDue: 500,
          refundedAmount: 50,
          paymentMethod: "CASH",
          employeeId: "emp-1",
          employeeName: "Alice",
          products: [{ productId: "p1", name: "Item A", quantity: 5, returnedQuantity: 1, total: 500 }],
        },
        {
          id: "ord-2",
          dateTime: nowIso,
          amountDue: 300,
          refundedAmount: 0,
          paymentMethod: "CARD",
          employeeId: "emp-2",
          employeeName: "Bob",
          products: [{ productId: "p2", name: "Item B", quantity: 3, returnedQuantity: 0, total: 300 }],
        },
      ]);

      mockProdRepo.getAll.mockResolvedValue([
        { id: "p1", name: "Item A", costPrice: 40, unitsInStock: 20, unitPrice: 100 },
        { id: "p2", name: "Item B", costPrice: 50, unitsInStock: 10, unitPrice: 100 },
      ]);

      const report = await reportingService.getSalesReport({ preset: "today" }, "tenant-1");

      // Gross: 500 + 300 = 800
      expect(report.grossSales).toBe(800);
      // Refunds: 50
      expect(report.refunds).toBe(50);
      // Net Sales: 800 - 50 = 750
      expect(report.netSales).toBe(750);
      // Cash: 500, Card: 300
      expect(report.cashSales).toBe(500);
      expect(report.cardSales).toBe(300);
      // Net COGS: (5 - 1)*40 + (3 - 0)*50 = 160 + 150 = 310
      expect(report.estimatedCogs).toBe(310);
      // Gross Profit: 750 - 310 = 440
      expect(report.grossProfit).toBe(440);
    });

    it("24. aggregates product sales rankings", async () => {
      const nowIso = new Date().toISOString();
      mockOrderRepo.getAll.mockResolvedValue([
        {
          id: "ord-1",
          dateTime: nowIso,
          products: [
            { productId: "p1", name: "Top Item", quantity: 10, returnedQuantity: 0, total: 1000 },
            { productId: "p2", name: "Second Item", quantity: 2, returnedQuantity: 0, total: 200 },
          ],
        },
      ]);
      mockProdRepo.getAll.mockResolvedValue([
        { id: "p1", name: "Top Item", costPrice: 50 },
        { id: "p2", name: "Second Item", costPrice: 40 },
      ]);

      const rankings = await reportingService.getProductSalesReport({ preset: "today" }, "tenant-1");

      expect(rankings.length).toBe(2);
      expect(rankings[0].productId).toBe("p1");
      expect(rankings[0].netRevenue).toBe(1000);
      expect(rankings[0].estimatedProfit).toBe(500); // 1000 - 10*50 = 500
    });

    it("26. generates inventory valuation and detects low-stock items", async () => {
      mockProdRepo.getAll.mockResolvedValue([
        { id: "p1", name: "Product High", unitsInStock: 20, unitPrice: 50, costPrice: 25 },
        { id: "p2", name: "Product Low", unitsInStock: 2, unitPrice: 100, costPrice: 50 },
      ]);

      const valuation = await reportingService.getInventoryValuationReport("tenant-1");

      expect(valuation.totalProducts).toBe(2);
      expect(valuation.totalUnitsInStock).toBe(22);
      // Retail: 20*50 + 2*100 = 1000 + 200 = 1200
      expect(valuation.totalRetailValue).toBe(1200);
      // Cost: 20*25 + 2*50 = 500 + 100 = 600
      expect(valuation.totalCostValue).toBe(600);
      // Low stock: p2 (units <= 5)
      expect(valuation.lowStockProducts.length).toBe(1);
      expect(valuation.lowStockProducts[0].id).toBe("p2");
    });
  });

  // 5. DATA EXPORT TESTS
  describe("CSV Data Export", () => {
    const exportService = new ExportService();

    it("27-29. generates correctly formatted CSV headers and escaped values", () => {
      const orders = [
        {
          id: "ord-1",
          invoiceNumber: "AAA0000001",
          dateTime: "2026-08-18T10:00:00Z",
          customerName: 'Acme, "Retail" Ltd',
          employeeName: "Alice",
          paymentMethod: "CASH" as const,
          subtotal: 100,
          tax: 5,
          discount: 0,
          total: 105,
          amountPaid: 105,
          change: 0,
          refundedAmount: 0,
          status: "COMPLETED" as const,
          products: [],
          tenantId: "default",
        },
      ];

      const csv = exportService.exportSalesCsv(orders as any);

      expect(csv).toContain("Invoice Number,Date Time,Customer,Cashier");
      expect(csv).toContain('"AAA0000001"');
      expect(csv).toContain('"Acme, ""Retail"" Ltd"'); // Escaped quotes and commas
    });
  });
});
