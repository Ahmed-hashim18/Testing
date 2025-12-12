export type PayrollStatus = "draft" | "processing" | "completed" | "paid";

export interface PayrollDeduction {
  type: "tax" | "insurance" | "pension" | "loan" | "other";
  description: string;
  amount: number;
  isPercentage: boolean;
}

export interface PayrollAllowance {
  type: "bonus" | "overtime" | "commission" | "allowance" | "other";
  description: string;
  amount: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollStatus;
  
  // Earnings
  baseSalary: number;
  allowances: PayrollAllowance[];
  grossSalary: number;
  
  // Deductions
  deductions: PayrollDeduction[];
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // Dates
  paymentDate?: string;
  processedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: "sick" | "vacation" | "personal" | "unpaid" | "other";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt: string;
}
