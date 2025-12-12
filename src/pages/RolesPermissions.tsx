import { useState } from "react";
import { Plus, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockRoles } from "@/data/mockRoles";
import { Role } from "@/types/role";
import { RoleFormDialog } from "@/components/roles/RoleFormDialog";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";

export default function RolesPermissions() {
  const [roles, setRoles] = useState(mockRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();

  const handleSaveRole = (roleData: Partial<Role>) => {
    if (selectedRole) {
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, ...roleData } : r));
    } else {
      const newRole: Role = {
        id: String(roles.length + 1),
        ...roleData as Role,
        roleType: "viewer",
        userCount: 0,
        isSystemRole: false,
        createdAt: new Date().toISOString(),
      };
      setRoles([...roles, newRole]);
    }
    setSelectedRole(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage role-based access control (RBAC)
          </p>
        </div>
        <Button onClick={() => { setSelectedRole(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <CardDescription className="mt-1">{role.description}</CardDescription>
                </div>
                {role.isSystemRole && (
                  <Badge variant="outline" className="shrink-0">System</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Users
                  </span>
                  <span className="font-medium">{role.userCount}</span>
                </div>

                <div className="text-sm">
                  <div className="text-muted-foreground mb-2">Permissions</div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm.module} variant="secondary" className="text-xs">
                        {perm.module.replace(/_/g, " ")}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setSelectedRole(role); setViewDialogOpen(true); }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {!role.isSystemRole && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setSelectedRole(role); setDialogOpen(true); }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RoleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={selectedRole && !selectedRole.isSystemRole ? selectedRole : undefined}
        onSave={handleSaveRole}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name} - Permissions</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
              </div>
              <PermissionMatrix
                permissions={selectedRole.permissions}
                onPermissionsChange={() => {}}
                readonly
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
