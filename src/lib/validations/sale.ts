import { z } from "zod";

export const lineItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string(),
  quantity: z.number().positive("Quantity must be greater than zero").int("Quantity must be a whole number"),
  unitPrice: z.number().positive("Unit price must be greater than zero"),
  discount: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%"),
  tax: z.number().min(0, "Tax cannot be negative"),
  total: z.number(),
});

export const salesOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().min(1, "Order number is required"),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer name is required"),
  date: z.string().min(1, "Order date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["draft", "confirmed", "invoiced", "paid", "cancelled"]).default("draft"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  subtotal: z.number().min(0),
  discountAmount: z.number().min(0),
  taxAmount: z.number().min(0),
  total: z.number().positive("Total must be greater than zero"),
  paidAmount: z.number().min(0),
  balance: z.number().min(0),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
}).refine((data) => {
  // Validate that due date is after order date
  return new Date(data.dueDate) >= new Date(data.date);
}, {
  message: "Due date must be on or after the order date",
  path: ["dueDate"],
});

export type SalesOrderFormData = z.infer<typeof salesOrderSchema>;
export type LineItemFormData = z.infer<typeof lineItemSchema>;
