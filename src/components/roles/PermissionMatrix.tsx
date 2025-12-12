import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePermission, ActionType, ModuleName } from "@/types/role";
import { Label } from "@/components/ui/label";

interface PermissionMatrixProps {
  permissions: ModulePermission[];
  onPermissionsChange: (permissions: ModulePermission[]) => void;
  readonly?: boolean;
}

const allModules: { name: ModuleName; label: string }[] = [
  { name: "dashboard", label: "Dashboard" },
  { name: "chart_of_accounts", label: "Chart of Accounts" },
  { name: "transactions", label: "Transactions" },
  { name: "products", label: "Products" },
  { name: "sales", label: "Sales" },
  { name: "purchases", label: "Purchases" },
  { name: "accounting", label: "Accounting" },
  { name: "hr_payroll", label: "HR & Payroll" },
  { name: "activity_log", label: "Activity Log" },
  { name: "user_management", label: "User Management" },
];

const allActions: ActionType[] = ["create", "read", "update", "delete", "export"];

export function PermissionMatrix({ permissions, onPermissionsChange, readonly }: PermissionMatrixProps) {
  const hasPermission = (module: ModuleName, action: ActionType) => {
    const modulePermission = permissions.find((p) => p.module === module);
    return modulePermission?.actions.includes(action) || false;
  };

  const togglePermission = (module: ModuleName, action: ActionType) => {
    if (readonly) return;

    const modulePermission = permissions.find((p) => p.module === module);
    
    if (!modulePermission) {
      onPermissionsChange([...permissions, { module, actions: [action] }]);
      return;
    }

    const hasAction = modulePermission.actions.includes(action);
    
    if (hasAction) {
      const newActions = modulePermission.actions.filter((a) => a !== action);
      if (newActions.length === 0) {
        onPermissionsChange(permissions.filter((p) => p.module !== module));
      } else {
        onPermissionsChange(
          permissions.map((p) =>
            p.module === module ? { ...p, actions: newActions } : p
          )
        );
      }
    } else {
      onPermissionsChange(
        permissions.map((p) =>
          p.module === module
            ? { ...p, actions: [...p.actions, action] }
            : p
        )
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>
          Configure module and action-level permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Module</th>
                {allActions.map((action) => (
                  <th key={action} className="text-center p-3 font-medium capitalize">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allModules.map((module) => (
                <tr key={module.name} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{module.label}</td>
                  {allActions.map((action) => (
                    <td key={action} className="text-center p-3">
                      <Checkbox
                        checked={hasPermission(module.name, action)}
                        onCheckedChange={() => togglePermission(module.name, action)}
                        disabled={readonly}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
