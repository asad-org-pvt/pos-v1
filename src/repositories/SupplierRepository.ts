import { Supplier, CreateSupplierInput, UpdateSupplierInput } from "../domain/models/Supplier";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";

export class SupplierRepository extends FirestoreBaseRepository<Supplier, CreateSupplierInput, UpdateSupplierInput> {
  constructor() {
    super("suppliers");
  }
}

export const supplierRepository = new SupplierRepository();
