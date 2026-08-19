import { z } from "zod";
import { PaymentMethodEnum } from "./Payment";

export const ReturnItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().min(1, "Returned quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  refundAmount: z.coerce.number().min(0, "Refund amount must be non-negative"),
});
export type ReturnItem = z.infer<typeof ReturnItemSchema>;

export const ReturnSchema = z.object({
  id: z.string().min(1, "Return ID is required"),
  tenantId: z.string().default("default"),
  originalOrderId: z.string().min(1, "Original order ID is required"),
  originalInvoiceNumber: z.string().min(1, "Original invoice number is required"),
  returnInvoiceNumber: z.string().min(1, "Return invoice number is required"),
  items: z.array(ReturnItemSchema).min(1, "At least one item must be returned"),
  refundSubtotal: z.coerce.number().min(0),
  refundTax: z.coerce.number().min(0).default(0),
  refundTotal: z.coerce.number().min(0),
  refundMethod: PaymentMethodEnum.default("CASH"),
  reason: z.string().optional().default("Customer Return"),
  cashierId: z.string().optional().default(""),
  cashierName: z.string().optional().default(""),
  registerId: z.string().optional().default(""),
  shiftId: z.string().optional().default(""),
  createdAt: z.string().optional(),
});

export const ProcessReturnInputSchema = z.object({
  orderId: z.string().min(1, "Original order ID is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.coerce.number().int().min(1, "Quantity to return must be at least 1"),
      })
    )
    .min(1, "Select at least one item to return"),
  refundMethod: PaymentMethodEnum.default("CASH"),
  reason: z.string().optional().default("Customer Return"),
  cashierId: z.string().optional(),
  cashierName: z.string().optional(),
  registerId: z.string().optional(),
  shiftId: z.string().optional(),
});

export type Return = z.infer<typeof ReturnSchema>;
export type ProcessReturnInput = z.infer<typeof ProcessReturnInputSchema>;
