import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityLog, ActivityModule, ActivityActionType } from "@/types/activityLog";

export function useActivityLogs() {
  const queryClient = useQueryClient();

  const activityLogsQuery = useQuery({
    queryKey: ["activityLogs"],
    queryFn: async () => {
      // Fetch logs with user info
      // Use column name instead of constraint name for more robust relationship query
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          user:profiles!user_id(id, name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(200); // Increased limit

      if (error) {
        console.error("Error fetching activity logs:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No activity logs found in database");
        return [];
      }

      return data.map((log: any) => ({
        id: log.id,
        module: log.module as ActivityModule,
        actionType: (log.action_type || log.action) as ActivityActionType,
        description: log.description || log.action || "Activity performed",
        userId: log.user_id,
        userName: log.user?.name || "Unknown User",
        userEmail: log.user?.email || "",
        timestamp: new Date(log.timestamp || log.created_at),
        metadata: {
          entityId: log.entity_id,
          entityType: log.entity_type,
          ...(log.metadata || {}),
        },
      })) as ActivityLog[];
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const createActivityLog = useMutation({
    mutationFn: async (logData: {
      module: ActivityModule;
      actionType: ActivityActionType;
      description: string;
      entityType?: string;
      entityId?: string;
      metadata?: any;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("Cannot create activity log: User not authenticated");
        // Return a resolved promise with null to complete the mutation lifecycle
        // This prevents the mutation from hanging while not breaking the app
        return null;
      }

      const insertData: any = {
        user_id: user.id,
        action: logData.actionType,
        action_type: logData.actionType,
        module: logData.module,
        description: logData.description,
      };

      if (logData.entityType) {
        insertData.entity_type = logData.entityType;
      }
      if (logData.entityId) {
        insertData.entity_id = logData.entityId;
      }
      if (logData.metadata) {
        insertData.metadata = logData.metadata;
      }

      const { data, error } = await supabase.from("activity_logs").insert(insertData).select().single();

      if (error) {
        console.error("Error creating activity log:", error);
        // Return null instead of throwing - activity logging should not break the app
        // But the mutation promise is properly resolved
        return null;
      }

      // Invalidate queries on success
      queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
      return data;
    },
  });

  return {
    activityLogs: activityLogsQuery.data ?? [],
    isLoading: activityLogsQuery.isLoading,
    error: activityLogsQuery.error,
    createActivityLog: createActivityLog.mutateAsync,
  };
}

