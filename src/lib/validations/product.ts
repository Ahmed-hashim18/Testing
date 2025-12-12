import { z } from "zod";

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Product name must be at least 2 characters").max(200, "Product name must not exceed 200 characters"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU must not exceed 50 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(2000, "Description must not exceed 2000 characters").optional(),
  costPrice: z.number().min(0, "Cost price cannot be negative"),
  sellingPrice: z.number().positive("Selling price must be greater than zero"),
  currentStock: z.number().int("Stock must be a whole number").min(0, "Stock cannot be negative"),
  reorderLevel: z.number().int("Reorder level must be a whole number").min(0, "Reorder level cannot be negative"),
  supplier: z.string().optional(),
  status: z.enum(["active", "inactive", "discontinued"]).default("active"),
  unit: z.string().min(1, "Unit is required"),
}).refine((data) => {
  // Validate that selling price is higher than cost price
  return data.sellingPrice >= data.costPrice;
}, {
  message: "Selling price should be equal to or higher than cost price",
  path: ["sellingPrice"],
}).refine((data) => {
  // Validate SKU format (alphanumeric and dashes only)
  return /^[A-Za-z0-9-]+$/.test(data.sku);
}, {
  message: "SKU can only contain letters, numbers, and dashes",
  path: ["sku"],
});

export type ProductFormData = z.infer<typeof productSchema>;
