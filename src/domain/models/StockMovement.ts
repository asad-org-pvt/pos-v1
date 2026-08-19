import { z } from "zod";

export const StockMovementTypeEnum = z.enum([
  "SALE",
  "RETURN",
  "RESTOCK",
  "ADJUSTMENT",
]);
export type StockMovementType = z.infer<typeof StockMovementTypeEnum>;

export const StockMovementSchema = z.object({
  id: z.string().min(1, "Movement ID is required"),
  tenantId: z.string().default("default"),
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  type: StockMovementTypeEnum,
  quantityDelta: z.coerce.number(), // Negative for SALE/loss, positive for RETURN/RESTOCK
  quantityBefore: z.coerce.number().min(0),
  quantityAfter: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0).optional(),
  reason: z.string().optional().default(""),
  relatedOrderId: z.string().optional(),
  relatedReturnId: z.string().optional(),
  relatedPoId: z.string().optional(),
  relatedInvoiceNumber: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  performedBy: z.string().optional().default(""),
  performedByName: z.string().optional().default(""),
  timestamp: z.string(),
  createdAt: z.string().optional(),
});

export const CreateStockMovementSchema = StockMovementSchema.omit({ id: true, createdAt: true }).extend({
  id: z.string().optional(),
});

export type StockMovement = z.infer<typeof StockMovementSchema>;
export type CreateStockMovementInput = z.infer<typeof CreateStockMovementSchema>;
