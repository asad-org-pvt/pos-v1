import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from "../domain/models/Employee";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";

export class EmployeeRepository extends FirestoreBaseRepository<Employee, CreateEmployeeInput, UpdateEmployeeInput> {
  constructor() {
    super("employees");
  }

  async findByEmail(email: string, tenantId?: string): Promise<Employee | null> {
    const list = await this.getAll(tenantId, {
      whereField: "email",
      whereOp: "==",
      whereValue: email,
      limit: 1,
    });
    return list.length > 0 ? list[0] : null;
  }
}

export const employeeRepository = new EmployeeRepository();
