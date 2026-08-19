import React, { useEffect, useMemo, useState } from "react";
import Table from "../common/components/table";
import { purchaseOrderService } from "../../services/app/PurchaseOrderService";
import { supplierService } from "../../services/app/SupplierService";
import { productService } from "../../services/app/ProductService";
import { exportService } from "../../services/app/ExportService";
import { PurchaseOrder } from "../../domain/models/PurchaseOrder";
import { Supplier } from "../../domain/models/Supplier";
import { Product } from "../../domain/models/Product";
import { useAuth, useTenant } from "../../context/AuthTenantContext";
import { useSettings } from "../../context/SettingsContext";
import { Modal } from "react-bootstrap";
import {
  Box,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add,
  FileDownload,
  Refresh,
  MoveToInbox,
  Delete,
  Cancel,
  ReceiptLong,
  PendingActions,
  CheckCircle,
  LocalShipping,
} from "@mui/icons-material";
import toast from "react-hot-toast";

export const PurchasingView: React.FC = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { formatCurrency, formatDate } = useSettings();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");

  // Create PO Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poItems, setPoItems] = useState<
    Array<{ productId: string; name: string; sku: string; orderedQuantity: number; unitCost: number }>
  >([]);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  // Receiving Modal State
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [receivingQtys, setReceivingQtys] = useState<{ [productId: string]: number }>({});
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [poList, supList, prodList] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(tenantId),
        supplierService.getSuppliers(tenantId),
        productService.getProducts(tenantId),
      ]);
      setPurchaseOrders(poList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      setSuppliers(supList);
      setProducts(prodList);
      if (supList.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supList[0].id);
      }
    } catch (err) {
      console.warn("Failed to load purchasing data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Derived Summary KPIs
  const kpis = useMemo(() => {
    let openCount = 0;
    let partialCount = 0;
    let receivedCount = 0;
    let totalSpend = 0;

    purchaseOrders.forEach((po) => {
      totalSpend += Number(po.total) || 0;
      if (po.status === "ORDERED" || po.status === "DRAFT") openCount++;
      else if (po.status === "PARTIALLY_RECEIVED") partialCount++;
      else if (po.status === "RECEIVED") receivedCount++;
    });

    return {
      totalOrders: purchaseOrders.length,
      openCount,
      partialCount,
      receivedCount,
      totalSpend,
    };
  }, [purchaseOrders]);

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
      const matchesSupplier = supplierFilter === "ALL" || po.supplierId === supplierFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.status.toLowerCase().includes(q);

      return matchesStatus && matchesSupplier && matchesQuery;
    });
  }, [purchaseOrders, statusFilter, supplierFilter, searchQuery]);

  const handleAddItemToPo = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    if (poItems.some((item) => item.productId === prod.id)) {
      toast.error("Item already in purchase order");
      return;
    }

    setPoItems([
      ...poItems,
      {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku || "",
        orderedQuantity: 10,
        unitCost: prod.costPrice || 0,
      },
    ]);
  };

  const calculatedPoTotal = useMemo(() => {
    return poItems.reduce((sum, item) => sum + (item.orderedQuantity * item.unitCost), 0);
  }, [poItems]);

  const handleCreatePo = async () => {
    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (poItems.length === 0) {
      toast.error("Please add at least one item to the PO");
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);

    setIsSubmittingPo(true);
    try {
      const newPo = await purchaseOrderService.createPurchaseOrder(
        {
          supplierId: selectedSupplierId,
          supplierName: supplier?.name || "Supplier",
          items: poItems,
          notes: poNotes,
          createdBy: user?.uid || "",
          createdByName: user?.displayName || user?.email?.split("@")[0] || "Manager",
        },
        tenantId
      );

      toast.success(`Purchase Order ${newPo.poNumber} created!`);
      setShowCreateModal(false);
      setPoItems([]);
      setPoNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create PO");
    } finally {
      setIsSubmittingPo(false);
    }
  };

  const handleCancelPo = async (po: PurchaseOrder) => {
    if (window.confirm(`Are you sure you want to cancel Purchase Order ${po.poNumber}?`)) {
      try {
        await purchaseOrderService.cancelPurchaseOrder(po.id, tenantId);
        toast.success(`Purchase Order ${po.poNumber} cancelled.`);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel purchase order");
      }
    }
  };

  const handleOpenReceive = (po: PurchaseOrder) => {
    setReceivingPo(po);
    const initialQtys: { [productId: string]: number } = {};
    po.items.forEach((item) => {
      const remaining = item.orderedQuantity - (item.receivedQuantity || 0);
      initialQtys[item.productId] = remaining > 0 ? remaining : 0;
    });
    setReceivingQtys(initialQtys);
  };

  const handleConfirmReceive = async () => {
    if (!receivingPo) return;

    const itemsToReceive: Array<{ productId: string; receivedNow: number; unitCost?: number }> = [];
    receivingPo.items.forEach((item) => {
      const qty = receivingQtys[item.productId] || 0;
      if (qty > 0) {
        itemsToReceive.push({
          productId: item.productId,
          receivedNow: qty,
          unitCost: item.unitCost,
        });
      }
    });

    if (itemsToReceive.length === 0) {
      toast.error("Please specify at least one item quantity to receive.");
      return;
    }

    setIsSubmittingReceive(true);
    try {
      const updatedPo = await purchaseOrderService.receiveItems(
        {
          poId: receivingPo.id,
          items: itemsToReceive,
          receivedBy: user?.uid || "",
          receivedByName: user?.displayName || user?.email?.split("@")[0] || "Manager",
        },
        tenantId
      );

      toast.success(`Received items for PO ${updatedPo.poNumber} - Stock updated!`);
      setReceivingPo(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to receive PO items");
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  const handleExportCsv = () => {
    const csv = exportService.exportPurchaseOrdersCsv(filteredOrders);
    exportService.triggerCsvDownload(csv, `purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Purchase orders exported to CSV");
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "ORDERED":
        return <Chip label="ORDERED" size="small" color="primary" />;
      case "PARTIALLY_RECEIVED":
        return <Chip label="PARTIAL" size="small" color="warning" />;
      case "RECEIVED":
        return <Chip label="RECEIVED" size="small" color="success" />;
      case "CANCELLED":
        return <Chip label="CANCELLED" size="small" color="error" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const renderTableData = useMemo(() => {
    return filteredOrders.map((po) => {
      const isReceivable = po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED";
      const isCancellable = po.status === "ORDERED" || po.status === "DRAFT";

      return (
        <tr key={po.id}>
          <td><strong>{po.poNumber}</strong></td>
          <td>{po.supplierName}</td>
          <td>{po.createdAt ? formatDate(po.createdAt) : "-"}</td>
          <td>{po.items?.length || 0} items</td>
          <td><strong>{formatCurrency(po.total || 0)}</strong></td>
          <td>{getStatusChip(po.status)}</td>
          <td>
            <Box sx={{ display: "flex", gap: 1 }}>
              {isReceivable && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<MoveToInbox />}
                  onClick={() => handleOpenReceive(po)}
                >
                  Receive
                </Button>
              )}
              {isCancellable && (
                <IconButton
                  size="small"
                  color="error"
                  title="Cancel PO"
                  onClick={() => handleCancelPo(po)}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              )}
            </Box>
          </td>
        </tr>
      );
    });
  }, [filteredOrders, formatCurrency]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Procurement Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #1976d2" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography color="text.secondary" variant="caption" fontWeight="bold">
                  TOTAL ORDERS
                </Typography>
                <ReceiptLong color="primary" fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                {kpis.totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #ed6c02" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography color="warning.main" variant="caption" fontWeight="bold">
                  OPEN / PENDING
                </Typography>
                <PendingActions color="warning" fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ mt: 0.5 }}>
                {kpis.openCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #9c27b0" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography color="secondary.main" variant="caption" fontWeight="bold">
                  PARTIAL DELIVERIES
                </Typography>
                <LocalShipping color="secondary" fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="secondary.main" sx={{ mt: 0.5 }}>
                {kpis.partialCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #2e7d32" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography color="success.main" variant="caption" fontWeight="bold">
                  TOTAL PROCUREMENT
                </Typography>
                <CheckCircle color="success" fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                ${kpis.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Header Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search by PO #, Supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 220 }}
          />

          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ORDERED">ORDERED</MenuItem>
              <MenuItem value="PARTIALLY_RECEIVED">PARTIAL</MenuItem>
              <MenuItem value="RECEIVED">RECEIVED</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 180 }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              value={supplierFilter}
              label="Supplier"
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Suppliers</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} disabled={isLoading}>
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Purchase Order
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* PO Table */}
      <Table
        tableHeadings={["PO #", "Supplier", "Date", "Line Items", "Total Cost", "Status", "Actions"]}
        renderBody={renderTableData}
        loading={isLoading}
      />

      {/* Create PO Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Supplier Purchase Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Supplier</InputLabel>
              <Select
                value={selectedSupplierId}
                label="Select Supplier"
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.phoneNumber || s.email || "Supplier"})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Add Product to PO</InputLabel>
              <Select
                value=""
                label="Add Product to PO"
                onChange={(e) => handleAddItemToPo(e.target.value)}
              >
                <MenuItem value="">-- Select Product to Add --</MenuItem>
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} (In Stock: {p.unitsInStock}, Cost: ${p.costPrice || 0})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {poItems.length > 0 && (
              <Table
                tableHeadings={["Product", "Ordered Qty", "Unit Cost ($)", "Line Total ($)", "Remove"]}
                renderBody={poItems.map((item, idx) => (
                  <tr key={item.productId}>
                    <td><strong>{item.name}</strong></td>
                    <td>
                      <TextField
                        type="number"
                        size="small"
                        value={item.orderedQuantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].orderedQuantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setPoItems(updated);
                        }}
                        sx={{ width: "90px" }}
                      />
                    </td>
                    <td>
                      <TextField
                        type="number"
                        size="small"
                        value={item.unitCost}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].unitCost = Math.max(0, parseFloat(e.target.value) || 0);
                          setPoItems(updated);
                        }}
                        sx={{ width: "100px" }}
                      />
                    </td>
                    <td>{formatCurrency(item.orderedQuantity * item.unitCost)}</td>
                    <td>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
                loading={false}
              />
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <TextField
                label="PO Notes (Optional)"
                size="small"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                sx={{ width: "60%" }}
              />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Total: {formatCurrency(calculatedPoTotal)}
              </Typography>
            </Box>
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outlined" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={poItems.length === 0 || isSubmittingPo}
            onClick={handleCreatePo}
          >
            {isSubmittingPo ? "Submitting..." : `Submit PO (${formatCurrency(calculatedPoTotal)})`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Receive PO Modal */}
      <Modal show={!!receivingPo} onHide={() => setReceivingPo(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Receive Inventory: PO #{receivingPo?.poNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {receivingPo && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Enter the quantity received now. Inventory stock and weighted-average cost will update atomically.
              </Typography>

              <Table
                tableHeadings={["Product", "Ordered", "Received Prev", "Remaining", "Receive Now Qty"]}
                renderBody={receivingPo.items.map((item) => {
                  const ordered = item.orderedQuantity;
                  const received = item.receivedQuantity || 0;
                  const remaining = ordered - received;
                  const currentReceive = receivingQtys[item.productId] || 0;

                  return (
                    <tr key={item.productId}>
                      <td><strong>{item.name}</strong></td>
                      <td>{ordered}</td>
                      <td>{received}</td>
                      <td>{remaining}</td>
                      <td>
                        <TextField
                          type="number"
                          size="small"
                          disabled={remaining <= 0}
                          value={currentReceive}
                          inputProps={{ min: 0, max: remaining }}
                          onChange={(e) => {
                            const val = Math.min(
                              remaining,
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            );
                            setReceivingQtys({
                              ...receivingQtys,
                              [item.productId]: val,
                            });
                          }}
                          sx={{ width: "90px" }}
                        />
                      </td>
                    </tr>
                  );
                })}
                loading={false}
              />
            </Box>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outlined" onClick={() => setReceivingPo(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={isSubmittingReceive}
            onClick={handleConfirmReceive}
          >
            {isSubmittingReceive ? "Receiving..." : "Confirm & Update Stock"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Box>
  );
};

export default PurchasingView;
