import { z } from "zod";

export const SupplierSchema = z.object({
  id: z.string().min(1, "Supplier ID is required"),
  name: z.string().min(1, "Supplier name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
  companyName: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateSupplierSchema = SupplierSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdateSupplierSchema = SupplierSchema.partial().omit({ id: true });

export type Supplier = z.infer<typeof SupplierSchema>;
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
