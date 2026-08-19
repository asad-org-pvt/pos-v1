import { useFormik } from "formik";
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  MenuItem,
  InputAdornment,
  Chip,
  IconButton,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  QrCodeScanner,
  Inventory,
  Category as CategoryIcon,
  AttachMoney,
  LocalShipping,
  Percent,
  TrendingUp,
  Image as ImageIcon,
  Save as SaveIcon,
  Close,
  Delete,
  AddPhotoAlternate,
  AutoAwesome,
} from "@mui/icons-material";
import { getCategories } from "../../../parser/categories";
import { getAllSuppliers } from "../../../parser/supplier";
import { SUB_CATEGORIES_COLLECTION } from "../../common/constants/collections";
import { useSettings } from "../../../context/SettingsContext";

export interface ComponentProps {
  onSubmit: (values: any, helpers?: any) => void;
  onChange?: (data: any) => void;
  product?: any;
  suppliers?: any[];
  categories?: any[];
  onImageChange?: (data: any) => void;
  onCancel?: () => void;
}

export const InventoryForm: React.FC<ComponentProps> = ({
  onSubmit,
  product,
  suppliers: propSuppliers,
  categories: propCategories,
  onCancel,
}) => {
  const { organizationSettings, formatCurrency } = useSettings();
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [imageInputUrl, setImageInputUrl] = useState("");

  const currencySymbol = organizationSettings?.currencySymbol?.trim() || "Rs";

  useEffect(() => {
    let mounted = true;
    const fetchMetadata = async () => {
      try {
        if (propSuppliers && propSuppliers.length > 0) {
          setSuppliersList(propSuppliers);
        } else {
          const fetchedSuppliers = await getAllSuppliers();
          if (mounted) setSuppliersList(fetchedSuppliers || []);
        }

        if (propCategories && propCategories.length > 0) {
          setCategoriesList(propCategories);
        } else {
          const fetchedCategories = await getCategories(SUB_CATEGORIES_COLLECTION.PRODUCTS);
          if (mounted) setCategoriesList(fetchedCategories || []);
        }
      } catch (err) {
        console.error("Error loading suppliers/categories", err);
      }
    };
    fetchMetadata();
    return () => {
      mounted = false;
    };
  }, [propSuppliers, propCategories]);

  const initialValues = {
    id: product?.id || product?.barcode || "",
    barcode: product?.barcode || product?.id || "",
    sku: product?.sku || product?.id || "",
    name: product?.name || "",
    unitPrice: product?.unitPrice !== undefined ? product.unitPrice : "",
    supplyPrice: product?.supplyPrice !== undefined ? product.supplyPrice : "",
    unitsInStock: product?.unitsInStock !== undefined ? product.unitsInStock : (product?.id ? 0 : 10),
    minThreshold: product?.minThreshold !== undefined ? product.minThreshold : 5,
    category: product?.category || "",
    description: product?.description || "",
    taxPerUnit: product?.taxPerUnit !== undefined ? product.taxPerUnit : 0,
    supplierId: product?.supplierId || "",
    images: Array.isArray(product?.images) ? product.images : [],
  };

  const validate = (values: typeof initialValues) => {
    const errors: Record<string, string> = {};
    if (!values.id?.trim()) {
      errors.id = "Barcode / SKU identifier is required";
    }
    if (!values.name?.trim()) {
      errors.name = "Product name is required";
    }
    if (values.unitPrice === "" || Number(values.unitPrice) < 0) {
      errors.unitPrice = "Valid retail sale price is required";
    }
    if (!values.category) {
      errors.category = "Category selection is required";
    }
    return errors;
  };

  const formik = useFormik({
    initialValues,
    validate,
    enableReinitialize: true,
    onSubmit: (values, helpers) => {
      const payload: any = {
        ...values,
        id: values.id.trim(),
        barcode: values.barcode?.trim() || values.id.trim(),
        sku: values.sku?.trim() || values.id.trim(),
        name: values.name.trim(),
        unitPrice: Number(values.unitPrice) || 0,
        supplyPrice: Number(values.supplyPrice) || 0,
        unitsInStock: Number(values.unitsInStock) || 0,
        minThreshold: Number(values.minThreshold) || 5,
        taxPerUnit: Number(values.taxPerUnit) || 0,
      };
      onSubmit(payload, helpers);
    },
  });

  // Calculate real-time profit margin
  const profitMargin = useMemo(() => {
    const sale = Number(formik.values.unitPrice) || 0;
    const cost = Number(formik.values.supplyPrice) || 0;
    if (sale <= 0) return null;
    const profit = sale - cost;
    const marginPercent = ((profit / sale) * 100).toFixed(1);
    return {
      profit,
      marginPercent,
      isPositive: profit >= 0,
    };
  }, [formik.values.unitPrice, formik.values.supplyPrice]);

  const handleGenerateBarcode = () => {
    const randomBarcode = "PRD-" + Math.floor(100000 + Math.random() * 900000);
    formik.setFieldValue("id", randomBarcode);
    formik.setFieldValue("barcode", randomBarcode);
    formik.setFieldValue("sku", randomBarcode);
  };

  const handleAddImageUrl = () => {
    if (!imageInputUrl.trim()) return;
    const currentImages = formik.values.images || [];
    if (!currentImages.includes(imageInputUrl.trim())) {
      formik.setFieldValue("images", [...currentImages, imageInputUrl.trim()]);
    }
    setImageInputUrl("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const currentImages = formik.values.images || [];
    formik.setFieldValue(
      "images",
      currentImages.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        formik.setFieldValue("images", [...(formik.values.images || []), reader.result]);
      }
    };
    reader.readAsDataURL(files[0]);
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 1 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Section 1: Product Identification */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <Inventory fontSize="small" /> Product Identification
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth
                size="small"
                label="Barcode / Product Code (SKU)"
                name="id"
                required
                disabled={Boolean(product?.id)}
                value={formik.values.id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.id && Boolean(formik.errors.id)}
                helperText={formik.touched.id && formik.errors.id}
                placeholder="Scan barcode or enter unique SKU"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeScanner fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: !product?.id && (
                    <InputAdornment position="end">
                      <Tooltip title="Generate Random SKU">
                        <IconButton size="small" onClick={handleGenerateBarcode} edge="end">
                          <AutoAwesome fontSize="small" color="primary" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Product Category"
                name="category"
                required
                value={formik.values.category}
                onChange={formik.handleChange}
                error={formik.touched.category && Boolean(formik.errors.category)}
                helperText={formik.touched.category && formik.errors.category}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              >
                {categoriesList.map((cat) => (
                  <MenuItem key={cat.id || cat.name} value={cat.name || cat.id}>
                    {cat.name || cat.id}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Product Title / Name"
                name="name"
                required
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                placeholder="e.g. Premium Basmati Rice 5kg"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Product Description / Specs"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Key attributes, packaging size, or handling instructions"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Pricing, Cost & Margins */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
              <AttachMoney fontSize="small" /> Pricing & Profit Margins
            </Typography>
            {profitMargin && (
              <Chip
                icon={<TrendingUp />}
                label={`Margin: ${profitMargin.marginPercent}% (${profitMargin.profit >= 0 ? "+" : ""}${formatCurrency(profitMargin.profit)})`}
                color={profitMargin.isPositive ? "success" : "error"}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Retail Sale Price"
                name="unitPrice"
                required
                value={formik.values.unitPrice}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.unitPrice && Boolean(formik.errors.unitPrice)}
                helperText={formik.touched.unitPrice && formik.errors.unitPrice}
                inputProps={{ step: "any", min: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <strong style={{ fontSize: 13, color: "var(--text-secondary)" }}>{currencySymbol}</strong>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Supply / Cost Price"
                name="supplyPrice"
                value={formik.values.supplyPrice}
                onChange={formik.handleChange}
                inputProps={{ step: "any", min: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <strong style={{ fontSize: 13, color: "var(--text-secondary)" }}>{currencySymbol}</strong>
                    </InputAdornment>
                  ),
                }}
                helperText="Purchase cost basis"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Tax Per Unit"
                name="taxPerUnit"
                value={formik.values.taxPerUnit}
                onChange={formik.handleChange}
                inputProps={{ step: "any", min: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Percent fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                helperText="Fixed tax per unit"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3: Stock & Inventory Management */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <Inventory fontSize="small" /> Stock Control & Thresholds
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Units in Stock (Opening Balance)"
                name="unitsInStock"
                required={!product?.id}
                disabled={Boolean(product?.id)}
                value={formik.values.unitsInStock}
                onChange={formik.handleChange}
                inputProps={{ min: 0, step: 1 }}
                helperText={
                  product?.id
                    ? "Live stock is governed by Stock Adjustments & Purchase Orders"
                    : "Initial on-hand inventory count"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Low Stock Alert Threshold"
                name="minThreshold"
                value={formik.values.minThreshold}
                onChange={formik.handleChange}
                inputProps={{ min: 0, step: 1 }}
                helperText="Alert triggers when on-hand stock reaches this level"
              />
            </Grid>
            {product?.id && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ py: 0.5, fontSize: "12px" }}>
                  To adjust current stock on hand, use the <strong>Stock Movements & Adjustments</strong> tab or receive stock via <strong>Purchase Orders</strong>.
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Section 4: Supplier Details */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <LocalShipping fontSize="small" /> Preferred Supplier / Vendor
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Supplier"
            name="supplierId"
            value={formik.values.supplierId}
            onChange={formik.handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalShipping fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>None / General Vendor</em>
            </MenuItem>
            {suppliersList.map((sup) => (
              <MenuItem key={sup.id} value={sup.id}>
                {sup.name} {sup.phone ? `(${sup.phone})` : ""}
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        {/* Section 5: Product Media / Images */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "primary.main" }}>
            <ImageIcon fontSize="small" /> Product Images
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Paste Image URL..."
              value={imageInputUrl}
              onChange={(e) => setImageInputUrl(e.target.value)}
            />
            <Button variant="outlined" onClick={handleAddImageUrl} disabled={!imageInputUrl.trim()}>
              Add URL
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AddPhotoAlternate />}
            >
              Upload
              <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
            </Button>
          </Box>

          {formik.values.images && formik.values.images.length > 0 ? (
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {formik.values.images.map((imgUrl: string, idx: number) => (
                <Box
                  key={idx}
                  sx={{
                    position: "relative",
                    width: 90,
                    height: 90,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`Product ${idx + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveImage(idx)}
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      bgcolor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      "&:hover": { bgcolor: "error.main" },
                      p: 0.5,
                    }}
                  >
                    <Delete sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No images attached yet. Add an image URL or upload a thumbnail.
            </Typography>
          )}
        </Paper>

        {/* Action Controls */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1, pb: 2 }}>
          {onCancel && (
            <Button variant="outlined" color="inherit" onClick={onCancel} startIcon={<Close />}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={formik.isSubmitting}
            startIcon={<SaveIcon />}
            sx={{ px: 4, py: 1.2, fontWeight: 700 }}
          >
            {product?.id ? "Update Product Catalog" : "Save Product to Catalog"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default InventoryForm;
