import React, { useEffect, useMemo, useState } from "react";
import Table from "../../common/components/table";
import { stockMovementService } from "../../../services/app/StockMovementService";
import { productService } from "../../../services/app/ProductService";
import { exportService } from "../../../services/app/ExportService";
import { StockMovement, StockMovementType } from "../../../domain/models/StockMovement";
import { AdjustmentReason } from "../../../domain/models/InventoryAdjustment";
import { useAuth, useTenant } from "../../../context/AuthTenantContext";
import { useSettings } from "../../../context/SettingsContext";
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
} from "@mui/material";
import { FileDownload, Tune, Refresh } from "@mui/icons-material";
import toast from "react-hot-toast";

export const StockMovementsView: React.FC = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { formatCurrency, formatDateTime } = useSettings();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<AdjustmentReason>("COUNT_CORRECTION");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [movList, prodList] = await Promise.all([
        stockMovementService.getMovements(tenantId),
        productService.getProducts(tenantId),
      ]);
      setMovements(movList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setProducts(prodList);
      if (prodList.length > 0 && !selectedProductId) {
        setSelectedProductId(prodList[0].id);
      }
    } catch (err) {
      console.warn("Failed to load stock movements", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesType = typeFilter === "ALL" || m.type === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.productName.toLowerCase().includes(q) ||
        m.reason?.toLowerCase().includes(q) ||
        m.relatedInvoiceNumber?.toLowerCase().includes(q) ||
        m.performedByName?.toLowerCase().includes(q);

      return matchesType && matchesQuery;
    });
  }, [movements, typeFilter, searchQuery]);

  const handleAdjustStock = async () => {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    if (adjustDelta === 0) {
      toast.error("Quantity delta cannot be 0");
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const prod = products.find((p) => p.id === selectedProductId);
      await stockMovementService.adjustStock(
        {
          productId: selectedProductId,
          quantityDelta: adjustDelta,
          reason: adjustReason,
          notes: adjustNotes,
          performedBy: user?.uid || "",
          performedByName: user?.displayName || user?.email?.split("@")[0] || "Manager",
        },
        tenantId
      );

      toast.success(`Adjusted stock for "${prod?.name || selectedProductId}" (${adjustDelta > 0 ? "+" : ""}${adjustDelta})`);
      setShowAdjustModal(false);
      setAdjustDelta(0);
      setAdjustNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleExportCsv = () => {
    const csv = exportService.exportMovementsCsv(filteredMovements);
    exportService.triggerCsvDownload(csv, `stock-movements-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Stock movements exported to CSV");
  };

  const getTypeChipColor = (type: StockMovementType) => {
    switch (type) {
      case "SALE":
        return "primary";
      case "RETURN":
        return "success";
      case "RESTOCK":
        return "secondary";
      case "ADJUSTMENT":
        return "warning";
      default:
        return "default";
    }
  };

  const renderTableData = useMemo(() => {
    return filteredMovements.map((m) => {
      return (
        <tr key={m.id}>
          <td>{formatDateTime(m.timestamp)}</td>
          <td><strong>{m.productName}</strong></td>
          <td>
            <Chip label={m.type} size="small" color={getTypeChipColor(m.type) as any} />
          </td>
          <td style={{ fontWeight: "bold", color: m.quantityDelta > 0 ? "var(--success, #16a34a)" : "var(--error, #dc2626)" }}>
            {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
          </td>
          <td>{m.quantityBefore}</td>
          <td>{m.quantityAfter}</td>
          <td>{m.unitCost ? formatCurrency(m.unitCost) : "-"}</td>
          <td>{m.reason || m.relatedInvoiceNumber || "-"}</td>
          <td>{m.performedByName || "System"}</td>
        </tr>
      );
    });
  }, [filteredMovements, formatCurrency, formatDateTime]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Control Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search by Product, Reason, Invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: "300px" }}
          />
          <FormControl size="small" sx={{ width: "160px" }}>
            <InputLabel>Movement Type</InputLabel>
            <Select
              value={typeFilter}
              label="Movement Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="SALE">SALE (-)</MenuItem>
              <MenuItem value="RETURN">RETURN (+)</MenuItem>
              <MenuItem value="RESTOCK">RESTOCK (+)</MenuItem>
              <MenuItem value="ADJUSTMENT">ADJUSTMENT (±)</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} disabled={isLoading}>
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Tune />}
            onClick={() => setShowAdjustModal(true)}
          >
            Adjust Stock
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportCsv}
            disabled={filteredMovements.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Movements Table */}
      <Table
        tableHeadings={[
          "Timestamp",
          "Product",
          "Type",
          "Delta",
          "Before",
          "After",
          "Unit Cost",
          "Reason / Reference",
          "Performed By",
        ]}
        renderBody={renderTableData}
        loading={isLoading}
      />

      {/* Adjust Stock Modal */}
      <Modal show={showAdjustModal} onHide={() => setShowAdjustModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Adjust Inventory Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Manually correct or adjust inventory. Every adjustment is recorded in the immutable audit ledger.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Select Product</InputLabel>
              <Select
                value={selectedProductId}
                label="Select Product"
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} (Current Stock: {p.unitsInStock})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Quantity Delta (+ to add, - to subtract)"
              type="number"
              size="small"
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(Number(e.target.value))}
              helperText="Example: +5 for recount increase, -2 for damaged items"
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel>Adjustment Reason</InputLabel>
              <Select
                value={adjustReason}
                label="Adjustment Reason"
                onChange={(e) => setAdjustReason(e.target.value as AdjustmentReason)}
              >
                <MenuItem value="COUNT_CORRECTION">Count Correction / Recount</MenuItem>
                <MenuItem value="DAMAGE">Damaged Goods</MenuItem>
                <MenuItem value="SPOILAGE">Spoiled / Expired</MenuItem>
                <MenuItem value="SHRINKAGE">Theft / Shrinkage</MenuItem>
                <MenuItem value="OTHER">Other Reason</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notes (Optional)"
              multiline
              rows={2}
              size="small"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              fullWidth
            />
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outlined" onClick={() => setShowAdjustModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={adjustDelta === 0 || isSubmittingAdjust}
            onClick={handleAdjustStock}
          >
            {isSubmittingAdjust ? "Saving..." : "Confirm Stock Adjustment"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Box>
  );
};

export default StockMovementsView;
