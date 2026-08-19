import { doc, writeBatch } from "firebase/firestore";
import { Product, CreateProductInput, UpdateProductInput } from "../domain/models/Product";
import { StockMovement } from "../domain/models/StockMovement";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";

export class ProductRepository extends FirestoreBaseRepository<Product, CreateProductInput, UpdateProductInput> {
  constructor() {
    super("products");
  }

  /**
   * Creates a new product. If initial stock is greater than 0, atomically creates
   * an OPENING_BALANCE StockMovement ledger entry to maintain mathematical integrity.
   */
  async create(data: CreateProductInput, tenantId?: string): Promise<Product> {
    const collName = this.getCollectionName(tenantId);
    const activeTenant = tenantId || (collName.includes("-") ? collName.split("-")[0] : "default");
    const productId = data.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const initialStock = Number(data.unitsInStock) || 0;
    const productPayload: Product = {
      ...data,
      id: productId,
      tenantId: activeTenant,
      unitsInStock: initialStock,
      status: initialStock > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
      createdAt: now,
      updatedAt: now,
    };

    if (initialStock <= 0) {
      return super.create(productPayload, tenantId);
    }

    // Atomically write Product and opening StockMovement
    const batch = writeBatch(this.getDb());
    const prodDocRef = doc(this.getDb(), collName, productId);
    batch.set(prodDocRef, productPayload);

    const movementsColl = `${activeTenant}-stock_movements`;
    const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const movDocRef = doc(this.getDb(), movementsColl, movementId);

    const openingMovement: StockMovement = {
      id: movementId,
      tenantId: activeTenant,
      productId,
      productName: data.name,
      type: "ADJUSTMENT",
      quantityDelta: initialStock,
      quantityBefore: 0,
      quantityAfter: initialStock,
      reason: "OPENING_BALANCE",
      unitCost: Number(data.costPrice) || 0,
      performedBy: "SYSTEM",
      performedByName: "Product Creation",
      timestamp: now,
      createdAt: now,
    };

    batch.set(movDocRef, openingMovement);
    await batch.commit();

    return productPayload;
  }
}

export const productRepository = new ProductRepository();
