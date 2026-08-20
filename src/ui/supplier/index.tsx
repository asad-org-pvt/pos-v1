import React from "react";
import toast from "react-hot-toast";
import { addOneSupplier } from "../../parser/supplier";
import { Box, Button } from "@mui/material";
import { AddBusiness, ArrowBack } from "@mui/icons-material";
import SupplierForm from "./supplier-form";
import SupplierList from "./supplier-list";

const Supplier = () => {
  const [showSupplierList, setShowSupplierList] = React.useState(true);
  const handleAddNewClick = () => {
    setShowSupplierList(!showSupplierList);
  };

  const onSubmitSupplier = (values: any, { resetForm }: any) => {
    addOneSupplier(values)
      .then(() => {
        toast.success(`${values.name} added successfully`);
        resetForm();
        setShowSupplierList(true);
      })
      .catch((err) => {
        toast.error(err.message || "Something went wrong with adding Supplier");
      });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={showSupplierList ? <AddBusiness /> : <ArrowBack />}
          onClick={handleAddNewClick}
          sx={{ borderRadius: 2, fontWeight: "bold" }}
        >
          {showSupplierList ? "Add New Supplier" : "Back to List"}
        </Button>
      </Box>
      {showSupplierList ? (
        <SupplierList onAddSupplierClick={handleAddNewClick} />
      ) : (
        <SupplierForm onSubmit={onSubmitSupplier} />
      )}
    </Box>
  );
};

export default Supplier;