import { StockMovement, CreateStockMovementSchema } from "../../domain/models/StockMovement";
import { InventoryAdjustmentInput, InventoryAdjustmentSchema } from "../../domain/models/InventoryAdjustment";
import { stockMovementRepository, StockMovementRepository } from "../../repositories/StockMovementRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";
import { addLog } from "../cloud/firebase/logging";

export class StockMovementService {
  constructor(private repo: StockMovementRepository = stockMovementRepository) {}

  async getMovements(tenantId?: string, options?: QueryOptions): Promise<StockMovement[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getMovementsByProductId(productId: string, tenantId?: string): Promise<StockMovement[]> {
    if (!productId) throw new ValidationError("Product ID is required");
    return this.repo.getByProductId(productId, tenantId);
  }

  async getMovementsByOrderId(orderId: string, tenantId?: string): Promise<StockMovement[]> {
    if (!orderId) throw new ValidationError("Order ID is required");
    return this.repo.getByOrderId(orderId, tenantId);
  }

  async recordMovement(input: unknown, tenantId?: string): Promise<StockMovement> {
    const parseResult = CreateStockMovementSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Stock movement validation failed: ${errorMsg}`, parseResult.error.format());
    }
    return this.repo.create(parseResult.data, tenantId);
  }

  async adjustStock(input: InventoryAdjustmentInput, tenantId?: string): Promise<StockMovement> {
    const parseResult = InventoryAdjustmentSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Stock adjustment validation failed: ${errorMsg}`, parseResult.error.format());
    }

    const movement = await this.repo.adjustStockAtomic(parseResult.data, tenantId);

    // Audit log (non-blocking)
    addLog({
      message: `Stock adjusted: ${movement.productName} (${movement.quantityDelta > 0 ? "+" : ""}${movement.quantityDelta}) - Reason: ${movement.reason}`,
      type: "info",
      path: "StockMovementService.adjustStock",
    }).catch((err) => console.warn("Audit log failed", err));

    return movement;
  }
}

export const stockMovementService = new StockMovementService();
