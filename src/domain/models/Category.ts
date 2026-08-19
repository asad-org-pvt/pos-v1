import { z } from "zod";

export const CategoryTypeEnum = z.enum([
  "categories_employees",
  "categories_customers",
  "categories_products",
  "categories_orders",
  "categories_suppliers",
]);
export type CategoryType = z.infer<typeof CategoryTypeEnum>;

export const CategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required"),
  type: z.string().optional().default("categories_products"),
  description: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateCategorySchema = CategorySchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdateCategorySchema = CategorySchema.partial().omit({ id: true });

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
