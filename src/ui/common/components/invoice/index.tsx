import React, { useMemo, useState, useEffect } from "react";
import Table from "../table";
import { ComponentProps, useStylesFromThemeFunction } from "./Invoice";
import {
  calculateSaleTotals,
  PaymentAllocation,
} from "../../../../domain/calculations/SaleCalculations";
import { PaymentMethod } from "../../../../domain/models/Payment";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Button,
  IconButton,
  TextField,
  Chip,
  Paper,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  AddCircleOutline,
  DeleteOutline,
  CallSplit,
  Payments,
  CreditCard,
  AccountBalanceWallet,
  PersonOutline,
  ReceiptLong,
  CheckCircleOutlined,
  PrintOutlined,
  CancelOutlined,
  ShoppingCartOutlined,
  LocalOfferOutlined,
} from "@mui/icons-material";
import { useSettings } from "../../../../context/SettingsContext";

export interface ExtendedInvoiceProps extends ComponentProps {
  customers?: Array<{ id: string; name: string; email?: string; phoneNumber?: string }>;
  selectedCustomer?: any;
  onSelectCustomer?: (customer: any) => void;
  paymentMethod?: PaymentMethod;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
  paymentReference?: string;
  onPaymentReferenceChange?: (ref: string) => void;
  amountTendered?: number;
  onAmountTenderedChange?: (amount: number) => void;
  specialDiscount?: number;
  onSpecialDiscountChange?: (discount: number) => void;
  payments?: PaymentAllocation[];
  onPaymentsChange?: (payments: PaymentAllocation[]) => void;
  isCompleted?: boolean;
}

