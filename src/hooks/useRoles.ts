import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Role {
  id: string;
  name: string;
  roleType: string;
  description: string;
}

export function useRoles() {
  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      return data.map((role: any) => ({
        id: role.id,
        name: role.name,
        roleType: role.role_type,
        description: role.description,
      })) as Role[];
    },
  });

  return {
    roles: rolesQuery.data ?? [],
    isLoading: rolesQuery.isLoading,
    error: rolesQuery.error,
  };
}
