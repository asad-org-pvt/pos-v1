import React, { useState } from "react";
import { Order } from "../../../../domain/models/Order";
import { Box, Button, Typography, Divider, CircularProgress } from "@mui/material";
import { Print as PrintIcon, Web } from "@mui/icons-material";
import { printerService } from "../../../../services/printer/PrinterService";
import { useSettings } from "../../../../context/SettingsContext";
import toast from "react-hot-toast";

export interface PrintableReceiptProps {
  order: Order | null;
  organizationName?: string;
  onClose?: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  order,
  organizationName,
  onClose,
}) => {
  const { organizationSettings, formatCurrency, formatDateTime } = useSettings();
  const [printing, setPrinting] = useState<boolean>(false);
  const resolvedOrgName = organizationName || organizationSettings.businessName || "PoS-v1 Store";

  if (!order) {
    return null;
  }

  const handleDirectPrint = async () => {
    setPrinting(true);
    try {
      const result = await printerService.printReceipt(order, { organizationName });
      if (result.success) {
        toast.success(`Receipt printed via ${result.transport}!`);
      } else {
        toast.error(result.error || "Direct printing unavailable. Falling back to browser print...");
        // Fallback
        window.print();
      }
    } catch (e: any) {
      toast.error("Printer error. Opening browser print...");
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Screen Control Bar (Hidden on print) */}
      <Box
        className="no-print"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mb: 2,
          "@media print": { display: "none" },
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
            disabled={printing}
            onClick={handleDirectPrint}
          >
            {printing ? "Printing..." : "Print Receipt"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Web />}
            onClick={handleBrowserPrint}
            size="small"
          >
            Browser Print
          </Button>
        </Box>
        {onClose && (
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Close
          </Button>
        )}
      </Box>

      {/* Printable Receipt Container (Formatted for 80mm thermal & standard paper) */}
      <Box
        id="printable-receipt"
        className="printable-content"
        sx={{
          maxWidth: "380px",
          margin: "0 auto",
          p: 3,
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "13px",
          lineHeight: 1.4,
          border: "1px dashed #ccc",
          borderRadius: 1,
          "@media print": {
            border: "none",
            maxWidth: "100%",
            width: "80mm",
            p: 0,
            m: 0,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "inherit" }}>
            {resolvedOrgName}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "inherit", fontSize: "11px" }}>
            {organizationSettings.receiptHeader || "Official Sales Receipt"}
          </Typography>
          {((order as any).isOffline || order.id?.startsWith("outbox_") || order.invoiceNumber?.startsWith("OFF-")) && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "#b45309",
                fontWeight: "bold",
                fontSize: "11px",
                border: "1px dashed #d97706",
                borderRadius: 1,
                py: 0.5,
                my: 0.5,
              }}
            >
              *** SAVED OFFLINE — PENDING SYNC ***
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontFamily: "inherit", fontSize: "11px" }}>
            Tel: {organizationSettings.phone || "---"} | Location: {organizationSettings.city || organizationSettings.country || "Branch"}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Meta Info */}
        <Box sx={{ mb: 1, fontSize: "11px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Invoice #:</span>
            <strong>{order.invoiceNumber}</strong>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Date:</span>
            <span>{order.dateTime ? formatDateTime(order.dateTime) : formatDateTime(new Date())}</span>
          </Box>
          {organizationSettings.showCashierName && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Cashier:</span>
              <span>{order.employeeName || "Cashier"}</span>
            </Box>
          )}
          {organizationSettings.showCustomerInfo && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Customer:</span>
              <span>{order.customerName || "Walk-in Customer"}</span>
            </Box>
          )}
          {order.customerPhone && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Phone:</span>
              <span>{order.customerPhone}</span>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Item Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", margin: "8px 0" }}>
          <thead>
            <tr style={{ borderBottom: "1px dashed #000" }}>
              <th style={{ textAlign: "left", paddingBottom: "4px" }}>Item</th>
              <th style={{ textAlign: "center", paddingBottom: "4px" }}>Qty</th>
              <th style={{ textAlign: "right", paddingBottom: "4px" }}>Price</th>
              <th style={{ textAlign: "right", paddingBottom: "4px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.products.map((item, idx) => (
              <tr key={item.id || `${item.name}-${idx}`}>
                <td style={{ paddingTop: "4px", maxWidth: "140px", wordBreak: "break-word" }}>
                  {item.name}
                </td>
                <td style={{ textAlign: "center", paddingTop: "4px" }}>{item.quantity}</td>
                <td style={{ textAlign: "right", paddingTop: "4px" }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ textAlign: "right", paddingTop: "4px" }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Calculations & Totals */}
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </Box>
          {organizationSettings.showTaxBreakdown && (
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
              <span>Tax ({((order.taxRate || 0.05) * 100).toFixed(0)}%):</span>
              <span>{formatCurrency(order.tax)}</span>
            </Box>
          )}
          {Number(order.discount || 0) > 0 && (
            <>
              {Number((order as any).specialDiscount || 0) > 0 ? (
                <>
                  {Number(order.discount) - Number((order as any).specialDiscount) > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
                      <span>General Discount ({((order.discountRate || 0.02) * 100).toFixed(0)}%):</span>
                      <span>-{formatCurrency(Number(order.discount) - Number((order as any).specialDiscount))}</span>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
                    <span>Special Discount:</span>
                    <span>-{formatCurrency((order as any).specialDiscount)}</span>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
                  <span>Discount ({((order.discountRate || 0.02) * 100).toFixed(0)}%):</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </Box>
              )}
            </>
          )}
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, fontWeight: "bold", fontSize: "14px" }}>
            <span>TOTAL:</span>
            <span>{formatCurrency(order.amountDue || order.total)}</span>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          {order.payments && order.payments.length > 1 ? (
            <Box sx={{ my: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: "bold", fontFamily: "inherit", display: "block", mb: 0.5 }}>
                PAYMENT BREAKDOWN:
              </Typography>
              {order.payments.map((p, pIdx) => (
                <Box key={p.id || pIdx} sx={{ display: "flex", justifyContent: "space-between", py: 0.2, fontSize: "11px" }}>
                  <span>
                    • {p.method} {p.reference ? `(${p.reference})` : ""}:
                  </span>
                  <span>
                    {formatCurrency(p.amount)}
                    {p.method === "CASH" && (p.amountTendered || 0) > (p.amount || 0)
                      ? ` [Tend: ${formatCurrency(p.amountTendered)}]`
                      : ""}
                  </span>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
              <span>Payment Method:</span>
              <span>{order.paymentMethod || "CASH"}</span>
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
            <span>Total Paid:</span>
            <span>{formatCurrency(order.amountPaid || order.amountDue || order.total)}</span>
          </Box>
          {Number(order.change || 0) > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2, fontWeight: "bold" }}>
              <span>Change Returned:</span>
              <span>{formatCurrency(order.change)}</span>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 2 }} />

        {/* Footer */}
        <Box sx={{ textAlign: "center", fontSize: "10px", color: "#555" }}>
          <p style={{ margin: "2px 0" }}>{organizationSettings.receiptFooter || "Thank you for shopping with us!"}</p>
          <p style={{ margin: "2px 0" }}>Return Policy: Within {organizationSettings.returnWindowDays || 30} days with receipt.</p>
        </Box>
      </Box>
    </Box>
  );
};

export default PrintableReceipt;
