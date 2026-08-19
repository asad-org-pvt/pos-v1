import { Return, ProcessReturnInput, ProcessReturnInputSchema } from "../../domain/models/Return";
import { returnRepository, ReturnRepository } from "../../repositories/ReturnRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";
import { addLog } from "../cloud/firebase/logging";

export class ReturnService {
  constructor(private repo: ReturnRepository = returnRepository) {}

  async getReturns(tenantId?: string, options?: QueryOptions): Promise<Return[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getReturnById(id: string, tenantId?: string): Promise<Return | null> {
    if (!id) throw new ValidationError("Return ID is required");
    return this.repo.getById(id, tenantId);
  }

  async getReturnsByOrderId(orderId: string, tenantId?: string): Promise<Return[]> {
    if (!orderId) throw new ValidationError("Order ID is required");
    return this.repo.getByOrderId(orderId, tenantId);
  }

  async processReturn(input: ProcessReturnInput, tenantId?: string): Promise<Return> {
    const parseResult = ProcessReturnInputSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Return validation failed: ${errorMsg}`, parseResult.error.format());
    }

    const returnRecord = await this.repo.processAtomicReturn(parseResult.data, tenantId);

    // Audit logging (non-blocking)
    addLog({
      message: `Return processed: Return #${returnRecord.returnInvoiceNumber} for Order #${returnRecord.originalInvoiceNumber} - Refund: ${returnRecord.refundTotal} (${returnRecord.refundMethod})`,
      type: "info",
      path: "ReturnService.processReturn",
    }).catch((err) => console.warn("Audit log failed", err));

    return returnRecord;
  }
}

export const returnService = new ReturnService();
