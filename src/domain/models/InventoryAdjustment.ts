import { z } from "zod";

export const AdjustmentReasonEnum = z.enum([
  "DAMAGE",
  "SPOILAGE",
  "SHRINKAGE",
  "COUNT_CORRECTION",
  "OTHER",
]);
export type AdjustmentReason = z.infer<typeof AdjustmentReasonEnum>;

export const InventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantityDelta: z.coerce.number().refine((val) => val !== 0, "Quantity delta cannot be zero"),
  reason: AdjustmentReasonEnum.default("COUNT_CORRECTION"),
  notes: z.string().optional().default(""),
  performedBy: z.string().optional().default(""),
  performedByName: z.string().optional().default("Manager"),
});

export type InventoryAdjustmentInput = z.infer<typeof InventoryAdjustmentSchema>;
