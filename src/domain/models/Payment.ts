import { z } from "zod";

export const PaymentMethodEnum = z.enum(["CASH", "CARD", "OTHER"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "COMPLETED",
  "FAILED",
  "VOIDED",
  "REFUNDED",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const PaymentSchema = z.object({
  id: z.string().min(1, "Payment ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  tenantId: z.string().default("default"),
  amount: z.coerce.number().min(0, "Payment amount must be non-negative"),
  amountTendered: z.coerce.number().min(0, "Amount tendered must be non-negative").default(0),
  change: z.coerce.number().min(0, "Change must be non-negative").default(0),
  method: PaymentMethodEnum.default("CASH"),
  status: PaymentStatusEnum.default("COMPLETED"),
  reference: z.string().optional().default(""),
  recordedBy: z.string().optional().default(""),
  recordedByName: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreatePaymentSchema = PaymentSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
  orderId: z.string().optional(),
  invoiceNumber: z.string().optional(),
});

export const UpdatePaymentSchema = PaymentSchema.partial().omit({ id: true });

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
