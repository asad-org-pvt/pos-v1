import { Order } from "../../domain/models/Order";
import { Product } from "../../domain/models/Product";
import { StockMovement } from "../../domain/models/StockMovement";
import { PurchaseOrder } from "../../domain/models/PurchaseOrder";
import { Shift } from "../../domain/models/Shift";

export class ExportService {
  /**
   * Escapes fields for standard CSV format.
   */
  private escapeField(value: any): string {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  exportSalesCsv(orders: Order[]): string {
    const headers = [
      "Invoice Number",
      "Date Time",
      "Customer",
      "Cashier",
      "Payment Method",
      "Subtotal",
      "Tax",
      "Discount",
      "Total Due",
      "Amount Paid",
      "Change",
      "Refunded Amount",
      "Status",
      "Items Count",
    ];

    const rows = orders.map((o) => [
      this.escapeField(o.invoiceNumber),
      this.escapeField(o.dateTime || o.createdAt),
      this.escapeField(o.customerName),
      this.escapeField(o.employeeName),
      this.escapeField(o.paymentMethod),
      this.escapeField(o.subtotal),
      this.escapeField(o.tax),
      this.escapeField(o.discount),
      this.escapeField(o.amountDue || o.total),
      this.escapeField(o.amountPaid),
      this.escapeField(o.change),
      this.escapeField(o.refundedAmount || 0),
      this.escapeField(o.status),
      this.escapeField(o.products?.length || 0),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  exportInventoryCsv(products: Product[]): string {
    const headers = [
      "Product ID",
      "SKU",
      "Barcode",
      "Name",
      "Category",
      "Selling Price",
      "Cost Price",
      "Units In Stock",
      "Total Retail Value",
      "Total Cost Value",
      "Status",
    ];

    const rows = products.map((p) => {
      const stock = Number(p.unitsInStock) || 0;
      const price = Number(p.unitPrice) || 0;
      const cost = Number(p.costPrice) || 0;
      return [
        this.escapeField(p.id),
        this.escapeField(p.sku || ""),
        this.escapeField(p.barcode || ""),
        this.escapeField(p.name),
        this.escapeField(p.category || ""),
        this.escapeField(price),
        this.escapeField(cost),
        this.escapeField(stock),
        this.escapeField((stock * price).toFixed(2)),
        this.escapeField((stock * cost).toFixed(2)),
        this.escapeField(p.status),
      ];
    });

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  exportMovementsCsv(movements: StockMovement[]): string {
    const headers = [
      "Timestamp",
      "Movement ID",
      "Product ID",
      "Product Name",
      "Type",
      "Quantity Delta",
      "Quantity Before",
      "Quantity After",
      "Unit Cost",
      "Reason",
      "Related Invoice / Order",
      "Performed By",
    ];

    const rows = movements.map((m) => [
      this.escapeField(m.timestamp),
      this.escapeField(m.id),
      this.escapeField(m.productId),
      this.escapeField(m.productName),
      this.escapeField(m.type),
      this.escapeField(m.quantityDelta),
      this.escapeField(m.quantityBefore),
      this.escapeField(m.quantityAfter),
      this.escapeField(m.unitCost || 0),
      this.escapeField(m.reason),
      this.escapeField(m.relatedInvoiceNumber || m.relatedOrderId || m.relatedPoId || ""),
      this.escapeField(m.performedByName || m.performedBy),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  exportPurchaseOrdersCsv(pos: PurchaseOrder[]): string {
    const headers = [
      "PO Number",
      "Supplier",
      "Status",
      "Items Count",
      "Subtotal",
      "Tax",
      "Total Cost",
      "Created By",
      "Created Date",
      "Received Date",
    ];

    const rows = pos.map((po) => [
      this.escapeField(po.poNumber),
      this.escapeField(po.supplierName),
      this.escapeField(po.status),
      this.escapeField(po.items?.length || 0),
      this.escapeField(po.subtotal),
      this.escapeField(po.tax),
      this.escapeField(po.total),
      this.escapeField(po.createdByName),
      this.escapeField(po.createdAt),
      this.escapeField(po.receivedAt || "-"),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  exportShiftsCsv(shifts: Shift[]): string {
    const headers = [
      "Shift ID",
      "Register",
      "Cashier",
      "Opened At",
      "Closed At",
      "Status",
      "Opening Float",
      "Cash Sales",
      "Card Sales",
      "Cash Refunds",
      "Total Sales",
      "Expected Cash",
      "Counted Cash",
      "Difference",
    ];

    const rows = shifts.map((s) => [
      this.escapeField(s.id),
      this.escapeField(s.registerName),
      this.escapeField(s.cashierName),
      this.escapeField(s.openedAt),
      this.escapeField(s.closedAt || "-"),
      this.escapeField(s.status),
      this.escapeField(s.openingFloat),
      this.escapeField(s.cashSales || 0),
      this.escapeField(s.cardSales || 0),
      this.escapeField(s.cashRefunds || 0),
      this.escapeField(s.totalSales || 0),
      this.escapeField(s.expectedCash || 0),
      this.escapeField(s.closingCash || 0),
      this.escapeField(s.cashDifference || 0),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  /**
   * Triggers browser download for generated CSV.
   */
  triggerCsvDownload(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const exportService = new ExportService();
