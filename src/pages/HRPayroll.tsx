import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Pencil, Trash2, FileText, DollarSign } from "lucide-react";
import { Employee } from "@/types/employee";
import { Department } from "@/types/department";
import { PayrollRecord } from "@/types/payroll";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { usePayroll } from "@/hooks/usePayroll";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { EmployeeFilters } from "@/components/hr/EmployeeFilters";
import { EmployeeFormDialog } from "@/components/hr/EmployeeFormDialog";
import { EmployeeDetailDialog } from "@/components/hr/EmployeeDetailDialog";
import { EmployeeAnalytics } from "@/components/hr/EmployeeAnalytics";
import { PayrollFilters } from "@/components/payroll/PayrollFilters";
import { PayrollFormDialog } from "@/components/payroll/PayrollFormDialog";
import { PayslipDialog } from "@/components/payroll/PayslipDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const employeeStatusColors = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  on_leave: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  probation: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  terminated: "bg-red-500/10 text-red-700 border-red-500/20",
};

const payrollStatusColors = {
  draft: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  processing: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  paid: "bg-green-500/10 text-green-700 border-green-500/20",
};

export default function HRPayroll() {
  const { employees, isLoading: isLoadingEmployees, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { departments, isLoading: isLoadingDepartments, createDepartment } = useDepartments();
  const { payroll: payrollRecords, isLoading: isLoadingPayroll, createPayroll, updatePayroll, deletePayroll } = usePayroll();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Payroll state
  const [payrollSearchQuery, setPayrollSearchQuery] = useState("");
  const [payrollStatusFilter, setPayrollStatusFilter] = useState("all");
  const [payrollPeriodFilter, setPayrollPeriodFilter] = useState("all");
  const [payrollFormOpen, setPayrollFormOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  
  const { toast } = useToast();

  const isLoading = isLoadingEmployees || isLoadingDepartments || isLoadingPayroll;

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || emp.employmentStatus === statusFilter;
      const matchesDepartment = departmentFilter === "all" || emp.departmentId === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  const filteredPayroll = useMemo(() => {
    return payrollRecords.filter((payroll) => {
      const employee = employees.find((e) => e.id === payroll.employeeId);
      const matchesSearch = employee
        ? `${employee.firstName} ${employee.lastName} ${employee.employeeId}`
            .toLowerCase()
            .includes(payrollSearchQuery.toLowerCase())
        : false;

      const matchesStatus = payrollStatusFilter === "all" || payroll.status === payrollStatusFilter;
      
      const matchesPeriod = payrollPeriodFilter === "all" || 
        payroll.periodStart.startsWith(payrollPeriodFilter);

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [payrollRecords, employees, payrollSearchQuery, payrollStatusFilter, payrollPeriodFilter]);

  const handleSave = async (employeeData: Partial<Employee>) => {
    if (selectedEmployee) {
      await updateEmployee({ id: selectedEmployee.id, data: employeeData });
    } else {
      // Generate employee ID
      const employeeId = `EMP${String(employees.length + 1).padStart(3, "0")}`;
      await createEmployee({ ...employeeData, employeeId });
    }
    setFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteEmployee(id);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailOpen(true);
  };

  const handleSavePayroll = async (payrollData: Partial<PayrollRecord>) => {
    if (selectedPayroll) {
      await updatePayroll({ id: selectedPayroll.id, data: payrollData });
    } else {
      await createPayroll(payrollData);
    }
    setPayrollFormOpen(false);
  };

  const handleDeletePayroll = async (id: string) => {
    await deletePayroll(id);
  };

  const handleEditPayroll = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setPayrollFormOpen(true);
  };

  const handleViewPayslip = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setPayslipOpen(true);
  };

  const getDepartment = (departmentId: string) => {
    return departments.find((d) => d.id === departmentId);
  };

  const getEmployee = (employeeId: string) => {
    return employees.find((e) => e.id === employeeId);
  };

  return (
    <div className="p-6 space-y-6">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">HR & Payroll</h1>
              <p className="text-muted-foreground mt-1">
                Manage employees, departments, and payroll
              </p>
            </div>
          </div>

      <EmployeeAnalytics employees={employees} departments={departments} />

      <Tabs defaultValue="employees" className="w-full">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <EmployeeFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    departmentFilter={departmentFilter}
                    onDepartmentChange={setDepartmentFilter}
                    departments={departments}
                  />
                  <Button onClick={() => { setSelectedEmployee(null); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No employees found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.employeeId}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {employee.firstName} {employee.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getDepartment(employee.departmentId)?.name}</TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell>
                              <Badge className={employeeStatusColors[employee.employmentStatus]}>
                                {employee.employmentStatus.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {employee.currency} {employee.baseSalary.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(employee)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(employee)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(employee.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <PayrollFilters
                    searchQuery={payrollSearchQuery}
                    onSearchChange={setPayrollSearchQuery}
                    statusFilter={payrollStatusFilter}
                    onStatusChange={setPayrollStatusFilter}
                    periodFilter={payrollPeriodFilter}
                    onPeriodChange={setPayrollPeriodFilter}
                  />
                  <Button onClick={() => { setSelectedPayroll(null); setPayrollFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Process Payroll
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Gross Salary</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayroll.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No payroll records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayroll.map((payroll) => {
                          const employee = getEmployee(payroll.employeeId);
                          return (
                            <TableRow key={payroll.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {employee?.firstName} {employee?.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{employee?.employeeId}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{format(new Date(payroll.periodStart), "MMM dd")} -</p>
                                  <p>{format(new Date(payroll.periodEnd), "MMM dd, yyyy")}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                ${payroll.grossSalary.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-destructive">
                                -${payroll.totalDeductions.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-bold text-primary">
                                ${payroll.netSalary.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge className={payrollStatusColors[payroll.status]}>
                                  {payroll.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewPayslip(payroll)}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditPayroll(payroll)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePayroll(payroll.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
        onSave={handleSave}
        departments={departments}
        onCreateDepartment={createDepartment}
      />

      <EmployeeDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        employee={selectedEmployee}
        department={getDepartment(selectedEmployee?.departmentId || "")}
      />

      <PayrollFormDialog
        open={payrollFormOpen}
        onOpenChange={setPayrollFormOpen}
        payroll={selectedPayroll}
        onSave={handleSavePayroll}
        employees={employees}
      />

      <PayslipDialog
        open={payslipOpen}
        onOpenChange={setPayslipOpen}
        payroll={selectedPayroll}
        employee={getEmployee(selectedPayroll?.employeeId || "")}
        department={getDepartment(getEmployee(selectedPayroll?.employeeId || "")?.departmentId || "")}
      />
        </>
      )}
    </div>
  );
}
