import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { Employee } from "@/types/employee";
import { Department } from "@/types/department";

interface EmployeeAnalyticsProps {
  employees: Employee[];
  departments: Department[];
}

export function EmployeeAnalytics({ employees, departments }: EmployeeAnalyticsProps) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.employmentStatus === "active").length;
  const avgSalary = employees.reduce((sum, e) => sum + e.baseSalary, 0) / employees.length;
  const totalPayroll = employees
    .filter((e) => e.employmentStatus === "active")
    .reduce((sum, e) => sum + e.baseSalary, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {activeEmployees} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Departments</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{departments.length}</div>
          <p className="text-xs text-muted-foreground">
            {departments.filter((d) => d.isActive).length} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            MRU {Math.round(avgSalary).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">per employee</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            MRU {Math.round(totalPayroll).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">monthly</p>
        </CardContent>
      </Card>
    </div>
  );
}
