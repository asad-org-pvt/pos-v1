import { Shift, OpenShiftInput, CloseShiftInput } from "../domain/models/Shift";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import { collection, query, where, getDocs, doc, runTransaction } from "firebase/firestore";
import { ValidationError, NotFoundError } from "../domain/errors/AppError";

export class ShiftRepository extends FirestoreBaseRepository<Shift, OpenShiftInput, any> {
  constructor() {
    super("shifts");
  }

  async findActiveShiftByRegister(registerId: string, tenantId?: string): Promise<Shift | null> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(
        collection(this.getDb(), collName),
        where("registerId", "==", registerId),
        where("status", "==", "OPEN")
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return this.mapDoc(snap.docs[0]);
    } catch (err) {
      this.handleError(err, "findActiveShiftByRegister");
    }
  }

  async findActiveShiftByCashier(cashierId: string, tenantId?: string): Promise<Shift | null> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(
        collection(this.getDb(), collName),
        where("cashierId", "==", cashierId),
        where("status", "==", "OPEN")
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return this.mapDoc(snap.docs[0]);
    } catch (err) {
      this.handleError(err, "findActiveShiftByCashier");
    }
  }

  /**
   * Atomically opens a shift on a register, locking the register to prevent race conditions.
   */
  async openShift(data: OpenShiftInput, tenantId?: string): Promise<Shift> {
    const collName = this.getCollectionName(tenantId);
    const activeTenant = tenantId || (collName.includes("-") ? collName.split("-")[0] : "default");
    const registersColl = `${activeTenant}-registers`;
    const registerDocRef = doc(this.getDb(), registersColl, data.registerId);
    const shiftId = data.id || `shift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const shiftDocRef = doc(this.getDb(), collName, shiftId);
    const now = new Date().toISOString();

    const shiftPayload: Shift = {
      id: shiftId,
      tenantId: activeTenant,
      registerId: data.registerId,
      registerName: data.registerName || "Main Register",
      cashierId: data.cashierId,
      cashierName: data.cashierName,
      openedAt: now,
      openingFloat: Number(data.openingFloat) || 0,
      status: "OPEN",
      closingCash: 0,
      expectedCash: Number(data.openingFloat) || 0,
      cashDifference: 0,
      cashSales: 0,
      cardSales: 0,
      otherSales: 0,
      cashRefunds: 0,
      cardRefunds: 0,
      totalSales: 0,
      totalRefunds: 0,
      totalTransactions: 0,
      notes: data.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    return await runTransaction(this.getDb(), async (transaction) => {
      // PHASE 1: READS
      const regSnap = await transaction.get(registerDocRef);
      if (regSnap.exists()) {
        const regData = regSnap.data();
        if (regData.activeShiftId) {
          const activeShiftRef = doc(this.getDb(), collName, regData.activeShiftId);
          const activeShiftSnap = await transaction.get(activeShiftRef);
          if (activeShiftSnap.exists() && activeShiftSnap.data()?.status === "OPEN") {
            const activeShift = activeShiftSnap.data() as Shift;
            throw new ValidationError(
              `Register "${data.registerName || data.registerId}" is already occupied by active shift ${activeShift.id} (Cashier: ${activeShift.cashierName}). Close active shift first.`
            );
          }
        }
      }

      // PHASE 2: WRITES
      transaction.set(shiftDocRef, shiftPayload);

      if (regSnap.exists()) {
        transaction.update(registerDocRef, {
          activeShiftId: shiftId,
          currentCashierId: data.cashierId,
          currentCashierName: data.cashierName,
          status: "OCCUPIED",
          updatedAt: now,
        });
      } else {
        transaction.set(
          registerDocRef,
          {
            id: data.registerId,
            name: data.registerName || "Main Register",
            activeShiftId: shiftId,
            currentCashierId: data.cashierId,
            currentCashierName: data.cashierName,
            status: "OCCUPIED",
            createdAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
      }

      return shiftPayload;
    });
  }

  /**
   * Atomically closes a shift and releases the register lock.
   */
  async closeShift(shiftId: string, closingData: CloseShiftInput, tenantId?: string): Promise<Shift> {
    const collName = this.getCollectionName(tenantId);
    const activeTenant = tenantId || (collName.includes("-") ? collName.split("-")[0] : "default");
    const shiftRef = doc(this.getDb(), collName, shiftId);
    const now = new Date().toISOString();

    return await runTransaction(this.getDb(), async (transaction) => {
      const snap = await transaction.get(shiftRef);
      if (!snap.exists()) {
        throw new NotFoundError("Shift", shiftId, { message: `Shift ${shiftId} not found` });
      }

      const current = snap.data() as Shift;
      if (current.status !== "OPEN") {
        throw new ValidationError(`Shift ${shiftId} is already ${current.status}. Duplicate close prevented.`);
      }

      const registersColl = `${activeTenant}-registers`;
      const registerDocRef = current.registerId ? doc(this.getDb(), registersColl, current.registerId) : null;
      let regSnap = null;
      if (registerDocRef) {
        regSnap = await transaction.get(registerDocRef);
      }

      const openingFloat = Number(current.openingFloat) || 0;
      const cashSales = Number(current.cashSales) || 0;
      const cashRefunds = Number(current.cashRefunds) || 0;
      const expectedCash = Number((openingFloat + cashSales - cashRefunds).toFixed(2));
      const countedCash = Number(closingData.closingCash);
      const cashDifference = Number((countedCash - expectedCash).toFixed(2));

      const updatedShift: Shift = {
        ...current,
        status: "CLOSED",
        closedAt: now,
        closingCash: countedCash,
        expectedCash,
        cashDifference,
        notes: closingData.notes ? `${current.notes || ""} | Close notes: ${closingData.notes}` : current.notes,
        updatedAt: now,
      };

      transaction.update(shiftRef, updatedShift);

      if (registerDocRef && regSnap && regSnap.exists()) {
        transaction.update(registerDocRef, {
          activeShiftId: null,
          currentCashierId: null,
          currentCashierName: null,
          status: "AVAILABLE",
          updatedAt: now,
        });
      }

      return updatedShift;
    });
  }
}

export const shiftRepository = new ShiftRepository();
