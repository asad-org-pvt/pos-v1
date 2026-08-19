import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Business, Save as SaveIcon, LocationOn, ReceiptLong } from "@mui/icons-material";
import { useSettings } from "../../../context/SettingsContext";
import { deriveCurrencyFromCountry } from "../../../domain/formatting/CurrencyFormatter";
import toast from "react-hot-toast";

export const GeneralSettings: React.FC = () => {
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
      toast.success("Organization profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update organization profile");
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
          <Business color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Organization Profile & Receipt Branding
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            {/* 1. BUSINESS PROFILE */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <Business fontSize="small" /> Business Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Store / Business Name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Business Type"
                value={formData.businessType || ""}
                placeholder="Retail, Cafe, Supermarket, etc."
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Store Contact Email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Store Contact Phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Website URL"
                value={formData.website || ""}
                placeholder="https://www.yourstore.com"
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Tax / VAT Registration #"
                value={formData.taxRegistrationNumber || ""}
                placeholder="e.g. VAT-987654321"
                onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
              />
            </Grid>

            {/* 2. LOCATION & ADDRESS */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <LocationOn fontSize="small" /> Physical Location & Address
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Street Address"
                value={formData.address || ""}
                placeholder="123 Main Street, Suite 100"
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Country / Region"
                value={formData.country || ""}
                onChange={(e) => {
                  const newCountry = e.target.value;
                  if (formData.currencyMode === "AUTO") {
                    const derived = deriveCurrencyFromCountry(newCountry);
                    setFormData({
                      ...formData,
                      country: newCountry,
                      currencyCode: derived.code,
                      currencySymbol: derived.symbol,
                      decimalPrecision: derived.decimalPrecision,
                      symbolPosition: derived.symbolPosition,
                    });
                  } else {
                    setFormData({ ...formData, country: newCountry });
                  }
                }}
                helperText="Used for automatic currency derivation"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Postal / ZIP Code"
                value={formData.postalCode || ""}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </Grid>

            {/* 3. RECEIPT BRANDING */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <ReceiptLong fontSize="small" /> Receipt Branding & Customization
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Receipt Header Subtitle"
                value={formData.receiptHeader || ""}
                placeholder="Official Sales Receipt"
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Receipt Footer Thank You Message"
                value={formData.receiptFooter || ""}
                placeholder="Thank you for shopping with us!"
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showCashierName}
                    onChange={(e) => setFormData({ ...formData, showCashierName: e.target.checked })}
                    color="primary"
                  />
                }
                label="Show Cashier Name on Receipts"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showCustomerInfo}
                    onChange={(e) => setFormData({ ...formData, showCustomerInfo: e.target.checked })}
                    color="primary"
                  />
                }
                label="Show Customer Details"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showTaxBreakdown}
                    onChange={(e) => setFormData({ ...formData, showTaxBreakdown: e.target.checked })}
                    color="primary"
                  />
                }
                label="Show Tax Breakdown"
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Organization Settings"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;
