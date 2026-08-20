import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Drawer,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  People as PeopleIcon,
  LocalShipping as SupplierIcon,
  Badge as StaffIcon,
  PersonAdd,
  AddBusiness,
  Close as CloseIcon,
  TrendingUp,
} from "@mui/icons-material";
import toast from "react-hot-toast";

import CustomerList from "../customer/customer-list";
import SupplierList from "../supplier/supplier-list";
import EmployeeList from "../employee/employee-list";
import CustomerForm from "../customer/customer-form";
import SupplierForm from "../supplier/supplier-form";
import EmployeeForm from "../employee/employee-form";

import { getAllCustomers, addOneCustomer } from "../../parser/customer";
import { getAllSuppliers, addOneSupplier } from "../../parser/supplier";
import { getAllEmployees, addOneEmployee } from "../../parser/employee";
import { useSettings } from "../../context/SettingsContext";

const Users: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [activeTab, setActiveTab] = useState(0);

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"CUSTOMER" | "SUPPLIER" | "EMPLOYEE">("CUSTOMER");

  // Metrics states
  const [customerCount, setCustomerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [totalCustomerSpend, setTotalCustomerSpend] = useState(0);

  // Key to force refresh list components
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMetrics = async () => {
    try {
      const [customers, suppliers, employees] = await Promise.all([
        getAllCustomers().catch(() => []),
        getAllSuppliers().catch(() => []),
        getAllEmployees().catch(() => []),
      ]);

      setCustomerCount(customers?.length || 0);
      setSupplierCount(suppliers?.length || 0);
      setEmployeeCount(employees?.length || 0);

      const totalSpend = (customers || []).reduce(
        (acc: number, c: any) => acc + (Number(c.totalAmountSpent) || 0),
        0
      );
      setTotalCustomerSpend(totalSpend);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [refreshKey]);

  const handleOpenDrawer = (type: "CUSTOMER" | "SUPPLIER" | "EMPLOYEE") => {
    setDrawerType(type);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleCreateCustomer = async (values: any) => {
    try {
      await addOneCustomer(values);
      toast.success(`Customer "${values.name}" created successfully`);
      handleCloseDrawer();
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer");
    }
  };

  const handleCreateSupplier = async (values: any) => {
    try {
      await addOneSupplier(values);
      toast.success(`Supplier "${values.name}" created successfully`);
      handleCloseDrawer();
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to create supplier");
    }
  };

  const handleCreateEmployee = async (values: any) => {
    try {
      await addOneEmployee(values);
      toast.success(`Staff member "${values.name}" created successfully`);
      handleCloseDrawer();
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff member");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: "100%", maxWidth: 1400, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            People & Partner Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your store customers, vendor suppliers, and staff permissions
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          {activeTab === 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => handleOpenDrawer("CUSTOMER")}
              sx={{ borderRadius: 2, fontWeight: "bold" }}
            >
              Add New Customer
            </Button>
          )}
          {activeTab === 1 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddBusiness />}
              onClick={() => handleOpenDrawer("SUPPLIER")}
              sx={{ borderRadius: 2, fontWeight: "bold" }}
            >
              Add New Supplier
            </Button>
          )}
          {activeTab === 2 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAdd />}
              onClick={() => handleOpenDrawer("EMPLOYEE")}
              sx={{ borderRadius: 2, fontWeight: "bold" }}
            >
              Add New Staff Member
            </Button>
          )}
        </Box>
      </Box>

      {/* KPI METRIC CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="500">
                    Total Customers
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {customerCount}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "info.light", color: "info.dark", display: "flex" }}>
                  <PeopleIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="500">
                    Suppliers & Vendors
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {supplierCount}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "secondary.light", color: "secondary.dark", display: "flex" }}>
                  <SupplierIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="500">
                    Staff & Cashiers
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {employeeCount}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.light", color: "primary.dark", display: "flex" }}>
                  <StaffIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="500">
                    Customer Revenue
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(totalCustomerSpend)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.light", color: "success.dark", display: "flex" }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DIRECTORY TABS */}
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1, bgcolor: "action.hover" }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              icon={<PeopleIcon fontSize="small" />}
              iconPosition="start"
              label={`Customers (${customerCount})`}
              sx={{ fontWeight: "600", textTransform: "none", minHeight: 48 }}
            />
            <Tab
              icon={<SupplierIcon fontSize="small" />}
              iconPosition="start"
              label={`Suppliers (${supplierCount})`}
              sx={{ fontWeight: "600", textTransform: "none", minHeight: 48 }}
            />
            <Tab
              icon={<StaffIcon fontSize="small" />}
              iconPosition="start"
              label={`Staff Accounts (${employeeCount})`}
              sx={{ fontWeight: "600", textTransform: "none", minHeight: 48 }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {activeTab === 0 && <CustomerList key={`cust_${refreshKey}`} onAddCustomerClick={() => handleOpenDrawer("CUSTOMER")} />}
          {activeTab === 1 && <SupplierList key={`sup_${refreshKey}`} onAddSupplierClick={() => handleOpenDrawer("SUPPLIER")} />}
          {activeTab === 2 && <EmployeeList key={`emp_${refreshKey}`} onAddEmployeeClick={() => handleOpenDrawer("EMPLOYEE")} />}
        </Box>
      </Paper>

      {/* DEDICATED SLIDE-OVER ADD DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 560, md: 620 },
            p: 0,
            boxSizing: "border-box",
            bgcolor: "background.default",
          },
        }}
      >
        {/* DRAWER HEADER */}
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              {drawerType === "CUSTOMER" && "Register New Customer"}
              {drawerType === "SUPPLIER" && "Register New Supplier / Vendor"}
              {drawerType === "EMPLOYEE" && "Add New Staff Member"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Fill in the required information to add to directory
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDrawer} size="small" edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* DRAWER FORM BODY */}
        <Box sx={{ p: 2, overflowY: "auto", flex: 1 }}>
          {drawerType === "CUSTOMER" && <CustomerForm onSubmit={handleCreateCustomer} />}
          {drawerType === "SUPPLIER" && <SupplierForm onSubmit={handleCreateSupplier} />}
          {drawerType === "EMPLOYEE" && <EmployeeForm onSubmit={handleCreateEmployee} />}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Users;
