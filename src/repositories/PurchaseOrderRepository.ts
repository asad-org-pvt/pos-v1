import { PurchaseOrder, CreatePurchaseOrderInput, UpdatePurchaseOrderInput, ReceivePoInput } from "../domain/models/PurchaseOrder";
import { StockMovement } from "../domain/models/StockMovement";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import { doc, runTransaction, getDocs, collection, query, where, orderBy } from "firebase/firestore";
import { ValidationError, NotFoundError } from "../domain/errors/AppError";

export class PurchaseOrderRepository extends FirestoreBaseRepository<
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput
> {
  constructor() {
    super("purchase_orders");
  }

  async getBySupplierId(supplierId: string, tenantId?: string): Promise<PurchaseOrder[]> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(
        collection(this.getDb(), collName),
        where("supplierId", "==", supplierId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => this.mapDoc(d));
    } catch (err) {
      this.handleError(err, "getBySupplierId");
    }
  }

  /**
   * Executes atomic PO receiving operation:
   * 1. Validates PO status and items
   * 2. Increases product stock & updates weighted-average cost basis
   * 3. Creates RESTOCK StockMovement records
   * 4. Updates PO items and overall status (PARTIALLY_RECEIVED or RECEIVED)
   */
  async receiveItemsAtomic(input: ReceivePoInput, tenantId?: string): Promise<PurchaseOrder> {
    const poCollection = this.getCollectionName(tenantId);
    const activeTenant = tenantId || (poCollection.includes("-") ? poCollection.split("-")[0] : "default");
    const productsCollection = activeTenant !== "default" ? `${activeTenant}-products` : "products";
    const movementsCollection = activeTenant !== "default" ? `${activeTenant}-stock_movements` : "stock_movements";

    const now = new Date().toISOString();

    return await runTransaction(this.getDb(), async (transaction) => {
      const poRef = doc(this.getDb(), poCollection, input.poId);
      const poSnap = await transaction.get(poRef);

      if (!poSnap.exists()) {
        throw new NotFoundError("PurchaseOrder", input.poId, {
          message: `Purchase Order ${input.poId} not found`,
        });
      }

      const po = poSnap.data() as PurchaseOrder;

      if (po.status === "CANCELLED") {
        throw new ValidationError("Cannot receive items against a CANCELLED purchase order.");
      }
      if (po.status === "RECEIVED") {
        throw new ValidationError("Purchase order has already been fully received.");
      }

      const updatedItems = [...po.items];
      const productUpdates: { docRef: any; newStock: number; newCostPrice: number; movement: StockMovement }[] = [];

      for (const reqItem of input.items) {
        const itemIdx = updatedItems.findIndex((item) => item.productId === reqItem.productId);
        if (itemIdx === -1) {
          throw new ValidationError(`Product ID "${reqItem.productId}" is not part of PO ${po.poNumber}.`);
        }

        const poItem = updatedItems[itemIdx];
        const ordered = Number(poItem.orderedQuantity) || 1;
        const alreadyReceived = Number(poItem.receivedQuantity) || 0;
        const remaining = ordered - alreadyReceived;
        const receivedNow = Number(reqItem.receivedNow);

        if (receivedNow <= 0) {
          throw new ValidationError(`Received quantity must be greater than 0 for "${poItem.name}".`);
        }

        if (receivedNow > remaining) {
          throw new ValidationError(
            `Cannot receive ${receivedNow} units of "${poItem.name}". Maximum remaining is ${remaining} (Ordered: ${ordered}, Already received: ${alreadyReceived}).`
          );
        }

        const unitCost = reqItem.unitCost !== undefined ? Number(reqItem.unitCost) : Number(poItem.unitCost) || 0;

        // Fetch product to update stock and cost basis
        const productRef = doc(this.getDb(), productsCollection, reqItem.productId);
        const productSnap = await transaction.get(productRef);

        let currentStock = 0;
        let currentCost = unitCost;
        let productName = poItem.name;

        if (productSnap.exists()) {
          const prodData = productSnap.data();
          currentStock = Number(prodData.unitsInStock) || 0;
          currentCost = Number(prodData.costPrice) || unitCost;
          productName = prodData.name || poItem.name;
        }

        const newStock = currentStock + receivedNow;

        // Weighted Average Cost calculation:
        // (currentStock * currentCost + receivedNow * unitCost) / newStock
        let newCostPrice = unitCost;
        if (currentStock > 0 && newStock > 0) {
          newCostPrice = Number(
            ((currentStock * currentCost + receivedNow * unitCost) / newStock).toFixed(2)
          );
        }

        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const movement: StockMovement = {
          id: movementId,
          tenantId: activeTenant,
          productId: reqItem.productId,
          productName,
          type: "RESTOCK",
          quantityDelta: receivedNow,
          quantityBefore: currentStock,
          quantityAfter: newStock,
          unitCost,
          reason: `PO Receiving #${po.poNumber}`,
          relatedPoId: po.id,
          relatedInvoiceNumber: po.poNumber,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          performedBy: input.receivedBy || "",
          performedByName: input.receivedByName || "Manager",
          timestamp: now,
          createdAt: now,
        };

        productUpdates.push({
          docRef: productRef,
          newStock,
          newCostPrice,
          movement,
        });

        // Update received quantity on PO item
        updatedItems[itemIdx] = {
          ...poItem,
          receivedQuantity: alreadyReceived + receivedNow,
        };
      }

      // Step 2: Apply product stock updates and create RESTOCK StockMovements
      for (const update of productUpdates) {
        transaction.update(update.docRef, {
          unitsInStock: update.newStock,
          costPrice: update.newCostPrice,
          status: "AVAILABLE",
          updatedAt: now,
        });

        const movRef = doc(this.getDb(), movementsCollection, update.movement.id);
        transaction.set(movRef, update.movement);
      }

      // Step 3: Determine overall PO status
      const allFullyReceived = updatedItems.every(
        (item) => (item.receivedQuantity || 0) >= item.orderedQuantity
      );
      const newStatus = allFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";

      const updatedPo: PurchaseOrder = {
        ...po,
        items: updatedItems,
        status: newStatus,
        receivedAt: now,
        updatedAt: now,
      };

      transaction.update(poRef, updatedPo);
      return updatedPo;
    });
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
