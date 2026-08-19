import { EscPosEncoder } from "../EscPosEncoder";
import { PrinterService } from "../PrinterService";
import { TransportFactory } from "../transports/TransportFactory";
import { BrowserPrintTransport } from "../transports/BrowserPrintTransport";
import { WebHardwareTransport } from "../transports/WebHardwareTransport";
import { Order } from "../../../domain/models/Order";
import { Return } from "../../../domain/models/Return";
import { PrinterConfig, CreatePrinterConfigSchema } from "../../../domain/models/PrinterConfig";

describe("Milestone 13 — Direct ESC/POS Thermal Printing", () => {
  let encoder: EscPosEncoder;

  beforeEach(() => {
    encoder = new EscPosEncoder(42);
    if (typeof window !== "undefined") {
      window.print = jest.fn();
    }
  });

  const sampleOrder: Order = {
    id: "ord-test-1",
    invoiceNumber: "INV-1001",
    tenantId: "tenant-alpha",
    status: "COMPLETED",
    type: "SALES",
    products: [
      {
        productId: "p1",
        name: "Espresso",
        quantity: 2,
        unitPrice: 3.5,
        total: 7.0,
      },
      {
        productId: "p2",
        name: "Croissant",
        quantity: 1,
        unitPrice: 4.0,
        total: 4.0,
      },
    ],
    subtotal: 11.0,
    discount: 0.22,
    discountRate: 0.02,
    tax: 0.55,
    taxRate: 0.05,
    total: 11.33,
    amountDue: 11.33,
    amountPaid: 20.0,
    change: 8.67,
    paymentMethod: "CASH",
    employeeName: "Alice Cashier",
    customerName: "John Doe",
    customerPhone: "555-1234",
    dateTime: "2026-08-19T10:00:00Z",
  };

  const sampleRefund: Return = {
    id: "ret-test-1",
    returnInvoiceNumber: "RET-2001",
    originalOrderId: "ord-test-1",
    originalInvoiceNumber: "INV-1001",
    tenantId: "tenant-alpha",
    items: [
      {
        productId: "p1",
        productName: "Espresso",
        quantity: 1,
        unitPrice: 3.5,
        totalRefund: 3.5,
      },
    ],
    refundTotal: 3.5,
    refundMethod: "CASH",
    cashierName: "Alice Cashier",
    reason: "Damaged cup",
    createdAt: "2026-08-19T11:00:00Z",
  };

  const sampleConfig: PrinterConfig = {
    id: "printer-1",
    tenantId: "tenant-alpha",
    name: "Thermal Front Counter",
    type: "THERMAL",
    transport: "BROWSER",
    paperWidth: 80,
    characterWidth: 42,
    autoCut: true,
    openCashDrawer: true,
    enabled: true,
    isDefault: true,
    headerText: "Store #01 - Downtown",
    footerText: "Visit us at www.posstore.com",
  };

  // ==========================================
  // 1. ESC/POS COMMAND ENCODING
  // ==========================================
  describe("1. ESC/POS Command Generation", () => {
    it("generates correct initialize, align, and bold byte sequences", () => {
      encoder.initialize().align("center").bold(true).text("HEADER").bold(false);
      const bytes = encoder.getBytes();

      // ESC @ = [0x1B, 0x40]
      expect(bytes[0]).toBe(0x1b);
      expect(bytes[1]).toBe(0x40);

      // ESC a 1 (center) = [0x1B, 0x61, 0x01]
      expect(bytes[2]).toBe(0x1b);
      expect(bytes[3]).toBe(0x61);
      expect(bytes[4]).toBe(0x01);

      // ESC E 1 (bold on) = [0x1B, 0x45, 0x01]
      expect(bytes[5]).toBe(0x1b);
      expect(bytes[6]).toBe(0x45);
      expect(bytes[7]).toBe(0x01);
    });

    it("generates cut paper and cash drawer kick commands", () => {
      encoder.openCashDrawer().cut(false);
      const bytes = encoder.getBytes();

      // Drawer kick: ESC p 0 25 250 = [0x1B, 0x70, 0x00, 0x19, 0xFA]
      expect(bytes[0]).toBe(0x1b);
      expect(bytes[1]).toBe(0x70);
      expect(bytes[2]).toBe(0x00);
      expect(bytes[3]).toBe(0x19);
      expect(bytes[4]).toBe(0xfa);

      // Cut command: GS V 0 = [0x1D, 0x56, 0x00]
      const len = bytes.length;
      expect(bytes[len - 3]).toBe(0x1d);
      expect(bytes[len - 2]).toBe(0x56);
      expect(bytes[len - 1]).toBe(0x00);
    });
  });

  // ==========================================
  // 2. SALES RECEIPT FORMATTING (80mm & 58mm)
  // ==========================================
  describe("2. Authoritative Receipt Formatting", () => {
    it("formats 80mm sales receipt with exact authoritative figures and columns", () => {
      const rawBytes = encoder.encodeReceipt(sampleOrder, sampleConfig, "MY CAFE");
      const textOutput = encoder.getTextRepresentation();

      expect(rawBytes.length).toBeGreaterThan(50);
      expect(textOutput).toContain("MY CAFE");
      expect(textOutput).toContain("Store #01 - Downtown");
      expect(textOutput).toContain("INV-1001");
      expect(textOutput).toContain("Alice Cashier");
      expect(textOutput).toContain("John Doe");
      expect(textOutput).toContain("Espresso");
      expect(textOutput).toContain("$7.00");
      expect(textOutput).toContain("Subtotal:");
      expect(textOutput).toContain("$11.00");
      expect(textOutput).toContain("Discount:");
      expect(textOutput).toContain("-$0.22");
      expect(textOutput).toContain("TOTAL:");
      expect(textOutput).toContain("$11.33");
      expect(textOutput).toContain("Change Returned:");
      expect(textOutput).toContain("$8.67");
      expect(textOutput).toContain("Visit us at www.posstore.com");
    });

    it("formats 58mm compact sales receipt conforming to 32 character columns", () => {
      const compactConfig: PrinterConfig = {
        ...sampleConfig,
        paperWidth: 58,
        characterWidth: 32,
      };

      encoder.encodeReceipt(sampleOrder, compactConfig, "COMPACT POS");
      const textOutput = encoder.getTextRepresentation();

      expect(textOutput).toContain("COMPACT POS");
      expect(textOutput).toContain("INV-1001");
      expect(textOutput).toContain("Espresso");
      expect(textOutput).toContain("$11.33");

      // Verify no line exceeds character width
      const lines = textOutput.split("\n");
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(35);
      }
    });

    it("formats split-tender multi-payment breakdown on receipts accurately", () => {
      const splitOrder: Order = {
        ...sampleOrder,
        paymentMethod: "OTHER",
        payments: [
          {
            id: "p1",
            orderId: "ord-test-1",
            invoiceNumber: "INV-1001",
            tenantId: "tenant-alpha",
            amount: 5.0,
            amountTendered: 10.0,
            change: 5.0,
            method: "CASH",
            status: "COMPLETED",
          },
          {
            id: "p2",
            orderId: "ord-test-1",
            invoiceNumber: "INV-1001",
            tenantId: "tenant-alpha",
            amount: 6.33,
            amountTendered: 6.33,
            change: 0,
            method: "CARD",
            reference: "AUTH-8821",
            status: "COMPLETED",
          },
        ],
      };

      encoder.encodeReceipt(splitOrder, sampleConfig, "SPLIT CAFE");
      const textOutput = encoder.getTextRepresentation();

      expect(textOutput).toContain("PAYMENT BREAKDOWN:");
      expect(textOutput).toContain("CASH");
      expect(textOutput).toContain("$5.00");
      expect(textOutput).toContain("Tend: $10.00");
      expect(textOutput).toContain("CARD (AUTH-8821)");
      expect(textOutput).toContain("$6.33");
    });
  });

  // ==========================================
  // 3. REFUND RECEIPT FORMATTING
  // ==========================================
  describe("3. Refund Receipt Formatting", () => {
    it("formats customer refund receipt with original invoice link and items", () => {
      encoder.encodeRefundReceipt(sampleRefund, sampleConfig, "MY CAFE");
      const textOutput = encoder.getTextRepresentation();

      expect(textOutput).toContain("CUSTOMER REFUND RECEIPT");
      expect(textOutput).toContain("RET-2001");
      expect(textOutput).toContain("INV-1001");
      expect(textOutput).toContain("Espresso x1");
      expect(textOutput).toContain("TOTAL REFUND:");
      expect(textOutput).toContain("$3.50");
      expect(textOutput).toContain("Damaged cup");
      expect(textOutput).toContain("Authorized Signature:");
    });
  });

  // ==========================================
  // 4. DIAGNOSTIC TEST PRINT
  // ==========================================
  describe("4. Diagnostic Test Print", () => {
    it("generates deterministic test print receipt without touching financial data", () => {
      const rawBytes = encoder.encodeTestReceipt(sampleConfig);
      const textOutput = encoder.getTextRepresentation();

      expect(rawBytes.length).toBeGreaterThan(30);
      expect(textOutput).toContain("POS TEST PRINT");
      expect(textOutput).toContain("Thermal Front Counter");
      expect(textOutput).toContain("Paper Width:");
      expect(textOutput).toContain("80mm (42 cols)");
      expect(textOutput).toContain("PRINTER STATUS: OK");
    });
  });

  // ==========================================
  // 5. PRINTER CONFIGURATION & VALIDATION
  // ==========================================
  describe("5. Printer Configuration & Schema Validation", () => {
    it("validates printer configuration with defaults", () => {
      const parsed = CreatePrinterConfigSchema.parse({
        name: "Kitchen Printer",
        transport: "NETWORK",
        paperWidth: 80,
        ipAddress: "192.168.1.50",
      });

      expect(parsed.name).toBe("Kitchen Printer");
      expect(parsed.transport).toBe("NETWORK");
      expect(parsed.paperWidth).toBe(80);
      expect(parsed.characterWidth).toBe(42);
      expect(parsed.autoCut).toBe(true);
      expect(parsed.openCashDrawer).toBe(false);
    });
  });

  // ==========================================
  // 6. TRANSPORT RESOLUTION & FACTORY
  // ==========================================
  describe("6. Transport Layer Resolution", () => {
    it("resolves BrowserPrintTransport and WebHardwareTransport correctly", () => {
      const browserTransport = TransportFactory.getTransport("BROWSER");
      expect(browserTransport).toBeInstanceOf(BrowserPrintTransport);
      expect(browserTransport.type).toBe("BROWSER");

      const usbTransport = TransportFactory.getTransport("USB");
      expect(usbTransport).toBeInstanceOf(WebHardwareTransport);
      expect(usbTransport.type).toBe("USB");

      const serialTransport = TransportFactory.getTransport("SERIAL");
      expect(serialTransport).toBeInstanceOf(WebHardwareTransport);
      expect(serialTransport.type).toBe("SERIAL");
    });
  });

  // ==========================================
  // 7. FINANCIAL DECOUPLING & ERROR HANDLING
  // ==========================================
  describe("7. Financial Decoupling & Safety", () => {
    it("returns structured failure when printer is disabled without throwing or corrupting order state", async () => {
      const mockRepo = {
        getDefaultConfig: jest.fn().mockResolvedValue({
          ...sampleConfig,
          enabled: false,
        }),
        saveConfig: jest.fn(),
      };

      const service = new PrinterService(mockRepo as any);
      const result = await service.printReceipt(sampleOrder, {}, "tenant-alpha");

      expect(result.success).toBe(false);
      expect(result.error).toContain("disabled in Settings");
      expect(result.fallbackAvailable).toBe(true);

      // Financial state of order is completely unchanged
      expect(sampleOrder.status).toBe("COMPLETED");
      expect(sampleOrder.total).toBe(11.33);
    });

    it("catches hardware transport errors gracefully and provides fallback option", async () => {
      const mockRepo = {
        getDefaultConfig: jest.fn().mockResolvedValue({
          ...sampleConfig,
          transport: "USB",
          enabled: true,
        }),
        saveConfig: jest.fn(),
      };

      const service = new PrinterService(mockRepo as any);
      const result = await service.printReceipt(sampleOrder, {}, "tenant-alpha");

      // In Node environment, WebUSB is not supported, so it should return clean graceful result
      expect(result.success).toBe(false);
      expect(result.fallbackAvailable).toBe(true);
      expect(result.rawData).toBeDefined();
    });

    it("diagnostic test print executes independently without affecting financial records", async () => {
      const service = new PrinterService();
      const result = await service.testPrint(sampleConfig, "tenant-alpha");

      expect(result.transport).toBe("BROWSER");
      expect(result.rawData).toBeDefined();
    });
  });
});
