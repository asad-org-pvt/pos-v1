import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/material";
import { PointOfSale, Save as SaveIcon, AttachMoney, Percent, ShoppingCart, AssignmentReturn } from "@mui/icons-material";
import { useSettings } from "../../../context/SettingsContext";
import { SUPPORTED_CURRENCIES, deriveCurrencyFromCountry } from "../../../domain/formatting/CurrencyFormatter";
import toast from "react-hot-toast";

export const PosBusinessSettings: React.FC = () => {
  const { organizationSettings, updateOrganizationSettings, isLoading } = useSettings();
  const [formData, setFormData] = useState(organizationSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(organizationSettings);
  }, [organizationSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOrganizationSettings(formData);
      toast.success("POS & Business settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ maxWidth: 900, m: "0 auto", borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <PointOfSale color="primary" />
          <Typography variant="h6" fontWeight="bold">
            POS & Business Settings
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            {/* 1. CURRENCY SECTION */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <AttachMoney fontSize="small" /> Currency & Denomination
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="currency-mode-label">Currency Mode</InputLabel>
                <Select
                  labelId="currency-mode-label"
                  label="Currency Mode"
                  value={formData.currencyMode}
                  onChange={(e) => {
                    const mode = e.target.value as "MANUAL" | "AUTO";
                    if (mode === "AUTO") {
                      const derived = deriveCurrencyFromCountry(formData.country || "United States");
                      setFormData({
                        ...formData,
                        currencyMode: "AUTO",
                        currencyCode: derived.code,
                        currencySymbol: derived.symbol,
                        decimalPrecision: derived.decimalPrecision,
                        symbolPosition: derived.symbolPosition,
                      });
                    } else {
                      setFormData({ ...formData, currencyMode: "MANUAL" });
                    }
                  }}
                >
                  <MenuItem value="MANUAL">Manual Selection</MenuItem>
                  <MenuItem value="AUTO">Auto (From Country Location)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="currency-code-label">Display Currency</InputLabel>
                <Select
                  labelId="currency-code-label"
                  label="Display Currency"
                  value={formData.currencyCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const details = SUPPORTED_CURRENCIES[code];
                    if (details) {
                      setFormData({
                        ...formData,
                        currencyMode: "MANUAL",
                        currencyCode: details.code,
                        currencySymbol: details.symbol,
                        decimalPrecision: details.decimalPrecision,
                        symbolPosition: details.symbolPosition,
                      });
                    }
                  }}
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.code} ({c.symbol.trim()}) - {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Currency Symbol"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                disabled={formData.currencyMode === "AUTO"}
              />
            </Grid>

            {/* 2. TAX & DISCOUNTS */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <Percent fontSize="small" /> Tax & Discounts
              </Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.taxEnabled}
                    onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
                    color="primary"
                  />
                }
                label="Enable Sales Tax"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Default Tax Rate"
                type="number"
                inputProps={{ step: "0.01", min: "0", max: "1" }}
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                helperText={`Current: ${(formData.defaultTaxRate * 100).toFixed(1)}%`}
                disabled={!formData.taxEnabled}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.discountsEnabled}
                    onChange={(e) => setFormData({ ...formData, discountsEnabled: e.target.checked })}
                    color="primary"
                  />
                }
                label="Enable Discounts"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Default Discount Rate"
                type="number"
                inputProps={{ step: "0.01", min: "0", max: "1" }}
                value={formData.defaultDiscountRate}
                onChange={(e) => setFormData({ ...formData, defaultDiscountRate: parseFloat(e.target.value) || 0 })}
                helperText={`Current: ${(formData.defaultDiscountRate * 100).toFixed(1)}%`}
                disabled={!formData.discountsEnabled}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Max Discount Limit (%)"
                type="number"
                inputProps={{ min: "0", max: "100" }}
                value={formData.maxDiscountPercent !== undefined ? formData.maxDiscountPercent : 50}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscountPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                  })
                }
                helperText="Maximum discount percentage at POS"
                disabled={!formData.discountsEnabled}
              />
            </Grid>

            {/* 3. CHECKOUT DEFAULTS */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <ShoppingCart fontSize="small" /> Checkout & Inventory Rules
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="default-payment-label">Default Payment Method</InputLabel>
                <Select
                  labelId="default-payment-label"
                  label="Default Payment Method"
                  value={formData.defaultPaymentMethod}
                  onChange={(e) => setFormData({ ...formData, defaultPaymentMethod: e.target.value as any })}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Credit / Debit Card</MenuItem>
                  <MenuItem value="OTHER">Other / Split</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Low Stock Warning Level"
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 0 })}
                helperText="Triggers low-stock warning in POS"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowNegativeStockSales}
                    onChange={(e) => setFormData({ ...formData, allowNegativeStockSales: e.target.checked })}
                    color="warning"
                  />
                }
                label="Allow Out-of-Stock Sales"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.customerRequired}
                    onChange={(e) => setFormData({ ...formData, customerRequired: e.target.checked })}
                    color="primary"
                  />
                }
                label="Require Customer for Checkout"
              />
            </Grid>

            {/* Quick Cash Presets Editor */}
            <Grid item xs={12} sm={8}>
              <Box sx={{ border: "1px solid", borderColor: "divider", p: 1.5, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 1 }}>
                  Quick Cash Preset Amounts ({formData.currencySymbol.trim()})
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mb: 1 }}>
                  {(formData.quickCashPresets || [20, 50, 100]).map((preset, idx) => (
                    <Chip
                      key={idx}
                      label={`${formData.currencySymbol.trim()} ${preset}`}
                      onDelete={() => {
                        const current = formData.quickCashPresets || [20, 50, 100];
                        if (current.length <= 1) {
                          toast.error("At least one quick cash preset is required");
                          return;
                        }
                        setFormData({
                          ...formData,
                          quickCashPresets: current.filter((_, i) => i !== idx),
                        });
                      }}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    id="new-preset-amount-input"
                    size="small"
                    type="number"
                    placeholder="New amount (e.g. 500)"
                    sx={{ width: 180 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const inputEl = e.currentTarget as HTMLInputElement;
                        const val = parseFloat(inputEl.value);
                        if (!val || val <= 0) {
                          toast.error("Enter a valid positive number");
                          return;
                        }
                        const current = formData.quickCashPresets || [20, 50, 100];
                        if (current.includes(val)) {
                          toast.error("Preset already exists");
                          return;
                        }
                        setFormData({
                          ...formData,
                          quickCashPresets: [...current, val].sort((a, b) => a - b),
                        });
                        inputEl.value = "";
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const inputEl = document.getElementById("new-preset-amount-input") as HTMLInputElement;
                      if (!inputEl) return;
                      const val = parseFloat(inputEl.value);
                      if (!val || val <= 0) {
                        toast.error("Enter a valid positive number");
                        return;
                      }
                      const current = formData.quickCashPresets || [20, 50, 100];
                      if (current.includes(val)) {
                        toast.error("Preset already exists");
                        return;
                      }
                      setFormData({
                        ...formData,
                        quickCashPresets: [...current, val].sort((a, b) => a - b),
                      });
                      inputEl.value = "";
                    }}
                  >
                    Add Preset
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* 4. RETURN POLICY */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <AssignmentReturn fontSize="small" /> Return & Refund Policy
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Return Window (Days)"
                type="number"
                value={formData.returnWindowDays}
                onChange={(e) => setFormData({ ...formData, returnWindowDays: parseInt(e.target.value, 10) || 30 })}
                helperText="Maximum allowed days after sale for returns"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.returnReasonRequired}
                    onChange={(e) => setFormData({ ...formData, returnReasonRequired: e.target.checked })}
                    color="primary"
                  />
                }
                label="Require Reason for Returns"
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Business Settings"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default PosBusinessSettings;
