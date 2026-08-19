import { z } from "zod";
import { OrderItemSchema } from "./OrderItem";
import { PaymentSchema, CreatePaymentSchema, PaymentMethodEnum } from "./Payment";

export const OrderStatusEnum = z.enum([
  "DRAFT",
  "PENDING",
  "COMPLETED",
  "VOIDED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  // Legacy status support for existing records
  "DRAFTED",
  "CONFIRMED",
  "IN_PROCESS",
  "DELIVERED",
  "CANCELLED",
  "NOT_RESPONDED",
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderTypeEnum = z.enum(["SALES", "PURCHASE"]);
export type OrderType = z.infer<typeof OrderTypeEnum>;

export const OrderSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  idempotencyKey: z.string().optional(),
  tenantId: z.string().default("default"),
  registerId: z.string().optional().default(""),
  shiftId: z.string().optional().default(""),
  products: z.array(OrderItemSchema).min(1, "At least one product is required"),
  subtotal: z.coerce.number().min(0, "Subtotal must be non-negative"),
  tax: z.coerce.number().min(0, "Tax must be non-negative"),
  taxRate: z.coerce.number().min(0).default(0.05),
  discount: z.coerce.number().min(0, "Discount must be non-negative").default(0),
  discountRate: z.coerce.number().min(0).default(0.02),
  specialDiscount: z.coerce.number().min(0).default(0).optional(),
  total: z.coerce.number().min(0, "Total must be non-negative"),
  amountPaid: z.coerce.number().min(0, "Amount paid must be non-negative").default(0),
  amountDue: z.coerce.number().min(0, "Amount due must be non-negative").default(0),
  change: z.coerce.number().min(0, "Change must be non-negative").default(0),
  refundedAmount: z.coerce.number().min(0).default(0).optional(),
  customerId: z.string().optional().default(""),
  customerName: z.string().optional().default("Walk-in Customer"),
  customerPhone: z.string().optional().default(""),
  customerEmail: z.string().optional().default(""),
  employeeId: z.string().optional().default(""),
  employeeName: z.string().optional().default(""),
  status: OrderStatusEnum.default("COMPLETED"),
  type: OrderTypeEnum.default("SALES"),
  paymentMethod: PaymentMethodEnum.default("CASH"),
  payments: z.array(PaymentSchema).optional().default([]),
  dateTime: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateOrderSchema = OrderSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
  payments: z.array(CreatePaymentSchema).optional().default([]),
});

export const UpdateOrderSchema = OrderSchema.partial().omit({ id: true });

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
