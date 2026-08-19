import React, { useEffect, useMemo, useState, useRef } from "react";
import ButtonComponent from "../common/components/button-component";
import DropdownSearch from "../common/components/dropdown-serach";
import InputComponent from "../common/components/input-component";
import { Invoice } from "../common/components/invoice";
import Table from "../common/components/table";
import RemoveIcon from "../../assets/component/RemoveIcon";
import { ComponentProps, useStylesFromThemeFunction } from "./POSEngine";
import { Colors } from "../common/colors";
import toast from "react-hot-toast";
import { orderService } from "../../services/app/OrderService";
import { invoiceService } from "../../services/app/InvoiceService";
import { customerService } from "../../services/app/CustomerService";
import { registerService } from "../../services/app/RegisterService";
import { shiftService } from "../../services/app/ShiftService";
import { btnType } from "../common/components/button-component/ButtonComponent.types";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductList } from "../../redux/actions/product.actions";
import { IStateSelector } from "../../redux/store/store.types";
import { sendEmail } from "../../utils/utilFunctions";
import { getInvnetoryRunningOutEmailTemplate } from "../../constants/emailjs";
import { useAuth, useTenant } from "../../context/AuthTenantContext";
import { useSettings } from "../../context/SettingsContext";
import { calculateSaleTotals } from "../../domain/calculations/SaleCalculations";
import { PaymentMethod } from "../../domain/models/Payment";
import { PaymentAllocation } from "../../domain/calculations/SaleCalculations";
import { Order } from "../../domain/models/Order";
import { Register } from "../../domain/models/Register";
import { Shift } from "../../domain/models/Shift";
import { offlineSyncService } from "../../services/app/OfflineSyncService";
import { indexedDbOutboxRepository } from "../../repositories/IndexedDbOutboxRepository";
import { outboxSyncEngine } from "../../services/app/OutboxSyncEngine";
import { connectivityService, ConnectivityState } from "../../services/app/ConnectivityService";
import { OutboxDrawer } from "../common/components/outbox-drawer";
import PrintableReceipt, { PrintableShiftReport } from "../common/components/printable-invoice";
import { Modal } from "react-bootstrap";
import { Box, TextField, Button, Typography, Chip, Paper, InputAdornment } from "@mui/material";
import { QrCodeScanner, PointOfSale, LockClock, CloudQueue } from "@mui/icons-material";

