import { StockMovement, CreateStockMovementInput } from "../domain/models/StockMovement";
import { InventoryAdjustmentInput } from "../domain/models/InventoryAdjustment";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import { collection, query, where, getDocs, orderBy, doc, runTransaction } from "firebase/firestore";
import { ValidationError, NotFoundError } from "../domain/errors/AppError";

export class StockMovementRepository extends FirestoreBaseRepository<StockMovement, CreateStockMovementInput, any> {
  constructor() {
    super("stock_movements");
  }

  /**
   * Append-only rule: Modifying historical stock movements is strictly prohibited.
   */
  async update(): Promise<StockMovement> {
    throw new ValidationError("Stock movement ledger is append-only and historical records cannot be modified.");
  }

  /**
   * Append-only rule: Deleting historical stock movements is strictly prohibited.
   */
  async delete(): Promise<boolean> {
    throw new ValidationError("Stock movement ledger is append-only and historical records cannot be deleted.");
  }

  async getByProductId(productId: string, tenantId?: string): Promise<StockMovement[]> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(
        collection(this.getDb(), collName),
        where("productId", "==", productId),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => this.mapDoc(d));
    } catch (err) {
      this.handleError(err, "getByProductId");
    }
  }

  async getByOrderId(orderId: string, tenantId?: string): Promise<StockMovement[]> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(
        collection(this.getDb(), collName),
        where("relatedOrderId", "==", orderId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => this.mapDoc(d));
    } catch (err) {
      this.handleError(err, "getByOrderId");
    }
  }

  /**
   * Executes atomic inventory adjustment:
   * 1. Validates product existence and resulting non-negative stock
   * 2. Updates product unitsInStock
   * 3. Creates immutable ADJUSTMENT StockMovement
   */
  async adjustStockAtomic(input: InventoryAdjustmentInput, tenantId?: string): Promise<StockMovement> {
    const movementsCollection = this.getCollectionName(tenantId);
    const activeTenant = tenantId || (movementsCollection.includes("-") ? movementsCollection.split("-")[0] : "default");
    const productsCollection = activeTenant !== "default" ? `${activeTenant}-products` : "products";

    const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    return await runTransaction(this.getDb(), async (transaction) => {
      const productRef = doc(this.getDb(), productsCollection, input.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new NotFoundError("Product", input.productId, {
          message: `Product ${input.productId} not found for stock adjustment`,
        });
      }

      const product = productSnap.data();
      const currentStock = Number(product.unitsInStock) || 0;
      const delta = Number(input.quantityDelta);

      if (delta === 0) {
        throw new ValidationError("Adjustment quantity delta cannot be zero.");
      }

      const newStock = currentStock + delta;
      if (newStock < 0) {
        throw new ValidationError(
          `Cannot adjust stock below zero. Current stock: ${currentStock}, adjustment requested: ${delta} (Result would be: ${newStock}).`
        );
      }

      const newStatus = newStock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";

      // 1. Update Product
      transaction.update(productRef, {
        unitsInStock: newStock,
        status: newStatus,
        updatedAt: now,
      });

      // 2. Write ADJUSTMENT StockMovement
      const movement: StockMovement = {
        id: movementId,
        tenantId: activeTenant,
        productId: input.productId,
        productName: product.name || "Product",
        type: "ADJUSTMENT",
        quantityDelta: delta,
        quantityBefore: currentStock,
        quantityAfter: newStock,
        unitCost: product.costPrice || 0,
        reason: `${input.reason}${input.notes ? `: ${input.notes}` : ""}`,
        performedBy: input.performedBy || "",
        performedByName: input.performedByName || "Manager",
        timestamp: now,
        createdAt: now,
      };

      const movRef = doc(this.getDb(), movementsCollection, movementId);
      transaction.set(movRef, movement);

      return movement;
    });
  }
}

export const stockMovementRepository = new StockMovementRepository();
