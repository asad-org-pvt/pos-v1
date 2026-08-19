import { z } from "zod";

export const ProductStatusEnum = z.enum(["AVAILABLE", "OUT_OF_STOCK", "DISCONTINUED"]);
export type ProductStatus = z.infer<typeof ProductStatusEnum>;

export const ProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Product name is required"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative").default(0).optional(),
  unitsInStock: z.coerce.number().int().min(0, "Units in stock must be non-negative"),
  category: z.string().optional().default(""),
  description: z.string().optional().default(""),
  images: z.array(z.string()).optional().default([]),
  status: ProductStatusEnum.default("AVAILABLE"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  taxPerUnit: z.coerce.number().optional().default(0),
  minThreshold: z.coerce.number().int().min(0).default(5).optional(),
  reorderLevel: z.coerce.number().int().min(0).default(5).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateProductSchema = ProductSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  id: z.string().optional(),
});

export const UpdateProductSchema = ProductSchema.partial().omit({ id: true });

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
