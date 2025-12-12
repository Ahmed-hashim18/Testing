import { z } from "zod";

export const accountSchema = z.object({
  id: z.string().optional(),
  code: z.string()
    .min(1, "Account code is required")
    .max(20, "Account code must not exceed 20 characters")
    .regex(/^[A-Za-z0-9-]+$/, "Account code can only contain letters, numbers, and dashes"),
  name: z.string()
    .min(2, "Account name must be at least 2 characters")
    .max(200, "Account name must not exceed 200 characters"),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"], {
    errorMap: () => ({ message: "Please select a valid account type" }),
  }),
  subtype: z.string().min(1, "Account subtype is required"),
  parentAccountId: z.string().nullable().optional(),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
  isActive: z.boolean().default(true),
  balance: z.number().default(0),
  currency: z.string().default("MRU"),
});

export const accountHierarchySchema = z.object({
  accountId: z.string(),
  parentAccountId: z.string().nullable(),
}).refine((data) => {
  // Prevent self-referencing
  return data.accountId !== data.parentAccountId;
}, {
  message: "Account cannot be its own parent",
  path: ["parentAccountId"],
});

export type AccountFormData = z.infer<typeof accountSchema>;
export type AccountHierarchyFormData = z.infer<typeof accountHierarchySchema>;
