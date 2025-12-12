import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PayrollRecord } from "@/types/payroll";
import { Employee } from "@/types/employee";
import { Department } from "@/types/department";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";

interface PayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: PayrollRecord | null;
  employee: Employee | undefined;
  department: Department | undefined;
}

const statusColors = {
  draft: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  processing: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  paid: "bg-green-500/10 text-green-700 border-green-500/20",
};

export function PayslipDialog({
  open,
  onOpenChange,
  payroll,
  employee,
  department,
}: PayslipDialogProps) {
  if (!payroll || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    alert("PDF download functionality would be implemented here");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Payslip - {format(new Date(payroll.periodStart), "MMMM yyyy")}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 print:p-8">
          {/* Header */}
          <div className="text-center pb-4 border-b">
            <h2 className="text-2xl font-bold">NaqelERP</h2>
            <p className="text-sm text-muted-foreground">Payslip for the month of {format(new Date(payroll.periodStart), "MMMM yyyy")}</p>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Employee Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="font-medium">{employee.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{employee.firstName} {employee.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{department?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium">{employee.position}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Payroll Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">
                    {format(new Date(payroll.periodStart), "MMM dd")} - {format(new Date(payroll.periodEnd), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={statusColors[payroll.status]}>
                    {payroll.status}
                  </Badge>
                </div>
                {payroll.paymentDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Date:</span>
                    <span className="font-medium">{format(new Date(payroll.paymentDate), "MMM dd, yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Earnings */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Salary</span>
                <span className="font-medium">MRU {payroll.baseSalary.toFixed(2)}</span>
              </div>
              
              {payroll.allowances.map((allowance, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {allowance.description} <span className="text-xs">({allowance.type})</span>
                  </span>
                  <span className="font-medium">MRU {allowance.amount.toFixed(2)}</span>
                </div>
              ))}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-semibold">
                <span>Gross Salary</span>
                <span className="text-primary">MRU {payroll.grossSalary.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Deductions</h3>
            <div className="space-y-2">
              {payroll.deductions.map((deduction, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {deduction.description} <span className="text-xs">({deduction.type})</span>
                  </span>
                  <span className="font-medium text-destructive">-MRU {deduction.amount.toFixed(2)}</span>
                </div>
              ))}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-semibold">
                <span>Total Deductions</span>
                <span className="text-destructive">-MRU {payroll.totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Net Salary</span>
              <span className="text-3xl font-bold text-primary">MRU {payroll.netSalary.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-1">For queries, please contact HR department.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
