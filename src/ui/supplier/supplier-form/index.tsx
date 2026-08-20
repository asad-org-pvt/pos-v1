import { useFormik } from "formik";
import React from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Business,
  ContactMail,
  LocalShipping,
  Save as SaveIcon,
} from "@mui/icons-material";
import { ComponentProps } from "./SupplierForm";

const SupplierForm: React.FC<ComponentProps> = ({
  onSubmit,
  supplier,
}) => {
  const initialValues = {
    id: supplier?.id || "",
    name: supplier?.name || supplier?.companyName || "",
    companyEmail: supplier?.companyEmail || supplier?.email || "",
    country: supplier?.country || "United States",
    state: supplier?.state || "",
    city: supplier?.city || "",
    address: supplier?.address || "",
    companyPhoneNumber: supplier?.companyPhoneNumber || supplier?.phoneNumber || "",
    zipCode: supplier?.zipCode || "",
    industry: supplier?.industry || "Retail Wholesale",
    productServiceDescription: supplier?.productServiceDescription || "",
    // Main Contact
    mainContactName: supplier?.mainContactName || "",
    mainContactCompanyPosition: supplier?.mainContactCompanyPosition || "",
    mainContactEmail: supplier?.mainContactEmail || "",
    mainContactPhoneNumber: supplier?.mainContactPhoneNumber || "",
    // Additional info
    paymentTerms: supplier?.paymentTerms || "Net 30",
    comment: supplier?.comment || "",
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name?.trim()) {
        errors.name = "Supplier / Company name is required";
      }
      if (values.companyEmail && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.companyEmail)) {
        errors.companyEmail = "Invalid company email address";
      }
      if (values.mainContactEmail && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.mainContactEmail)) {
        errors.mainContactEmail = "Invalid contact email address";
      }
      return errors;
    },
    onSubmit: (values, { resetForm }) => {
      const payload = {
        ...values,
        id: values.id || `sup_${Date.now()}`,
        name: values.name,
        companyName: values.name,
        email: values.companyEmail,
        phoneNumber: values.companyPhoneNumber || values.mainContactPhoneNumber,
        isActive: true,
      };
      onSubmit(payload, { resetForm });
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: { xs: 1.5, sm: 2 } }}>
      {/* 1. COMPANY PROFILE */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Business color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Company & Commercial Profile
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="name"
              name="name"
              label="Company / Vendor Name *"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="id"
              name="id"
              label="Supplier Code / Reference ID"
              placeholder="e.g. SUP-2026 or Vendor ID"
              value={formik.values.id}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="companyEmail"
              name="companyEmail"
              type="email"
              label="Corporate Email"
              value={formik.values.companyEmail}
              onChange={formik.handleChange}
              error={formik.touched.companyEmail && Boolean(formik.errors.companyEmail)}
              helperText={formik.touched.companyEmail && formik.errors.companyEmail}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="companyPhoneNumber"
              name="companyPhoneNumber"
              label="Office Phone Number"
              value={formik.values.companyPhoneNumber}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="industry-label">Industry Category</InputLabel>
              <Select
                labelId="industry-label"
                label="Industry Category"
                id="industry"
                name="industry"
                value={formik.values.industry}
                onChange={formik.handleChange}
              >
                <MenuItem value="Retail Wholesale">Retail Wholesale & Goods</MenuItem>
                <MenuItem value="Food & Beverage">Food, Beverage & Grocery</MenuItem>
                <MenuItem value="Apparel & Fashion">Apparel & Textiles</MenuItem>
                <MenuItem value="Electronics & Tech">Electronics & Hardware</MenuItem>
                <MenuItem value="Packaging & Supplies">Packaging & General Supplies</MenuItem>
                <MenuItem value="Logistics & Freight">Logistics & Transportation</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="payment-terms-label">Payment Terms</InputLabel>
              <Select
                labelId="payment-terms-label"
                label="Payment Terms"
                id="paymentTerms"
                name="paymentTerms"
                value={formik.values.paymentTerms}
                onChange={formik.handleChange}
              >
                <MenuItem value="Immediate / COD">Cash on Delivery / Immediate</MenuItem>
                <MenuItem value="Net 15">Net 15 Days</MenuItem>
                <MenuItem value="Net 30">Net 30 Days</MenuItem>
                <MenuItem value="Net 60">Net 60 Days</MenuItem>
                <MenuItem value="Advance">100% Advance Payment</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              id="productServiceDescription"
              name="productServiceDescription"
              label="Products & Services Supplied"
              placeholder="Summary of goods and materials provided..."
              value={formik.values.productServiceDescription}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. PRIMARY CONTACT PERSON */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ContactMail color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Primary Contact Person
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="mainContactName"
              name="mainContactName"
              label="Contact Person Name"
              value={formik.values.mainContactName}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="mainContactCompanyPosition"
              name="mainContactCompanyPosition"
              label="Company Position / Title"
              placeholder="e.g. Sales Manager, Key Account Exec"
              value={formik.values.mainContactCompanyPosition}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="mainContactEmail"
              name="mainContactEmail"
              type="email"
              label="Direct Email"
              value={formik.values.mainContactEmail}
              onChange={formik.handleChange}
              error={formik.touched.mainContactEmail && Boolean(formik.errors.mainContactEmail)}
              helperText={formik.touched.mainContactEmail && formik.errors.mainContactEmail}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="mainContactPhoneNumber"
              name="mainContactPhoneNumber"
              label="Direct Mobile / Phone"
              value={formik.values.mainContactPhoneNumber}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 3. ADDRESS & LOGISTICS */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <LocalShipping color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Address & Dispatch Location
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="country"
              name="country"
              label="Country"
              value={formik.values.country}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="state"
              name="state"
              label="State / Province"
              value={formik.values.state}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="city"
              name="city"
              label="City"
              value={formik.values.city}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="zipCode"
              name="zipCode"
              label="Zip / Postal Code"
              value={formik.values.zipCode}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              id="address"
              name="address"
              label="Warehouse / Factory / Office Address"
              value={formik.values.address}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              id="comment"
              name="comment"
              label="Internal Notes / Commercial Terms"
              value={formik.values.comment}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SUBMIT BUTTON */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={formik.isSubmitting}
          startIcon={<SaveIcon />}
          sx={{ minWidth: 160, borderRadius: 2, fontWeight: "bold" }}
        >
          {formik.isSubmitting ? "Saving..." : "Save Supplier"}
        </Button>
      </Box>
    </Box>
  );
};

export default SupplierForm;
