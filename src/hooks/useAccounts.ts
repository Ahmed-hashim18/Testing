import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Account, AccountType, AccountStatus } from "@/types/account";
import { toast } from "@/lib/toast";
import { useActivityLogs } from "./useActivityLog";

export function useAccounts() {
  const queryClient = useQueryClient();
  const { createActivityLog } = useActivityLogs();

  // Initial data fetch on mount
  useEffect(() => {
    console.log("[useAccounts] Hook mounted, checking connection...");
    
    // Test connection
    supabase.from("accounts").select("count", { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          console.error("[useAccounts] Connection test failed:", error);
        } else {
          console.log("[useAccounts] Connection OK, accounts count:", count);
        }
      });
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts'
        },
        async (payload) => {
          console.log('[useAccounts] Realtime change detected:', payload.eventType);
          await queryClient.invalidateQueries({ queryKey: ["accounts"] });
          await queryClient.refetchQueries({ queryKey: ["accounts"] });
        }
      )
      .subscribe((status) => {
        console.log("[useAccounts] Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      console.log("[useAccounts] Fetching accounts...");
      
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("code");

      if (error) {
        console.error("[useAccounts] Error fetching accounts:", error);
        throw error;
      }
      
      console.log("[useAccounts] Fetched accounts:", data?.length || 0);
      
      if (!data || data.length === 0) {
        console.log("[useAccounts] No accounts found in database");
        return [];
      }
      
      // Map database enum values to AccountType (capitalize first letter)
      const typeMap: Record<string, AccountType> = {
        'asset': 'Assets',
        'liability': 'Liabilities',
        'equity': 'Equity',
        'revenue': 'Revenue',
        'expense': 'Expenses',
      };
      
      const mappedAccounts = data.map((acc) => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: typeMap[acc.account_type] || 'Assets' as AccountType,
        parentId: acc.parent_id,
        balance: Number(acc.balance) || 0,
        description: acc.description,
        status: acc.status as AccountStatus,
        isImported: acc.is_imported || false,
        createdAt: new Date(acc.created_at),
        updatedAt: new Date(acc.updated_at),
      })) as Account[];
      
      console.log("[useAccounts] Mapped accounts:", mappedAccounts.length);
      return mappedAccounts;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });

  const createAccount = useMutation({
    mutationFn: async (accountData: Partial<Account>) => {
      // Map AccountType to database enum values (lowercase)
      const typeMap: Record<string, string> = {
        'Assets': 'asset',
        'Liabilities': 'liability',
        'Equity': 'equity',
        'Revenue': 'revenue',
        'Expenses': 'expense',
      };
      
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          code: accountData.code,
          name: accountData.name,
          account_type: typeMap[accountData.type || 'Assets'] || 'asset',
          parent_id: accountData.parentId,
          balance: accountData.balance || 0,
          description: accountData.description,
          status: accountData.status || "active",
        })
        .select()
        .single();

      if (error) throw error;
      
      // Create activity log
      try {
        await createActivityLog({
          module: "accounts",
          actionType: "create",
          description: `Created account ${accountData.code} - ${accountData.name}`,
          entityType: "account",
          entityId: data.id,
          metadata: {
            code: accountData.code,
            name: accountData.name,
            type: accountData.type,
          },
        });
      } catch (logError) {
        console.error("Error creating activity log:", logError);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] }); // Force immediate refetch
      toast.success("Account created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create account", error.message);
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Account> }) => {
      // Map AccountType to database enum values (lowercase)
      const typeMap: Record<string, string> = {
        'Assets': 'asset',
        'Liabilities': 'liability',
        'Equity': 'equity',
        'Revenue': 'revenue',
        'Expenses': 'expense',
      };
      
      // Get account data before update for activity log
      const { data: accountBefore } = await supabase
        .from("accounts")
        .select("code, name")
        .eq("id", id)
        .single();
      
      const updateData: any = {
        code: data.code,
        name: data.name,
        parent_id: data.parentId,
        balance: data.balance,
        description: data.description,
        status: data.status,
      };
      
      if (data.type) {
        updateData.account_type = typeMap[data.type] || 'asset';
      }
      
      const { error } = await supabase
        .from("accounts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      
      // Create activity log
      try {
        await createActivityLog({
          module: "accounts",
          actionType: "update",
          description: `Updated account ${accountBefore?.code || id} - ${accountBefore?.name || ''}`,
          entityType: "account",
          entityId: id,
          metadata: {
            changes: Object.keys(data),
          },
        });
      } catch (logError) {
        console.error("Error creating activity log:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] }); // Force immediate refetch
      toast.success("Account updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update account", error.message);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      // Check if account is imported
      const { data: account, error: fetchError } = await supabase
        .from("accounts")
        .select("is_imported")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (account?.is_imported) {
        throw new Error("No se puede eliminar una cuenta importada. Las cuentas importadas son permanentes.");
      }

      // Get account data before deletion for activity log
      const { data: accountBefore } = await supabase
        .from("accounts")
        .select("code, name")
        .eq("id", id)
        .single();
      
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
      
      // Create activity log
      try {
        await createActivityLog({
          module: "accounts",
          actionType: "delete",
          description: `Deleted account ${accountBefore?.code || id} - ${accountBefore?.name || ''}`,
          entityType: "account",
          entityId: id,
          metadata: {
            code: accountBefore?.code,
            name: accountBefore?.name,
          },
        });
      } catch (logError) {
        console.error("Error creating activity log:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] }); // Force immediate refetch
      toast.success("Account deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete account", error.message);
    },
  });

  const bulkDeleteAccounts = useMutation({
    mutationFn: async (ids: string[]) => {
      // Check if any account is imported
      const { data: accounts, error: fetchError } = await supabase
        .from("accounts")
        .select("id, code, is_imported")
        .in("id", ids);

      if (fetchError) throw fetchError;

      const importedAccounts = accounts?.filter(acc => acc.is_imported) || [];
      if (importedAccounts.length > 0) {
        const importedCodes = importedAccounts.map(acc => acc.code).join(', ');
        throw new Error(`No se pueden eliminar cuentas importadas: ${importedCodes}. Las cuentas importadas son permanentes.`);
      }

      // Get accounts before deletion for activity log
      const { data: accountsBefore } = await supabase
        .from("accounts")
        .select("id, code, name")
        .in("id", ids);
      
      const { error } = await supabase.from("accounts").delete().in("id", ids);
      if (error) throw error;
      
      // Create activity log for each deleted account
      if (accountsBefore) {
        for (const account of accountsBefore) {
          try {
            await createActivityLog({
              module: "accounts",
              actionType: "delete",
              description: `Deleted account ${account.code} - ${account.name}`,
              entityType: "account",
              entityId: account.id,
              metadata: {
                code: account.code,
                name: account.name,
              },
            });
          } catch (logError) {
            console.error("Error creating activity log:", logError);
          }
        }
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] }); // Force immediate refetch
      toast.success(`${ids.length} account(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete accounts", error.message);
    },
  });

  const importAccounts = useMutation({
    mutationFn: async (accountsData: Partial<Account>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Map AccountType to database enum values (lowercase)
      const typeMap: Record<string, string> = {
        'Assets': 'asset',
        'Liabilities': 'liability',
        'Equity': 'equity',
        'Revenue': 'revenue',
        'Expenses': 'expense',
      };

      // Step 1: Resolve parent IDs that exist in database (non-batch)
      // First, fetch all existing accounts to build code map
      const { data: existingAccountsData } = await supabase
        .from("accounts")
        .select("id, code");
      
      const existingCodeToIdMap = new Map<string, string>();
      if (existingAccountsData) {
        existingAccountsData.forEach((acc: any) => {
          existingCodeToIdMap.set(acc.code.toLowerCase(), acc.id);
        });
      }

      // Step 2: Prepare accounts for insert - store parentCode for accounts that need batch resolution
      const accountsWithParentCodes: Array<{ accountIndex: number; parentCode: string }> = [];
      const accountsToInsert = accountsData.map((acc, index) => {
        let parentId = acc.parentId || null;
        let parentCode: string | undefined = undefined;
        
        // If parentId is not set but we have parentCode in the data (from CSV), store it
        if (!parentId && (acc as any).parentCode) {
          parentCode = (acc as any).parentCode;
          // Check if parent exists in existing accounts
          const existingParentId = existingCodeToIdMap.get(parentCode.toLowerCase());
          if (existingParentId) {
            parentId = existingParentId;
            parentCode = undefined; // Already resolved
          } else {
            accountsWithParentCodes.push({ accountIndex: index, parentCode });
          }
        } else if (parentId && !parentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // If parentId looks like a code, check existing accounts
          const existingParentId = existingCodeToIdMap.get(parentId.toLowerCase());
          if (existingParentId) {
            parentId = existingParentId;
          } else {
            parentCode = parentId; // Store code for later resolution
            accountsWithParentCodes.push({ accountIndex: index, parentCode });
            parentId = null;
          }
        }

        const insertData = {
          code: acc.code,
          name: acc.name,
          account_type: typeMap[acc.type || 'Assets'] || 'asset',
          parent_id: parentId, // Will be null for batch-resolved parents
          balance: acc.balance || 0,
          description: acc.description || null,
          status: acc.status || "active",
          is_imported: true,
          created_by: user.id,
        };

        return insertData;
      });

      // Step 2: Insert all accounts first (without parent_id for batch accounts)
      const { data: insertedAccounts, error: insertError } = await supabase
        .from("accounts")
        .insert(accountsToInsert)
        .select("id, code");

      if (insertError) throw insertError;
      if (!insertedAccounts) throw new Error("Failed to insert accounts");

      // Step 3: Build code -> id map from inserted accounts AND existing accounts
      const codeToIdMap = new Map<string, string>();
      insertedAccounts.forEach((acc: any) => {
        codeToIdMap.set(acc.code.toLowerCase(), acc.id);
      });

      // Also fetch all existing accounts to build complete map
      const { data: allAccounts } = await supabase
        .from("accounts")
        .select("id, code");
      
      if (allAccounts) {
        allAccounts.forEach((acc: any) => {
          codeToIdMap.set(acc.code.toLowerCase(), acc.id);
        });
      }

      // Step 4: Update parent_id for accounts that need it
      const updates = accountsWithParentCodes
        .filter(({ parentCode }) => {
          const parentId = codeToIdMap.get(parentCode.toLowerCase());
          if (!parentId) {
            console.warn(`Parent account with code "${parentCode}" not found`);
            return false;
          }
          return true;
        })
        .map(({ accountIndex, parentCode }) => {
          const account = accountsToInsert[accountIndex];
          return {
            id: codeToIdMap.get(account.code.toLowerCase())!,
            parent_id: codeToIdMap.get(parentCode.toLowerCase())!,
          };
        });

      // Batch update parent_ids
      if (updates.length > 0) {
        // Update in batches to avoid overwhelming the database
        const batchSize = 50;
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          await Promise.all(
            batch.map((update) =>
              supabase
                .from("accounts")
                .update({ parent_id: update.parent_id })
                .eq("id", update.id)
            )
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] }); // Force immediate refetch
      toast.success("Accounts imported successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to import accounts", error.message);
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: AccountStatus }) => {
      const { error } = await supabase
        .from("accounts")
        .update({ status })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.refetchQueries({ queryKey: ["accounts"] }); // Force immediate refetch
      toast.success(`${ids.length} account(s) updated successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to update accounts", error.message);
    },
  });

  // Memoize refetch function to prevent unnecessary re-renders
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    return queryClient.refetchQueries({ queryKey: ["accounts"] });
  }, [queryClient]);

  return {
    accounts: accountsQuery.data ?? [],
    isLoading: accountsQuery.isLoading,
    error: accountsQuery.error,
    refetch,
    createAccount: createAccount.mutateAsync,
    updateAccount: updateAccount.mutateAsync,
    deleteAccount: deleteAccount.mutateAsync,
    bulkDeleteAccounts: bulkDeleteAccounts.mutateAsync,
    bulkUpdateStatus: bulkUpdateStatus.mutateAsync,
    importAccounts: importAccounts.mutateAsync,
  };
}
