import { useFormik } from "formik";
import React from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
} from "@mui/material";
import {
  Person,
  Home,
  Work,
  Save as SaveIcon,
} from "@mui/icons-material";
import { ComponentProps } from "./EmployeeForm";

const EmployeeForm: React.FC<ComponentProps> = ({
  onSubmit,
  employee,
}) => {
  const initialValues = {
    id: employee?.id || "",
    name: employee?.name || "",
    email: employee?.email || "",
    fatherName: employee?.fatherName || "",
    country: employee?.country || "United States",
    state: employee?.state || "",
    city: employee?.city || "",
    address: employee?.address || "",
    zipCode: employee?.zipCode || "",
    nationality: employee?.nationality || "",
    phoneNumber: employee?.phoneNumber || "",
    landLineNumber: employee?.landLineNumber || "",
    gender: employee?.gender || "male",
    religion: employee?.religion || "",
    dateOfBirth: employee?.dateOfBirth || "",
    organisation: employee?.organisation || localStorage.getItem("org") || "default",
    department: employee?.department || "Cash Counter",
    designation: employee?.designation || employee?.jobTitle || "Cashier",
    role: employee?.role || (employee?.isAdmin ? "ADMIN" : "EMPLOYEE"),
    appointmentDate: employee?.appointmentDate || new Date().toISOString().split("T")[0],
    appointmentBranch: employee?.appointmentBranch || "Main Branch",
    joiningDate: employee?.joiningDate || new Date().toISOString().split("T")[0],
    active: employee?.active !== undefined ? (employee?.active ? "active" : "inactive") : "active",
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name?.trim()) {
        errors.name = "Employee name is required";
      }
      if (!values.email?.trim()) {
        errors.email = "Email address is required";
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
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
        id: values.id || `emp_${Date.now()}`,
        jobTitle: values.designation,
        isActive: values.active === "active",
        isAdmin: values.role === "ADMIN" || values.role === "SUPER_ADMIN",
      };
      onSubmit(payload, { resetForm });
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: { xs: 1.5, sm: 2 } }}>
      {/* 1. PERSONAL INFORMATION */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Person color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Personal & Identification Details
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="name"
              name="name"
              label="Full Name *"
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
              label="National ID / CNIC / Staff ID"
              placeholder="e.g. 42101-1234567-1 or EMP-101"
              value={formik.values.id}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="email"
              name="email"
              type="email"
              label="Email Address *"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="phoneNumber"
              name="phoneNumber"
              label="Primary Phone Number *"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
              helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              id="fatherName"
              name="fatherName"
              label="Father / Guardian Name"
              value={formik.values.fatherName}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
                labelId="gender-label"
                label="Gender"
                id="gender"
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              label="Date of Birth"
              InputLabelProps={{ shrink: true }}
              value={formik.values.dateOfBirth}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. RESIDENTIAL ADDRESS */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Home color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Address & Location
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

      {/* 3. EMPLOYMENT & ROLE ACCESS */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Work color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            Job Details & System Access
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="dept-label">Department</InputLabel>
              <Select
                labelId="dept-label"
                label="Department"
                id="department"
                name="department"
                value={formik.values.department}
                onChange={formik.handleChange}
              >
                <MenuItem value="Cash Counter">Cash Counter / Front Desk</MenuItem>
                <MenuItem value="Sales">Sales & Customer Service</MenuItem>
                <MenuItem value="Inventory">Inventory & Warehouse</MenuItem>
                <MenuItem value="Purchasing">Purchasing & Procurement</MenuItem>
                <MenuItem value="Management">Store Management</MenuItem>
                <MenuItem value="Accounts">Finance & Accounts</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              id="designation"
              name="designation"
              label="Job Title / Designation"
              value={formik.values.designation}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="role-label">System Role & Permissions</InputLabel>
              <Select
                labelId="role-label"
                label="System Role & Permissions"
                id="role"
                name="role"
                value={formik.values.role}
                onChange={formik.handleChange}
              >
                <MenuItem value="EMPLOYEE">Cashier / Staff Member (POS sales & basic features)</MenuItem>
                <MenuItem value="ORGANISATION">Store Manager (Discounts, returns, shifts, reports)</MenuItem>
                <MenuItem value="ADMIN">Administrator (Full organization control & settings)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-label">Employment Status</InputLabel>
              <Select
                labelId="status-label"
                label="Employment Status"
                id="active"
                name="active"
                value={formik.values.active}
                onChange={formik.handleChange}
              >
                <MenuItem value="active">Active (Permitted to log in)</MenuItem>
                <MenuItem value="inactive">Inactive / On Leave</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              id="appointmentDate"
              name="appointmentDate"
              label="Appointment Date"
              InputLabelProps={{ shrink: true }}
              value={formik.values.appointmentDate}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              id="joiningDate"
              name="joiningDate"
              label="Joining Date"
              InputLabelProps={{ shrink: true }}
              value={formik.values.joiningDate}
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
          {formik.isSubmitting ? "Saving..." : "Save Employee"}
        </Button>
      </Box>
    </Box>
  );
};

export default EmployeeForm;
