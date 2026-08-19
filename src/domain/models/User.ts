import { z } from "zod";

export const UserRoleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "ORGANISATION", "EMPLOYEE", "CUSTOMER", "SUPPLIER"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid user email"),
  displayName: z.string().optional().default(""),
  role: UserRoleEnum.default("EMPLOYEE"),
  organisationId: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
