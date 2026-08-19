import { customerService } from "../../services/app/CustomerService";

// get Customers from inventory
export const getAllCustomers = async () => {
  return await customerService.getCustomers();
};

// add Customer in inventory
export const addOneCustomer = async (customer: any) => {
  return await customerService.createCustomer(customer);
};

// delete Customer api
export const deleteOneCustomer = async (id: string) => {
  return await customerService.deleteCustomer(id);
};

// edit Customer api
export const editCustomer = async (id: string, customer: any) => {
  return await customerService.updateCustomer(id, customer);
};