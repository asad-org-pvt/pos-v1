import { useFormik } from "formik";
import React from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  Business,
  Email,
  Phone,
  Language,
  LocationOn,
  Person,
  AttachMoney,
  Percent,
  Category,
  Save as SaveIcon,
  Close,
} from "@mui/icons-material";

export interface ComponentProps {
  onSubmit: (values: any, helpers?: any) => void;
  onChange?: (data: any) => void;
  organisation?: any;
  options?: any;
  onImageChange?: (data: any) => void;
  onCancel?: () => void;
}

const BUSINESS_TYPES = [
  "Retail Store",
  "Supermarket / Grocery",
  "Pharmacy / Healthcare",
  "Restaurant / Cafe",
  "Wholesale & Distribution",
  "Electronics & Tech",
  "Fashion & Apparel",
  "Services & Consulting",
  "Manufacturing",
  "Other",
];

const CURRENCIES = [
  { code: "PKR", symbol: "Rs" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "AED", symbol: "AED" },
  { code: "SAR", symbol: "SAR" },
  { code: "CAD", symbol: "CA$" },
  { code: "INR", symbol: "₹" },
  { code: "AUD", symbol: "A$" },
];

export const OrganisationForm: React.FC<ComponentProps> = ({
  onSubmit,
  organisation,
  onCancel,
}) => {
  const initialValues = {
    name: organisation?.name || "",
    type: organisation?.type || "Retail Store",
    industry: organisation?.industry || "Retail",
    founded: organisation?.founded || "",
    description: organisation?.description || "",
    email: organisation?.email || "",
    phone: organisation?.phone || "",
    website: organisation?.website || "",
    ceo: organisation?.ceo || "",
    address: organisation?.address || "",
    city: organisation?.city || "",
    state: organisation?.state || "",
    country: organisation?.country || "Pakistan",
    postalCode: organisation?.postalCode || "",
    currency: organisation?.currency || "PKR",
    taxRate: organisation?.taxRate !== undefined ? organisation.taxRate : 0.05,
    discountRate: organisation?.discountRate !== undefined ? organisation.discountRate : 0.02,
    numEmployees: organisation?.numEmployees || "",
    revenue: organisation?.revenue || "",
    parentOrganization: organisation?.parentOrganization || "",
  };

  const validate = (values: typeof initialValues) => {
    const errors: Record<string, string> = {};
    if (!values.name?.trim()) {
      errors.name = "Organization name is required";
    }
    if (!values.email?.trim()) {
      errors.email = "Contact email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = "Invalid email address format";
    }
    return errors;
  };

  const formik = useFormik({
    initialValues,
    validate,
    enableReinitialize: true,
    onSubmit: (values, helpers) => {
      const payload: any = {
        ...values,
        taxRate: Number(values.taxRate) || 0,
        discountRate: Number(values.discountRate) || 0,
        numEmployees: values.numEmployees ? Number(values.numEmployees) : undefined,
        revenue: values.revenue ? Number(values.revenue) : undefined,
      };
      if (organisation?.id) {
        payload.id = organisation.id;
      }
      onSubmit(payload, helpers);
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 1 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Section 1: Basic Profile */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <Business fontSize="small" /> Organization Profile
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Organization Name"
                name="name"
                required
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Business Type"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
              >
                {BUSINESS_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Industry Sector"
                name="industry"
                value={formik.values.industry}
                onChange={formik.handleChange}
                placeholder="e.g. Retail, Grocery, FMCG"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Category fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Founded Date"
                name="founded"
                InputLabelProps={{ shrink: true }}
                value={formik.values.founded}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Brief Description / Mission"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Brief summary of business operations and store policy"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Contact & Online Presence */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <Email fontSize="small" /> Contact & Communication
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Official Email"
                name="email"
                type="email"
                required
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                placeholder="+92 300 1234567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Website URL"
                name="website"
                type="url"
                value={formik.values.website}
                onChange={formik.handleChange}
                placeholder="https://example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Language fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Executive / CEO / Director"
                name="ceo"
                value={formik.values.ceo}
                onChange={formik.handleChange}
                placeholder="Full Name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3: Address & Location */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <LocationOn fontSize="small" /> Headquarters & Address
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Street Address"
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                placeholder="Suite / Building / Street"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="City"
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="State / Province"
                name="state"
                value={formik.values.state}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Country"
                name="country"
                value={formik.values.country}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Postal / ZIP Code"
                name="postalCode"
                value={formik.values.postalCode}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4: Operational & Tax Policies */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <AttachMoney fontSize="small" /> Operational Defaults & Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Default Currency"
                name="currency"
                value={formik.values.currency}
                onChange={formik.handleChange}
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Default Tax Rate"
                name="taxRate"
                value={formik.values.taxRate}
                onChange={formik.handleChange}
                inputProps={{ step: 0.01, min: 0, max: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Percent fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                helperText="e.g. 0.05 = 5%"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Default Discount Rate"
                name="discountRate"
                value={formik.values.discountRate}
                onChange={formik.handleChange}
                inputProps={{ step: 0.01, min: 0, max: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Percent fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                helperText="e.g. 0.02 = 2%"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Number of Employees"
                name="numEmployees"
                value={formik.values.numEmployees}
                onChange={formik.handleChange}
                placeholder="e.g. 25"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Parent Organization (if branch)"
                name="parentOrganization"
                value={formik.values.parentOrganization}
                onChange={formik.handleChange}
                placeholder="Parent enterprise name"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Action Controls */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}>
          {onCancel && (
            <Button variant="outlined" color="inherit" onClick={onCancel} startIcon={<Close />}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={formik.isSubmitting}
            startIcon={<SaveIcon />}
            sx={{ px: 4, py: 1 }}
          >
            {organisation?.id ? "Update Organization" : "Create Organization"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default OrganisationForm;
