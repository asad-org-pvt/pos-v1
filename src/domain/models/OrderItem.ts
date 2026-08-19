import { z } from "zod";

export const OrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  unitCost: z.coerce.number().min(0).default(0).optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  total: z.coerce.number().min(0, "Total must be non-negative"),
  lineSubtotal: z.coerce.number().min(0).optional(),
  lineTotal: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).default(0).optional(),
  taxAmount: z.coerce.number().min(0).default(0).optional(),
  discountAmount: z.coerce.number().min(0).default(0).optional(),
  category: z.string().optional().default(""),
  unitsInStock: z.coerce.number().optional(),
  returnedQuantity: z.coerce.number().int().min(0).default(0).optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;
