import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  Inventory,
  Warning,
  ErrorOutline,
  AttachMoney,
  TrendingUp,
  Refresh,
  Tune,
} from "@mui/icons-material";
import { productService } from "../../../services/app/ProductService";
import { stockMovementService } from "../../../services/app/StockMovementService";
import { Product } from "../../../domain/models/Product";
import { StockMovement } from "../../../domain/models/StockMovement";
import { useTenant } from "../../../context/AuthTenantContext";
import { useSettings } from "../../../context/SettingsContext";

interface InventoryDashboardProps {
  onOpenAdjustModal?: () => void;
  onNavigateToCatalog?: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  onOpenAdjustModal,
  onNavigateToCatalog,
}) => {
  const { tenantId } = useTenant();
  const { formatCurrency } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodList, movList] = await Promise.all([
        productService.getProducts(tenantId),
        stockMovementService.getMovements(tenantId),
      ]);
      setProducts(prodList);
      setRecentMovements(
        movList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)
      );
    } catch (err) {
      console.warn("Failed to load inventory dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Derived KPIs
  const stats = useMemo(() => {
    const totalProducts = products.length;
    let totalUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    const lowStockItems: Product[] = [];
    const outOfStockItems: Product[] = [];

    products.forEach((p) => {
      const stock = Number(p.unitsInStock) || 0;
      const unitPrice = Number(p.unitPrice) || 0;
      const costPrice = Number(p.costPrice) || (unitPrice * 0.7); // Fallback cost estimate
      const threshold = Number(p.minThreshold) || 5;

      totalUnits += stock;
      totalCostValue += stock * costPrice;
      totalRetailValue += stock * unitPrice;

      if (stock === 0) {
        outOfStockItems.push(p);
      } else if (stock <= threshold) {
        lowStockItems.push(p);
      }
    });

    return {
      totalProducts,
      totalUnits,
      totalCostValue,
      totalRetailValue,
      lowStockItems,
      outOfStockItems,
    };
  }, [products]);

  return (
    <Box sx={{ p: 3, bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Inventory & Stock Operations Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time stock valuation, replenishment alerts, and audit trail metrics
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} disabled={isLoading}>
            Refresh
          </Button>
          {onOpenAdjustModal && (
            <Button variant="contained" color="warning" startIcon={<Tune />} onClick={onOpenAdjustModal}>
              Quick Adjust
            </Button>
          )}
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Products */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: "4px solid",
              borderLeftColor: "primary.main",
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, color: "text.secondary" }}>
                    Total Products
                  </Typography>
                  <Typography variant="h4" fontWeight="800" sx={{ mt: 0.5, color: "text.primary" }}>
                    {stats.totalProducts}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "primary.light",
                    color: "primary.main",
                  }}
                >
                  <Inventory fontSize="medium" />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                <strong>{stats.totalUnits.toLocaleString()}</strong> units on hand
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Alerts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: "4px solid",
              borderLeftColor: "warning.main",
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, color: "warning.main" }}>
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="h4" fontWeight="800" sx={{ mt: 0.5, color: "text.primary" }}>
                    {stats.lowStockItems.length}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "warning.light",
                    color: "warning.main",
                  }}
                >
                  <Warning fontSize="medium" />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                At or below reorder threshold
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Out of Stock */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: "4px solid",
              borderLeftColor: "error.main",
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, color: "error.main" }}>
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" fontWeight="800" sx={{ mt: 0.5, color: "text.primary" }}>
                    {stats.outOfStockItems.length}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "error.light",
                    color: "error.main",
                  }}
                >
                  <ErrorOutline fontSize="medium" />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                Critical replenishment required
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Value */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: "4px solid",
              borderLeftColor: "success.main",
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, color: "success.main" }}>
                    Inventory Valuation
                  </Typography>
                  <Typography variant="h4" fontWeight="800" sx={{ mt: 0.5, color: "text.primary" }}>
                    {formatCurrency(stats.totalRetailValue)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "success.light",
                    color: "success.main",
                  }}
                >
                  <AttachMoney fontSize="medium" />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                Cost basis: <strong>{formatCurrency(stats.totalCostValue)}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actionable Alerts & Recent Activity */}
      <Grid container spacing={3}>
        {/* Replenishment Alert Table */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: 2.5,
              height: "100%",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                ⚠️ Stock Replenishment Required
              </Typography>
              {onNavigateToCatalog && (
                <Button size="small" variant="outlined" onClick={onNavigateToCatalog}>
                  View All Products
                </Button>
              )}
            </Box>

            {stats.lowStockItems.length === 0 && stats.outOfStockItems.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  🎉 All products are adequately stocked above minimum reorder thresholds.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 320, borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product Name</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell align="center"><strong>Current Stock</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...stats.outOfStockItems, ...stats.lowStockItems].map((prod) => (
                      <TableRow key={prod.id} hover>
                        <TableCell><strong style={{ color: "var(--text-primary)" }}>{prod.name}</strong></TableCell>
                        <TableCell>{prod.category || "General"}</TableCell>
                        <TableCell align="center">
                          <strong>{prod.unitsInStock}</strong> / {prod.minThreshold || 5} min
                        </TableCell>
                        <TableCell align="center">
                          {prod.unitsInStock === 0 ? (
                            <Chip label="OUT OF STOCK" color="error" size="small" />
                          ) : (
                            <Chip label="LOW STOCK" color="warning" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Recent Audit Ledger Activity */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 2.5,
              height: "100%",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                📋 Recent Stock Movement Ledger
              </Typography>
              <TrendingUp color="primary" fontSize="small" />
            </Box>

            {recentMovements.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No stock movements recorded yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 320, borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell align="center"><strong>Type</strong></TableCell>
                      <TableCell align="right"><strong>Delta</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentMovements.map((mov) => (
                      <TableRow key={mov.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600" color="text.primary">
                            {mov.productName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(mov.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {mov.reason || mov.type}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={mov.type}
                            size="small"
                            color={
                              mov.type === "SALE"
                                ? "primary"
                                : mov.type === "RESTOCK"
                                ? "success"
                                : mov.type === "RETURN"
                                ? "secondary"
                                : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: "bold",
                            color: mov.quantityDelta > 0 ? "success.main" : "error.main",
                          }}
                        >
                          {mov.quantityDelta > 0 ? `+${mov.quantityDelta}` : mov.quantityDelta}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryDashboard;
