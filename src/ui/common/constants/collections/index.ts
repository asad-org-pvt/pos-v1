import { getRuntimeTenantId } from "../../../../context/tenantRuntime";

/**
 * Dynamic collection name and path resolvers.
 * These evaluate at call time, preventing stale module-initialization capture.
 */

export const ORGANISATIONS_COLLECTION = "organisations";
export const ADMINS_COLLECTION = "admins";

export const getTenantOrg = (): string => {
  return getRuntimeTenantId() || localStorage.getItem("org") || "default";
};

export const getEmployeesCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-employees` : "employees";
};

export const getCustomersCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-customers` : "customers";
};

export const getProductsCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-products` : "products";
};

export const getOrdersCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-orders` : "orders";
};

export const getSuppliersCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-suppliers` : "suppliers";
};

export const getCategoriesCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-categories` : "categories";
};

export const getStoresCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-stores` : "stores";
};

export const getLogsCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-logs` : "logs";
};

export const getTownsCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-towns` : "towns";
};

export const getAreasCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-areas` : "areas";
};

export const getSalesRoutesCollection = (org = getTenantOrg()): string => {
  return org && org !== "default" ? `${org}-sales-routes` : "sales-routes";
};

export const SUB_CATEGORIES_COLLECTION = {
  EMPLOYEES: "categories_employees",
  CUSTOMERS: "categories_customers",
  PRODUCTS: "categories_products",
  ORDERS: "categories_orders",
  SUPPLIERS: "categories_suppliers",
};

// Legacy getter proxies for backward compatibility
export const EMPLOYEES_COLLECTION = getEmployeesCollection();
export const CUSTOMERS_COLLECTION = getCustomersCollection();
export const PRODUCTS_COLLECTION = getProductsCollection();
export const ORDERS_COLLECTION = getOrdersCollection();
export const SUPPLIERS_COLLECTION = getSuppliersCollection();
export const CATEGORIES_COLLECTION = getCategoriesCollection();
export const STORES_COLLECTION = getStoresCollection();
export const LOGS_COLLECTION = getLogsCollection();
export const TOWNS_COLLECTION = getTownsCollection();
export const AREAS_COLLECTION = getAreasCollection();
export const SALES_ROUTES_COLLECTION = getSalesRoutesCollection();
