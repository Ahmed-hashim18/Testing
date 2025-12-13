import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, TransactionType } from "@/types/transaction";
import { toast } from "@/lib/toast";
import { useActivityLogs } from "@/hooks/useActivityLog";
import { transactionSchema } from "@/lib/validations/transaction";
import { z } from "zod";

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
            account_to_data:accounts!transactions_account_to_fkey(id, name, code),
            creator:profiles!created_by(id, name, email)
          `)
          .order("date", { ascending: false });
        
        data = result.data;
        error = result.error;
      } catch (e) {
        console.warn("[useTransactions] Join query failed, trying simple query:", e);
        // Fallback to simple query without joins
        const result = await supabase
          .from("transactions")
          .select(`
            *,
            creator:profiles!created_by(id, name, email)
          `)
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

      return data.map((t: any) => {
        // Get creator name or fallback to ID
        const createdByName = t.creator?.name || t.creator?.email || t.created_by || "System";
        
        return {
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
          createdBy: createdByName,
          updatedAt: t.updated_at,
        };
      }) as Transaction[];
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

      // Helper function to check if a string is a UUID
      const isUUID = (str: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      // Add account IDs if provided (for double-entry bookkeeping)
      // Both accounts are required for proper double-entry bookkeeping
      let accountFromId: string | null = null;
      let accountToId: string | null = null;

      // Resolve account_from
      if (transactionData.accountFromId) {
        accountFromId = transactionData.accountFromId;
      } else if (transactionData.accountFrom) {
        // Check if accountFrom is already a UUID (ID), if so use it directly
        if (isUUID(transactionData.accountFrom)) {
          // Verify the account exists
          const { data: fromAccount, error: fromError } = await supabase
            .from("accounts")
            .select("id")
            .eq("id", transactionData.accountFrom)
            .maybeSingle();
          
          if (fromError) {
            throw new Error(`Failed to lookup account ID "${transactionData.accountFrom}": ${fromError.message}`);
          }
          
          if (!fromAccount) {
            throw new Error(`Account "${transactionData.accountFrom}" not found`);
          }
          
          // Check if this account is a parent (has children) - if so, reject
          const { data: children, error: childrenError } = await supabase
            .from("accounts")
            .select("id")
            .eq("parent_id", fromAccount.id)
            .limit(1);
          
          if (childrenError) {
            console.warn("Error checking for child accounts:", childrenError);
          }
          
          if (children && children.length > 0) {
            throw new Error(`Account "${transactionData.accountFrom}" is a parent account and cannot be used in transactions. Please select a leaf account.`);
          }
          
          accountFromId = transactionData.accountFrom;
        } else {
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
          
          // Check if this account is a parent (has children) - if so, reject
          const { data: children, error: childrenError } = await supabase
            .from("accounts")
            .select("id")
            .eq("parent_id", fromAccount.id)
            .limit(1);
          
          if (childrenError) {
            console.warn("Error checking for child accounts:", childrenError);
          }
          
          if (children && children.length > 0) {
            throw new Error(`Account "${transactionData.accountFrom}" is a parent account and cannot be used in transactions. Please select a leaf account.`);
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
      }

      // Resolve account_to
      if (transactionData.accountToId) {
        accountToId = transactionData.accountToId;
      } else if (transactionData.accountTo) {
        // Check if accountTo is already a UUID (ID), if so use it directly
        if (isUUID(transactionData.accountTo)) {
          // Verify the account exists and is a leaf account (not a parent)
          const { data: toAccount, error: toError } = await supabase
            .from("accounts")
            .select("id")
            .eq("id", transactionData.accountTo)
            .maybeSingle();
          
          if (toError) {
            throw new Error(`Failed to lookup account ID "${transactionData.accountTo}": ${toError.message}`);
          }
          
          if (!toAccount) {
            throw new Error(`Account "${transactionData.accountTo}" not found`);
          }
          
          // Check if this account is a parent (has children) - if so, reject
          const { data: children, error: childrenError } = await supabase
            .from("accounts")
            .select("id")
            .eq("parent_id", toAccount.id)
            .limit(1);
          
          if (childrenError) {
            console.warn("Error checking for child accounts:", childrenError);
          }
          
          if (children && children.length > 0) {
            throw new Error(`Account "${transactionData.accountTo}" is a parent account and cannot be used in transactions. Please select a leaf account.`);
          }
          
          accountToId = transactionData.accountTo;
        } else {
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

  const bulkImportTransactions = useMutation({
    mutationFn: async (transactionsData: Partial<Transaction>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Validate all transactions first
      for (const txnData of transactionsData) {
        try {
          transactionSchema.parse(txnData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
          }
          throw error;
        }
      }

      // Resolve all account IDs
      const accountByName = new Map<string, string>();
      const accountByCode = new Map<string, string>();
      const { data: allAccounts } = await supabase.from("accounts").select("id, name, code");
      
      if (allAccounts) {
        allAccounts.forEach(acc => {
          accountByName.set(acc.name.toLowerCase(), acc.id);
          if (acc.code) {
            accountByCode.set(acc.code.toLowerCase(), acc.id);
          }
        });
      }

      // Find leaf accounts
      const { data: allAccountsWithChildren } = await supabase.from("accounts").select("id, parent_id");
      const childrenMap = new Map<string, string[]>();
      allAccountsWithChildren?.forEach(acc => {
        if (acc.parent_id) {
          if (!childrenMap.has(acc.parent_id)) {
            childrenMap.set(acc.parent_id, []);
          }
          childrenMap.get(acc.parent_id)!.push(acc.id);
        }
      });
      const leafAccountIds = new Set(
        allAccountsWithChildren
          ?.filter(acc => !childrenMap.has(acc.id))
          .map(acc => acc.id) || []
      );

      // Prepare insert data
      const insertData = await Promise.all(transactionsData.map(async (txnData) => {
        let accountFromId: string | null = null;
        let accountToId: string | null = null;

        if (txnData.accountFrom) {
          accountFromId = accountByName.get(txnData.accountFrom.toLowerCase()) || 
                         accountByCode.get(txnData.accountFrom.toLowerCase()) ||
                         txnData.accountFromId || null;
          
          if (accountFromId && !leafAccountIds.has(accountFromId)) {
            throw new Error(`Account "${txnData.accountFrom}" is a parent account and cannot be used`);
          }
        }

        if (txnData.accountTo) {
          accountToId = accountByName.get(txnData.accountTo.toLowerCase()) || 
                       accountByCode.get(txnData.accountTo.toLowerCase()) ||
                       txnData.accountToId || null;
          
          if (accountToId && !leafAccountIds.has(accountToId)) {
            throw new Error(`Account "${txnData.accountTo}" is a parent account and cannot be used`);
          }
        }

        if (txnData.type === 'transfer' && accountFromId && accountToId && accountFromId === accountToId) {
          throw new Error('From and To accounts must be different for transfer transactions');
        }

        return {
          date: txnData.date,
          type: txnData.type,
          description: txnData.description,
          amount: txnData.amount,
          status: txnData.status || 'pending',
          reference: txnData.reference || null,
          notes: txnData.notes || null,
          account_from: accountFromId,
          account_to: accountToId,
          created_by: user.id,
        };
      }));

      // Insert all transactions in a single database transaction
      const { data, error } = await supabase
        .from("transactions")
        .insert(insertData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Create activity log entry
      await createActivityLog({
        module: "transactions",
        actionType: "import",
        description: `Imported ${data.length} transaction(s) from CSV`,
        entityType: "transaction",
        metadata: {
          count: data.length,
          transactionIds: data.map(t => t.id),
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
      toast.success(`${data.length} transaction(s) imported successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to import transactions", error.message);
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
    bulkImportTransactions: bulkImportTransactions.mutateAsync,
  };
}
