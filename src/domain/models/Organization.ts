import { z } from "zod";

export const OrganizationSchema = z.object({
  id: z.string().min(1, "Organization ID is required"),
  name: z.string().min(1, "Organization name is required"),
  email: z.string().email("Invalid organization email"),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  currency: z.string().default("PKR"),
  taxRate: z.number().nonnegative().default(0.05),
  discountRate: z.number().nonnegative().default(0.02),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateOrganizationSchema = OrganizationSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdateOrganizationSchema = OrganizationSchema.partial().omit({ id: true });

export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
