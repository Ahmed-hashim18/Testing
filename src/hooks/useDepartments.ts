import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Department } from "@/types/department";
import { toast } from "sonner";

export function useDepartments() {
  const queryClient = useQueryClient();

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      return data.map((dept: any) => ({
        id: dept.id,
        code: dept.code,
        name: dept.name,
        managerId: dept.manager_id,
        description: dept.description,
        budget: dept.budget,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at,
      })) as Department[];
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (deptData: Partial<Department>) => {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          code: deptData.code,
          name: deptData.name,
          description: deptData.description || null,
          budget: deptData.budget || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create department: " + error.message);
    },
  });

  return {
    departments: departmentsQuery.data ?? [],
    isLoading: departmentsQuery.isLoading,
    error: departmentsQuery.error,
    createDepartment: createDepartmentMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  };
}
