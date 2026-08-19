import { z } from "zod";

export const RegisterStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export type RegisterStatus = z.infer<typeof RegisterStatusEnum>;

export const RegisterSchema = z.object({
  id: z.string().min(1, "Register ID is required"),
  tenantId: z.string().default("default"),
  name: z.string().min(1, "Register name is required"),
  status: RegisterStatusEnum.default("ACTIVE"),
  location: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateRegisterSchema = RegisterSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdateRegisterSchema = RegisterSchema.partial().omit({ id: true });

export type Register = z.infer<typeof RegisterSchema>;
export type CreateRegisterInput = z.infer<typeof CreateRegisterSchema>;
export type UpdateRegisterInput = z.infer<typeof UpdateRegisterSchema>;
