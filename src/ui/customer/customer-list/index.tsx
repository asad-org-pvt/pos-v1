import React, { useMemo, useState } from "react";
import EditIcon from "../../../assets/component/EditIcon";
import RemoveIcon from "../../../assets/component/RemoveIcon";
import { Colors } from "../../common/colors";
import Table from "../../common/components/table";
import { useStylesFromThemeFunction } from "./CustomerList";
import toast from "react-hot-toast";
import { Modal } from "react-bootstrap";
import { customerService } from "../../../services/app/CustomerService";
import CustomerForm from "../customer-form";
import { useTenant } from "../../../context/AuthTenantContext";
import { Customer } from "../../../domain/models/Customer";
import { Order } from "../../../domain/models/Order";
import { Return } from "../../../domain/models/Return";
import {
  Box,
  TextField,
  Button,
  Chip,
  Typography,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import { Visibility, Refresh } from "@mui/icons-material";
import { useSettings } from "../../../context/SettingsContext";

interface ComponentProps {
  customers?: any[];
}

const CustomerList: React.FC<ComponentProps> = (props) => {
  const classes = useStylesFromThemeFunction();
  const { tenantId } = useTenant();
  const { formatCurrency, formatDate, organizationSettings } = useSettings();

  const [tableHeadings] = useState([
    "ID",
    "Name",
    "Status",
    "Email",
    "Phone Number",
    "Address",
    "Actions",
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>((props?.customers as Customer[]) || []);
  const [showCustomerUpdateModal, setShowCustomerUpdateModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Customer History Modal State
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerReturns, setCustomerReturns] = useState<Return[]>([]);
  const [historyTab, setHistoryTab] = useState<number>(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadCustomers = () => {
    setIsLoading(true);
    customerService
      .getCustomers(tenantId)
      .then((res) => {
        setCustomers(res);
      })
      .catch(() => {
        toast.error("Failed to load customers");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    loadCustomers();
  }, [tenantId]);

  const handleRemoveCustomer = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to deactivate customer "${customer.name}"?`)) {
      try {
        await customerService.deactivateCustomer(customer.id, tenantId);
        toast.success(`Customer "${customer.name}" deactivated`);
        loadCustomers();
      } catch (e: any) {
        toast.error(e.message || "Error while deactivating customer");
      }
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerUpdateModal(true);
  };

  const handleViewCustomerDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetailModal(true);
    setIsLoadingHistory(true);
    try {
      const [orders, returns] = await Promise.all([
        customerService.getCustomerPurchaseHistory(customer.id, tenantId),
        customerService.getCustomerReturnHistory(customer.id, tenantId),
      ]);
      setCustomerOrders(orders);
      setCustomerReturns(returns);
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
        toast.success(`${updatedCustomer.name} updated successfully`);
        setShowCustomerUpdateModal(false);
        setSelectedCustomer(null);
        loadCustomers();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating customer");
      });
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return customers;
    }
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phoneNumber?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const renderTableData = useMemo(() => {
    return filteredCustomers?.map((customer) => {
      const isActive = customer.isActive !== false;
      return (
        <tr key={customer.id} onDoubleClick={() => handleViewCustomerDetail(customer)}>
          <td><strong>{customer.id}</strong></td>
          <td>{customer.name}</td>
          <td>
            <Chip
              label={isActive ? "Active" : "Inactive"}
              size="small"
              color={isActive ? "success" : "default"}
            />
          </td>
          <td>{customer.email || "-"}</td>
          <td>{customer.phoneNumber || "-"}</td>
          <td>{customer.address || "-"}</td>
          <td>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton
                size="small"
                color="primary"
                title="View History"
                onClick={() => handleViewCustomerDetail(customer)}
              >
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                title="Edit Customer"
                onClick={() => handleEditCustomer(customer)}
              >
                <EditIcon fill={Colors.gray} />
              </IconButton>
              <IconButton
                size="small"
                title="Deactivate Customer"
                onClick={() => handleRemoveCustomer(customer)}
              >
                <RemoveIcon fill={Colors.red} />
              </IconButton>
            </Box>
          </td>
        </tr>
      );
    });
  }, [filteredCustomers, classes]);

  return (
    <>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search by Name, Phone, Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 320 }}
        />
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadCustomers} disabled={isLoading}>
          Refresh
        </Button>
      </Box>

      <Table
        tableHeadings={tableHeadings}
        renderBody={renderTableData}
        loading={isLoading}
      />

      {/* Customer Update Modal */}
      <Modal
        className={classes.modalWrapper}
        show={showCustomerUpdateModal}
        onHide={() => setShowCustomerUpdateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Update <b>{selectedCustomer?.name}</b>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={classes.modalBodyWrapper}>
            <CustomerForm customer={selectedCustomer} onSubmit={handleUpdate} />
          </div>
        </Modal.Body>
      </Modal>

      {/* Customer Details & History Modal */}
      <Modal
        show={showCustomerDetailModal}
        onHide={() => setShowCustomerDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Customer Profile: <b>{selectedCustomer?.name}</b>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <Box>
                  <Typography variant="body2"><strong>Email:</strong> {selectedCustomer.email || "N/A"}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedCustomer.phoneNumber || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2"><strong>Address:</strong> {selectedCustomer.address || "N/A"}</Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedCustomer.isActive !== false ? "Active" : "Inactive"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs value={historyTab} onChange={(_, val) => setHistoryTab(val)}>
                  <Tab label={`Purchase History (${customerOrders.length})`} />
                  <Tab label={`Return History (${customerReturns.length})`} />
                </Tabs>
              </Box>

              {historyTab === 0 && (
                <Table
                  tableHeadings={["Invoice #", "Date", "Items", `Total (${organizationSettings.currencySymbol.trim()})`, "Status"]}
                  renderBody={customerOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td><strong>{ord.invoiceNumber || ord.id}</strong></td>
                      <td>{ord.createdAt || ord.dateTime ? formatDate(ord.createdAt || ord.dateTime) : "-"}</td>
                      <td>{ord.products?.length || 0}</td>
                      <td>{formatCurrency(ord.amountDue || ord.total || 0)}</td>
                      <td><Chip label={ord.status} size="small" color={ord.status === "COMPLETED" ? "success" : "default"} /></td>
                    </tr>
                  ))}
                  loading={isLoadingHistory}
                />
              )}

              {historyTab === 1 && (
                <Table
                  tableHeadings={["Return #", "Orig Invoice", "Date", `Refund (${organizationSettings.currencySymbol.trim()})`, "Reason"]}
                  renderBody={customerReturns.map((ret) => (
                    <tr key={ret.id}>
                      <td><strong>{ret.returnInvoiceNumber || ret.id}</strong></td>
                      <td>{ret.originalInvoiceNumber}</td>
                      <td>{ret.createdAt ? formatDate(ret.createdAt) : "-"}</td>
                      <td style={{ color: "var(--error, #dc2626)", fontWeight: "bold" }}>{formatCurrency(ret.refundTotal)}</td>
                      <td>{ret.reason}</td>
                    </tr>
                  ))}
                  loading={isLoadingHistory}
                />
              )}
            </Box>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outlined" onClick={() => setShowCustomerDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CustomerList;
