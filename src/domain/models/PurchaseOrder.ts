import { z } from "zod";

export const PurchaseOrderStatusEnum = z.enum([
  "DRAFT",
  "ORDERED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>;

export const PurchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Item name is required"),
  sku: z.string().optional().default(""),
  orderedQuantity: z.coerce.number().int().min(1, "Ordered quantity must be at least 1"),
  receivedQuantity: z.coerce.number().int().min(0).default(0),
  unitCost: z.coerce.number().min(0, "Unit cost must be non-negative"),
  totalCost: z.coerce.number().min(0, "Total cost must be non-negative"),
});
export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;

export const PurchaseOrderSchema = z.object({
  id: z.string().min(1, "PO ID is required"),
  tenantId: z.string().default("default"),
  poNumber: z.string().min(1, "PO Number is required"),
  supplierId: z.string().min(1, "Supplier ID is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  status: PurchaseOrderStatusEnum.default("DRAFT"),
  items: z.array(PurchaseOrderItemSchema).min(1, "At least one item is required"),
  subtotal: z.coerce.number().min(0),
  tax: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  createdBy: z.string().optional().default(""),
  createdByName: z.string().optional().default("Manager"),
  notes: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  receivedAt: z.string().optional(),
});

export const CreatePurchaseOrderSchema = PurchaseOrderSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdatePurchaseOrderSchema = PurchaseOrderSchema.partial().omit({ id: true });

export const ReceivePoInputSchema = z.object({
  poId: z.string().min(1, "Purchase Order ID is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        receivedNow: z.coerce.number().int().min(1, "Received quantity must be at least 1"),
        unitCost: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, "Select at least one item to receive"),
  receivedBy: z.string().optional(),
  receivedByName: z.string().optional(),
  notes: z.string().optional().default(""),
});

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema>;
export type ReceivePoInput = z.infer<typeof ReceivePoInputSchema>;