export const Invoice: React.FC<ExtendedInvoiceProps> = ({
  isLoading,
  products = [],
  handleCancel,
  handleConfirm,
  handlePrint,
  invoiceNumber,
  customers = [],
  selectedCustomer = null,
  onSelectCustomer,
  paymentMethod = "CASH",
  onPaymentMethodChange,
  paymentReference = "",
  onPaymentReferenceChange,
  amountTendered,
  onAmountTenderedChange,
  specialDiscount,
  onSpecialDiscountChange,
  payments = [],
  onPaymentsChange,
  isCompleted = false,
}) => {
  const classes = useStylesFromThemeFunction();
  const { formatCurrency, organizationSettings } = useSettings();
  const [internalTendered, setInternalTendered] = useState<number>(0);
  const [internalSpecialDiscount, setInternalSpecialDiscount] = useState<number>(0);
  const [activeTenderTab, setActiveTenderTab] = useState<string>("CASH");
  const [splitAllocations, setSplitAllocations] = useState<PaymentAllocation[]>([]);

  const isSplitMode = activeTenderTab === "SPLIT";
  const activeTaxRate = organizationSettings.taxEnabled ? organizationSettings.defaultTaxRate : 0;
  const activeDiscountRate = organizationSettings.discountsEnabled ? organizationSettings.defaultDiscountRate : 0;
  const effectiveSpecialDiscount = specialDiscount !== undefined ? specialDiscount : internalSpecialDiscount;

  // Initialize payment method from organization settings default
  useEffect(() => {
    if (organizationSettings.defaultPaymentMethod) {
      const def = organizationSettings.defaultPaymentMethod as PaymentMethod;
      setActiveTenderTab(def);
      if (onPaymentMethodChange) onPaymentMethodChange(def);
    }
  }, [organizationSettings.defaultPaymentMethod]);

  // Authoritative calculations
  const totals = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        taxRate: activeTaxRate,
        discount: 0,
        generalDiscount: 0,
        specialDiscount: 0,
        discountRate: activeDiscountRate,
        total: 0,
        amountDue: 0,
        amountPaid: 0,
        change: 0,
        paymentMethod,
        payments: [],
        isFullyPaid: false,
      };
    }
    try {
      if (isSplitMode && splitAllocations.length > 0) {
        return calculateSaleTotals({
          items: products,
          taxRate: activeTaxRate,
          discountRate: activeDiscountRate,
          specialDiscount: effectiveSpecialDiscount,
          maxDiscountPercent: organizationSettings.maxDiscountPercent,
          payments: splitAllocations,
        });
      }

      const currentTendered = amountTendered !== undefined ? amountTendered : internalTendered;
      const effectiveMethod = (isSplitMode ? "OTHER" : paymentMethod) as PaymentMethod;
      return calculateSaleTotals({
        items: products,
        taxRate: activeTaxRate,
        discountRate: activeDiscountRate,
        specialDiscount: effectiveSpecialDiscount,
        maxDiscountPercent: organizationSettings.maxDiscountPercent,
        paymentMethod: effectiveMethod,
        amountTendered: currentTendered,
      });
    } catch (e) {
      return {
        subtotal: 0,
        tax: 0,
        taxRate: activeTaxRate,
        discount: 0,
        generalDiscount: 0,
        specialDiscount: 0,
        discountRate: activeDiscountRate,
        total: 0,
        amountDue: 0,
        amountPaid: 0,
        change: 0,
        paymentMethod,
        payments: [],
        isFullyPaid: false,
      };
    }
  }, [products, paymentMethod, amountTendered, internalTendered, isSplitMode, splitAllocations, activeTaxRate, activeDiscountRate, effectiveSpecialDiscount, organizationSettings.maxDiscountPercent]);

  useEffect(() => {
    if (totals.amountDue > 0 && internalTendered === 0 && paymentMethod === "CASH" && !isSplitMode) {
      setInternalTendered(totals.amountDue);
      if (onAmountTenderedChange) onAmountTenderedChange(totals.amountDue);
    }
  }, [totals.amountDue, paymentMethod, isSplitMode]);

  // Sync split allocations up to parent
  useEffect(() => {
    if (onPaymentsChange) {
      if (isSplitMode) {
        onPaymentsChange(splitAllocations);
      } else {
        onPaymentsChange([]);
      }
    }
  }, [isSplitMode, splitAllocations]);

  const handleTenderedChange = (val: number) => {
    setInternalTendered(val);
    if (onAmountTenderedChange) onAmountTenderedChange(val);
  };

  const handleTenderTabChange = (_: any, newTab: string | null) => {
    if (!newTab) return;
    setActiveTenderTab(newTab);

    if (newTab === "SPLIT") {
      const half1 = Math.floor(totals.amountDue / 2);
      const half2 = Number((totals.amountDue - half1).toFixed(2));
      const initialRows: PaymentAllocation[] = [
        { method: "CASH", amount: half1, amountTendered: half1, change: 0 },
        { method: "CARD", amount: half2, amountTendered: half2, change: 0, reference: "" },
      ];
      setSplitAllocations(initialRows);
    } else {
      if (onPaymentMethodChange) {
        onPaymentMethodChange(newTab as PaymentMethod);
      }
      setSplitAllocations([]);
    }
  };

  const handleAddSplitRow = () => {
    const allocated = splitAllocations.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, Number((totals.amountDue - allocated).toFixed(2)));
    setSplitAllocations([
      ...splitAllocations,
      { method: "CASH", amount: remaining, amountTendered: remaining, change: 0 },
    ]);
  };

  const handleRemoveSplitRow = (index: number) => {
    const updated = splitAllocations.filter((_, idx) => idx !== index);
    setSplitAllocations(updated);
  };

  const handleSplitRowChange = (index: number, field: keyof PaymentAllocation, value: any) => {
    const updated = [...splitAllocations];
    const row = { ...updated[index], [field]: value };

    if (field === "amount" && row.method === "CASH") {
      row.amountTendered = value;
      row.change = 0;
    }
    if (field === "amountTendered" && row.method === "CASH") {
      const tendered = Number(value) || 0;
      const amt = Number(row.amount) || 0;
      row.change = Math.max(0, Number((tendered - amt).toFixed(2)));
    }

    updated[index] = row;
    setSplitAllocations(updated);
  };

  const renderAddedProducts = useMemo(() => {
    if (!products || products.length === 0) {
      return <></>;
    }
    return products.map((product) => {
      const { name, unitPrice, quantity } = product;
      const itemTotal = Number(unitPrice) * Number(quantity);
      return (
        <tr key={product.id || name}>
          <td style={{ fontWeight: 500 }}>{name}</td>
          <td style={{ textAlign: "center" }}>{quantity}</td>
          <td style={{ textAlign: "right" }}>{formatCurrency(unitPrice)}</td>
          <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(itemTotal)}</td>
        </tr>
      );
    });
  }, [products, formatCurrency]);

  const splitAllocatedSum = useMemo(() => {
    return Number(splitAllocations.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toFixed(2));
  }, [splitAllocations]);

  const splitRemainingBalance = useMemo(() => {
    return Number((totals.amountDue - splitAllocatedSum).toFixed(2));
  }, [totals.amountDue, splitAllocatedSum]);

  const isCustomerValid = !organizationSettings.customerRequired || Boolean(selectedCustomer?.id);
  const maxAllowedPercent = organizationSettings.maxDiscountPercent !== undefined ? organizationSettings.maxDiscountPercent : 50;
  const maxAllowedDiscount = Number(((totals.subtotal * maxAllowedPercent) / 100).toFixed(2));
  const isDiscountOverLimit = totals.subtotal > 0 && effectiveSpecialDiscount > maxAllowedDiscount;

  const canConfirm =
    products.length > 0 &&
    !isLoading &&
    isCustomerValid &&
    !isDiscountOverLimit &&
    (isSplitMode ? splitRemainingBalance === 0 && splitAllocations.length > 0 : paymentMethod !== "CASH" || totals.isFullyPaid);

  return (
    <div className={classes.totalBillContainer}>
      {/* Header */}
      <div className={classes.headerRow}>
        <h2 className={classes.title}>
          <ReceiptLong fontSize="medium" color="primary" /> Invoice
        </h2>
        <Chip
          label={`#${invoiceNumber || "---"}`}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: "700", fontSize: "12px" }}
        />
      </div>

      {/* Customer Selection */}
      <FormControl fullWidth size="small">
        <InputLabel id="customer-select-label">Customer</InputLabel>
        <Select
          labelId="customer-select-label"
          id="customer-select"
          value={selectedCustomer?.id || ""}
          label="Customer"
          startAdornment={
            <InputAdornment position="start">
              <PersonOutline fontSize="small" sx={{ color: "text.secondary" }} />
            </InputAdornment>
          }
          onChange={(e) => {
            const custId = e.target.value;
            const found = customers.find((c) => c.id === custId) || null;
            if (onSelectCustomer) onSelectCustomer(found);
          }}
          sx={{ bgcolor: "background.paper", borderRadius: "8px" }}
        >
          <MenuItem value="">
            <em>Walk-in Customer</em>
          </MenuItem>
          {customers.map((cust) => (
            <MenuItem key={cust.id} value={cust.id}>
              {cust.name} {cust.phoneNumber ? `(${cust.phoneNumber})` : ""}
            </MenuItem>
          ))}
        </Select>
        {organizationSettings.customerRequired && !selectedCustomer && (
          <Typography variant="caption" sx={{ color: "warning.main", display: "block", mt: 0.5, fontWeight: 600 }}>
            * Customer selection is required by organization policy
          </Typography>
        )}
      </FormControl>

      {/* Products Cart Summary */}
      <div className={classes.productsList}>
        {products.length <= 0 ? (
          <div className={classes.noData}>
            <ShoppingCartOutlined sx={{ fontSize: 32, mb: 0.5, color: "text.disabled" }} />
            <span>No items in cart</span>
          </div>
        ) : (
          <Table
            tableHeadings={["Item", "Qty", "Price", "Total"]}
            renderBody={renderAddedProducts}
            loading={isLoading}
          />
        )}
      </div>

      {/* Special Discount Field */}
      <Box sx={{ mb: 1 }}>
        <TextField
          size="small"
          fullWidth
          label={`Special Discount (${organizationSettings.currencySymbol.trim()})`}
          type="number"
          error={isDiscountOverLimit}
          helperText={
            isDiscountOverLimit
              ? `Exceeds maximum allowed discount limit of ${maxAllowedPercent}% (${formatCurrency(maxAllowedDiscount)})`
              : undefined
          }
          inputProps={{ min: 0, step: "0.5" }}
          value={effectiveSpecialDiscount > 0 ? effectiveSpecialDiscount : ""}
          placeholder="0.00"
          onChange={(e) => {
            const val = Math.max(0, parseFloat(e.target.value) || 0);
            setInternalSpecialDiscount(val);
            if (onSpecialDiscountChange) onSpecialDiscountChange(val);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocalOfferOutlined fontSize="small" sx={{ color: isDiscountOverLimit ? "error.main" : "success.main" }} />
              </InputAdornment>
            ),
            style: { borderRadius: "8px", fontSize: "12px" },
          }}
        />
      </Box>

      {/* Calculations Breakdown */}
      <div className={classes.breakdownBox}>
        <div className={classes.breakdownRow}>
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.generalDiscount > 0 && (
          <div className={classes.breakdownRow} style={{ color: "var(--success, #16a34a)" }}>
            <span>General Discount ({(activeDiscountRate * 100).toFixed(0)}%)</span>
            <span>-{formatCurrency(totals.generalDiscount)}</span>
          </div>
        )}
        {totals.specialDiscount > 0 && (
          <div className={classes.breakdownRow} style={{ color: "var(--success, #16a34a)", fontWeight: "600" }}>
            <span>Special Discount</span>
            <span>-{formatCurrency(totals.specialDiscount)}</span>
          </div>
        )}
        {organizationSettings.taxEnabled && (
          <div className={classes.breakdownRow}>
            <span>Tax ({(activeTaxRate * 100).toFixed(0)}%)</span>
            <span>{formatCurrency(totals.tax)}</span>
          </div>
        )}
        <div className={classes.breakdownRowBold}>
          <span>Amount Due</span>
          <span style={{ color: "var(--primary-color, #0d6efd)" }}>{formatCurrency(totals.amountDue)}</span>
        </div>
      </div>

      {/* Payment Tender Segmented Control */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontWeight: "700", mb: 0.8, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}
        >
          Payment Tender
        </Typography>
        <ToggleButtonGroup
          value={activeTenderTab}
          exclusive
          fullWidth
          size="small"
          onChange={handleTenderTabChange}
          sx={{
            bgcolor: "background.default",
            borderRadius: "8px",
            p: "2px",
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "none",
              py: 0.6,
              "&.Mui-selected": {
                bgcolor: "background.paper",
                color: "text.primary",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              },
            },
          }}
        >
          <ToggleButton value="CASH">
            <Payments sx={{ fontSize: 15, mr: 0.5 }} /> Cash
          </ToggleButton>
          <ToggleButton value="CARD">
            <CreditCard sx={{ fontSize: 15, mr: 0.5 }} /> Card
          </ToggleButton>
          <ToggleButton value="OTHER">
            <AccountBalanceWallet sx={{ fontSize: 15, mr: 0.5 }} /> Other
          </ToggleButton>
          <ToggleButton value="SPLIT">
            <CallSplit sx={{ fontSize: 15, mr: 0.5 }} /> Split
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Single Tender Inputs */}
      {!isSplitMode ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {paymentMethod === "CASH" ? (
            <>
              <TextField
                size="small"
                fullWidth
                label={`Cash Tendered (${organizationSettings.currencySymbol.trim()})`}
                type="number"
                value={amountTendered !== undefined ? amountTendered : internalTendered}
                onChange={(e) => handleTenderedChange(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{organizationSettings.currencySymbol.trim()}</InputAdornment>,
                  style: { borderRadius: "8px", fontWeight: "600" },
                }}
              />
              {/* Quick Cash Presets */}
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                <Chip
                  label="Exact"
                  size="small"
                  onClick={() => handleTenderedChange(totals.amountDue)}
                  clickable
                  sx={{ fontSize: "11px", fontWeight: "600" }}
                />
                {(organizationSettings.quickCashPresets || [20, 50, 100]).map((amt) => (
                  <Chip
                    key={amt}
                    label={formatCurrency(amt)}
                    size="small"
                    onClick={() => handleTenderedChange(amt)}
                    clickable
                    sx={{ fontSize: "11px", fontWeight: "600" }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <TextField
              size="small"
              fullWidth
              label={paymentMethod === "CARD" ? "Card Auth / Reference #" : "Payment Reference #"}
              value={paymentReference}
              placeholder="Optional Reference #"
              onChange={(e) => {
                if (onPaymentReferenceChange) onPaymentReferenceChange(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {paymentMethod === "CARD" ? (
                      <CreditCard fontSize="small" sx={{ color: "text.secondary" }} />
                    ) : (
                      <AccountBalanceWallet fontSize="small" sx={{ color: "text.secondary" }} />
                    )}
                  </InputAdornment>
                ),
                style: { borderRadius: "8px" },
              }}
            />
          )}

          {/* Cash Change Indicator */}
          {totals.change > 0 && paymentMethod === "CASH" && (
            <Paper
              elevation={0}
              sx={{
                p: 1,
                bgcolor: "success.light",
                border: "1px solid",
                borderColor: "success.main",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "success.main", fontWeight: "700" }}>
                CASH CHANGE DUE
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "success.main", fontWeight: "800" }}>
                {formatCurrency(totals.change)}
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        /* Multi-Tender Split Panel */
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default", borderRadius: "8px", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: "700", color: "text.secondary" }}>
              SPLIT ALLOCATIONS
            </Typography>
            <Button
              size="small"
              startIcon={<AddCircleOutline fontSize="small" />}
              onClick={handleAddSplitRow}
              sx={{ fontSize: "11px", textTransform: "none", py: 0.2 }}
            >
              Add Tender
            </Button>
          </Box>

          {splitAllocations.map((row, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                gap: 0.8,
                alignItems: "center",
                mb: 1,
                p: 0.6,
                bgcolor: "background.paper",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <FormControl size="small" sx={{ width: 95 }}>
                <Select
                  value={row.method}
                  onChange={(e) => handleSplitRowChange(idx, "method", e.target.value)}
                  sx={{ fontSize: "12px", height: "32px" }}
                >
                  <MenuItem value="CASH">CASH</MenuItem>
                  <MenuItem value="CARD">CARD</MenuItem>
                  <MenuItem value="OTHER">OTHER</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Amount"
                type="number"
                value={row.amount}
                onChange={(e) => handleSplitRowChange(idx, "amount", parseFloat(e.target.value) || 0)}
                sx={{ width: 95, "& input": { fontSize: "12px", py: "6px" } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start" sx={{ "& p": { fontSize: "11px" } }}>$</InputAdornment>,
                }}
              />

              {row.method === "CASH" ? (
                <TextField
                  size="small"
                  label="Tendered"
                  type="number"
                  value={row.amountTendered}
                  onChange={(e) =>
                    handleSplitRowChange(idx, "amountTendered", parseFloat(e.target.value) || 0)
                  }
                  sx={{ width: 90, "& input": { fontSize: "12px", py: "6px" } }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ "& p": { fontSize: "11px" } }}>$</InputAdornment>,
                  }}
                />
              ) : (
                <TextField
                  size="small"
                  label="Ref #"
                  value={row.reference || ""}
                  onChange={(e) => handleSplitRowChange(idx, "reference", e.target.value)}
                  sx={{ flex: 1, "& input": { fontSize: "12px", py: "6px" } }}
                />
              )}

              <IconButton size="small" color="error" onClick={() => handleRemoveSplitRow(idx)}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Box>
          ))}

          {/* Split Status Badge */}
          <Box
            sx={{
              mt: 1,
              p: 0.8,
              borderRadius: "6px",
              bgcolor: splitRemainingBalance === 0 ? "success.light" : "error.light",
              border: "1px solid",
              borderColor: splitRemainingBalance === 0 ? "success.main" : "error.main",
              fontSize: "12px",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>Allocated:</span>
              <strong style={{ color: "var(--text-primary, #0f172a)" }}>{formatCurrency(splitAllocatedSum)} / {formatCurrency(totals.amountDue)}</strong>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>Remaining:</span>
              <strong style={{ color: splitRemainingBalance === 0 ? "var(--success, #16a34a)" : "var(--error, #dc2626)" }}>
                {formatCurrency(splitRemainingBalance)}
              </strong>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Action Buttons */}
      <div className={classes.buttonsContainer}>
        <Button
          variant="outlined"
          color="inherit"
          size="medium"
          disabled={isLoading}
          startIcon={<CancelOutlined />}
          onClick={handleCancel}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: "600",
            color: "text.secondary",
            borderColor: "divider",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="medium"
          disabled={products.length <= 0 || isLoading}
          startIcon={<PrintOutlined />}
          onClick={handlePrint}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: "600",
          }}
        >
          Print
        </Button>

        <Button
          variant="contained"
          color="primary"
          size="medium"
          disabled={!canConfirm}
          startIcon={<CheckCircleOutlined />}
          onClick={handleConfirm}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: "700",
            boxShadow: "0 2px 8px rgba(14, 165, 233, 0.25)",
          }}
        >
          Pay {formatCurrency(totals.amountDue)}
        </Button>
      </div>
    </div>
  );
};

export default Invoice;
