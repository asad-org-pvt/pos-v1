import { useFormik } from "formik";
import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Paper,
  FormControlLabel,
  Checkbox,
  Collapse,
} from "@mui/material";
import {
  Person,
  Home,
  LocalShipping,
  Save as SaveIcon,
} from "@mui/icons-material";
import { ComponentProps } from "./CustomerForm";

const CustomerForm: React.FC<ComponentProps> = ({
  onSubmit,
  customer,
}) => {
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const initialValues = {
    id: customer?.id || "",
    name: customer?.name || "",
    email: customer?.email || "",
    phoneNumber: customer?.phoneNumber || "",
    country: customer?.country || "United States",
    state: customer?.state || "",
    city: customer?.city || "",
    address: customer?.address || "",
    zipCode: customer?.zipCode || customer?.zip || "",
    // Shipping Information
    shippingCountry: customer?.shippingCountry || "",
    shippingState: customer?.shippingState || "",
    shippingCity: customer?.shippingCity || "",
    shippingAddress: customer?.shippingAddress || "",
    shippingAddressLandmark: customer?.shippingAddressLandmark || "",
    shippingZipCode: customer?.shippingZipCode || "",
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name?.trim()) {
        errors.name = "Customer name is required";
      }
      if (values.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
        errors.email = "Invalid email address";
      }
      if (!values.phoneNumber?.trim()) {
        errors.phoneNumber = "Phone number is required";
      }
      return errors;
    },
    onSubmit: (values, { resetForm }) => {
      const payload = {
        ...values,
        id: values.id || `cust_${Date.now()}`,
        zip: values.zipCode,
        shippingCountry: sameAsBilling ? values.country : values.shippingCountry,
        shippingState: sameAsBilling ? values.state : values.shippingState,
        shippingCity: sameAsBilling ? values.city : values.shippingCity,
        shippingAddress: sameAsBilling ? values.address : values.shippingAddress,
        shippingZipCode: sameAsBilling ? values.zipCode : values.shippingZipCode,
        isActive: true,
      };
      onSubmit(payload, { resetForm });
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: { xs: 1.5, sm: 2 } }}>
      {/* 1. PERSONAL & CONTACT DETAILS */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Person color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Customer Profile & Contact
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="name"
              name="name"
              label="Customer Full Name *"
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
              label="Customer ID / CNIC / Loyalty Code"
              placeholder="e.g. CUST-1001 or CNIC"
              value={formik.values.id}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="phoneNumber"
              name="phoneNumber"
              label="Mobile / Phone Number *"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
              helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. BILLING ADDRESS */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Home color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Billing / Primary Address
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
              label="Street Address"
              value={formik.values.address}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 3. SHIPPING ADDRESS */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocalShipping color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              Shipping / Delivery Address
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography variant="body2">Same as billing address</Typography>}
          />
        </Box>

        <Collapse in={!sameAsBilling}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                id="shippingCountry"
                name="shippingCountry"
                label="Shipping Country"
                value={formik.values.shippingCountry}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                id="shippingState"
                name="shippingState"
                label="Shipping State"
                value={formik.values.shippingState}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                id="shippingCity"
                name="shippingCity"
                label="Shipping City"
                value={formik.values.shippingCity}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                id="shippingZipCode"
                name="shippingZipCode"
                label="Shipping Zip Code"
                value={formik.values.shippingZipCode}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                id="shippingAddress"
                name="shippingAddress"
                label="Shipping Street Address"
                value={formik.values.shippingAddress}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                id="shippingAddressLandmark"
                name="shippingAddressLandmark"
                label="Delivery Landmark / Instructions"
                value={formik.values.shippingAddressLandmark}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </Collapse>
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
          {formik.isSubmitting ? "Saving..." : "Save Customer"}
        </Button>
      </Box>
    </Box>
  );
};

export default CustomerForm;