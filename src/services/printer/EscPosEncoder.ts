import { Order } from "../../domain/models/Order";
import { Return } from "../../domain/models/Return";
import { PrinterConfig } from "../../domain/models/PrinterConfig";

export class EscPosEncoder {
  private buffer: number[] = [];
  private textBuffer: string[] = [];
  private characterWidth: number = 42;

  constructor(characterWidth = 42) {
    this.characterWidth = characterWidth || 42;
  }

  /**
   * Clears internal buffers
   */
  clear(): this {
    this.buffer = [];
    this.textBuffer = [];
    return this;
  }

  /**
   * Set printer character width for column layout calculations
   */
  setCharacterWidth(width: number): this {
    this.characterWidth = width > 0 ? width : 42;
    return this;
  }

  /**
   * ESC @ - Initialize printer
   */
  initialize(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  /**
   * ESC a n - Set text justification (0=Left, 1=Center, 2=Right)
   */
  align(alignment: "left" | "center" | "right"): this {
    let n = 0;
    if (alignment === "center") n = 1;
    if (alignment === "right") n = 2;
    this.buffer.push(0x1b, 0x61, n);
    return this;
  }

  /**
   * ESC E n - Turn emphasized (bold) mode on/off
   */
  bold(enable = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  /**
   * ESC ! n - Set character font/size (Normal, Double Height, Double Width, Double Both)
   */
  fontSize(size: "normal" | "double-height" | "double-width" | "double" = "normal"): this {
    let n = 0x00;
    if (size === "double-height") n = 0x10;
    if (size === "double-width") n = 0x20;
    if (size === "double") n = 0x30;
    this.buffer.push(0x1b, 0x21, n);
    return this;
  }

  /**
   * Append raw text string (encoded to standard ASCII bytes)
   */
  text(str: string): this {
    if (!str) return this;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // Clamp to printable ASCII / CP437 space
      this.buffer.push(code > 255 ? 0x3f : code);
    }
    this.textBuffer.push(str);
    return this;
  }

  /**
   * Append line with newline feed (LF: 0x0A)
   */
  line(str = ""): this {
    this.text(str);
    this.buffer.push(0x0a);
    this.textBuffer.push("\n");
    return this;
  }

  /**
   * Feed n lines
   */
  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
      this.textBuffer.push("\n");
    }
    return this;
  }

  /**
   * Generate horizontal separator line matching characterWidth
   */
  separator(char = "-"): this {
    const sep = char.repeat(this.characterWidth);
    return this.line(sep);
  }

  /**
   * Align two columns: Left-aligned label and Right-aligned value
   */
  twoColumns(left: string, right: string): this {
    const totalWidth = this.characterWidth;
    const rightLen = right.length;
    const leftLen = left.length;

    if (leftLen + rightLen >= totalWidth) {
      // Truncate left or split
      const availableLeft = totalWidth - rightLen - 1;
      const truncatedLeft = availableLeft > 0 ? left.substring(0, availableLeft) : "";
      const spaces = " ".repeat(Math.max(1, totalWidth - truncatedLeft.length - rightLen));
      return this.line(`${truncatedLeft}${spaces}${right}`);
    }

    const spaces = " ".repeat(totalWidth - leftLen - rightLen);
    return this.line(`${left}${spaces}${right}`);
  }

  /**
   * Print table row with column width constraints and alignments
   */
  tableRow(
    columns: { text: string; width: number; align?: "left" | "center" | "right" }[]
  ): this {
    let rowStr = "";
    for (const col of columns) {
      const colText = (col.text || "").substring(0, col.width);
      const padding = col.width - colText.length;
      const align = col.align || "left";

      if (align === "right") {
        rowStr += " ".repeat(padding) + colText;
      } else if (align === "center") {
        const padLeft = Math.floor(padding / 2);
        const padRight = padding - padLeft;
        rowStr += " ".repeat(padLeft) + colText + " ".repeat(padRight);
      } else {
        rowStr += colText + " ".repeat(padding);
      }
    }
    return this.line(rowStr);
  }

  /**
   * GS V 0 / 1 - Cut paper command
   */
  cut(partial = false): this {
    // Feed 3 lines before cutting to clear printhead
    this.feed(3);
    this.buffer.push(0x1d, 0x56, partial ? 0x01 : 0x00);
    return this;
  }

  /**
   * ESC p - Open cash drawer pulse
   */
  openCashDrawer(): this {
    // Pin 2 (connector pin 2) pulse: 25ms on, 250ms off
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  /**
   * Return generated raw binary ESC/POS byte array
   */
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Return plain-text representation (useful for testing and debug logs)
   */
  getTextRepresentation(): string {
    return this.textBuffer.join("");
  }

  // =========================================================================
  // AUTHORITATIVE RECEIPT GENERATORS
  // =========================================================================

  /**
   * Deterministically encode a full POS sales order receipt into ESC/POS bytes
   */
  encodeReceipt(order: Order, config: PrinterConfig, organizationName = "POS STORE"): Uint8Array {
    const charWidth = config.characterWidth || (config.paperWidth === 58 ? 32 : 42);
    this.clear().setCharacterWidth(charWidth);

    // 1. Initialize
    this.initialize();

    // 2. Cash Drawer Kick (if configured)
    if (config.openCashDrawer) {
      this.openCashDrawer();
    }

    // 3. Header
    this.align("center");
    this.bold(true).fontSize("double").line(organizationName);
    this.bold(false).fontSize("normal");

    if (config.headerText) {
      this.line(config.headerText);
    }
    this.line("OFFICIAL SALES RECEIPT");
    this.separator("-");

    // 4. Metadata
    this.align("left");
    this.twoColumns("Invoice #:", order.invoiceNumber);
    this.twoColumns(
      "Date:",
      order.dateTime
        ? new Date(order.dateTime).toLocaleString()
        : order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : new Date().toLocaleString()
    );
    if (order.employeeName) {
      this.twoColumns("Cashier:", order.employeeName);
    }
    if (order.customerName && order.customerName !== "Walk-in Customer") {
      this.twoColumns("Customer:", order.customerName);
      if (order.customerPhone) {
        this.twoColumns("Phone:", order.customerPhone);
      }
    }
    this.separator("-");

    // 5. Table Header
    // Column layout: Item, Qty, Price, Total
    if (charWidth >= 40) {
      // 80mm Layout (42 chars: Item(18), Qty(4), Price(9), Total(11))
      this.bold(true);
      this.tableRow([
        { text: "ITEM", width: 18, align: "left" },
        { text: "QTY", width: 4, align: "center" },
        { text: "PRICE", width: 9, align: "right" },
        { text: "TOTAL", width: 11, align: "right" },
      ]);
      this.bold(false);
      this.separator("-");

      for (const item of order.products || []) {
        const itemTotal = (Number(item.unitPrice) * Number(item.quantity)).toFixed(2);
        this.tableRow([
          { text: item.name || "Item", width: 18, align: "left" },
          { text: `${item.quantity}`, width: 4, align: "center" },
          { text: `$${Number(item.unitPrice).toFixed(2)}`, width: 9, align: "right" },
          { text: `$${itemTotal}`, width: 11, align: "right" },
        ]);
      }
    } else {
      // 58mm Layout (32 chars: Item(14), Qty(3), Total(15))
      this.bold(true);
      this.tableRow([
        { text: "ITEM", width: 14, align: "left" },
        { text: "QTY", width: 4, align: "center" },
        { text: "TOTAL", width: 14, align: "right" },
      ]);
      this.bold(false);
      this.separator("-");

      for (const item of order.products || []) {
        const itemTotal = (Number(item.unitPrice) * Number(item.quantity)).toFixed(2);
        this.tableRow([
          { text: item.name || "Item", width: 14, align: "left" },
          { text: `${item.quantity}`, width: 4, align: "center" },
          { text: `$${itemTotal}`, width: 14, align: "right" },
        ]);
      }
    }

    this.separator("-");

    // 6. Financial Totals
    this.twoColumns("Subtotal:", `$${(order.subtotal || 0).toFixed(2)}`);
    if ((order.discount || 0) > 0) {
      this.twoColumns("Discount:", `-$${Number(order.discount).toFixed(2)}`);
    }
    this.twoColumns("Tax (5%):", `$${(order.tax || 0).toFixed(2)}`);
    this.separator("=");
    this.bold(true).fontSize("double-height");
    this.twoColumns("TOTAL:", `$${(order.total || 0).toFixed(2)}`);
    this.bold(false).fontSize("normal");
    this.separator("=");

    // 7. Payment Information & Split Tender Breakdown
    if (order.payments && order.payments.length > 1) {
      this.bold(true).line("PAYMENT BREAKDOWN:");
      this.bold(false);
      for (const pay of order.payments) {
        const refStr = pay.reference ? ` (${pay.reference})` : "";
        const tenderStr =
          pay.method === "CASH" && pay.amountTendered
            ? ` [Tend: $${Number(pay.amountTendered).toFixed(2)}]`
            : "";
        this.twoColumns(`• ${pay.method}${refStr}:`, `$${Number(pay.amount).toFixed(2)}${tenderStr}`);
      }
      this.separator("-");
      this.twoColumns("Total Paid:", `$${(order.amountPaid || order.total || 0).toFixed(2)}`);
    } else {
      this.twoColumns("Payment Method:", `${order.paymentMethod || "CASH"}`);
      this.twoColumns("Amount Paid:", `$${(order.amountPaid || order.total || 0).toFixed(2)}`);
    }

    if ((order.change || 0) > 0) {
      this.bold(true);
      this.twoColumns("Change Returned:", `$${Number(order.change).toFixed(2)}`);
      this.bold(false);
    }

    this.separator("-");

    // 8. Footer
    this.align("center");
    if (config.footerText) {
      this.line(config.footerText);
    } else {
      this.line("Thank you for shopping with us!");
    }
    this.line("Please retain receipt for returns.");

    // 9. Cut
    if (config.autoCut) {
      this.cut(false);
    } else {
      this.feed(3);
    }

    return this.getBytes();
  }

  /**
   * Deterministically encode a customer return / refund receipt into ESC/POS bytes
   */
  encodeRefundReceipt(
    returnRecord: Return,
    config: PrinterConfig,
    organizationName = "POS STORE"
  ): Uint8Array {
    const charWidth = config.characterWidth || (config.paperWidth === 58 ? 32 : 42);
    this.clear().setCharacterWidth(charWidth);

    this.initialize();

    if (config.openCashDrawer && returnRecord.refundMethod === "CASH") {
      this.openCashDrawer();
    }

    // Header
    this.align("center");
    this.bold(true).fontSize("double").line(organizationName);
    this.bold(false).fontSize("normal");
    this.line("CUSTOMER REFUND RECEIPT");
    this.separator("-");

    // Metadata
    this.align("left");
    this.twoColumns("Return #:", returnRecord.returnInvoiceNumber);
    this.twoColumns("Original Inv #:", returnRecord.originalInvoiceNumber);
    this.twoColumns(
      "Date:",
      returnRecord.createdAt
        ? new Date(returnRecord.createdAt).toLocaleString()
        : new Date().toLocaleString()
    );
    if (returnRecord.cashierName) {
      this.twoColumns("Processed By:", returnRecord.cashierName);
    }
    if (returnRecord.reason) {
      this.twoColumns("Reason:", returnRecord.reason);
    }
    this.separator("-");

    // Items Returned
    this.bold(true);
    this.twoColumns("RETURNED ITEMS", "REFUND");
    this.bold(false);
    this.separator("-");

    for (const item of returnRecord.items || []) {
      const lineTotal = `$${Number(item.totalRefund || 0).toFixed(2)}`;
      this.twoColumns(`${item.productName || "Product"} x${item.quantity}`, lineTotal);
    }

    this.separator("=");
    this.bold(true).fontSize("double-height");
    this.twoColumns("TOTAL REFUND:", `$${(returnRecord.refundTotal || 0).toFixed(2)}`);
    this.bold(false).fontSize("normal");
    this.separator("=");

    this.twoColumns("Refund Method:", `${returnRecord.refundMethod || "CASH"}`);
    this.separator("-");

    // Footer
    this.align("center");
    this.line("Refund processed successfully.");
    this.line("Authorized Signature: _______________");

    if (config.autoCut) {
      this.cut(false);
    } else {
      this.feed(3);
    }

    return this.getBytes();
  }

  /**
   * Deterministically encode a simple printer diagnostic test print receipt
   */
  encodeTestReceipt(config: PrinterConfig, organizationName = "POS PRINTER TEST"): Uint8Array {
    const charWidth = config.characterWidth || (config.paperWidth === 58 ? 32 : 42);
    this.clear().setCharacterWidth(charWidth);

    this.initialize();

    this.align("center");
    this.bold(true).fontSize("double").line("POS TEST PRINT");
    this.bold(false).fontSize("normal");
    this.separator("=");

    this.align("left");
    this.twoColumns("Printer:", config.name || "Default Printer");
    this.twoColumns("Paper Width:", `${config.paperWidth}mm (${charWidth} cols)`);
    this.twoColumns("Transport:", config.transport);
    this.twoColumns("Auto Cut:", config.autoCut ? "ENABLED" : "DISABLED");
    this.twoColumns("Cash Drawer:", config.openCashDrawer ? "ENABLED" : "DISABLED");
    this.twoColumns("Date:", new Date().toLocaleString());
    this.separator("-");

    this.align("center");
    this.bold(true).line("PRINTER STATUS: OK");
    this.bold(false).line("Thermal Printing Engine Verified.");
    this.separator("=");

    if (config.autoCut) {
      this.cut(false);
    } else {
      this.feed(3);
    }

    return this.getBytes();
  }
}

export const escPosEncoder = new EscPosEncoder();
