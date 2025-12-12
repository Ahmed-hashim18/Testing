import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["sale", "purchase", "payment", "receipt", "expense", "refund", "adjustment", "transfer"], {
    errorMap: () => ({ message: "Please select a valid transaction type" }),
  }),
  description: z.string().min(3, "Description must be at least 3 characters").max(500, "Description must not exceed 500 characters"),
  accountFrom: z.string().optional(),
  accountTo: z.string().optional(),
  amount: z.number().positive("Amount must be greater than zero").max(999999999, "Amount is too large"),
  status: z.enum(["pending", "posted", "reconciled", "void"]).default("pending"),
  reference: z.string().max(100, "Reference must not exceed 100 characters").optional(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
}).refine((data) => {
  // Ensure either accountFrom or accountTo is provided based on transaction type
  if (data.type === "transfer") {
    return data.accountFrom && data.accountTo && data.accountFrom !== data.accountTo;
  }
  return true;
}, {
  message: "For transfers, both accounts must be specified and different",
  path: ["accountTo"],
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
