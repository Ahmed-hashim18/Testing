import { z } from "zod";

export const purchaseLineItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().positive("Quantity must be greater than zero").int("Quantity must be a whole number"),
  unitPrice: z.number().positive("Unit price must be greater than zero"),
  total: z.number().positive(),
});

export const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().min(1, "Order number is required"),
  date: z.string().min(1, "Order date is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  status: z.enum(["draft", "ordered", "received", "paid", "cancelled"]).default("draft"),
  lineItems: z.array(purchaseLineItemSchema).min(1, "At least one line item is required"),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  taxRate: z.number().min(0).max(100, "Tax rate cannot exceed 100%"),
  total: z.number().positive("Total must be greater than zero"),
  amountPaid: z.number().min(0),
  balance: z.number().min(0),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
  receivedDate: z.string().optional(),
  paymentDate: z.string().optional(),
}).refine((data) => {
  // Validate that amount paid doesn't exceed total
  return data.amountPaid <= data.total;
}, {
  message: "Amount paid cannot exceed total",
  path: ["amountPaid"],
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type PurchaseLineItemFormData = z.infer<typeof purchaseLineItemSchema>;
