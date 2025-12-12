import { z } from "zod";

export const permissionSchema = z.object({
  module: z.string(),
  create: z.boolean().default(false),
  read: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
  export: z.boolean().default(false),
});

export const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must not exceed 50 characters")
    .regex(/^[A-Za-z0-9\s-]+$/, "Role name can only contain letters, numbers, spaces, and dashes"),
  description: z.string().max(500, "Description must not exceed 500 characters").optional(),
  permissions: z.array(permissionSchema).min(1, "At least one permission must be configured"),
  isSystem: z.boolean().default(false),
}).refine((data) => {
  // Ensure at least one permission is granted
  const hasAnyPermission = data.permissions.some(p => 
    p.create || p.read || p.update || p.delete || p.export
  );
  return hasAnyPermission;
}, {
  message: "Role must have at least one permission granted",
  path: ["permissions"],
});

export type RoleFormData = z.infer<typeof roleSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
