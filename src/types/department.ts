export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId?: string;
  employeeCount: number;
  budget: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
