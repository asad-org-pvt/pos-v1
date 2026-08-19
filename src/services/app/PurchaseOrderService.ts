import {
  PurchaseOrder,
  CreatePurchaseOrderSchema,
  ReceivePoInput,
  ReceivePoInputSchema,
} from "../../domain/models/PurchaseOrder";
import { purchaseOrderRepository, PurchaseOrderRepository } from "../../repositories/PurchaseOrderRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";
import { addLog } from "../cloud/firebase/logging";

export class PurchaseOrderService {
  constructor(private repo: PurchaseOrderRepository = purchaseOrderRepository) {}

  async getPurchaseOrders(tenantId?: string, options?: QueryOptions): Promise<PurchaseOrder[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getPurchaseOrderById(id: string, tenantId?: string): Promise<PurchaseOrder | null> {
    if (!id) throw new ValidationError("Purchase Order ID is required");
    return this.repo.getById(id, tenantId);
  }

  async createPurchaseOrder(input: any, tenantId?: string): Promise<PurchaseOrder> {
    // 1. Calculate line totals and subtotal
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      throw new ValidationError("At least one product item is required for a Purchase Order.");
    }

    let subtotal = 0;
    const validatedItems = input.items.map((item: any) => {
      const qty = Number(item.orderedQuantity);
      const cost = Number(item.unitCost);

      if (isNaN(qty) || qty <= 0) {
        throw new ValidationError(`Invalid ordered quantity for item "${item.name}": must be >= 1`);
      }
      if (isNaN(cost) || cost < 0) {
        throw new ValidationError(`Invalid unit cost for item "${item.name}": cannot be negative`);
      }

      const totalCost = Number((qty * cost).toFixed(2));
      subtotal += totalCost;

      return {
        productId: item.productId,
        name: item.name,
        sku: item.sku || "",
        orderedQuantity: qty,
        receivedQuantity: 0,
        unitCost: cost,
        totalCost,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    const tax = input.tax !== undefined ? Number(input.tax) : 0;
    const total = Number((subtotal + tax).toFixed(2));

    const poNumber = input.poNumber || `PO-${Date.now().toString().slice(-6)}`;

    const poPayload = {
      ...input,
      poNumber,
      items: validatedItems,
      subtotal,
      tax,
      total,
      status: input.status || "ORDERED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parseResult = CreatePurchaseOrderSchema.safeParse(poPayload);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Purchase Order validation failed: ${errorMsg}`, parseResult.error.format());
    }

    const created = await this.repo.create(parseResult.data, tenantId);

    // Audit log (non-blocking)
    addLog({
      message: `Purchase Order created: ${created.poNumber} for Supplier "${created.supplierName}" - Total: $${created.total}`,
      type: "info",
      path: "PurchaseOrderService.createPurchaseOrder",
    }).catch((err) => console.warn("Audit log failed", err));

    return created;
  }

  async receiveItems(input: ReceivePoInput, tenantId?: string): Promise<PurchaseOrder> {
    const parseResult = ReceivePoInputSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`PO Receiving validation failed: ${errorMsg}`, parseResult.error.format());
    }

    const updatedPo = await this.repo.receiveItemsAtomic(parseResult.data, tenantId);

    // Audit log (non-blocking)
    addLog({
      message: `Items received for PO ${updatedPo.poNumber} - Status: ${updatedPo.status}`,
      type: "info",
      path: "PurchaseOrderService.receiveItems",
    }).catch((err) => console.warn("Audit log failed", err));

    return updatedPo;
  }

  async cancelPurchaseOrder(id: string, tenantId?: string): Promise<PurchaseOrder> {
    if (!id) throw new ValidationError("Purchase Order ID is required for cancellation");
    const po = await this.getPurchaseOrderById(id, tenantId);
    if (!po) throw new ValidationError(`Purchase order ${id} not found.`);

    if (po.status === "RECEIVED" || po.status === "PARTIALLY_RECEIVED") {
      throw new ValidationError("Cannot cancel a purchase order that has already been partially or fully received.");
    }

    return this.repo.update(id, { status: "CANCELLED", updatedAt: new Date().toISOString() }, tenantId);
  }
}

export const purchaseOrderService = new PurchaseOrderService();
