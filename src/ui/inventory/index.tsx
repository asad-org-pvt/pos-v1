import React, { useEffect, useState } from "react";
import AddNewInventory from "./add-new-inventory";
import InventoryList from "./inventory-list";
import StockMovementsView from "./stock-movements";
import InventoryDashboard from "./inventory-dashboard";
import { ComponentProps } from "./Inventory";
import ListLayout from "../app-layout/list-layout";
import { TypeProductStatus } from "../../redux/store/store.types";
import { addProductIntoInventory } from "../../parser/inventory";
import toast from "react-hot-toast";
import { addLog } from "../../services/cloud/firebase/logging";
import { Box, Tabs, Tab } from "@mui/material";

const Inventory: React.FC<ComponentProps> = () => {
  const [closeDrawer, setCloseDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTimeout(() => {
      if (closeDrawer) {
        setCloseDrawer(false);
      }
    }, 200);
  }, [closeDrawer]);

  const onAddProduct = async (values: any) => {
    const productPayload = {
      ...values,
      status:
        values.unitsInStock > 0
          ? TypeProductStatus.AVAILABLE
          : TypeProductStatus.OUT_OF_STOCK,
      createdAt: new Date().getTime().toString(),
      updatedAt: new Date().getTime().toString(),
    };
    addProductIntoInventory(productPayload)
      .then(() => {
        toast.success(`${values.name} added successfully`);
        setCloseDrawer(true);
      })
      .catch((e) => {
        toast.error(e.message || "Error while adding product");
        addLog({
          message: e.message || "Error while adding product",
          type: "error",
          path: "inventory/add-new-inventory",
        });
      });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1, bgcolor: "background.paper" }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="📊 Inventory Dashboard" />
          <Tab label="📦 Products Catalog" />
          <Tab label="📋 Stock Movements & Adjustments" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <InventoryDashboard
          onOpenAdjustModal={() => setActiveTab(2)}
          onNavigateToCatalog={() => setActiveTab(1)}
        />
      )}

      {activeTab === 1 && (
        <ListLayout
          title="inventory"
          drawerComponent={<AddNewInventory onSubmit={onAddProduct} />}
          listComponent={<InventoryList />}
          closeDrawer={closeDrawer}
        />
      )}

      {activeTab === 2 && <StockMovementsView />}
    </Box>
  );
};

export default Inventory;
