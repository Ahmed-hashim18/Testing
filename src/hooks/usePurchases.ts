import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseStatus } from "@/types/purchase";
import { toast } from "@/lib/toast";
import { useActivityLogs } from "./useActivityLog";

export function usePurchases() {
  const queryClient = useQueryClient();
  const { createActivityLog } = useActivityLogs();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('purchases_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_orders'
        },
        (payload) => {
          console.log('Purchase order change detected:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["purchases"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["products"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const purchasesQuery = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          vendor:vendors(id, name),
          line_items:purchase_line_items(
            id,
            product_id,
            product:products(name),
            quantity,
            unit_price,
            total
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((po) => ({
        id: po.id,
        orderNumber: po.order_number,
        date: po.date,
        vendorId: po.vendor_id,
        vendorName: po.vendor?.name || "",
        status: po.status as PurchaseStatus,
        lineItems: po.line_items.map((li: any) => ({
          id: li.id,
          productId: li.product_id,
          productName: li.product?.name || "",
          quantity: li.quantity,
          unitPrice: li.unit_price,
          total: li.total,
        })),
        subtotal: po.subtotal,
        tax: po.tax,
        taxRate: po.tax_rate,
        total: po.total,
        amountPaid: po.amount_paid,
        balance: po.balance,
        notes: po.notes,
        receivedDate: po.received_date,
        paymentDate: po.payment_date,
        createdAt: po.created_at,
        createdBy: po.created_by,
      })) as PurchaseOrder[];
    },
  });

  const createPurchase = useMutation({
    mutationFn: async (purchaseData: Partial<PurchaseOrder>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: purchaseOrder, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          order_number: purchaseData.orderNumber,
          date: purchaseData.date,
          vendor_id: purchaseData.vendorId,
          status: purchaseData.status,
          subtotal: purchaseData.subtotal,
          tax: purchaseData.tax,
          tax_rate: purchaseData.taxRate,
          total: purchaseData.total,
          amount_paid: purchaseData.amountPaid || 0,
          balance: purchaseData.balance || purchaseData.total,
          notes: purchaseData.notes,
          received_date: purchaseData.receivedDate,
          payment_date: purchaseData.paymentDate,
          created_by: user.id,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Insert line items and update inventory
      if (purchaseData.lineItems && purchaseData.lineItems.length > 0) {
        const { error: lineItemsError } = await supabase
          .from("purchase_line_items")
          .insert(
            purchaseData.lineItems.map((item) => ({
              purchase_order_id: purchaseOrder.id,
              product_id: item.productId,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.total,
            }))
          );

        if (lineItemsError) throw lineItemsError;

        // Update inventory - increase stock for each product
        for (const item of purchaseData.lineItems) {
          // Get current stock
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("current_stock")
            .eq("id", item.productId)
            .single();

          if (productError) {
            console.error(`Error fetching product ${item.productId}:`, productError);
            continue;
          }

          const newStock = (product.current_stock || 0) + item.quantity;

          // Update product stock
          const { error: updateError } = await supabase
            .from("products")
            .update({ current_stock: newStock })
            .eq("id", item.productId);

          if (updateError) {
            console.error(`Error updating stock for product ${item.productId}:`, updateError);
          }

          // Record stock movement
          await supabase.from("stock_movements").insert({
            product_id: item.productId,
            movement_type: "in",
            quantity: item.quantity,
            reference_type: "purchase",
            reference_id: purchaseOrder.id,
            notes: `Purchase order ${purchaseData.orderNumber}`,
            created_by: user.id,
          });
        }
      }

      // Create transaction for expense
      if (purchaseData.total && purchaseData.total > 0) {
        // Find cash account (vault) - where money comes FROM
        let cashAccountId: string | null = null;
        const { data: cashAccounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("account_type", "asset")
          .ilike("name", "%cash%")
          .limit(1);

        if (cashAccounts && cashAccounts.length > 0) {
          cashAccountId = cashAccounts[0].id;
        } else {
          // Try to find by code (common cash account codes)
          const { data: accountByCode } = await supabase
            .from("accounts")
            .select("id")
            .in("code", ["1110", "1010", "1000"])
            .eq("account_type", "asset")
            .limit(1)
            .maybeSingle();

          if (accountByCode) {
            cashAccountId = accountByCode.id;
          }
        }

        // Find expense account - where expense goes TO
        let expenseAccountId: string | null = null;
        const { data: expenseAccounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("account_type", "expense")
          .ilike("name", "%purchase%")
          .limit(1);

        if (expenseAccounts && expenseAccounts.length > 0) {
          expenseAccountId = expenseAccounts[0].id;
        } else {
          // Try to find any expense account
          const { data: anyExpense } = await supabase
            .from("accounts")
            .select("id")
            .eq("account_type", "expense")
            .limit(1)
            .maybeSingle();

          if (anyExpense) {
            expenseAccountId = anyExpense.id;
          } else {
            // Try common expense account codes
            const { data: expenseByCode } = await supabase
              .from("accounts")
              .select("id")
              .in("code", ["5000", "5100", "5200", "6000"])
              .eq("account_type", "expense")
              .limit(1)
              .maybeSingle();

            if (expenseByCode) {
              expenseAccountId = expenseByCode.id;
            }
          }
        }

        // Create transaction with both accounts
        if (cashAccountId && expenseAccountId) {
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              date: purchaseData.date || new Date().toISOString().split("T")[0],
              type: "purchase",
              description: `Purchase order ${purchaseData.orderNumber} - ${purchaseData.vendorName || "vendor"}`,
              account_from: cashAccountId, // Cash account (source - money going out)
              account_to: expenseAccountId, // Expense account (destination - expense recorded)
              amount: purchaseData.total,
              status: "posted", // Use "posted" for completed purchases
              reference: purchaseData.orderNumber,
              notes: `Purchase from ${purchaseData.vendorName || "vendor"}`,
              created_by: user.id,
            });

          if (transactionError) {
            console.error("Error creating transaction:", transactionError);
          } else {
            // Update cash account balance (decrease)
            const { data: cashAccount } = await supabase
              .from("accounts")
              .select("balance")
              .eq("id", cashAccountId)
              .single();

            if (cashAccount) {
              // Allow negative balances for consistency with sales (cash can go negative in overdraft scenarios)
              // Both sales and purchases should follow the same balance calculation rules
              const newBalance = (cashAccount.balance || 0) - purchaseData.total;
              const { error: updateCashError } = await supabase
                .from("accounts")
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq("id", cashAccountId);
              
              if (updateCashError) {
                console.error("Error updating cash account balance:", updateCashError);
              }
            }

            // Update expense account balance
            // For Expense accounts: balance increases with debits (account_to = debit)
            // Since expense is account_to, it's debited, so balance should increase
            const { data: expenseAccount } = await supabase
              .from("accounts")
              .select("balance")
              .eq("id", expenseAccountId)
              .single();

            if (expenseAccount) {
              // Expense accounts increase with debits (when account_to)
              // The transaction has account_to = expense, so it's a debit to expense
              const newBalance = (expenseAccount.balance || 0) + purchaseData.total;
              const { error: updateExpenseError } = await supabase
                .from("accounts")
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq("id", expenseAccountId);
              
              if (updateExpenseError) {
                console.error("Error updating expense account balance:", updateExpenseError);
              }
            }
          }
        } else {
          console.warn("Could not find required accounts for transaction:", {
            cashAccountId,
            expenseAccountId,
          });
        }
      }

      // Create activity log
      try {
        await createActivityLog({
          module: "purchases",
          actionType: "create",
          description: `Created purchase order ${purchaseData.orderNumber} for ${purchaseData.total?.toFixed(2)} MRU`,
          entityType: "purchase_order",
          entityId: purchaseOrder.id,
          metadata: {
            orderNumber: purchaseData.orderNumber,
            total: purchaseData.total,
            vendorName: purchaseData.vendorName,
          },
        });
      } catch (logError) {
        console.error("Error creating activity log:", logError);
      }

      // Invalidate and refetch queries to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["vendors"] }),
      ]);
      
      // Force immediate refetch to ensure balances are updated
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["accounts"] }),
        queryClient.refetchQueries({ queryKey: ["transactions"] }),
      ]);

      return purchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase order created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create purchase order", error.message);
    },
  });

  const updatePurchase = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PurchaseOrder> }) => {
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({
          order_number: data.orderNumber,
          date: data.date,
          vendor_id: data.vendorId,
          status: data.status,
          subtotal: data.subtotal,
          tax: data.tax,
          tax_rate: data.taxRate,
          total: data.total,
          amount_paid: data.amountPaid,
          balance: data.balance,
          notes: data.notes,
          received_date: data.receivedDate,
          payment_date: data.paymentDate,
        })
        .eq("id", id);

      if (poError) throw poError;

      if (data.lineItems) {
        await supabase.from("purchase_line_items").delete().eq("purchase_order_id", id);

        if (data.lineItems.length > 0) {
          const { error: lineItemsError } = await supabase
            .from("purchase_line_items")
            .insert(
              data.lineItems.map((item) => ({
                purchase_order_id: id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.total,
              }))
            );

          if (lineItemsError) throw lineItemsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase order updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update purchase order", error.message);
    },
  });

  const deletePurchases = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("purchase_orders").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success(`${ids.length} purchase order(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete purchase orders", error.message);
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status, updateData }: { ids: string[]; status: PurchaseStatus; updateData?: Partial<PurchaseOrder> }) => {
      const updates: any = { status };
      
      if (updateData) {
        if (updateData.receivedDate) updates.received_date = updateData.receivedDate;
        if (updateData.paymentDate) updates.payment_date = updateData.paymentDate;
        if (updateData.amountPaid !== undefined) updates.amount_paid = updateData.amountPaid;
        if (updateData.balance !== undefined) updates.balance = updateData.balance;
      }

      const { error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success(`${ids.length} purchase order(s) updated successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to update purchase orders", error.message);
    },
  });

  return {
    purchases: purchasesQuery.data ?? [],
    isLoading: purchasesQuery.isLoading,
    error: purchasesQuery.error,
    createPurchase: createPurchase.mutateAsync,
    updatePurchase: updatePurchase.mutateAsync,
    deletePurchases: deletePurchases.mutateAsync,
    bulkUpdateStatus: bulkUpdateStatus.mutateAsync,
  };
}
