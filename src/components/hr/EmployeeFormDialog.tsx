import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Employee } from "@/types/employee";
import { Department } from "@/types/department";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: (employee: Partial<Employee>) => void;
  departments: Department[];
  onCreateDepartment?: (dept: Partial<Department>) => Promise<any>;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSave,
  departments,
  onCreateDepartment,
}: EmployeeFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "prefer_not_to_say",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Mauritania",
    departmentId: "",
    position: "",
    employmentType: "full_time",
    employmentStatus: "active",
    hireDate: "",
    baseSalary: 0,
    currency: "MRU",
    paymentFrequency: "monthly",
    notes: "",
  });
  const [showNewDept, setShowNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        dateOfBirth: employee.dateOfBirth || "",
        gender: employee.gender || "prefer_not_to_say",
        address: employee.address || "",
        city: employee.city || "",
        state: employee.state || "",
        zipCode: employee.zipCode || "",
        country: employee.country || "Mauritania",
        departmentId: employee.departmentId || "",
        position: employee.position || "",
        employmentType: employee.employmentType || "full_time",
        employmentStatus: employee.employmentStatus || "active",
        hireDate: employee.hireDate || "",
        baseSalary: employee.baseSalary || 0,
        currency: employee.currency || "MRU",
        paymentFrequency: employee.paymentFrequency || "monthly",
        notes: employee.notes || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "prefer_not_to_say",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Mauritania",
        departmentId: "",
        position: "",
        employmentType: "full_time",
        employmentStatus: "active",
        hireDate: "",
        baseSalary: 0,
        currency: "MRU",
        paymentFrequency: "monthly",
        notes: "",
      });
    }
    setShowNewDept(false);
    setNewDeptName("");
    setNewDeptCode("");
  }, [employee, open]);

  const handleDepartmentChange = (value: string) => {
    if (value === "__create_new__") {
      setShowNewDept(true);
    } else {
      setFormData({ ...formData, departmentId: value });
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim() || !newDeptCode.trim()) {
      toast.error("Department name and code are required");
      return;
    }

    if (onCreateDepartment) {
      try {
        const newDept = await onCreateDepartment({
          name: newDeptName.trim(),
          code: newDeptCode.trim().toUpperCase(),
        });
        setFormData({ ...formData, departmentId: newDept.id });
        setShowNewDept(false);
        setNewDeptName("");
        setNewDeptCode("");
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName || ""} 
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName || ""} 
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email || ""} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={formData.phone || ""} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input 
                    id="dateOfBirth" 
                    name="dateOfBirth" 
                    type="date" 
                    value={formData.dateOfBirth || ""} 
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    value={formData.gender || "prefer_not_to_say"}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address || ""} 
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input 
                    id="city" 
                    name="city" 
                    value={formData.city || ""} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    value={formData.state || ""} 
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input 
                    id="zipCode" 
                    name="zipCode" 
                    value={formData.zipCode || ""} 
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country || "Mauritania"} 
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })} 
                  required 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="employment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentId">Department *</Label>
                  {!showNewDept ? (
                    <Select 
                      value={formData.departmentId || ""}
                      onValueChange={handleDepartmentChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {onCreateDepartment && (
                          <SelectItem value="__create_new__" className="text-primary font-medium">
                            <span className="flex items-center gap-1">
                              <Plus className="h-4 w-4" />
                              Create new department
                            </span>
                          </SelectItem>
                        )}
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                      <div className="text-sm font-medium">New Department</div>
                      <Input
                        placeholder="Department name *"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                      />
                      <Input
                        placeholder="Department code *"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleCreateDepartment}>
                          Create
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowNewDept(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input 
                    id="position" 
                    name="position" 
                    value={formData.position || ""} 
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select 
                    value={formData.employmentType || "full_time"}
                    onValueChange={(value) => setFormData({ ...formData, employmentType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="employmentStatus">Status *</Label>
                  <Select 
                    value={formData.employmentStatus || "active"}
                    onValueChange={(value) => setFormData({ ...formData, employmentStatus: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input 
                  id="hireDate" 
                  name="hireDate" 
                  type="date" 
                  value={formData.hireDate || ""} 
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  value={formData.notes || ""} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                  rows={3} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="compensation" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseSalary">Base Salary *</Label>
                  <Input 
                    id="baseSalary" 
                    name="baseSalary" 
                    type="number" 
                    step="0.01" 
                    value={formData.baseSalary || 0} 
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <Select 
                    value={formData.currency || "MRU"}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MRU">MRU</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="paymentFrequency">Payment Frequency *</Label>
                <Select 
                  value={formData.paymentFrequency || "monthly"}
                  onValueChange={(value) => setFormData({ ...formData, paymentFrequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {employee ? "Update" : "Create"} Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
