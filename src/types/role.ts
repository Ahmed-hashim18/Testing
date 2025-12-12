export type AppRole = 'admin' | 'manager' | 'accountant' | 'sales' | 'inventory' | 'hr' | 'viewer';

export type ModuleName = 
  | 'dashboard' 
  | 'chart_of_accounts' 
  | 'transactions' 
  | 'products' 
  | 'sales' 
  | 'purchases' 
  | 'accounting' 
  | 'hr_payroll' 
  | 'activity_log'
  | 'user_management';

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'export';

export interface ModulePermission {
  module: ModuleName;
  actions: ActionType[];
}

export interface Role {
  id: string;
  name: string;
  roleType: AppRole;
  description: string;
  permissions: ModulePermission[];
  userCount: number;
  isSystemRole: boolean;
  createdAt: string;
}
