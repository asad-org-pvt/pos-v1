import React from "react";
import { Shift } from "../../../../domain/models/Shift";
import { Box, Button, Typography, Divider } from "@mui/material";
import { Print as PrintIcon } from "@mui/icons-material";
import { useSettings } from "../../../../context/SettingsContext";

export interface PrintableShiftReportProps {
  shift: Shift | null;
  organizationName?: string;
  onClose?: () => void;
}

export const PrintableShiftReport: React.FC<PrintableShiftReportProps> = ({
  shift,
  organizationName = "PoS-v1 Store",
  onClose,
}) => {
  const { formatCurrency, formatDateTime } = useSettings();
  if (!shift) return null;

  const handlePrint = () => {
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
          mb: 2,
          "@media print": { display: "none" },
        }}
      >
        <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print Shift Report (Z-Report)
        </Button>
        {onClose && (
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Close
          </Button>
        )}
      </Box>

      {/* Printable Report Container */}
      <Box
        id="printable-shift-report"
        sx={{
          maxWidth: "380px",
          margin: "0 auto",
          p: 3,
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "13px",
          lineHeight: 1.4,
          border: "1px solid #000",
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
            {organizationName}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "inherit", fontWeight: "bold" }}>
            END-OF-DAY / SHIFT CLOSEOUT (Z-REPORT)
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: "inherit" }}>
            Status: {shift.status}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Shift Details */}
        <Box sx={{ mb: 1, fontSize: "11px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Register:</span>
            <strong>{shift.registerName || shift.registerId}</strong>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cashier:</span>
            <span>{shift.cashierName}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Shift Opened:</span>
            <span>{shift.openedAt ? formatDateTime(shift.openedAt) : "-"}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Shift Closed:</span>
            <span>{shift.closedAt ? formatDateTime(shift.closedAt) : "OPEN"}</span>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Sales Summary */}
        <Box sx={{ my: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5, fontSize: "12px" }}>
            SALES BREAKDOWN
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cash Sales:</span>
            <span>{formatCurrency(shift.cashSales || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Card Sales:</span>
            <span>{formatCurrency(shift.cardSales || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Other Sales:</span>
            <span>{formatCurrency(shift.otherSales || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", borderTop: "1px dashed #ccc", pt: 0.5 }}>
            <span>Total Sales ({shift.totalTransactions || 0} txns):</span>
            <span>{formatCurrency(shift.totalSales || 0)}</span>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Returns Summary */}
        <Box sx={{ my: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5, fontSize: "12px" }}>
            REFUNDS & RETURNS
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cash Refunds:</span>
            <span>-{formatCurrency(shift.cashRefunds || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Card Refunds:</span>
            <span>-{formatCurrency(shift.cardRefunds || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", borderTop: "1px dashed #ccc", pt: 0.5 }}>
            <span>Total Refunds:</span>
            <span>-{formatCurrency(shift.totalRefunds || 0)}</span>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 1 }} />

        {/* Cash Drawer Reconciliation */}
        <Box sx={{ my: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5, fontSize: "12px" }}>
            CASH RECONCILIATION
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Opening Float:</span>
            <span>{formatCurrency(shift.openingFloat || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>+ Cash Sales:</span>
            <span>+{formatCurrency(shift.cashSales || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>- Cash Refunds:</span>
            <span>-{formatCurrency(shift.cashRefunds || 0)}</span>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>EXPECTED DRAWER CASH:</span>
            <span>{formatCurrency(shift.expectedCash || 0)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#1976d2" }}>
            <span>ACTUAL COUNTED CASH:</span>
            <span>{formatCurrency(shift.closingCash || 0)}</span>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "14px",
              borderTop: "2px solid #000",
              pt: 0.5,
              mt: 0.5,
              color: (shift.cashDifference || 0) < 0 ? "#d32f2f" : (shift.cashDifference || 0) > 0 ? "#2e7d32" : "#000",
            }}
          >
            <span>DIFFERENCE:</span>
            <span>
              {formatCurrency(shift.cashDifference || 0)}
            </span>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed", my: 2 }} />

        {/* Signatures */}
        <Box sx={{ mt: 3, fontSize: "10px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Cashier Sig: ____________</span>
            <span>Manager Sig: ____________</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PrintableShiftReport;
