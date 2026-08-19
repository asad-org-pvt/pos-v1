import { createAction } from "@reduxjs/toolkit";
import { Dispatch } from "redux";
import { productService } from "../../services/app/ProductService";

// Define action types
export const fetchProducts = createAction("fetch/productsRequest");
export const fetchProductsSuccess = createAction<any>("fetch/productsSuccess");
export const fetchProductsFailure = createAction<string>(
  "fetch/productsFailure"
);

// Async action creator
export const fetchProductList = (tenantId?: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(fetchProducts());

    try {
      const productsList = await productService.getProducts(tenantId);
      dispatch(fetchProductsSuccess(productsList));
    } catch (error: any) {
      dispatch(fetchProductsFailure(error?.message || "Failed to fetch products"));
    }
  };
};
