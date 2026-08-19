import { productService } from "../../services/app/ProductService";
import { doc } from "firebase/firestore";
import { firebaseFirestore } from "../../services";
import { getProductsCollection } from "../../ui/common/constants/collections";

// get products from inventory
export const getProductsFromInventory = async () => {
  const products = await productService.getProducts();
  const db = firebaseFirestore.getInstance();
  const collName = getProductsCollection();
  return products.map((product) => ({
    ...product,
    ref: doc(db, collName, product.id),
  }));
};

// get products from inventory
export const getProductByIdFromInventory = async (docId: string) => {
  return await productService.getProductById(docId);
};

export const getProductRefByIdFromInventory = async (docId: string) => {
  const db = firebaseFirestore.getInstance();
  const collName = getProductsCollection();
  return doc(db, collName, docId);
};

export const getProductRefByIdFromInventoryByFirebaseInstance = async (
  docId: string,
  _firebaseInstance?: any
) => {
  return getProductRefByIdFromInventory(docId);
};

// add product in inventory
export const addProductIntoInventory = async (product: any) => {
  return await productService.createProduct(product);
};

// delete product api
export const deleteProductFromInventory = async (id: string) => {
  return await productService.deleteProduct(id);
};

// edit product api
export const editProductFromInventory = async (id: string, product: any) => {
  return await productService.updateProduct(id, product);
};
