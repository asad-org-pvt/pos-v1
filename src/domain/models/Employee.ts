import { z } from "zod";

export const EmployeeSchema = z.object({
  id: z.string().min(1, "Employee ID is required"),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  name: z.string().min(1, "Employee name is required"),
  email: z.string().email("Invalid employee email"),
  phoneNumber: z.string().optional().default(""),
  role: z.string().default("EMPLOYEE"),
  organisationId: z.string().optional(),
  organisation: z.string().optional(),
  department: z.string().optional().default(""),
  jobTitle: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  isAdmin: z.boolean().default(false),
  photo: z.string().optional().default(""),
  compensation: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateEmployeeSchema = EmployeeSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdateEmployeeSchema = EmployeeSchema.partial().omit({ id: true });

export type Employee = z.infer<typeof EmployeeSchema>;
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
