import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Refresh,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Visibility,
  ShoppingBag,
  AssignmentReturn,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { customerService } from "../../../services/app/CustomerService";
import CustomerForm from "../customer-form";
import { useTenant } from "../../../context/AuthTenantContext";
import { Customer } from "../../../domain/models/Customer";
import { Order } from "../../../domain/models/Order";
import { Return } from "../../../domain/models/Return";
import { useSettings } from "../../../context/SettingsContext";

interface ComponentProps {
  customers?: any[];
  onAddCustomerClick?: () => void;
}

const CustomerList: React.FC<ComponentProps> = (props) => {
  const { tenantId } = useTenant();
  const { formatCurrency, formatDate } = useSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>((props?.customers as Customer[]) || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit and Detail Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [deactivateCandidate, setDeactivateCandidate] = useState<Customer | null>(null);

  // History state
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerReturns, setCustomerReturns] = useState<Return[]>([]);
  const [historyTab, setHistoryTab] = useState<number>(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadCustomers = () => {
    setIsLoading(true);
    customerService
      .getCustomers(tenantId)
      .then((res) => {
        setCustomers(res || []);
      })
      .catch(() => {
        toast.error("Failed to load customers");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadCustomers();
  }, [tenantId]);

  const handleConfirmDeactivate = async () => {
    if (!deactivateCandidate) return;
    try {
      await customerService.deactivateCustomer(deactivateCandidate.id, tenantId);
      toast.success(`Customer "${deactivateCandidate.name}" status updated`);
      setDeactivateCandidate(null);
      loadCustomers();
    } catch (e: any) {
      toast.error(e.message || "Error while deactivating customer");
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
  };

  const handleViewCustomerDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailDialog(true);
    setIsLoadingHistory(true);
    try {
      const [orders, returns] = await Promise.all([
        customerService.getCustomerPurchaseHistory(customer.id, tenantId),
        customerService.getCustomerReturnHistory(customer.id, tenantId),
      ]);
      setCustomerOrders(orders || []);
      setCustomerReturns(returns || []);
    } catch (err) {
      console.warn("Could not load customer history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUpdate = (updatedCustomer: any) => {
    customerService
      .updateCustomer(updatedCustomer.id, updatedCustomer, tenantId)
      .then(() => {
        toast.success(`Customer "${updatedCustomer.name}" updated successfully`);
        setShowEditDialog(false);
        setSelectedCustomer(null);
        loadCustomers();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating customer");
      });
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !searchQuery.trim() ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phoneNumber?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* SEARCH BAR */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <TextField
          size="small"
          placeholder="Search customer by name, mobile, email, CNIC/ID..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { xs: "100%", sm: 340 }, flex: 1 }}
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh customer list">
            <IconButton onClick={loadCustomers} disabled={isLoading} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* CUSTOMERS TABLE */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}
      >
        <Table size="medium">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Contact Info</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Location</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Orders / Spent</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading customers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : displayedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? "No customers matching search criteria." : "No customers registered yet."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedCustomers.map((cust) => {
                const initials = cust.name
                  ? cust.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "C";

                const isActive = cust.isActive !== false;

                return (
                  <TableRow
                    key={cust.id}
                    hover
                    sx={{ "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: "info.main",
                            color: "info.contrastText",
                            width: 38,
                            height: 38,
                            fontSize: "0.875rem",
                            fontWeight: "bold",
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                            {cust.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {cust.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="500" color="text.primary">
                        {cust.phoneNumber || "-"}
                      </Typography>
                      {cust.email && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {cust.email}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {cust.city ? `${cust.city}, ` : ""}{cust.country || "-"}
                      </Typography>
                      {cust.address && (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 160 }}>
                          {cust.address}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="text.primary">
                        {formatCurrency(cust.totalAmountSpent || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cust.totalOrdersPlaced || 0} purchase(s)
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={isActive ? "Active" : "Inactive"}
                        color={isActive ? "success" : "default"}
                        sx={{ fontWeight: "600" }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <Tooltip title="View Order History & Profile">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewCustomerDetail(cust)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Customer">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditCustomer(cust)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Deactivate Customer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeactivateCandidate(cust)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* EDIT MODAL DIALOG */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid", borderColor: "divider" }}>
          Edit Customer: {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedCustomer && (
            <CustomerForm customer={selectedCustomer} onSubmit={handleUpdate} />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setShowEditDialog(false)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* CUSTOMER DETAIL & HISTORY DIALOG */}
      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid", borderColor: "divider" }}>
          Customer Account: {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedCustomer && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Snapshot Info Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "action.hover",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                  <Typography variant="body2" fontWeight="bold">{selectedCustomer.phoneNumber || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email Address</Typography>
                  <Typography variant="body2" fontWeight="bold">{selectedCustomer.email || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Billing Address</Typography>
                  <Typography variant="body2">{selectedCustomer.address || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Account Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={selectedCustomer.isActive !== false ? "Active Member" : "Inactive"}
                      color={selectedCustomer.isActive !== false ? "success" : "default"}
                    />
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs value={historyTab} onChange={(_, val) => setHistoryTab(val)}>
                  <Tab icon={<ShoppingBag fontSize="small" />} iconPosition="start" label={`Purchase Orders (${customerOrders.length})`} />
                  <Tab icon={<AssignmentReturn fontSize="small" />} iconPosition="start" label={`Return Records (${customerReturns.length})`} />
                </Tabs>
              </Box>

              {historyTab === 0 && (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingHistory ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Loading history...</TableCell>
                        </TableRow>
                      ) : customerOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>No purchase history recorded for this customer.</TableCell>
                        </TableRow>
                      ) : (
                        customerOrders.map((ord) => (
                          <TableRow key={ord.id} hover>
                            <TableCell sx={{ fontWeight: "bold" }}>{ord.invoiceNumber || ord.id}</TableCell>
                            <TableCell>{ord.createdAt || ord.dateTime ? formatDate(ord.createdAt || ord.dateTime) : "-"}</TableCell>
                            <TableCell>{ord.products?.length || 0} item(s)</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>{formatCurrency(ord.amountDue || ord.total || 0)}</TableCell>
                            <TableCell>
                              <Chip
                                label={ord.status || "COMPLETED"}
                                size="small"
                                color={ord.status === "COMPLETED" ? "success" : "default"}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {historyTab === 1 && (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Return Note #</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Original Invoice</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Refund Amount</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoadingHistory ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Loading returns...</TableCell>
                        </TableRow>
                      ) : customerReturns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>No return records found for this customer.</TableCell>
                        </TableRow>
                      ) : (
                        customerReturns.map((ret) => (
                          <TableRow key={ret.id} hover>
                            <TableCell sx={{ fontWeight: "bold" }}>{ret.returnInvoiceNumber || ret.id}</TableCell>
                            <TableCell>{ret.originalInvoiceNumber}</TableCell>
                            <TableCell>{ret.createdAt ? formatDate(ret.createdAt) : "-"}</TableCell>
                            <TableCell sx={{ color: "error.main", fontWeight: "bold" }}>{formatCurrency(ret.refundTotal)}</TableCell>
                            <TableCell>{ret.reason || "General return"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setShowDetailDialog(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DEACTIVATE CONFIRMATION MODAL */}
      <Dialog
        open={Boolean(deactivateCandidate)}
        onClose={() => setDeactivateCandidate(null)}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Confirm Status Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate customer <strong>{deactivateCandidate?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeactivateCandidate(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeactivate} color="error" variant="contained">
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
