import React, { useState } from "react";
import { Return } from "../../../../domain/models/Return";
import { Box, Button, Typography, Divider, CircularProgress } from "@mui/material";
import { Print as PrintIcon, Web } from "@mui/icons-material";
import { printerService } from "../../../../services/printer/PrinterService";
import { useSettings } from "../../../../context/SettingsContext";
import toast from "react-hot-toast";

export interface PrintableRefundReceiptProps {
  returnRecord: Return | null;
  organizationName?: string;
  onClose?: () => void;
}

export const PrintableRefundReceipt: React.FC<PrintableRefundReceiptProps> = ({
  returnRecord,
  organizationName = "PoS-v1 Store",
  onClose,
}) => {
  const { formatCurrency, formatDateTime } = useSettings();
  const [printing, setPrinting] = useState<boolean>(false);

  if (!returnRecord) return null;

  const handleDirectPrint = async () => {
    setPrinting(true);
    try {
      const result = await printerService.printRefundReceipt(returnRecord, { organizationName });
      if (result.success) {
        toast.success(`Refund receipt printed via ${result.transport}!`);
      } else {
        toast.error(result.error || "Direct printer unavailable. Falling back to browser print...");
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
      {/* Screen Control Bar */}
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
            color="error"
            startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
            disabled={printing}
            onClick={handleDirectPrint}
          >
            {printing ? "Printing..." : "Print Refund Receipt"}
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

      {/* Printable Receipt Container */}
      <Box
        id="printable-refund-receipt"
        sx={{
          maxWidth: "380px",
          margin: "0 auto",
          p: 3,
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "13px",
          lineHeight: 1.4,
          border: "1px dashed #d32f2f",
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
          <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "inherit", color: "#d32f2f" }}>
            {organizationName}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "inherit", fontSize: "12px", fontWeight: "bold" }}>
            CUSTOMER RETURN & REFUND RECEIPT
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Metadata */}
        <Box sx={{ mb: 1, fontSize: "11px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Return #:</span>
            <strong>{returnRecord.returnInvoiceNumber}</strong>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Original Invoice #:</span>
            <span>{returnRecord.originalInvoiceNumber}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Date:</span>
            <span>{returnRecord.createdAt ? formatDateTime(returnRecord.createdAt) : formatDateTime(new Date())}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cashier:</span>
            <span>{returnRecord.cashierName || "Cashier"}</span>
          </Box>
          {returnRecord.reason && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Reason:</span>
              <span>{returnRecord.reason}</span>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Items */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", margin: "8px 0" }}>
          <thead>
            <tr style={{ borderBottom: "1px dashed #000" }}>
              <th style={{ textAlign: "left", paddingBottom: "4px" }}>Item Returned</th>
              <th style={{ textAlign: "center", paddingBottom: "4px" }}>Qty</th>
              <th style={{ textAlign: "right", paddingBottom: "4px" }}>Refund</th>
            </tr>
          </thead>
          <tbody>
            {returnRecord.items.map((item, idx) => (
              <tr key={item.productId || `${item.name}-${idx}`}>
                <td style={{ paddingTop: "4px", maxWidth: "140px", wordBreak: "break-word" }}>{item.name}</td>
                <td style={{ textAlign: "center", paddingTop: "4px" }}>{item.quantity}</td>
                <td style={{ textAlign: "right", paddingTop: "4px" }}>{formatCurrency(item.refundAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Totals */}
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, fontWeight: "bold", fontSize: "14px" }}>
            <span>TOTAL REFUNDED:</span>
            <span>{formatCurrency(returnRecord.refundTotal)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
            <span>Refund Method:</span>
            <span>{returnRecord.refundMethod}</span>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 2 }} />

        {/* Signatures */}
        <Box sx={{ mt: 2, fontSize: "10px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <span>Cashier Sig: ____________</span>
            <span>Customer Sig: ____________</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PrintableRefundReceipt;
