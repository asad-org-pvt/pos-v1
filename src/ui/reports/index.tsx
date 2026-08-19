import React, { useEffect, useState } from "react";
import Table from "../common/components/table";
import {
  reportingService,
  DateRangePreset,
  SalesSummaryReport,
  ProductSalesSummary,
  CashierSalesSummary,
  InventoryValuationReport,
} from "../../services/app/ReportingService";
import { orderService } from "../../services/app/OrderService";
import { productService } from "../../services/app/ProductService";
import { stockMovementService } from "../../services/app/StockMovementService";
import { exportService } from "../../services/app/ExportService";
import { useTenant } from "../../context/AuthTenantContext";
import { useSettings } from "../../context/SettingsContext";
import {
  Box,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Button,
} from "@mui/material";
import {
  TrendingUp,
  AttachMoney,
  PointOfSale,
  Inventory2,
  FileDownload,
  Refresh,
} from "@mui/icons-material";
import toast from "react-hot-toast";

export const ReportsView: React.FC = () => {
  const { tenantId } = useTenant();
  const { formatCurrency } = useSettings();
  const [datePreset, setDatePreset] = useState<DateRangePreset>("today");
  const [isLoading, setIsLoading] = useState(false);

  const [salesSummary, setSalesSummary] = useState<SalesSummaryReport | null>(null);
  const [productSales, setProductSales] = useState<ProductSalesSummary[]>([]);
  const [cashierSales, setCashierSales] = useState<CashierSalesSummary[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuationReport | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [sales, prodSales, cashiers, valuation] = await Promise.all([
        reportingService.getSalesReport({ preset: datePreset }, tenantId),
        reportingService.getProductSalesReport({ preset: datePreset }, tenantId),
        reportingService.getCashierReport({ preset: datePreset }, tenantId),
        reportingService.getInventoryValuationReport(tenantId),
      ]);

      setSalesSummary(sales);
      setProductSales(prodSales);
      setCashierSales(cashiers);
      setInventoryValuation(valuation);
    } catch (err) {
      console.warn("Failed to load reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [datePreset, tenantId]);

  const handleExportSalesCsv = async () => {
    try {
      const orders = await orderService.getOrders(tenantId);
      const csv = exportService.exportSalesCsv(orders);
      exportService.triggerCsvDownload(csv, `sales-report-${datePreset}.csv`);
      toast.success("Sales data exported to CSV");
    } catch (e: any) {
      toast.error("Export failed");
    }
  };

  const handleExportInventoryCsv = async () => {
    try {
      const products = await productService.getProducts(tenantId);
      const csv = exportService.exportInventoryCsv(products);
      exportService.triggerCsvDownload(csv, `inventory-valuation-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Inventory valuation exported to CSV");
    } catch (e: any) {
      toast.error("Export failed");
    }
  };

  const handleExportMovementsCsv = async () => {
    try {
      const movements = await stockMovementService.getMovements(tenantId);
      const csv = exportService.exportMovementsCsv(movements);
      exportService.triggerCsvDownload(csv, `stock-movements-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Stock movements exported to CSV");
    } catch (e: any) {
      toast.error("Export failed");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Date Filter & Export Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Management Reports & Analytics
          </Typography>
          <ToggleButtonGroup
            color="primary"
            value={datePreset}
            exclusive
            size="small"
            onChange={(_, val) => {
              if (val) setDatePreset(val);
            }}
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="yesterday">Yesterday</ToggleButton>
            <ToggleButton value="last7days">Last 7 Days</ToggleButton>
            <ToggleButton value="last30days">Last 30 Days</ToggleButton>
            <ToggleButton value="all">All Time</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={loadReports} disabled={isLoading}>
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={handleExportSalesCsv}>
            Export Sales
          </Button>
          <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={handleExportInventoryCsv}>
            Export Inventory
          </Button>
          <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={handleExportMovementsCsv}>
            Export Movements
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Grid */}
      {salesSummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "info.light" }}>
              <AttachMoney color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  GROSS SALES
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(salesSummary.grossSales)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {salesSummary.transactionCount} transactions
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "error.light" }}>
              <PointOfSale color="error" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  RETURNS / REFUNDS
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "error.main" }}>
                  -{formatCurrency(salesSummary.refunds)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Net: {formatCurrency(salesSummary.netSales)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "success.light" }}>
              <TrendingUp color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  ESTIMATED GROSS PROFIT
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "success.main" }}>
                  {formatCurrency(salesSummary.grossProfit)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Margin: {salesSummary.grossMarginPercent}%
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "warning.light" }}>
              <Inventory2 color="warning" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  INVENTORY VALUATION
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(inventoryValuation?.totalCostValue || 0)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {inventoryValuation?.totalUnitsInStock || 0} total units
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Payment Methods Breakdown */}
      {salesSummary && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
            PAYMENT TENDER BREAKDOWN
          </Typography>
          <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Typography variant="body2">
              <strong>Cash Sales:</strong> {formatCurrency(salesSummary.cashSales)}
            </Typography>
            <Typography variant="body2">
              <strong>Card Sales:</strong> {formatCurrency(salesSummary.cardSales)}
            </Typography>
            <Typography variant="body2">
              <strong>Other Payments:</strong> {formatCurrency(salesSummary.otherSales)}
            </Typography>
            <Typography variant="body2">
              <strong>Avg Ticket Size:</strong> {formatCurrency(salesSummary.avgTransactionValue)}
            </Typography>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Top Selling Products
            </Typography>
            <Table
              tableHeadings={["Product", "Units Sold", "Returned", "Net Units", "Net Revenue", "Est. Profit"]}
              renderBody={productSales.slice(0, 8).map((p) => (
                <tr key={p.productId}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.unitsSold}</td>
                  <td>{p.unitsReturned}</td>
                  <td>{p.netUnitsSold}</td>
                  <td>{formatCurrency(p.netRevenue)}</td>
                  <td style={{ color: p.estimatedProfit >= 0 ? "var(--success, #16a34a)" : "var(--error, #dc2626)" }}>
                    {formatCurrency(p.estimatedProfit)}
                  </td>
                </tr>
              ))}
              loading={isLoading}
            />
          </Paper>
        </Grid>

        {/* Cashier Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Cashier Sales Performance
            </Typography>
            <Table
              tableHeadings={["Cashier", "Txns", "Gross Sales", "Refunds", "Net Sales"]}
              renderBody={cashierSales.map((c) => (
                <tr key={c.cashierId}>
                  <td><strong>{c.cashierName}</strong></td>
                  <td>{c.transactionCount}</td>
                  <td>{formatCurrency(c.grossSales)}</td>
                  <td>{formatCurrency(c.refunds)}</td>
                  <td><strong>{formatCurrency(c.netSales)}</strong></td>
                </tr>
              ))}
              loading={isLoading}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsView;
