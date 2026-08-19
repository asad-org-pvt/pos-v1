import { Register, CreateRegisterSchema, UpdateRegisterSchema } from "../../domain/models/Register";
import { registerRepository, RegisterRepository } from "../../repositories/RegisterRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";

export class RegisterService {
  constructor(private repo: RegisterRepository = registerRepository) {}

  async getRegisters(tenantId?: string, options?: QueryOptions): Promise<Register[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getActiveRegisters(tenantId?: string): Promise<Register[]> {
    return this.repo.getActiveRegisters(tenantId);
  }

  async getRegisterById(id: string, tenantId?: string): Promise<Register | null> {
    if (!id) throw new ValidationError("Register ID is required");
    return this.repo.getById(id, tenantId);
  }

  async createRegister(input: unknown, tenantId?: string): Promise<Register> {
    const parseResult = CreateRegisterSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Register validation failed: ${errorMsg}`, parseResult.error.format());
    }
    return this.repo.create(parseResult.data, tenantId);
  }

  async updateRegister(id: string, input: unknown, tenantId?: string): Promise<Register> {
    if (!id) throw new ValidationError("Register ID is required for update");
    const parseResult = UpdateRegisterSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Register update validation failed: ${errorMsg}`, parseResult.error.format());
    }
    return this.repo.update(id, parseResult.data, tenantId);
  }

  async deleteRegister(id: string, tenantId?: string): Promise<boolean> {
    if (!id) throw new ValidationError("Register ID is required for deletion");
    return this.repo.delete(id, tenantId);
  }
}

export const registerService = new RegisterService();
