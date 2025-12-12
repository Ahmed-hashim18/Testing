import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayrollRecord, PayrollAllowance, PayrollDeduction } from "@/types/payroll";
import { Employee } from "@/types/employee";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";

interface PayrollFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: PayrollRecord | null;
  onSave: (payroll: Partial<PayrollRecord>) => void;
  employees: Employee[];
}

export function PayrollFormDialog({
  open,
  onOpenChange,
  payroll,
  onSave,
  employees,
}: PayrollFormDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>(payroll?.employeeId || "");
  const [allowances, setAllowances] = useState<PayrollAllowance[]>(payroll?.allowances || []);
  const [deductions, setDeductions] = useState<PayrollDeduction[]>(payroll?.deductions || []);

  const employee = employees.find((e) => e.id === selectedEmployee);
  const baseSalary = employee ? employee.baseSalary / 12 : 0;

  const calculateGross = () => {
    const allowanceTotal = allowances.reduce((sum, a) => sum + a.amount, 0);
    return baseSalary + allowanceTotal;
  };

  const calculateDeductions = () => {
    return deductions.reduce((sum, d) => sum + d.amount, 0);
  };

  const calculateNet = () => {
    return calculateGross() - calculateDeductions();
  };

  const addAllowance = () => {
    setAllowances([...allowances, { type: "bonus", description: "", amount: 0 }]);
  };

  const removeAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const updateAllowance = (index: number, field: keyof PayrollAllowance, value: any) => {
    const updated = [...allowances];
    updated[index] = { ...updated[index], [field]: value };
    setAllowances(updated);
  };

  const addDeduction = () => {
    setDeductions([...deductions, { type: "tax", description: "", amount: 0, isPercentage: false }]);
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const updateDeduction = (index: number, field: keyof PayrollDeduction, value: any) => {
    const updated = [...deductions];
    updated[index] = { ...updated[index], [field]: value };
    setDeductions(updated);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<PayrollRecord> = {
      employeeId: selectedEmployee,
      periodStart: formData.get("periodStart") as string,
      periodEnd: formData.get("periodEnd") as string,
      status: formData.get("status") as any,
      baseSalary,
      allowances,
      grossSalary: calculateGross(),
      deductions,
      totalDeductions: calculateDeductions(),
      netSalary: calculateNet(),
    };
    
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payroll ? "Edit Payroll" : "Process New Payroll"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee">Employee *</Label>
              <Select 
                value={selectedEmployee} 
                onValueChange={setSelectedEmployee}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue={payroll?.status || "draft"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodStart">Period Start *</Label>
              <Input 
                id="periodStart" 
                name="periodStart" 
                type="date" 
                defaultValue={payroll?.periodStart} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="periodEnd">Period End *</Label>
              <Input 
                id="periodEnd" 
                name="periodEnd" 
                type="date" 
                defaultValue={payroll?.periodEnd} 
                required 
              />
            </div>
          </div>

          <div>
            <Label>Base Salary (Monthly)</Label>
            <div className="text-2xl font-bold text-primary mt-1">
              MRU {baseSalary.toFixed(2)}
            </div>
          </div>

          <Separator />

          {/* Allowances */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Allowances</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAllowance}>
                <Plus className="h-4 w-4 mr-2" />
                Add Allowance
              </Button>
            </div>
            
            <div className="space-y-3">
              {allowances.map((allowance, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Type</Label>
                    <Select 
                      value={allowance.type} 
                      onValueChange={(value: any) => updateAllowance(index, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="overtime">Overtime</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="allowance">Allowance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label>Description</Label>
                    <Input 
                      value={allowance.description}
                      onChange={(e) => updateAllowance(index, "description", e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  
                  <div className="w-32">
                    <Label>Amount</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={allowance.amount}
                      onChange={(e) => updateAllowance(index, "amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeAllowance(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Deductions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deduction
              </Button>
            </div>
            
            <div className="space-y-3">
              {deductions.map((deduction, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Type</Label>
                    <Select 
                      value={deduction.type} 
                      onValueChange={(value: any) => updateDeduction(index, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tax">Tax</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="pension">Pension</SelectItem>
                        <SelectItem value="loan">Loan</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label>Description</Label>
                    <Input 
                      value={deduction.description}
                      onChange={(e) => updateDeduction(index, "description", e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  
                  <div className="w-32">
                    <Label>Amount</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={deduction.amount}
                      onChange={(e) => updateDeduction(index, "amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeDeduction(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Salary:</span>
              <span className="font-semibold">MRU {calculateGross().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Deductions:</span>
              <span className="font-semibold text-destructive">-MRU {calculateDeductions().toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Net Salary:</span>
              <span className="font-bold text-primary">MRU {calculateNet().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedEmployee}>
              {payroll ? "Update" : "Process"} Payroll
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
