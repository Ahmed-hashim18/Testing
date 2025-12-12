export type AppRole = 'admin' | 'manager' | 'accountant' | 'sales' | 'inventory' | 'hr' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}
