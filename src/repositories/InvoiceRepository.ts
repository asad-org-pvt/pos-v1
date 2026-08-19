import { ref, get, set } from "firebase/database";
import { firebaseDatabase } from "../services";
import { getRuntimeTenantId } from "../context/tenantRuntime";
import { PersistenceError } from "../domain/errors/AppError";

export class InvoiceRepository {
  private getDb() {
    return firebaseDatabase.getInstance();
  }

  async getLastInvoiceNumber(tenantId?: string): Promise<string> {
    try {
      const activeTenant = tenantId || getRuntimeTenantId();
      const path = activeTenant && activeTenant !== "default" ? `invoices/${activeTenant}/lastInvoiceId` : "lastInvoiceId";
      const snap = await get(ref(this.getDb(), path));
      const val = snap.val();
      return typeof val === "string" ? val : "AAA0000000";
    } catch (err) {
      console.warn("Unable to fetch last invoice number from RTDB, using default", err);
      return "AAA0000000";
    }
  }

  async setLastInvoiceNumber(invoiceNumber: string, tenantId?: string): Promise<void> {
    try {
      const activeTenant = tenantId || getRuntimeTenantId();
      const path = activeTenant && activeTenant !== "default" ? `invoices/${activeTenant}/lastInvoiceId` : "lastInvoiceId";
      await set(ref(this.getDb(), path), invoiceNumber);
    } catch (err) {
      console.error("Failed to persist last invoice number", err);
      throw new PersistenceError("Failed to persist last invoice number", { original: err });
    }
  }
}

export const invoiceRepository = new InvoiceRepository();