export const POSEngine: React.FC<ComponentProps> = ({ isLoading }) => {
  const { productList, loading } = useSelector(
    (state: IStateSelector) => state.data
  );
  const [showLoader, setShowLoader] = useState(false || isLoading || loading);

  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { organizationSettings, formatCurrency } = useSettings();
  const dispatch = useDispatch();

  // Cart & Item states
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addedProducts, setAddedProducts] = useState<any[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Customer & Payment states
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentReference, setPaymentReference] = useState<string>("" );
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [specialDiscount, setSpecialDiscount] = useState<number>(0);
  const [splitPayments, setSplitPayments] = useState<PaymentAllocation[]>([]);

  // Completed sale & Receipt states
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [isProcessingSale, setIsProcessingSale] = useState<boolean>(false);

  // Register & Shift states
  const [registers, setRegisters] = useState<Register[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [showShiftReportModal, setShowShiftReportModal] = useState<boolean>(false);
  const [closedShiftReport, setClosedShiftReport] = useState<Shift | null>(null);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>("");
  const [openingFloat, setOpeningFloat] = useState<number>(100);
  const [closingCashCounted, setClosingCashCounted] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>("");

  const classes = useStylesFromThemeFunction();

  const loadInvoiceNumber = async () => {
    try {
      const nextNum = await invoiceService.getNextInvoiceNumber(tenantId);
      setInvoiceNumber(nextNum);
    } catch (err) {
      console.warn("Could not load invoice number", err);
    }
  };

  const loadCustomers = async () => {
    try {
      const list = await customerService.getCustomers(tenantId);
      setCustomers(list);
    } catch (err) {
      console.warn("Could not load customer list", err);
    }
  };

  const loadRegistersAndShift = async () => {
    try {
      let regList = await registerService.getActiveRegisters(tenantId);
      if (regList.length === 0) {
        // Auto-seed default main register if none exists
        try {
          const newReg = await registerService.createRegister(
            { name: "Main Register", status: "ACTIVE", location: "Store Front" },
            tenantId
          );
          regList = [newReg];
        } catch (e) {
          // ignore
        }
      }
      setRegisters(regList);
      if (regList.length > 0 && !selectedRegisterId) {
        setSelectedRegisterId(regList[0].id);
      }

      if (user?.uid) {
        const shift = await shiftService.getActiveShiftForCashier(user.uid, tenantId);
        setActiveShift(shift);
      }
    } catch (err) {
      console.warn("Could not load registers or shift", err);
    }
  };

  useEffect(() => {
    setShowLoader(isLoading || loading);
    loadInvoiceNumber();
    loadCustomers();
    loadRegistersAndShift();
  }, [isLoading, loading, tenantId, user?.uid]);

  const productOptions = useMemo(
    () =>
      productList?.map((product) => ({
        label: `${product.id} - ${product.name} (Stock: ${product.unitsInStock})`,
        value: product,
      })),
    [productList]
  );

  const [connectivityState, setConnectivityState] = useState<ConnectivityState>(
    connectivityService.getState()
  );
  const [showOutboxDrawer, setShowOutboxDrawer] = useState<boolean>(false);
  const [pendingOutboxCount, setPendingOutboxCount] = useState<number>(0);

  const refreshOutboxCount = async () => {
    try {
      const count = await indexedDbOutboxRepository.countPending(tenantId);
      setPendingOutboxCount(count);
    } catch (_) {}
  };

  useEffect(() => {
    refreshOutboxCount();
  }, [tenantId]);

  useEffect(() => {
    dispatch(fetchProductList(tenantId));
  }, [dispatch, tenantId]);

  useEffect(() => {
    if (productList && productList.length > 0) {
      offlineSyncService.cacheProducts(productList, tenantId);
    }
  }, [productList, tenantId]);

  useEffect(() => {
    const unsub = connectivityService.subscribe((state) => {
      setConnectivityState(state);
      if (state === "ONLINE") {
        outboxSyncEngine.syncQueue(tenantId).then((res) => {
          if (res.synced > 0) {
            toast.success(`Synced ${res.synced} offline sales!`);
            dispatch(fetchProductList(tenantId));
          }
          refreshOutboxCount();
        });
      }
    });
    return unsub;
  }, [tenantId, dispatch]);

  // Barcode Scanner Handler
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput || barcodeInput.trim() === "") return;

    const queryCode = barcodeInput.trim().toLowerCase();
    const matched = productList?.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === queryCode) ||
        (p.sku && p.sku.toLowerCase() === queryCode) ||
        (p.id && p.id.toLowerCase() === queryCode) ||
        (p.name && p.name.toLowerCase() === queryCode)
    );

    if (!matched) {
      toast.error(`Unknown barcode / SKU: "${barcodeInput}"`);
      setBarcodeInput("");
      return;
    }

    const availableStock = Number(matched.unitsInStock) || 0;
    const allowNegative = Boolean(organizationSettings.allowNegativeStockSales);
    if (!allowNegative && availableStock <= 0) {
      toast.error(`Product "${matched.name}" is OUT OF STOCK`);
      setBarcodeInput("");
      return;
    }

    const existingIndex = addedProducts.findIndex(
      (p) => p.id === matched.id || p.name === matched.name
    );

    if (existingIndex >= 0) {
      const currentQty = Number(addedProducts[existingIndex].quantity) || 0;
      if (!allowNegative && currentQty + 1 > availableStock) {
        toast.error(`Cannot add more than ${availableStock} units in stock`);
        setBarcodeInput("");
        return;
      }
      const updated = [...addedProducts];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: currentQty + 1,
      };
      setAddedProducts(updated);
      toast.success(`Incremented: ${matched.name} (Qty: ${currentQty + 1})`);
    } else {
      setAddedProducts([
        ...addedProducts,
        {
          ...matched,
          productId: matched.id,
          quantity: 1,
        },
      ]);
      toast.success(`Scanned: ${matched.name}`);
    }

    setBarcodeInput("");
  };

  const productChange = (product: any) => {
    setSelectedProduct(product);
    const allowNegative = Boolean(organizationSettings.allowNegativeStockSales);
    setQuantity(allowNegative || (product?.unitsInStock && product.unitsInStock > 0) ? 1 : 0);
  };

  const handleRemoveProduct = (product: any) => {
    setAddedProducts(
      addedProducts.filter((addedProduct) => addedProduct !== product)
    );
  };

  const handleIncreaseQuantity = (concernedProduct: any) => {
    if (!concernedProduct) return;
    const available = Number(concernedProduct.unitsInStock) || 0;
    const allowNegative = Boolean(organizationSettings.allowNegativeStockSales);
    if (!allowNegative && Number(concernedProduct.quantity) >= available) {
      toast.error(`No more units in stock (Available: ${available})`);
      return;
    }
    const updated = addedProducts.map((item: any) => {
      if (item.id === concernedProduct.id) {
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) + 1,
        };
      }
      return item;
    });
    setAddedProducts(updated);
  };

  const handleDecreaseQuantity = (concernedProduct: any) => {
    if (!concernedProduct) return;
    if (Number(concernedProduct.quantity) <= 1) {
      toast.error("Minimum quantity is 1. Click remove to delete.");
      return;
    }
    const updated = addedProducts.map((item: any) => {
      if (item.id === concernedProduct.id) {
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) - 1,
        };
      }
      return item;
    });
    setAddedProducts(updated);
  };

  const renderAddedProducts = useMemo(() => {
    return addedProducts.map((product) => {
      const { name, unitPrice, quantity } = product;
      const total = Number(unitPrice) * Number(quantity);
      return (
        <tr key={product.id || name}>
          <td>{name}</td>
          <td>
            <div className={classes.centeredRow}>
              <div className={classes.qualtityButtonWrapper}>
                <ButtonComponent
                  onClick={() => handleDecreaseQuantity(product)}
                >
                  -
                </ButtonComponent>
              </div>
              {quantity}
              <div className={classes.qualtityButtonWrapper}>
                <ButtonComponent
                  onClick={() => handleIncreaseQuantity(product)}
                >
                  +
                </ButtonComponent>
              </div>
            </div>
          </td>
          <td>{formatCurrency(unitPrice)}</td>
          <td>{formatCurrency(total)}</td>
          <td>
            <div className={classes.equallyDistantRow}>
              <div
                className={classes.iconWrapper}
                onClick={() => handleRemoveProduct(product)}
              >
                <RemoveIcon fill={Colors.red} />
              </div>
            </div>
          </td>
        </tr>
      );
    });
  }, [addedProducts, formatCurrency]);

  const handleProductAdd = () => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }

    const availableStock = Number(selectedProduct.unitsInStock) || 0;
    const qtyToAdd = Number(quantity) || 1;
    const allowNegative = Boolean(organizationSettings.allowNegativeStockSales);

    if (!allowNegative && availableStock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const existingIndex = addedProducts.findIndex(
      (p) => p.id === selectedProduct.id || p.name === selectedProduct.name
    );

    if (existingIndex >= 0) {
      const currentQty = Number(addedProducts[existingIndex].quantity) || 0;
      if (!allowNegative && currentQty + qtyToAdd > availableStock) {
        toast.error(`Cannot add more than ${availableStock} units in stock`);
        return;
      }
      const updated = [...addedProducts];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: currentQty + qtyToAdd,
      };
      setAddedProducts(updated);
    } else {
      if (!allowNegative && qtyToAdd > availableStock) {
        toast.error(`Cannot add more than ${availableStock} units in stock`);
        return;
      }
      setAddedProducts([
        ...addedProducts,
        {
          ...selectedProduct,
          productId: selectedProduct.id,
          quantity: qtyToAdd,
        },
      ]);
    }
  };

  const handleCancel = () => {
    setAddedProducts([]);
    setSelectedCustomer(null);
    setAmountTendered(0);
    setPaymentReference("");
    setSpecialDiscount(0);
    toast("Cart Cleared");
  };

  const handleOpenReceipt = () => {
    if (lastCompletedOrder) {
      setShowReceiptModal(true);
    } else if (addedProducts.length > 0) {
      toast.error("Please confirm the sale before printing receipt");
    }
  };

  const handleConfirmSale = async () => {
    if (addedProducts.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    setIsProcessingSale(true);
    setShowLoader(true);

    const idempotencyKey = `idem-${invoiceNumber}-${Date.now()}`;
    const activeTaxRate = organizationSettings.taxEnabled ? organizationSettings.defaultTaxRate : 0;
    const activeDiscountRate = organizationSettings.discountsEnabled ? organizationSettings.defaultDiscountRate : 0;
    const calculatedTotals = calculateSaleTotals({
      items: addedProducts,
      taxRate: activeTaxRate,
      discountRate: activeDiscountRate,
      specialDiscount,
      maxDiscountPercent: organizationSettings.maxDiscountPercent,
      paymentMethod,
      amountTendered,
      payments: splitPayments.length > 0 ? splitPayments : undefined,
    });

    // Offline queue fallback
    if (connectivityService.isOffline()) {
      if (paymentMethod === "CARD") {
        toast("Card payment recorded offline without live gateway authorization.", {
          icon: "⚠️",
        });
      }

      const orderPayload = {
        invoiceNumber,
        idempotencyKey,
        items: addedProducts,
        customerId: selectedCustomer?.id || "",
        customerName: selectedCustomer?.name || "Walk-in Customer",
        customerPhone: selectedCustomer?.phoneNumber || "",
        customerEmail: selectedCustomer?.email || "",
        registerId: activeShift?.registerId || selectedRegisterId || "",
        shiftId: activeShift?.id || "",
        paymentMethod,
        paymentReference,
        amountTendered,
        specialDiscount,
        payments: splitPayments.length > 0 ? splitPayments : undefined,
        employeeId: user?.uid || "",
        employeeName: user?.displayName || user?.email?.split("@")[0] || "Cashier",
        dateTime: new Date().toISOString(),
      };

      const queued = await indexedDbOutboxRepository.enqueue({
        tenantId,
        userId: user?.uid || "cashier",
        userName: user?.displayName || "Cashier",
        operationType: "CHECKOUT_SALE",
        payload: orderPayload,
        localInvoiceNumber: invoiceNumber,
        affectedProductIds: addedProducts.map((p) => p.productId || p.id),
      });

      await refreshOutboxCount();

      setLastCompletedOrder({
        id: queued.operationId,
        invoiceNumber,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        employeeName: user?.displayName || "Cashier",
        paymentMethod,
        subtotal: calculatedTotals.subtotal,
        tax: calculatedTotals.tax,
        discount: calculatedTotals.discount,
        specialDiscount: calculatedTotals.specialDiscount,
        total: calculatedTotals.total,
        amountDue: calculatedTotals.amountDue,
        amountPaid: calculatedTotals.amountPaid,
        change: calculatedTotals.change,
        products: calculatedTotals.products,
        status: "COMPLETED",
      } as any);

      setShowReceiptModal(true);
      toast.success(`Sale saved offline — pending sync (#${invoiceNumber})!`);
      setAddedProducts([]);
      setSelectedProduct(null);
      setSelectedCustomer(null);
      setAmountTendered(0);
      setPaymentReference("");
      setSpecialDiscount(0);
      setSplitPayments([]);
      setIsProcessingSale(false);
      setShowLoader(false);
      return;
    }

    try {
      const completedOrder = await orderService.completeSale(
        {
          invoiceNumber,
          idempotencyKey,
          items: addedProducts,
          customerId: selectedCustomer?.id || "",
          customerName: selectedCustomer?.name || "Walk-in Customer",
          customerPhone: selectedCustomer?.phoneNumber || "",
          customerEmail: selectedCustomer?.email || "",
          registerId: activeShift?.registerId || selectedRegisterId || "",
          shiftId: activeShift?.id || "",
          paymentMethod,
          paymentReference,
          amountTendered,
          specialDiscount,
          payments: splitPayments.length > 0 ? splitPayments : undefined,
          employeeId: user?.uid || "",
          employeeName: user?.displayName || user?.email?.split("@")[0] || "Cashier",
          dateTime: new Date().toISOString(),
        },
        tenantId
      );

      // Record last used invoice number
      await invoiceService.recordInvoiceNumber(invoiceNumber, tenantId);

      // Update state & trigger receipt view
      setLastCompletedOrder(completedOrder);
      setShowReceiptModal(true);
      toast.success(`Sale completed! Invoice #${completedOrder.invoiceNumber}`);

      // Asynchronous background notification (EmailJS) decoupled from transaction
      const userEmail = user?.email || localStorage.getItem("email");
      if (userEmail) {
        sendEmail(
          userEmail,
          getInvnetoryRunningOutEmailTemplate({
            invoice: {
              invoiceNumber: completedOrder.invoiceNumber,
              customer: completedOrder.customerName,
              date: new Date().toLocaleDateString(),
            },
            products: completedOrder.products,
            total: completedOrder.total,
            tax: completedOrder.tax,
            company: {
              email: userEmail,
              phone: "---",
              address: "POS Store",
            },
          })
        );
      }

      // Reset cart and refresh product list & invoice number & shift data
      setAddedProducts([]);
      setSelectedProduct(null);
      setSelectedCustomer(null);
      setAmountTendered(0);
      setPaymentReference("");
      setSpecialDiscount(0);
      setSplitPayments([]);
      dispatch(fetchProductList(tenantId));
      loadInvoiceNumber();
      loadRegistersAndShift();
    } catch (error: any) {
      console.error("Sale completion failed", error);
      toast.error(error.message || "Sale could not be completed!");
    } finally {
      setIsProcessingSale(false);
      setShowLoader(false);
    }
  };

  // Shift Management Actions
  const handleOpenShift = async () => {
    if (!selectedRegisterId) {
      toast.error("Please select a register");
      return;
    }
    try {
      const shift = await shiftService.openShift(
        {
          registerId: selectedRegisterId,
          cashierId: user?.uid || "emp-1",
          cashierName: user?.displayName || user?.email?.split("@")[0] || "Cashier",
          openingFloat,
        },
        tenantId
      );
      setActiveShift(shift);
      setShowOpenShiftModal(false);
      toast.success(`Shift opened on ${shift.registerName}! Float: $${shift.openingFloat}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to open shift");
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    try {
      const closed = await shiftService.closeShift(
        activeShift.id,
        {
          closingCash: closingCashCounted,
          notes: closingNotes,
        },
        tenantId
      );
      setActiveShift(null);
      setClosedShiftReport(closed);
      setShowCloseShiftModal(false);
      setShowShiftReportModal(true);
      toast.success("Shift successfully closed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to close shift");
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.innerContainerLeft}>
        {/* Register & Shift Banner */}
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: activeShift ? "success.light" : "warning.light",
            border: "1px solid",
            borderColor: activeShift ? "success.main" : "warning.main",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PointOfSale color={activeShift ? "success" : "warning"} />
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {activeShift ? `Shift Active: ${activeShift.registerName}` : "No Active Shift"}
                </Typography>
                <Chip
                  label={
                    connectivityState === "SYNCING"
                      ? "SYNCING..."
                      : connectivityState === "ONLINE"
                      ? "ONLINE"
                      : "OFFLINE (OUTBOX ACTIVE)"
                  }
                  color={
                    connectivityState === "ONLINE"
                      ? "success"
                      : connectivityState === "SYNCING"
                      ? "info"
                      : "warning"
                  }
                  size="small"
                  sx={{ height: "20px", fontSize: "10px", fontWeight: "bold" }}
                />
              </Box>
              <Typography variant="caption" color="textSecondary">
                {activeShift
                  ? `Cashier: ${activeShift.cashierName} | Drawer Cash: ${formatCurrency(
                      (activeShift.openingFloat || 0) +
                      (activeShift.cashSales || 0) -
                      (activeShift.cashRefunds || 0)
                    )}`
                  : "Open a shift to track cash drawer reconciliation"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="outlined"
              color={pendingOutboxCount > 0 ? "warning" : "inherit"}
              size="small"
              startIcon={<CloudQueue />}
              onClick={() => setShowOutboxDrawer(true)}
            >
              Outbox ({pendingOutboxCount})
            </Button>
            {activeShift ? (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<LockClock />}
                onClick={() => {
                  setClosingCashCounted(
                    (activeShift.openingFloat || 0) +
                      (activeShift.cashSales || 0) -
                      (activeShift.cashRefunds || 0)
                  );
                  setShowCloseShiftModal(true);
                }}
              >
                Close Shift
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => setShowOpenShiftModal(true)}
              >
                Open Shift
              </Button>
            )}
          </Box>
        </Paper>

        {/* Barcode Scanner Input */}
        <form onSubmit={handleBarcodeScan} style={{ marginBottom: "12px" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Scan Barcode or Enter SKU then press Enter..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            inputRef={barcodeInputRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeScanner color="primary" />
                </InputAdornment>
              ),
              endAdornment: barcodeInput ? (
                <Button type="submit" size="small" variant="contained">
                  Scan / Add
                </Button>
              ) : null,
            }}
          />
        </form>

        <div className={classes.productSearchContainer}>
          <DropdownSearch
            label="Product"
            options={productOptions ?? []}
            placeholder="Search Product by Name or SKU..."
            onChange={productChange}
          />
          <div className={classes.row}>
            <InputComponent
              label="Quantity"
              name="quantity"
              type="number"
              variant="primary"
              value={`${quantity}`}
              placeholder="1"
              onChange={(value: number) => {
                if (value < 1) {
                  toast.error("Quantity cannot be less than 1");
                  return;
                }
                setQuantity(value);
              }}
            />
            <ButtonComponent
              variant={btnType.PRIMARY}
              onClick={handleProductAdd}
            >
              Add Item
            </ButtonComponent>
          </div>
        </div>

        <div className={classes.productSuggestionContainer}>
          <Table
            tableHeadings={["Product", "Quantity", "Price", "Total", "Actions"]}
            renderBody={renderAddedProducts}
            loading={showLoader}
          />
        </div>
      </div>

      <div className={classes.innerContainerRight}>
        <Invoice
          products={addedProducts}
          handleCancel={handleCancel}
          handleConfirm={handleConfirmSale}
          handlePrint={handleOpenReceipt}
          isLoading={isProcessingSale || showLoader}
          invoiceNumber={invoiceNumber}
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          paymentReference={paymentReference}
          onPaymentReferenceChange={setPaymentReference}
          amountTendered={amountTendered}
          onAmountTenderedChange={setAmountTendered}
          specialDiscount={specialDiscount}
          onSpecialDiscountChange={setSpecialDiscount}
          payments={splitPayments}
          onPaymentsChange={setSplitPayments}
          isCompleted={!!lastCompletedOrder && addedProducts.length === 0}
        />
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Sale Receipt #{lastCompletedOrder?.invoiceNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PrintableReceipt
            order={lastCompletedOrder}
            onClose={() => setShowReceiptModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Open Shift Modal */}
      <Modal
        show={showOpenShiftModal}
        onHide={() => setShowOpenShiftModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Open Cashier Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2">
              Select a register station and enter the starting cash float in the drawer.
            </Typography>
            <TextField
              select
              label="Register"
              value={selectedRegisterId}
              onChange={(e) => setSelectedRegisterId(e.target.value)}
              SelectProps={{ native: true }}
              size="small"
              fullWidth
            >
              {registers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.location || "Store"})
                </option>
              ))}
            </TextField>
            <TextField
              label={`Opening Cash Float (${organizationSettings.currencySymbol.trim()})`}
              type="number"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(Number(e.target.value))}
              size="small"
              fullWidth
            />
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outlined" onClick={() => setShowOpenShiftModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={handleOpenShift}>
            Open Shift
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Close Shift Modal */}
      <Modal
        show={showCloseShiftModal}
        onHide={() => setShowCloseShiftModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Close Shift Reconciliation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeShift && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Expected Drawer Cash:</strong>{" "}
                  {formatCurrency(
                    (activeShift.openingFloat || 0) +
                    (activeShift.cashSales || 0) -
                    (activeShift.cashRefunds || 0)
                  )}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Opening Float ({formatCurrency(activeShift.openingFloat)}) + Cash Sales (
                  {formatCurrency(activeShift.cashSales || 0)}) - Cash Refunds (
                  {formatCurrency(activeShift.cashRefunds || 0)})
                </Typography>
              </Box>

              <TextField
                label={`Actual Counted Cash (${organizationSettings.currencySymbol.trim()})`}
                type="number"
                value={closingCashCounted}
                onChange={(e) => setClosingCashCounted(Number(e.target.value))}
                size="small"
                fullWidth
              />

              <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>Discrepancy:</span>
                <span
                  style={{
                    color:
                      closingCashCounted -
                        ((activeShift.openingFloat || 0) +
                          (activeShift.cashSales || 0) -
                          (activeShift.cashRefunds || 0)) <
                      0
                        ? "var(--error, #dc2626)"
                        : "var(--success, #16a34a)",
                  }}
                >
                  {formatCurrency(
                    closingCashCounted -
                    ((activeShift.openingFloat || 0) +
                      (activeShift.cashSales || 0) -
                      (activeShift.cashRefunds || 0))
                  )}
                </span>
              </Box>

              <TextField
                label="Closing Notes (Optional)"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                size="small"
                multiline
                rows={2}
                fullWidth
              />
            </Box>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outlined" onClick={() => setShowCloseShiftModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleCloseShift}>
            Confirm & Close Shift
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Shift Report (Z-Report) Modal */}
      <Modal
        show={showShiftReportModal}
        onHide={() => setShowShiftReportModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Shift Closeout Report (Z-Report)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PrintableShiftReport
            shift={closedShiftReport}
            onClose={() => setShowShiftReportModal(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Offline Outbox Queue Drawer */}
      <OutboxDrawer
        open={showOutboxDrawer}
        onClose={() => {
          setShowOutboxDrawer(false);
          refreshOutboxCount();
        }}
      />
    </div>
  );
};
