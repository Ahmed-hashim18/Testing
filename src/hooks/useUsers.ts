import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, AppRole } from "@/types/user";
import { toast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";

export function useUsers() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Fetch profiles and roles in parallel for faster loading
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, email, status, avatar_url, created_at, last_login")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("user_roles")
          .select("user_id, role"),
      ]);

      if (profilesResult.error) {
        console.error("Error fetching profiles:", profilesResult.error);
        throw profilesResult.error;
      }

      const profiles = profilesResult.data || [];
      const roles = rolesResult.data || [];
      
      // Create a role map for O(1) lookup
      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));

      return profiles.map((profile: any) => ({
        id: profile.id,
        name: profile.name || "",
        email: profile.email,
        role: (roleMap.get(profile.id) || "viewer") as AppRole,
        status: profile.status || "active",
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
        lastLogin: profile.last_login,
      })) as User[];
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Check if user already has a role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update user role", error.message);
    },
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "active" | "inactive" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update user status", error.message);
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      // Security check: Only admins can assign admin role
      if (data.role === 'admin' && currentUser?.role !== 'admin') {
        throw new Error("Only administrators can assign the admin role");
      }

      // Get current role before updating (needed for self-promotion check)
      let currentRole: AppRole | null = null;
      if (data.role && userId === currentUser?.id) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        currentRole = existingRole?.role as AppRole | null;
      }

      // Security check: Users cannot promote themselves to admin
      // But allow admins to keep their admin role when editing their own profile
      if (data.role === 'admin' && userId === currentUser?.id && currentRole !== 'admin') {
        throw new Error("You cannot promote yourself to administrator");
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          status: data.status,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update role if provided
      if (data.role) {
        const { data: existing } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: data.role })
            .eq("user_id", userId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: data.role });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update user", error.message);
    },
  });

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    updateUserRole: updateUserRole.mutateAsync,
    updateUserStatus: updateUserStatus.mutateAsync,
    updateUser: updateUser.mutateAsync,
  };
}
