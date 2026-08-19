import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.string().min(1, "Customer ID is required"),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  totalOrdersPlaced: z.coerce.number().optional().default(0),
  totalAmountSpent: z.coerce.number().optional().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateCustomerSchema = CustomerSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdateCustomerSchema = CustomerSchema.partial().omit({ id: true });

export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
