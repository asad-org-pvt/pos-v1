import React from "react";
import { ComponentProps } from "./Orders";
// import "boxicons";
import OrderList from "./order-list";
import ListLayout from "../app-layout/list-layout";

import { Box } from "@mui/material";

const Order: React.FC<ComponentProps> = () => {
  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box", overflowX: "hidden" }}>
      <ListLayout
        title="orders"
        listComponent={<OrderList />}
        closeDrawer={false}
      />
    </Box>
  );
};

export default Order;
