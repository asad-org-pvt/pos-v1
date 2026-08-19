import { z } from "zod";

export const AuditActionEnum = z.enum([
  "SALE_COMPLETED",
  "SALE_FAILED",
  "PAYMENT_RECORDED",
  "SALE_VOIDED",
  "STOCK_UPDATED",
]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

export const AuditEventSchema = z.object({
  id: z.string().min(1, "Audit Event ID is required"),
  tenantId: z.string().default("default"),
  action: AuditActionEnum,
  entityId: z.string().min(1, "Entity ID is required"),
  entityType: z.enum(["ORDER", "PAYMENT", "PRODUCT"]),
  actorId: z.string().optional().default(""),
  actorName: z.string().optional().default(""),
  details: z.any().optional(),
  timestamp: z.string(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
