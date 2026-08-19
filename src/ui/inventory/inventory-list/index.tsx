import React, { useMemo, useState } from "react";
import EditIcon from "../../../assets/component/EditIcon";
import RemoveIcon from "../../../assets/component/RemoveIcon";
import { Colors } from "../../common/colors";
import Table from "../../common/components/table";
import { useStylesFromThemeFunction } from "./InventoryList";
import toast from "react-hot-toast";
import { Modal } from "react-bootstrap";
import {
  getProductsFromInventory,
  editProductFromInventory,
  deleteProductFromInventory,
} from "../../../parser/inventory";
import InventoryForm from "../Inventory-form";
import BulkProductImportModal from "../bulk-import";
import { Box, Chip, TextField, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { Refresh, UploadFile } from "@mui/icons-material";
import { useSettings } from "../../../context/SettingsContext";

interface ComponentProps {
  products?: any[];
}

const InventoryList: React.FC<ComponentProps> = (props) => {
  const classes = useStylesFromThemeFunction();
  const { formatCurrency, organizationSettings } = useSettings();
  const [tableHeadings] = React.useState([
    "Barcode / ID",
    "Product Name",
    "Stock Status",
    "Units in Stock",
    "Sale Price",
    "Category",
    "Description",
    "Actions",
  ] as string[]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState({} as any);
  const [products, setProducts] = React.useState((props?.products as any[]) || []);
  const [showProductUpdateModal, setShowProductUpdateModal] = React.useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = React.useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProducts = () => {
    setIsLoading(true);
    getProductsFromInventory()
      .then((res) => {
        setProducts(res);
      })
      .catch(() => {
        toast.error("Failed to load inventory");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemoveProduct = async (product: any) => {
    if (window.confirm(`Are you sure you want to remove "${product.name}"?`)) {
      try {
        await deleteProductFromInventory(product.id);
        toast.success(`${product.name} removed successfully`);
        loadProducts();
      } catch (e: any) {
        toast.error(e.message || "Error while removing product");
      }
    }
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductUpdateModal(true);
  };

  const handleUpdate = (updatedProduct: any) => {
    editProductFromInventory(updatedProduct.id, updatedProduct)
      .then(() => {
        toast.success(`${updatedProduct.name} updated successfully`);
        setShowProductUpdateModal(false);
        setSelectedProduct({} as any);
        loadProducts();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating product");
      });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.unitsInStock) || 0;
      const minThreshold = Number(p.minThreshold) || 5;

      let matchesStatus = true;
      if (filterStatus === "OUT_OF_STOCK") {
        matchesStatus = stock === 0;
      } else if (filterStatus === "LOW_STOCK") {
        matchesStatus = stock > 0 && stock <= minThreshold;
      } else if (filterStatus === "IN_STOCK") {
        matchesStatus = stock > minThreshold;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [products, filterStatus, searchQuery]);

  const renderTableData = useMemo(() => {
    return filteredProducts?.map((product) => {
      const stock = Number(product.unitsInStock) || 0;
      const threshold =
        Number(product.minThreshold || product.lowStockThreshold) ||
        organizationSettings.lowStockThreshold ||
        5;

      let stockBadge = <Chip label="In Stock" color="success" size="small" />;
      if (stock === 0) {
        stockBadge = <Chip label="Out of Stock" color="error" size="small" />;
      } else if (stock <= threshold) {
        stockBadge = <Chip label={`Low Stock (≤${threshold})`} color="warning" size="small" />;
      }

      return (
        <tr key={product.id} onDoubleClick={() => handleEditProduct(product)}>
          <td><strong>{product.id}</strong></td>
          <td>{product.name}</td>
          <td>{stockBadge}</td>
          <td style={{ fontWeight: "bold" }}>{product.unitsInStock}</td>
          <td>{formatCurrency(product.unitPrice)}</td>
          <td>{product.category || "-"}</td>
          <td>{product.description || "-"}</td>
          <td>
            <Box className={classes.equallyDistantRow}>
              <Box
                className={classes.iconWrapper}
                onClick={() => handleEditProduct(product)}
                title="Edit Product"
              >
                <EditIcon fill={Colors.gray} />
              </Box>
              <Box
                className={classes.iconWrapper}
                onClick={() => handleRemoveProduct(product)}
                title="Delete Product"
              >
                <RemoveIcon fill={Colors.red} />
              </Box>
            </Box>
          </td>
        </tr>
      );
    });
  }, [filteredProducts, classes, formatCurrency, organizationSettings.lowStockThreshold]);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search by Name, Barcode, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 260 }}
          />
          <FormControl size="small" sx={{ width: 170 }}>
            <InputLabel>Stock Level</InputLabel>
            <Select
              value={filterStatus}
              label="Stock Level"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="ALL">All Products</MenuItem>
              <MenuItem value="LOW_STOCK">⚠️ Low Stock (≤ Min)</MenuItem>
              <MenuItem value="OUT_OF_STOCK">🚨 Out of Stock (= 0)</MenuItem>
              <MenuItem value="IN_STOCK">✅ Healthy Stock</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadFile />}
            onClick={() => setShowBulkImportModal(true)}
          >
            Import Products CSV
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadProducts} disabled={isLoading}>
            Refresh
          </Button>
        </Box>
      </Box>

      <Table
        tableHeadings={tableHeadings}
        renderBody={renderTableData}
        loading={isLoading}
      />

      <Modal
        className={classes.modalWrapper}
        show={showProductUpdateModal}
        onHide={() => setShowProductUpdateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Update {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Box className={classes.modalBodyWrapper}>
            <InventoryForm
              product={selectedProduct}
              onSubmit={handleUpdate}
              onCancel={() => setShowProductUpdateModal(false)}
            />
          </Box>
        </Modal.Body>
      </Modal>

      {/* Bulk Product CSV Import Modal */}
      <BulkProductImportModal
        show={showBulkImportModal}
        onHide={() => setShowBulkImportModal(false)}
        onSuccess={() => {
          loadProducts();
          setShowBulkImportModal(false);
        }}
      />
    </>
  );
};

export default InventoryList;
