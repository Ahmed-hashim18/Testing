import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";
import { toast } from "@/lib/toast";

export function useEmployees() {
  const queryClient = useQueryClient();

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          department:departments(id, name, code)
        `)
        .order("employee_number", { ascending: true });

      if (error) throw error;

      return data.map((emp: any) => ({
        id: emp.id,
        employeeId: emp.employee_number,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        phone: emp.phone || "",
        dateOfBirth: emp.date_of_birth || "",
        gender: "prefer_not_to_say" as const,
        address: emp.address || "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        hireDate: emp.hire_date,
        departmentId: emp.department_id,
        position: emp.position,
        employmentType: emp.employment_type,
        baseSalary: emp.salary,
        currency: emp.currency || "MRU",
        paymentFrequency: "monthly" as const,
        employmentStatus: emp.status,
        emergencyContact: {
          name: emp.emergency_contact || "",
          relationship: "",
          phone: emp.emergency_phone || "",
        },
        profileImage: emp.avatar_url,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
      })) as Employee[];
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (employeeData: Partial<Employee>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("employees")
        .insert({
          employee_number: employeeData.employeeId,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          date_of_birth: employeeData.dateOfBirth,
          hire_date: employeeData.hireDate,
          department_id: employeeData.departmentId,
          position: employeeData.position,
          employment_type: employeeData.employmentType,
          salary: employeeData.baseSalary,
          currency: employeeData.currency || "MRU",
          status: employeeData.employmentStatus || "active",
          address: employeeData.address,
          emergency_contact: employeeData.emergencyContact?.name,
          emergency_phone: employeeData.emergencyContact?.phone,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create employee", error.message);
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employee> }) => {
      const { error } = await supabase
        .from("employees")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          hire_date: data.hireDate,
          department_id: data.departmentId,
          position: data.position,
          employment_type: data.employmentType,
          salary: data.baseSalary,
          currency: data.currency,
          status: data.employmentStatus,
          address: data.address,
          emergency_contact: data.emergencyContact?.name,
          emergency_phone: data.emergencyContact?.phone,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update employee", error.message);
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete employee", error.message);
    },
  });

  return {
    employees: employeesQuery.data ?? [],
    isLoading: employeesQuery.isLoading,
    error: employeesQuery.error,
    createEmployee: createEmployee.mutateAsync,
    updateEmployee: updateEmployee.mutateAsync,
    deleteEmployee: deleteEmployee.mutateAsync,
  };
}
