import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, TransactionType } from "@/types/transaction";
import { toast } from "@/lib/toast";
import { useActivityLogs } from "@/hooks/useActivityLog";

export function useTransactions() {
  const queryClient = useQueryClient();
  const { createActivityLog } = useActivityLogs();

  // Initial data fetch on mount
  useEffect(() => {
    console.log("[useTransactions] Hook mounted, checking connection...");
    
    // Test connection
    supabase.from("transactions").select("count", { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          console.error("[useTransactions] Connection test failed:", error);
        } else {
          console.log("[useTransactions] Connection OK, transactions count:", count);
        }
      });
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        async (payload) => {
          console.log('[useTransactions] Realtime change detected:', payload.eventType);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["transactions"] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
            queryClient.invalidateQueries({ queryKey: ["accounts"] }),
          ]);
          await Promise.all([
            queryClient.refetchQueries({ queryKey: ["transactions"] }),
            queryClient.refetchQueries({ queryKey: ["accounts"] }),
          ]);
        }
      )
      .subscribe((status) => {
        console.log("[useTransactions] Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      console.log("[useTransactions] Fetching transactions...");
      
      // Try with join first, fallback to simple query if it fails
      let data: any[] | null = null;
      let error: any = null;
      
      try {
        const result = await supabase
          .from("transactions")
          .select(`
            *,
            account_from_data:accounts!transactions_account_from_fkey(id, name, code),
            account_to_data:accounts!transactions_account_to_fkey(id, name, code)
          `)
          .order("date", { ascending: false });
        
        data = result.data;
        error = result.error;
      } catch (e) {
        console.warn("[useTransactions] Join query failed, trying simple query:", e);
        // Fallback to simple query without joins
        const result = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("[useTransactions] Error fetching transactions:", error);
        throw error;
      }
      
      console.log("[useTransactions] Fetched transactions:", data?.length || 0);

      if (!data || data.length === 0) {
        console.log("[useTransactions] No transactions found");
        return [];
      }

      return data.map((t: any) => ({
        id: t.id,
        date: t.date,
        type: t.type as TransactionType,
        accountFrom: t.account_from_data?.name || "",
        accountTo: t.account_to_data?.name || "",
        accountFromId: t.account_from,
        accountToId: t.account_to,
        description: t.description,
        amount: Number(t.amount) || 0,
        reference: t.reference,
        status: t.status,
        notes: t.notes,
        createdAt: t.created_at,
        createdBy: t.created_by,
        updatedAt: t.updated_at,
      })) as Transaction[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });

  const createTransaction = useMutation({
    mutationFn: async (transactionData: Partial<Transaction>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Build insert object with all transaction fields
      const insertData: any = {
        date: transactionData.date,
        type: transactionData.type,
        description: transactionData.description,
        amount: transactionData.amount,
        reference: transactionData.reference,
        notes: transactionData.notes,
        status: transactionData.status || "pending",
        created_by: user.id,
      };

      // Add account IDs if provided (for double-entry bookkeeping)
      // Both accounts are required for proper double-entry bookkeeping
      let accountFromId: string | null = null;
      let accountToId: string | null = null;

      // Resolve account_from
      if (transactionData.accountFromId) {
        accountFromId = transactionData.accountFromId;
      } else if (transactionData.accountFrom) {
        // If account name is provided, try to resolve it to an ID
        try {
          const { data: fromAccount, error: fromError } = await supabase
            .from("accounts")
            .select("id")
            .eq("name", transactionData.accountFrom)
            .maybeSingle();
          
          if (fromError) {
            throw new Error(`Failed to lookup account "${transactionData.accountFrom}": ${fromError.message}`);
          }
          
          if (!fromAccount) {
            throw new Error(`Account "${transactionData.accountFrom}" not found`);
          }
          
          accountFromId = fromAccount.id;
        } catch (error) {
          // Re-throw with more context
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(`Failed to resolve account "${transactionData.accountFrom}"`);
        }
      }

      // Resolve account_to
      if (transactionData.accountToId) {
        accountToId = transactionData.accountToId;
      } else if (transactionData.accountTo) {
        // If account name is provided, try to resolve it to an ID
        try {
          const { data: toAccount, error: toError } = await supabase
            .from("accounts")
            .select("id")
            .eq("name", transactionData.accountTo)
            .maybeSingle();
          
          if (toError) {
            throw new Error(`Failed to lookup account "${transactionData.accountTo}": ${toError.message}`);
          }
          
          if (!toAccount) {
            throw new Error(`Account "${transactionData.accountTo}" not found`);
          }
          
          accountToId = toAccount.id;
        } catch (error) {
          // Re-throw with more context
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(`Failed to resolve account "${transactionData.accountTo}"`);
        }
      }

      // Validate that both accounts are present for double-entry bookkeeping
      // (Some transaction types might not require both accounts, but most do)
      if (accountFromId && accountToId) {
        // Prevent creating transactions with the same account in both fields
        if (accountFromId === accountToId) {
          throw new Error("Cannot create transaction with the same account in both 'from' and 'to' fields");
        }
        insertData.account_from = accountFromId;
        insertData.account_to = accountToId;
      } else if (accountFromId || accountToId) {
        // If only one account is provided, warn but allow (some transaction types might be single-entry)
        if (accountFromId) {
          insertData.account_from = accountFromId;
        }
        if (accountToId) {
          insertData.account_to = accountToId;
        }
        console.warn("Transaction created with only one account (not double-entry)", {
          accountFromId,
          accountToId,
          type: transactionData.type,
        });
      }

      const { data, error } = await supabase
        .from("transactions")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Create activity log entry
      await createActivityLog({
        module: "transactions",
        actionType: "create",
        description: `Transaction created: ${data.description || data.type} - ${data.amount} MRU`,
        entityType: "transaction",
        entityId: data.id,
        metadata: {
          type: data.type,
          amount: data.amount,
          reference: data.reference,
          status: data.status,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["activityLogs"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["transactions"] });
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
      toast.success("Transaction created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create transaction", error.message);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          date: data.date,
          type: data.type,
          description: data.description,
          amount: data.amount,
          reference: data.reference,
          notes: data.notes,
          status: data.status,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      // Create activity log entry
      await createActivityLog({
        module: "transactions",
        actionType: "update",
        description: `Transaction updated: ${variables.data.description || variables.data.type || "Transaction"}`,
        entityType: "transaction",
        entityId: variables.id,
        metadata: {
          type: variables.data.type,
          amount: variables.data.amount,
          status: variables.data.status,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["activityLogs"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["transactions"] });
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
      toast.success("Transaction updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update transaction", error.message);
    },
  });

  const deleteTransactions = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("transactions").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: async (_, ids) => {
      // Create activity log entry for each deleted transaction
      for (const id of ids) {
        await createActivityLog({
          module: "transactions",
          actionType: "delete",
          description: `Transaction deleted`,
          entityType: "transaction",
          entityId: id,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["activityLogs"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["transactions"] });
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
      toast.success(`${ids.length} transaction(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete transactions", error.message);
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: "pending" | "posted" | "reconciled" | "void" }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: async (_, { ids, status }) => {
      // Create activity log entry for bulk status update
      await createActivityLog({
        module: "transactions",
        actionType: "update",
        description: `Bulk status update: ${ids.length} transaction(s) set to ${status}`,
        entityType: "transaction",
        metadata: {
          count: ids.length,
          status,
          transactionIds: ids,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["activityLogs"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["transactions"] });
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
      toast.success(`${ids.length} transaction(s) updated successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to update transactions", error.message);
    },
  });

  // Memoize refetch function to prevent unnecessary re-renders
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    return queryClient.refetchQueries({ queryKey: ["transactions"] });
  }, [queryClient]);

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    refetch,
    createTransaction: createTransaction.mutateAsync,
    updateTransaction: updateTransaction.mutateAsync,
    deleteTransactions: deleteTransactions.mutateAsync,
    bulkUpdateStatus: bulkUpdateStatus.mutateAsync,
  };
}
