import { supplierService } from "../../services/app/SupplierService";

// get Suppliers from inventory
export const getAllSuppliers = async () => {
  return await supplierService.getSuppliers();
};

// add Supplier in inventory
export const addOneSupplier = async (supplier: any) => {
  return await supplierService.createSupplier(supplier);
};

// delete Supplier api
export const deleteOneSupplier = async (id: string) => {
  return await supplierService.deleteSupplier(id);
};

// edit Supplier api
export const editSupplier = async (id: string, supplier: any) => {
  return await supplierService.updateSupplier(id, supplier);
};