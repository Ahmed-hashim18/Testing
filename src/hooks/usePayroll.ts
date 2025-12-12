import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PayrollRecord } from "@/types/payroll";
import { toast } from "@/lib/toast";

export function usePayroll() {
  const queryClient = useQueryClient();

  const payrollQuery = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll")
        .select(`
          *,
          employee:employees(id, employee_number, first_name, last_name)
        `)
        .order("period_start", { ascending: false });

      if (error) throw error;

      return data.map((p: any) => ({
        id: p.id,
        employeeId: p.employee_id,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        baseSalary: p.basic_salary,
        allowances: p.allowances 
          ? [{ type: "allowance" as const, description: "Allowances", amount: p.allowances }]
          : [],
        grossSalary: p.basic_salary + (p.allowances || 0) + (p.overtime || 0),
        deductions: p.deductions
          ? [{ type: "other" as const, description: "Deductions", amount: p.deductions, isPercentage: false }]
          : [],
        totalDeductions: p.deductions || 0,
        netSalary: p.net_salary,
        status: p.status,
        paymentDate: p.payment_date,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })) as PayrollRecord[];
    },
  });

  const createPayroll = useMutation({
    mutationFn: async (payrollData: Partial<PayrollRecord>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const allowancesTotal = payrollData.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0;
      const deductionsTotal = payrollData.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;

      const { data, error } = await supabase
        .from("payroll")
        .insert({
          employee_id: payrollData.employeeId,
          period_start: payrollData.periodStart,
          period_end: payrollData.periodEnd,
          basic_salary: payrollData.baseSalary,
          allowances: allowancesTotal,
          overtime: 0,
          deductions: deductionsTotal,
          net_salary: payrollData.netSalary,
          status: payrollData.status || "draft",
          payment_date: payrollData.paymentDate,
          notes: "",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Payroll created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create payroll", error.message);
    },
  });

  const updatePayroll = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PayrollRecord> }) => {
      const allowancesTotal = data.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0;
      const deductionsTotal = data.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;

      const { error } = await supabase
        .from("payroll")
        .update({
          period_start: data.periodStart,
          period_end: data.periodEnd,
          basic_salary: data.baseSalary,
          allowances: allowancesTotal,
          overtime: 0,
          deductions: deductionsTotal,
          net_salary: data.netSalary,
          status: data.status,
          payment_date: data.paymentDate,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Payroll updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update payroll", error.message);
    },
  });

  const deletePayroll = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payroll").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Payroll deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete payroll", error.message);
    },
  });

  return {
    payroll: payrollQuery.data ?? [],
    isLoading: payrollQuery.isLoading,
    error: payrollQuery.error,
    createPayroll: createPayroll.mutateAsync,
    updatePayroll: updatePayroll.mutateAsync,
    deletePayroll: deletePayroll.mutateAsync,
  };
}
