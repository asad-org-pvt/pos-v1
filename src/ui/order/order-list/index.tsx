import React, { useEffect, useMemo, useState } from "react";
import Table from "../../common/components/table";
import { orderService } from "../../../services/app/OrderService";
import { returnService } from "../../../services/app/ReturnService";
import { Modal } from "react-bootstrap";
import { useStylesFromThemeFunction } from "./OrderList";
import { useAuth, useTenant } from "../../../context/AuthTenantContext";
import { Order } from "../../../domain/models/Order";
import { Return } from "../../../domain/models/Return";
import { PaymentMethod } from "../../../domain/models/Payment";
import PrintableReceipt, { PrintableRefundReceipt } from "../../common/components/printable-invoice";
import {
  Box,
  TextField,
  Button,
  Chip,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Visibility, Print as PrintIcon, AssignmentReturn } from "@mui/icons-material";
import { useSettings } from "../../../context/SettingsContext";
import toast from "react-hot-toast";

interface ComponentProps {
  orders?: any[];
}

const OrderList: React.FC<ComponentProps> = (props) => {
  const classes = useStylesFromThemeFunction();
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { formatCurrency, formatDateTime, organizationSettings } = useSettings();

  // State management
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>(props?.orders || []);

  // Return / Refund state
  const [orderForReturn, setOrderForReturn] = useState<Order | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<{ [productId: string]: number }>({});
  const [returnReason, setReturnReason] = useState<string>("Customer Return");
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("CASH");
  const [isProcessingReturn, setIsProcessingReturn] = useState<boolean>(false);
  const [completedRefundReceipt, setCompletedRefundReceipt] = useState<Return | null>(null);
  const [showRefundReceiptModal, setShowRefundReceiptModal] = useState<boolean>(false);

  const [tableHeadings] = useState([
    "Invoice #",
    "Customer",
    "Date & Time",
    "Items",
    "Total",
    "Payment",
    "Status",
    "Actions",
  ]);

  const isReturnExpired = (order: Order): boolean => {
    if (!order.dateTime) return false;
    const orderTime = new Date(order.dateTime).getTime();
    if (isNaN(orderTime)) return false;
    const windowDays = organizationSettings.returnWindowDays !== undefined ? organizationSettings.returnWindowDays : 30;
    const elapsedDays = (Date.now() - orderTime) / (1000 * 60 * 60 * 24);
    return elapsedDays > windowDays;
  };

  const loadOrders = () => {
    setIsLoading(true);
    orderService
      .getOrders(tenantId)
      .then((res) => {
        setOrders(res);
      })
      .catch((err) => {
        console.error("Failed to load orders", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, [tenantId]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return orders;
    }
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (order) =>
        order.invoiceNumber?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.employeeName?.toLowerCase().includes(q) ||
        order.paymentMethod?.toLowerCase().includes(q) ||
        order.status?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  };

  const handleInitiateReturn = (order: Order) => {
    if (isReturnExpired(order)) {
      const windowDays = organizationSettings.returnWindowDays !== undefined ? organizationSettings.returnWindowDays : 30;
      toast.error(`Return policy limit exceeded: Returns are only permitted within ${windowDays} days of purchase.`);
      return;
    }
    setOrderForReturn(order);
    const initialQtys: { [productId: string]: number } = {};
    order.products.forEach((p) => {
      const pid = p.productId || p.id || "";
      initialQtys[pid] = 0;
    });
    setReturnItemsState(initialQtys);
    setRefundMethod((order.paymentMethod as PaymentMethod) || "CASH");
  };

  const calculatePendingRefundTotal = useMemo(() => {
    if (!orderForReturn) return 0;
    let total = 0;
    orderForReturn.products.forEach((p) => {
      const pid = p.productId || p.id || "";
      const returnQty = returnItemsState[pid] || 0;
      if (returnQty > 0) {
        const soldQty = Number(p.quantity) || 1;
        const unitRefund = Number(p.total) / soldQty;
        total += unitRefund * returnQty;
      }
    });
    return Number(total.toFixed(2));
  }, [orderForReturn, returnItemsState]);

  const handleProcessReturn = async () => {
    if (!orderForReturn) return;

    const itemsToReturn: { productId: string; quantity: number }[] = [];
    orderForReturn.products.forEach((p) => {
      const pid = p.productId || p.id || "";
      const qty = returnItemsState[pid] || 0;
      if (qty > 0) {
        itemsToReturn.push({ productId: pid, quantity: qty });
      }
    });

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item quantity to return.");
      return;
    }

    setIsProcessingReturn(true);
    try {
      const returnRecord = await returnService.processReturn(
        {
          orderId: orderForReturn.id,
          items: itemsToReturn,
          refundMethod,
          reason: returnReason,
          cashierId: user?.uid || "",
          cashierName: user?.displayName || user?.email?.split("@")[0] || "Cashier",
          registerId: orderForReturn.registerId,
          shiftId: orderForReturn.shiftId,
        },
        tenantId
      );

      toast.success(`Refund processed! Return #${returnRecord.returnInvoiceNumber}`);
      setOrderForReturn(null);
      setCompletedRefundReceipt(returnRecord);
      setShowRefundReceiptModal(true);
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to process return");
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const renderTableData = useMemo(() => {
    return filteredOrders?.map((order) => {
      const isReturnable =
        order.status === "COMPLETED" ||
        order.status === "PARTIALLY_REFUNDED" ||
        order.status === "CONFIRMED";

      return (
        <tr key={order.id} onDoubleClick={() => setSelectedOrder(order)}>
          <td>
            <strong>{order.invoiceNumber || order.id}</strong>
          </td>
          <td>{order.customerName || "Walk-in"}</td>
          <td>{order.dateTime ? formatDateTime(order.dateTime) : "-"}</td>
          <td>{order.products?.length || 0}</td>
          <td>{formatCurrency(order.amountDue || order.total)}</td>
          <td>
            <Chip
              label={order.paymentMethod || "CASH"}
              size="small"
              variant="outlined"
              color={order.paymentMethod === "CARD" ? "primary" : "default"}
            />
          </td>
          <td>
            <Chip
              label={order.status || "COMPLETED"}
              size="small"
              color={
                order.status === "COMPLETED" || order.status === "CONFIRMED"
                  ? "success"
                  : order.status === "REFUNDED"
                  ? "error"
                  : order.status === "PARTIALLY_REFUNDED"
                  ? "secondary"
                  : "warning"
              }
            />
          </td>
          <td>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="text"
                startIcon={<Visibility />}
                onClick={() => setSelectedOrder(order)}
              >
                View
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handleViewReceipt(order)}
              >
                Receipt
              </Button>
              {isReturnable && (
                <Button
                  size="small"
                  variant="outlined"
                  color={isReturnExpired(order) ? "inherit" : "error"}
                  disabled={isReturnExpired(order)}
                  title={
                    isReturnExpired(order)
                      ? `Return window expired (${organizationSettings.returnWindowDays || 30} days)`
                      : "Process Return"
                  }
                  startIcon={<AssignmentReturn />}
                  onClick={() => handleInitiateReturn(order)}
                >
                  Return
                </Button>
              )}
            </Box>
          </td>
        </tr>
      );
    });
  }, [filteredOrders, formatCurrency, formatDateTime, organizationSettings.returnWindowDays]);

  return (
    <>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search by Invoice #, Customer, Cashier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: "350px" }}
        />
        <Button variant="outlined" onClick={loadOrders} disabled={isLoading}>
          Refresh
        </Button>
      </Box>

      <Table
        tableHeadings={tableHeadings}
        renderBody={renderTableData}
        loading={isLoading}
      />

      {/* Sale Details Modal */}
      <Modal
        className={classes.modalWrapper}
        show={!!selectedOrder && !showReceiptModal}
        onHide={() => setSelectedOrder(null)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Sale Details #{selectedOrder?.invoiceNumber || selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div className={classes.modalBodyWrapper}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box>
                  <Typography variant="body2">
                    <strong>Customer:</strong> {selectedOrder.customerName || "Walk-in"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cashier:</strong> {selectedOrder.employeeName || "Cashier"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2">
                    <strong>Date:</strong> {selectedOrder.dateTime ? formatDateTime(selectedOrder.dateTime) : "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedOrder.status}
                  </Typography>
                </Box>
              </Box>

              <Table
                tableHeadings={["Item", "Quantity", "Returned", "Unit Price", "Total"]}
                renderBody={selectedOrder.products?.map((item, idx) => (
                  <tr key={item.id || `${item.name}-${idx}`}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.returnedQuantity || 0}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
                loading={false}
              />

              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Box sx={{ minWidth: "220px", fontSize: "14px" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </Box>
                  {selectedOrder.discount > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, fontWeight: "bold", borderTop: "1px solid #ccc" }}>
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.amountDue || selectedOrder.total)}</span>
                  </Box>
                  {selectedOrder.refundedAmount && selectedOrder.refundedAmount > 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5, color: "#d32f2f", fontWeight: "bold" }}>
                      <span>Refunded:</span>
                      <span>-{formatCurrency(selectedOrder.refundedAmount)}</span>
                    </Box>
                  ) : null}
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => setShowReceiptModal(true)}
                >
                  Print Receipt
                </Button>
              </Box>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Return / Refund Modal */}
      <Modal
        show={!!orderForReturn}
        onHide={() => setOrderForReturn(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Process Return for Order #{orderForReturn?.invoiceNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orderForReturn && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Select the quantity of each item to return. Stock will be restored automatically.
              </Typography>

              <Table
                tableHeadings={["Item", "Sold", "Already Returned", "Refundable", "Return Qty", "Refund Amt"]}
                renderBody={orderForReturn.products.map((p) => {
                  const pid = p.productId || p.id || "";
                  const soldQty = Number(p.quantity) || 1;
                  const returnedQty = Number(p.returnedQuantity) || 0;
                  const refundable = soldQty - returnedQty;
                  const currentReturnQty = returnItemsState[pid] || 0;
                  const unitRefund = Number(p.total) / soldQty;
                  const itemRefund = unitRefund * currentReturnQty;

                  return (
                    <tr key={pid}>
                      <td><strong>{p.name}</strong></td>
                      <td>{soldQty}</td>
                      <td>{returnedQty}</td>
                      <td>{refundable}</td>
                      <td>
                        <TextField
                          type="number"
                          size="small"
                          disabled={refundable <= 0}
                          value={currentReturnQty}
                          inputProps={{ min: 0, max: refundable }}
                          onChange={(e) => {
                            const val = Math.min(
                              refundable,
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            );
                            setReturnItemsState({
                              ...returnItemsState,
                              [pid]: val,
                            });
                          }}
                          sx={{ width: "80px" }}
                        />
                      </td>
                      <td>{formatCurrency(itemRefund)}</td>
                    </tr>
                  );
                })}
                loading={false}
              />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                <Box sx={{ width: "60%" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reason for Return"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    Total Refund: {formatCurrency(calculatePendingRefundTotal)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: "bold", mb: 0.5, display: "block" }}>
                  REFUND METHOD
                </Typography>
                <ToggleButtonGroup
                  color="error"
                  value={refundMethod}
                  exclusive
                  size="small"
                  onChange={(_, val) => {
                    if (val) setRefundMethod(val);
                  }}
                >
                  <ToggleButton value="CASH">CASH</ToggleButton>
                  <ToggleButton value="CARD">CARD</ToggleButton>
                  <ToggleButton value="OTHER">OTHER</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outlined" onClick={() => setOrderForReturn(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={calculatePendingRefundTotal <= 0 || isProcessingReturn}
            onClick={handleProcessReturn}
          >
            {isProcessingReturn ? "Processing..." : `Confirm Return & Refund ($${calculatePendingRefundTotal})`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sale Receipt Modal */}
      <Modal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Print Receipt #{selectedOrder?.invoiceNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PrintableReceipt
            order={selectedOrder}
            onClose={() => setShowReceiptModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Refund Receipt Modal */}
      <Modal
        show={showRefundReceiptModal}
        onHide={() => setShowRefundReceiptModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Print Refund Receipt #{completedRefundReceipt?.returnInvoiceNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PrintableRefundReceipt
            returnRecord={completedRefundReceipt}
            onClose={() => setShowRefundReceiptModal(false)}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrderList;
