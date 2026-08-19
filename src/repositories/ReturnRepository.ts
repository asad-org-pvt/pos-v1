import { Return, ProcessReturnInput, ReturnItem } from "../domain/models/Return";
import { Order } from "../domain/models/Order";
import { StockMovement } from "../domain/models/StockMovement";
import { Shift } from "../domain/models/Shift";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import { doc, runTransaction, getDocs, collection, query, where, orderBy } from "firebase/firestore";
import { ValidationError, NotFoundError } from "../domain/errors/AppError";
import { settingsRepository } from "./SettingsRepository";

export class ReturnRepository extends FirestoreBaseRepository<Return, any, any> {
  constructor() {
    super("returns");
  }

  async getByOrderId(orderId: string, tenantId?: string): Promise<Return[]> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(collection(this.getDb(), collName), where("originalOrderId", "==", orderId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => this.mapDoc(d));
    } catch (err) {
      this.handleError(err, "getByOrderId");
    }
  }

  /**
   * Bounded query for retrieving return records within a date range.
   */
  async getByDateRange(startDateIso: string, endDateIso: string, tenantId?: string): Promise<Return[]> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(
        collection(this.getDb(), collName),
        where("createdAt", ">=", startDateIso),
        where("createdAt", "<=", endDateIso),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => this.mapDoc(d));
    } catch (err) {
      // Fallback in case composite index is building
      const all = await this.getAll(tenantId);
      const start = new Date(startDateIso).getTime();
      const end = new Date(endDateIso).getTime();
      return all.filter((r) => {
        const time = new Date(r.createdAt || 0).getTime();
        return time >= start && time <= end;
      });
    }
  }

  /**
   * Executes atomic return transaction:
   * 1. READS ALL REQUIRED DOCUMENTS STRICTLY FIRST (Order, Products, Shift).
   * 2. Validates return quantities against remaining refundable count.
   * 3. WRITES ALL UPDATES (Product Stock Restore, RETURN Movements, Order status, Shift reconciliation, Return Record).
   */
  async processAtomicReturn(input: ProcessReturnInput, tenantId?: string): Promise<Return> {
    const returnsCollection = this.getCollectionName(tenantId);
    const activeTenant = tenantId || (returnsCollection.includes("-") ? returnsCollection.split("-")[0] : "default");
    const ordersCollection = activeTenant !== "default" ? `${activeTenant}-orders` : "orders";
    const productsCollection = activeTenant !== "default" ? `${activeTenant}-products` : "products";
    const movementsCollection = activeTenant !== "default" ? `${activeTenant}-stock_movements` : "stock_movements";
    const shiftsCollection = activeTenant !== "default" ? `${activeTenant}-shifts` : "shifts";

    const returnId = `ret-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    return await runTransaction(this.getDb(), async (transaction) => {
      // =========================================================================
      // PHASE 1: READ ALL DOCUMENTS STRICTLY BEFORE ANY WRITES
      // =========================================================================

      // Read 1: Original Order
      const orderRef = doc(this.getDb(), ordersCollection, input.orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new NotFoundError("Order", input.orderId, {
          message: `Original order ${input.orderId} not found`,
        });
      }

      const order = orderSnap.data() as Order;

      if (order.status !== "COMPLETED" && order.status !== "PARTIALLY_REFUNDED" && order.status !== "CONFIRMED") {
        throw new ValidationError(
          `Cannot process return for order with status "${order.status}". Only completed sales can be returned.`
        );
      }

      // Check return policy window
      if (order.dateTime) {
        const orderTime = new Date(order.dateTime).getTime();
        if (!isNaN(orderTime)) {
          const orgSettings = await settingsRepository.getOrganizationSettings(activeTenant);
          const windowDays = orgSettings.returnWindowDays !== undefined ? orgSettings.returnWindowDays : 30;
          const elapsedDays = (Date.now() - orderTime) / (1000 * 60 * 60 * 24);
          if (elapsedDays > windowDays) {
            throw new ValidationError(
              `Return window of ${windowDays} days has expired for order ${order.invoiceNumber || input.orderId}.`
            );
          }
        }
      }

      // Read 2: Read Product documents for each returned item
      const productSnapshots: { reqItem: any; productRef: any; snap: any }[] = [];
      for (const reqItem of input.items) {
        const productRef = doc(this.getDb(), productsCollection, reqItem.productId);
        const productSnap = await transaction.get(productRef);
        productSnapshots.push({ reqItem, productRef, snap: productSnap });
      }

      // Read 3: Read Shift document (STRICTLY IN READ PHASE)
      let shiftRef: any = null;
      let shiftSnap: any = null;
      if (input.shiftId) {
        shiftRef = doc(this.getDb(), shiftsCollection, input.shiftId);
        shiftSnap = await transaction.get(shiftRef);
      }

      // =========================================================================
      // PHASE 2: IN-MEMORY VALIDATIONS & PREPARATION
      // =========================================================================

      let totalRefund = 0;
      const validatedReturnItems: ReturnItem[] = [];
      const updatedOrderProducts = [...order.products];

      for (const reqItem of input.items) {
        const productIndex = updatedOrderProducts.findIndex(
          (p) => p.productId === reqItem.productId || p.id === reqItem.productId
        );

        if (productIndex === -1) {
          throw new ValidationError(`Item "${reqItem.productId}" was not part of the original order.`);
        }

        const orderItem = updatedOrderProducts[productIndex];
        const soldQty = Number(orderItem.quantity) || 1;
        const alreadyReturned = Number(orderItem.returnedQuantity) || 0;
        const remainingRefundable = soldQty - alreadyReturned;
        const requestedQty = Number(reqItem.quantity);

        if (requestedQty <= 0) {
          throw new ValidationError(`Invalid return quantity (${requestedQty}) for item "${orderItem.name}".`);
        }

        if (requestedQty > remainingRefundable) {
          throw new ValidationError(
            `Cannot return ${requestedQty} units of "${orderItem.name}". Maximum refundable is ${remainingRefundable} (Sold: ${soldQty}, Already returned: ${alreadyReturned}).`
          );
        }

        const unitRefundPrice = Number((orderItem.total / soldQty).toFixed(2));
        const itemRefundTotal = Number((unitRefundPrice * requestedQty).toFixed(2));
        totalRefund += itemRefundTotal;

        validatedReturnItems.push({
          productId: reqItem.productId,
          name: orderItem.name,
          quantity: requestedQty,
          unitPrice: orderItem.unitPrice,
          refundAmount: itemRefundTotal,
        });

        // Update returned quantity on item
        updatedOrderProducts[productIndex] = {
          ...orderItem,
          returnedQuantity: alreadyReturned + requestedQty,
        };
      }

      totalRefund = Number(totalRefund.toFixed(2));

      // Prepare product stock increments and StockMovements
      const productUpdates: { docRef: any; newStock: number; movement: StockMovement }[] = [];

      for (let i = 0; i < productSnapshots.length; i++) {
        const { reqItem, productRef, snap } = productSnapshots[i];
        let currentStock = 0;
        let productName = reqItem.name || "Product";
        let unitCost = 0;

        if (snap.exists()) {
          const prodData = snap.data();
          currentStock = Number(prodData.unitsInStock) || 0;
          productName = prodData.name || productName;
          unitCost = Number(prodData.costPrice) || 0;
        }

        const newStock = currentStock + Number(reqItem.quantity);
        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const movement: StockMovement = {
          id: movementId,
          tenantId: activeTenant,
          productId: reqItem.productId,
          productName,
          type: "RETURN",
          quantityDelta: Number(reqItem.quantity),
          quantityBefore: currentStock,
          quantityAfter: newStock,
          unitCost,
          reason: input.reason || "Customer Return",
          relatedOrderId: order.id,
          relatedReturnId: returnId,
          relatedInvoiceNumber: order.invoiceNumber,
          performedBy: input.cashierId || "",
          performedByName: input.cashierName || "Cashier",
          timestamp: now,
          createdAt: now,
        };

        productUpdates.push({
          docRef: productRef,
          newStock,
          movement,
        });
      }

      // Determine order refund status
      const allFullyReturned = updatedOrderProducts.every(
        (p) => (p.returnedQuantity || 0) >= p.quantity
      );
      const newOrderStatus = allFullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED";
      const updatedRefundedAmount = Number(((order.refundedAmount || 0) + totalRefund).toFixed(2));

      // Prepare Shift update data if applicable
      let shiftUpdateData: any = null;
      if (shiftSnap && shiftSnap.exists()) {
        const shiftData = shiftSnap.data() as Shift;
        if (shiftData.status === "OPEN") {
          const isCash = input.refundMethod === "CASH";
          const cashRefunds = Number(((shiftData.cashRefunds || 0) + (isCash ? totalRefund : 0)).toFixed(2));
          const cardRefunds = Number(((shiftData.cardRefunds || 0) + (!isCash ? totalRefund : 0)).toFixed(2));
          const totalRefunds = Number(((shiftData.totalRefunds || 0) + totalRefund).toFixed(2));
          const expectedCash = Number(((shiftData.openingFloat || 0) + (shiftData.cashSales || 0) - cashRefunds).toFixed(2));

          shiftUpdateData = {
            cashRefunds,
            cardRefunds,
            totalRefunds,
            expectedCash,
            updatedAt: now,
          };
        }
      }

      const returnRecord: Return = {
        id: returnId,
        tenantId: activeTenant,
        originalOrderId: order.id,
        originalInvoiceNumber: order.invoiceNumber,
        returnInvoiceNumber: `RET-${order.invoiceNumber}-${Date.now().toString().slice(-4)}`,
        items: validatedReturnItems,
        refundSubtotal: totalRefund,
        refundTax: 0,
        refundTotal: totalRefund,
        refundMethod: input.refundMethod || "CASH",
        reason: input.reason || "Customer Return",
        cashierId: input.cashierId || "",
        cashierName: input.cashierName || "Cashier",
        registerId: input.registerId || "",
        shiftId: input.shiftId || "",
        createdAt: now,
      };

      // =========================================================================
      // PHASE 3: EXECUTE ALL WRITES (NO MORE READS PERMITTED)
      // =========================================================================

      // Write 1: Update Product Stock & create StockMovements
      for (const update of productUpdates) {
        transaction.update(update.docRef, {
          unitsInStock: update.newStock,
          status: "AVAILABLE",
          updatedAt: now,
        });

        const movDocRef = doc(this.getDb(), movementsCollection, update.movement.id);
        transaction.set(movDocRef, update.movement);
      }

      // Write 2: Update Order
      transaction.update(orderRef, {
        products: updatedOrderProducts,
        status: newOrderStatus,
        refundedAmount: updatedRefundedAmount,
        updatedAt: now,
      });

      // Write 3: Update Shift
      if (shiftRef && shiftUpdateData) {
        transaction.update(shiftRef, shiftUpdateData);
      }

      // Write 4: Persist Return Document
      const returnDocRef = doc(this.getDb(), returnsCollection, returnId);
      transaction.set(returnDocRef, returnRecord);

      // Write 5: Persist Compensating Refund Payment Record
      const paymentsCollection = this.getScopedCollection("payments", tenantId);
      const refundPaymentId = `pay-refund-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const refundPaymentDocRef = doc(this.getDb(), paymentsCollection, refundPaymentId);
      transaction.set(refundPaymentDocRef, {
        id: refundPaymentId,
        orderId: order.id,
        invoiceNumber: order.invoiceNumber,
        tenantId: activeTenant,
        amount: totalRefund,
        amountTendered: totalRefund,
        change: 0,
        method: input.refundMethod || order.paymentMethod || "CASH",
        status: "REFUNDED",
        reference: `RETURN-${returnId}`,
        recordedBy: input.cashierId || "CASHIER",
        recordedByName: input.cashierName || "Cashier",
        createdAt: now,
        updatedAt: now,
      });

      return returnRecord;
    });
  }
}

export const returnRepository = new ReturnRepository();
