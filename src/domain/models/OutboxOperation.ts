import { z } from "zod";
import { CreateOrderSchema } from "./Order";

export const OutboxOperationTypeEnum = z.enum(["CHECKOUT_SALE", "CUSTOMER_RETURN"]);
export type OutboxOperationType = z.infer<typeof OutboxOperationTypeEnum>;

export const OutboxStatusEnum = z.enum([
  "PENDING_SYNC",
  "SYNCING",
  "SYNCED",
  "FAILED",
  "BLOCKED",
  "CONFLICT",
]);
export type OutboxStatus = z.infer<typeof OutboxStatusEnum>;

export const OutboxOperationSchema = z.object({
  operationId: z.string().min(1, "Operation ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().optional().default(""),
  operationType: OutboxOperationTypeEnum.default("CHECKOUT_SALE"),
  schemaVersion: z.number().default(1),
  createdAt: z.string().default(() => new Date().toISOString()),
  payload: z.record(z.any()).or(z.any()),
  status: OutboxStatusEnum.default("PENDING_SYNC"),
  attemptCount: z.number().default(0),
  maxRetries: z.number().default(5),
  lastAttemptAt: z.string().optional(),
  nextRetryAt: z.string().optional(),
  lastError: z.string().optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  localInvoiceNumber: z.string().min(1, "Local invoice number is required"),
  affectedProductIds: z.array(z.string()).default([]),
  conflictReason: z.string().optional(),
  syncedAt: z.string().optional(),
  syncedOrderId: z.string().optional(),
});

export type OutboxOperation = z.infer<typeof OutboxOperationSchema>;

export type CreateOutboxOperationInput = {
  tenantId: string;
  userId: string;
  userName?: string;
  operationType?: OutboxOperationType;
  payload: any;
  localInvoiceNumber: string;
  affectedProductIds?: string[];
  idempotencyKey?: string;
};
