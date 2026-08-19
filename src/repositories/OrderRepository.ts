import { doc, runTransaction, getDocs, collection, query, where, orderBy, limit } from "firebase/firestore";
import { Order, CreateOrderInput, UpdateOrderInput } from "../domain/models/Order";
import { Payment } from "../domain/models/Payment";
import { StockMovement } from "../domain/models/StockMovement";
import { Shift } from "../domain/models/Shift";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import { ValidationError, NotFoundError } from "../domain/errors/AppError";

export class OrderRepository extends FirestoreBaseRepository<Order, CreateOrderInput, UpdateOrderInput> {
  constructor() {
    super("orders");
  }

  /**
   * Looks up an order by its idempotency key within the tenant collection.
   */
  async findByIdempotencyKey(idempotencyKey: string, tenantId?: string): Promise<Order | null> {
    if (!idempotencyKey) return null;
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(
        collection(this.getDb(), collName),
        where("idempotencyKey", "==", idempotencyKey),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return this.mapDoc(snap.docs[0]);
    } catch (err) {
      console.warn("Could not check idempotency key in database", err);
      return null;
    }
  }

  /**
   * Bounded query for retrieving orders within a date range (prevents unbounded memory dumps).
   */
  async getByDateRange(startDateIso: string, endDateIso: string, tenantId?: string): Promise<Order[]> {
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
      // Fallback for collections where compound index is pending
      const all = await this.getAll(tenantId);
      const start = new Date(startDateIso).getTime();
      const end = new Date(endDateIso).getTime();
      return all.filter((o) => {
        const time = new Date(o.createdAt || o.dateTime || 0).getTime();
        return time >= start && time <= end;
      });
    }
  }

  /**
   * Completes a sale atomically inside a single Firestore transaction:
   * 1. READS ALL REQUIRED DOCUMENTS FIRST (products, shift, idempotency lock).
   * 2. Checks idempotency inside the lock.
   * 3. Validates inventory levels and captures historical cost snapshots.
   * 4. WRITES ALL UPDATES (product stock decrements, SALE movements, Order, Payment, Shift stats, Idempotency lock).
   */
  async completeSale(orderData: CreateOrderInput, tenantId?: string): Promise<Order> {
    const ordersCollection = this.getCollectionName(tenantId);
    const activeTenant = tenantId || (ordersCollection.includes("-") ? ordersCollection.split("-")[0] : "default");
    const productsCollection = activeTenant !== "default" ? `${activeTenant}-products` : "products";
    const paymentsCollection = activeTenant !== "default" ? `${activeTenant}-payments` : "payments";
    const movementsCollection = activeTenant !== "default" ? `${activeTenant}-stock_movements` : "stock_movements";
    const shiftsCollection = activeTenant !== "default" ? `${activeTenant}-shifts` : "shifts";
    const idempCollection = activeTenant !== "default" ? `${activeTenant}-idempotency` : "idempotency";

    const generatedOrderId = orderData.id || `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const incomingPayments =
      (orderData as any).payments && Array.isArray((orderData as any).payments) && (orderData as any).payments.length > 0
        ? (orderData as any).payments
        : [
            {
              method: orderData.paymentMethod || "CASH",
              amount: orderData.amountPaid || orderData.amountDue || orderData.total,
              amountTendered: (orderData as any).amountTendered || orderData.amountPaid || orderData.total,
              change: orderData.change || 0,
              reference: (orderData as any).paymentReference || "",
            },
          ];

    const paymentRecords: Payment[] = incomingPayments.map((p: any, idx: number) => {
      const pId = `pay-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: pId,
        orderId: generatedOrderId,
        invoiceNumber: orderData.invoiceNumber,
        tenantId: activeTenant,
        amount: Number(p.amount) || 0,
        amountTendered: p.amountTendered !== undefined ? Number(p.amountTendered) : Number(p.amount) || 0,
        change: Number(p.change) || 0,
        method: p.method || "CASH",
        status: "COMPLETED",
        reference: p.reference || (orderData as any).paymentReference || "",
        recordedBy: orderData.employeeId || "",
        recordedByName: orderData.employeeName || "",
        createdAt: now,
        updatedAt: now,
      };
    });

    try {
      return await runTransaction(this.getDb(), async (transaction) => {
        // =========================================================================
        // PHASE 1: READ ALL DOCUMENTS STRICTLY BEFORE ANY WRITES
        // =========================================================================

        // Read 1: Idempotency Key Lock (if provided)
        let existingOrderId: string | null = null;
        let idempDocRef: any = null;
        if (orderData.idempotencyKey) {
          idempDocRef = doc(this.getDb(), idempCollection, orderData.idempotencyKey);
          const idempSnap = await transaction.get(idempDocRef);
          if (idempSnap.exists()) {
            existingOrderId = idempSnap.data()?.orderId;
          }
        }

        if (existingOrderId) {
          const existingOrderRef = doc(this.getDb(), ordersCollection, existingOrderId);
          const existingOrderSnap = await transaction.get(existingOrderRef);
          if (existingOrderSnap.exists()) {
            return existingOrderSnap.data() as Order;
          }
        }

        // Read 2: Read all product documents
        const productSnapshots: { item: any; productRef: any; snap: any }[] = [];
        for (const item of orderData.products) {
          const productId = item.productId || item.id;
          if (!productId) continue;

          const productDocRef = doc(this.getDb(), productsCollection, productId);
          const productSnap = await transaction.get(productDocRef);
          productSnapshots.push({ item, productRef: productDocRef, snap: productSnap });
        }

        // Read 3: Read Shift document (STRICTLY IN READ PHASE)
        let shiftRef: any = null;
        let shiftSnap: any = null;
        if (orderData.shiftId) {
          shiftRef = doc(this.getDb(), shiftsCollection, orderData.shiftId);
          shiftSnap = await transaction.get(shiftRef);
        }

        // =========================================================================
        // PHASE 2: IN-MEMORY VALIDATIONS & DATA PREPARATION
        // =========================================================================

        const productUpdates: { docRef: any; newStock: number; status: string; movement: StockMovement }[] = [];
        const enrichedProducts = [...orderData.products];

        for (let i = 0; i < productSnapshots.length; i++) {
          const { item, productRef, snap } = productSnapshots[i];
          const productId = item.productId || item.id;

          if (!snap.exists()) {
            throw new NotFoundError("Product", productId, {
              message: `Product "${item.name}" (${productId}) not found in inventory`,
            });
          }

          const productData = snap.data();
          const currentStock = Number(productData.unitsInStock) || 0;
          const currentCost = Number(productData.costPrice) || 0;
          const requestedQty = Number(item.quantity) || 1;

          if (requestedQty <= 0) {
            throw new ValidationError(`Invalid quantity for "${item.name}": must be greater than 0`);
          }

          if (currentStock < requestedQty) {
            throw new ValidationError(
              `Insufficient stock for "${item.name}". Current in stock: ${currentStock}, Requested: ${requestedQty}`
            );
          }

          const newStock = currentStock - requestedQty;
          const status = newStock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
          const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

          // Enrich OrderItem with immutable historical cost & economics snapshot
          enrichedProducts[i] = {
            ...item,
            unitCost: currentCost,
            lineSubtotal: Number((Number(item.unitPrice) * requestedQty).toFixed(2)),
            lineTotal: Number((Number(item.unitPrice) * requestedQty).toFixed(2)),
          };

          const movement: StockMovement = {
            id: movementId,
            tenantId: activeTenant,
            productId,
            productName: item.name,
            type: "SALE",
            quantityDelta: -requestedQty,
            quantityBefore: currentStock,
            quantityAfter: newStock,
            unitCost: currentCost,
            reason: "POS Sale Checkout",
            relatedOrderId: generatedOrderId,
            relatedInvoiceNumber: orderData.invoiceNumber,
            performedBy: orderData.employeeId || "",
            performedByName: orderData.employeeName || "Cashier",
            timestamp: now,
            createdAt: now,
          };

          productUpdates.push({
            docRef: productRef,
            newStock,
            status,
            movement,
          });
        }

        const orderPayload: Order = {
          ...orderData,
          id: generatedOrderId,
          tenantId: activeTenant,
          status: orderData.status || "COMPLETED",
          products: enrichedProducts,
          payments: paymentRecords,
          createdAt: now,
          updatedAt: now,
        };

        // Prepare Shift update data if applicable with per-tender totals
        let shiftUpdateData: any = null;
        if (shiftSnap && shiftSnap.exists()) {
          const shiftData = shiftSnap.data() as Shift;
          if (shiftData.status === "OPEN") {
            let shiftCashDelta = 0;
            let shiftCardDelta = 0;
            let shiftOtherDelta = 0;

            for (const p of paymentRecords) {
              if (p.method === "CASH") {
                shiftCashDelta += p.amount;
              } else if (p.method === "CARD") {
                shiftCardDelta += p.amount;
              } else {
                shiftOtherDelta += p.amount;
              }
            }

            const cashSales = Number(((shiftData.cashSales || 0) + shiftCashDelta).toFixed(2));
            const cardSales = Number(((shiftData.cardSales || 0) + shiftCardDelta).toFixed(2));
            const otherSales = Number(((shiftData.otherSales || 0) + shiftOtherDelta).toFixed(2));
            const saleAmount = orderData.amountPaid || orderData.amountDue || orderData.total;
            const totalSales = Number(((shiftData.totalSales || 0) + saleAmount).toFixed(2));
            const totalTransactions = (shiftData.totalTransactions || 0) + 1;
            const cashRefunds = Number(shiftData.cashRefunds) || 0;
            const expectedCash = Number(((shiftData.openingFloat || 0) + cashSales - cashRefunds).toFixed(2));

            shiftUpdateData = {
              cashSales,
              cardSales,
              otherSales,
              totalSales,
              totalTransactions,
              expectedCash,
              updatedAt: now,
            };
          }
        }

        // =========================================================================
        // PHASE 3: EXECUTE ALL WRITES (NO MORE READS PERMITTED)
        // =========================================================================

        // Write 1: Update Product Stock & create StockMovements
        for (const update of productUpdates) {
          transaction.update(update.docRef, {
            unitsInStock: update.newStock,
            status: update.status,
            updatedAt: now,
          });

          const movementDocRef = doc(this.getDb(), movementsCollection, update.movement.id);
          transaction.set(movementDocRef, update.movement);
        }

        // Write 2: Persist Order
        const orderDocRef = doc(this.getDb(), ordersCollection, generatedOrderId);
        transaction.set(orderDocRef, orderPayload);

        // Write 3: Persist All Payment Records
        for (const pRec of paymentRecords) {
          const paymentDocRef = doc(this.getDb(), paymentsCollection, pRec.id);
          transaction.set(paymentDocRef, pRec);
        }

        // Write 4: Persist Idempotency Lock
        if (idempDocRef) {
          transaction.set(idempDocRef, {
            idempotencyKey: orderData.idempotencyKey,
            orderId: generatedOrderId,
            tenantId: activeTenant,
            createdAt: now,
          });
        }

        // Write 5: Update Shift
        if (shiftRef && shiftUpdateData) {
          transaction.update(shiftRef, shiftUpdateData);
        }

        return orderPayload;
      });
    } catch (err) {
      this.handleError(err, "completeSale");
    }
  }

  /**
   * For backward compatibility with existing tests and calls.
   */
  async createOrderWithStockUpdate(orderData: CreateOrderInput, tenantId?: string): Promise<Order> {
    return this.completeSale(orderData, tenantId);
  }
}

export const orderRepository = new OrderRepository();
