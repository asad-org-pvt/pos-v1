import {
  Employee,
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
} from "../../domain/models/Employee";
import { employeeRepository, EmployeeRepository } from "../../repositories/EmployeeRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";

export class EmployeeService {
  constructor(private repo: EmployeeRepository = employeeRepository) {}

  async getEmployees(tenantId?: string, options?: QueryOptions): Promise<Employee[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getEmployeeById(id: string, tenantId?: string): Promise<Employee | null> {
    if (!id) {
      throw new ValidationError("Employee ID is required");
    }
    return this.repo.getById(id, tenantId);
  }

  async findByEmail(email: string, tenantId?: string): Promise<Employee | null> {
    if (!email) return null;
    return this.repo.findByEmail(email, tenantId);
  }

  async createEmployee(input: unknown, tenantId?: string): Promise<Employee> {
    const parseResult = CreateEmployeeSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Employee validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.create(parseResult.data, tenantId);
  }

  async updateEmployee(id: string, input: unknown, tenantId?: string): Promise<Employee> {
    if (!id) {
      throw new ValidationError("Employee ID is required for update");
    }

    const parseResult = UpdateEmployeeSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Employee update validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.update(id, parseResult.data, tenantId);
  }

  async deleteEmployee(id: string, tenantId?: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError("Employee ID is required for deletion");
    }
    return this.repo.delete(id, tenantId);
  }
}

export const employeeService = new EmployeeService();
