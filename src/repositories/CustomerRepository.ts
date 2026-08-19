import { Customer, CreateCustomerInput, UpdateCustomerInput } from "../domain/models/Customer";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";

export class CustomerRepository extends FirestoreBaseRepository<Customer, CreateCustomerInput, UpdateCustomerInput> {
  constructor() {
    super("customers");
  }
}

export const customerRepository = new CustomerRepository();
