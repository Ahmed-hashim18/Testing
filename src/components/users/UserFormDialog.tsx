import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, AppRole } from "@/types/user";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSave: (user: Partial<User>) => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSave }: UserFormDialogProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || ("viewer" as AppRole),
    department: user?.department || "",
    status: user?.status || "active",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if current user can assign admin role
  const canAssignAdmin = currentUser?.role === 'admin';
  // Check if editing self
  const isEditingSelf = user?.id === currentUser?.id;
  // Check if the user being edited is already an admin
  const isEditingAdmin = user?.role === 'admin';
  
  // Show admin option if:
  // 1. Current user is admin AND not editing self, OR
  // 2. Editing an existing admin user (to allow viewing/keeping the role)
  const showAdminOption = (canAssignAdmin && !isEditingSelf) || isEditingAdmin;
  
  // Debug log
  console.log('[UserFormDialog] currentUser role:', currentUser?.role, 'canAssignAdmin:', canAssignAdmin, 'isEditingSelf:', isEditingSelf, 'isEditingAdmin:', isEditingAdmin);

  useEffect(() => {
    if (open) {
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || ("viewer" as AppRole),
        department: user?.department || "",
        status: user?.status || "active",
      });
      setErrors({});
    }
  }, [open, user]);

  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "name":
        if (!value || value.length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        } else if (value.length > 100) {
          newErrors.name = "Name must not exceed 100 characters";
        } else {
          delete newErrors.name;
        }
        break;
      case "email":
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameValid = validateField("name", formData.name);
    const emailValid = validateField("email", formData.email);
    
    if (!nameValid || !emailValid) {
      toast.error("Please fix the validation errors");
      return;
    }

    onSave(formData);
    toast.success(user ? "User updated successfully" : "User created successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                Full Name
                <span className="text-destructive">*</span>
              </label>
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => handleBlur("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                Email
                <span className="text-destructive">*</span>
              </label>
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={() => handleBlur("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium flex items-center gap-1">
              Role
              <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.role}
              onValueChange={(value: AppRole) => {
                // Prevent non-admins from selecting admin
                if (value === 'admin' && !canAssignAdmin) {
                  toast.error("Only administrators can assign the admin role");
                  return;
                }
                // Prevent self-promotion to admin (only if user is NOT already admin)
                // Allow admins to keep their admin role when editing their own profile
                if (value === 'admin' && isEditingSelf && !isEditingAdmin) {
                  toast.error("You cannot promote yourself to administrator");
                  return;
                }
                setFormData({ ...formData, role: value });
              }}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {showAdminOption && (
                  <SelectItem value="admin">
                    Administrator
                  </SelectItem>
                )}
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            {!canAssignAdmin && formData.role === 'admin' && (
              <p className="text-sm text-destructive">
                Only administrators can assign the admin role
              </p>
            )}
            {isEditingSelf && formData.role === 'admin' && !isEditingAdmin && (
              <p className="text-sm text-destructive">
                You cannot promote yourself to administrator
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="department" className="text-sm font-medium">
              Department
            </label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium flex items-center gap-1">
              Status
              <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {user ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
