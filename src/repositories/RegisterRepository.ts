import { Register, CreateRegisterInput, UpdateRegisterInput } from "../domain/models/Register";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import { collection, query, where, getDocs } from "firebase/firestore";

export class RegisterRepository extends FirestoreBaseRepository<Register, CreateRegisterInput, UpdateRegisterInput> {
  constructor() {
    super("registers");
  }

  async getActiveRegisters(tenantId?: string): Promise<Register[]> {
    try {
      const collName = this.getCollectionName(tenantId);
      const q = query(collection(this.getDb(), collName), where("status", "==", "ACTIVE"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => this.mapDoc(d));
    } catch (err) {
      this.handleError(err, "getActiveRegisters");
    }
  }
}

export const registerRepository = new RegisterRepository();
