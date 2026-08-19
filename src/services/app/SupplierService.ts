import {
  Supplier,
  CreateSupplierSchema,
  UpdateSupplierSchema,
} from "../../domain/models/Supplier";
import { supplierRepository, SupplierRepository } from "../../repositories/SupplierRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";

export class SupplierService {
  constructor(private repo: SupplierRepository = supplierRepository) {}

  async getSuppliers(tenantId?: string, options?: QueryOptions): Promise<Supplier[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getSupplierById(id: string, tenantId?: string): Promise<Supplier | null> {
    if (!id) {
      throw new ValidationError("Supplier ID is required");
    }
    return this.repo.getById(id, tenantId);
  }

  async createSupplier(input: unknown, tenantId?: string): Promise<Supplier> {
    const parseResult = CreateSupplierSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Supplier validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.create(parseResult.data, tenantId);
  }

  async updateSupplier(id: string, input: unknown, tenantId?: string): Promise<Supplier> {
    if (!id) {
      throw new ValidationError("Supplier ID is required for update");
    }

    const parseResult = UpdateSupplierSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Supplier update validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.update(id, parseResult.data, tenantId);
  }

  async deactivateSupplier(id: string, tenantId?: string): Promise<Supplier> {
    if (!id) {
      throw new ValidationError("Supplier ID is required for deactivation");
    }
    return this.repo.update(id, { isActive: false, updatedAt: new Date().toISOString() }, tenantId);
  }

  async deleteSupplier(id: string, tenantId?: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError("Supplier ID is required for deletion");
    }
    return this.repo.delete(id, tenantId);
  }
}

export const supplierService = new SupplierService();
