import { z } from "zod";

export const ShiftStatusEnum = z.enum(["OPEN", "CLOSED", "CANCELLED"]);
export type ShiftStatus = z.infer<typeof ShiftStatusEnum>;

export const ShiftSchema = z.object({
  id: z.string().min(1, "Shift ID is required"),
  tenantId: z.string().default("default"),
  registerId: z.string().min(1, "Register ID is required"),
  registerName: z.string().optional().default("Main Register"),
  cashierId: z.string().min(1, "Cashier ID is required"),
  cashierName: z.string().min(1, "Cashier name is required"),
  openedAt: z.string(),
  closedAt: z.string().optional(),
  openingFloat: z.coerce.number().min(0, "Opening float must be non-negative").default(0),
  status: ShiftStatusEnum.default("OPEN"),
  closingCash: z.coerce.number().optional().default(0),
  expectedCash: z.coerce.number().optional().default(0),
  cashDifference: z.coerce.number().optional().default(0),
  cashSales: z.coerce.number().optional().default(0),
  cardSales: z.coerce.number().optional().default(0),
  otherSales: z.coerce.number().optional().default(0),
  cashRefunds: z.coerce.number().optional().default(0),
  cardRefunds: z.coerce.number().optional().default(0),
  totalSales: z.coerce.number().optional().default(0),
  totalRefunds: z.coerce.number().optional().default(0),
  totalTransactions: z.coerce.number().int().optional().default(0),
  notes: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const OpenShiftSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().default("default"),
  registerId: z.string().min(1, "Register ID is required"),
  registerName: z.string().optional().default("Main Register"),
  cashierId: z.string().min(1, "Cashier ID is required"),
  cashierName: z.string().min(1, "Cashier name is required"),
  openingFloat: z.coerce.number().min(0, "Opening float must be non-negative").default(0),
  notes: z.string().optional().default(""),
});

export const CloseShiftSchema = z.object({
  closingCash: z.coerce.number().min(0, "Counted closing cash must be non-negative"),
  notes: z.string().optional().default(""),
});

export type Shift = z.infer<typeof ShiftSchema>;
export type OpenShiftInput = z.infer<typeof OpenShiftSchema>;
export type CloseShiftInput = z.infer<typeof CloseShiftSchema>;
