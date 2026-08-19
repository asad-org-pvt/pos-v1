import { z } from "zod";

export const PrinterTransportEnum = z.enum(["BROWSER", "USB", "SERIAL", "NETWORK"]);
export type PrinterTransportType = z.infer<typeof PrinterTransportEnum>;

export const PrinterTypeEnum = z.enum(["THERMAL", "IMPACT"]);
export type PrinterType = z.infer<typeof PrinterTypeEnum>;

export const PrinterConfigSchema = z.object({
  id: z.string().min(1, "Printer ID is required"),
  tenantId: z.string().default("default"),
  name: z.string().min(1, "Printer name is required").default("Default Receipt Printer"),
  type: PrinterTypeEnum.default("THERMAL"),
  transport: PrinterTransportEnum.default("BROWSER"),
  paperWidth: z.union([z.literal(58), z.literal(80)]).default(80),
  characterWidth: z.coerce.number().min(20).max(80).default(42),
  autoCut: z.boolean().default(true),
  openCashDrawer: z.boolean().default(false),
  ipAddress: z.string().optional().default(""),
  port: z.coerce.number().optional().default(9100),
  baudRate: z.coerce.number().optional().default(9600),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(true),
  headerText: z.string().optional().default(""),
  footerText: z.string().optional().default("Thank you for your business!"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreatePrinterConfigSchema = PrinterConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
});

export const UpdatePrinterConfigSchema = PrinterConfigSchema.partial().omit({ id: true });

export type PrinterConfig = z.infer<typeof PrinterConfigSchema>;
export type CreatePrinterConfigInput = z.infer<typeof CreatePrinterConfigSchema>;
export type UpdatePrinterConfigInput = z.infer<typeof UpdatePrinterConfigSchema>;
