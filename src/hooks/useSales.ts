import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesOrder, LineItem } from "@/types/sale";
import { toast } from "sonner";
import { useActivityLogs } from "./useActivityLog";

export function useSales() {
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { createActivityLog } = useActivityLogs();

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch sales orders separately, then line items
      const { data: salesData, error: salesError } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customer:customers(id, name)
        `)
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      // Fetch line items for all sales
      const salesIds = (salesData || []).map(s => s.id);
      let lineItemsMap: Record<string, any[]> = {};
      
      if (salesIds.length > 0) {
        const { data: lineItems, error: lineItemsError } = await supabase
          .from("sales_line_items")
          .select(`
            *,
            product:products(name, sku)
          `)
          .in("sale_id", salesIds);
        
        if (!lineItemsError && lineItems) {
          lineItems.forEach(item => {
            if (!lineItemsMap[item.sale_id]) {
              lineItemsMap[item.sale_id] = [];
            }
            lineItemsMap[item.sale_id].push(item);
          });
        }
      }

      const mappedSales: SalesOrder[] = (salesData || []).map((sale) => ({
        id: sale.id,
        orderNumber: sale.order_number,
        customerId: sale.customer_id,
        customerName: sale.customer?.name || "",
        date: sale.order_date,
        dueDate: sale.order_date,
        status: sale.status,
        lineItems: (lineItemsMap[sale.id] || []).map((item: any): LineItem => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product?.name || "",
          sku: item.product?.sku || "",
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.total,
        })),
        subtotal: sale.subtotal,
        discountAmount: sale.discount_amount,
        taxAmount: sale.tax_amount,
        total: sale.total,
        paidAmount: sale.paid_amount || 0,
        balance: sale.balance,
        notes: sale.notes || undefined,
        createdAt: sale.created_at,
        updatedAt: sale.updated_at,
      }));

      setSales(mappedSales);
    } catch (error: any) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    fetchSales();

    // Subscribe to realtime changes on sales_orders table
    const channel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_orders'
        },
        (payload) => {
          console.log('Sales order change detected:', payload.eventType);
          // Refetch data on any change
          fetchSales();
          // Also invalidate related queries
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSales, queryClient]);

  const createSalesOrder = async (orderData: Partial<SalesOrder>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Insert sales order
      const { data: salesOrder, error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          order_number: orderData.orderNumber,
          customer_id: orderData.customerId,
          order_date: orderData.date,
          status: orderData.status || "draft",
          subtotal: orderData.subtotal,
          discount_amount: orderData.discountAmount,
          tax_amount: orderData.taxAmount,
          total: orderData.total,
          paid_amount: orderData.paidAmount || 0,
          balance: orderData.balance,
          notes: orderData.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update customer balance (increase by unpaid amount)
      if (orderData.customerId && orderData.balance && orderData.balance > 0) {
        const { data: customer } = await supabase
          .from("customers")
          .select("balance")
          .eq("id", orderData.customerId)
          .single();

        if (customer) {
          await supabase
            .from("customers")
            .update({ balance: (customer.balance || 0) + orderData.balance })
            .eq("id", orderData.customerId);
        }
      }

      // Insert line items and update inventory
      if (orderData.lineItems && orderData.lineItems.length > 0) {
        const lineItemsData = orderData.lineItems.map((item) => ({
          sale_id: salesOrder.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          total: item.total,
        }));

        const { error: lineItemsError } = await supabase
          .from("sales_line_items")
          .insert(lineItemsData);

        if (lineItemsError) throw lineItemsError;

        // Update inventory - decrease stock for each product
        for (const item of orderData.lineItems) {
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

          const newStock = Math.max(0, (product.current_stock || 0) - item.quantity);

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
            movement_type: "out",
            quantity: item.quantity,
            reference_type: "sale",
            reference_id: salesOrder.id,
            notes: `Sale order ${orderData.orderNumber}`,
            created_by: user.id,
          });
        }
      }

      // Create transaction for income
      if (orderData.total && orderData.total > 0) {
        // Find cash account (vault) - where money goes TO
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

        // Find revenue/income account - where income comes FROM
        let revenueAccountId: string | null = null;
        const { data: revenueAccounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("account_type", "revenue")
          .ilike("name", "%sales%")
          .limit(1);

        if (revenueAccounts && revenueAccounts.length > 0) {
          revenueAccountId = revenueAccounts[0].id;
        } else {
          // Try to find any revenue account
          const { data: anyRevenue } = await supabase
            .from("accounts")
            .select("id")
            .eq("account_type", "revenue")
            .limit(1)
            .maybeSingle();

          if (anyRevenue) {
            revenueAccountId = anyRevenue.id;
          } else {
            // Try common revenue account codes
            const { data: revenueByCode } = await supabase
              .from("accounts")
              .select("id")
              .in("code", ["4000", "4100", "4200"])
              .eq("account_type", "revenue")
              .limit(1)
              .maybeSingle();

            if (revenueByCode) {
              revenueAccountId = revenueByCode.id;
            }
          }
        }

        // Create transaction with both accounts
        // For sales: Cash (asset) increases (debit) and Revenue increases (credit)
        // According to GeneralLedger logic:
        // - Revenue as account_to = credit (increase) ✓ (line 101)
        // - Cash as account_to = debit (increase) ✓ (line 99)
        // But we can only have one account_to, so we need to choose.
        // The correct approach: account_from = cash, account_to = revenue
        // - Revenue as account_to will be credited (increased) ✓
        // - Cash as account_from will be credited (decreased) per GeneralLedger, but we manually increase it
        // This matches standard double-entry: Debit Cash, Credit Revenue
        if (cashAccountId && revenueAccountId) {
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              date: orderData.date || new Date().toISOString().split("T")[0],
              type: "sale",
              description: `Sale order ${orderData.orderNumber} - ${orderData.customerName || "customer"}`,
              account_from: cashAccountId, // Cash account (source)
              account_to: revenueAccountId, // Revenue account (destination) - will be credited (increased) per GeneralLedger
              amount: orderData.total,
              status: "posted",
              reference: orderData.orderNumber,
              notes: `Sale to ${orderData.customerName || "customer"}`,
              created_by: user.id,
            });

          if (transactionError) {
            console.error("Error creating transaction:", transactionError);
          } else {
            // Update cash account balance (increase)
            // Note: GeneralLedger would credit cash (decrease) when it's account_from,
            // but for sales we need cash to increase, so we manually increase it
            const { data: cashAccount } = await supabase
              .from("accounts")
              .select("balance")
              .eq("id", cashAccountId)
              .single();

            if (cashAccount) {
              const newBalance = (cashAccount.balance || 0) + orderData.total;
              const { error: updateCashError } = await supabase
                .from("accounts")
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq("id", cashAccountId);
              
              if (updateCashError) {
                console.error("Error updating cash account balance:", updateCashError);
              }
            }

            // Update revenue account balance (increase)
            // According to GeneralLedger: if account_to is revenue, it's credited (increased) ✓
            const { data: revenueAccount } = await supabase
              .from("accounts")
              .select("balance")
              .eq("id", revenueAccountId)
              .single();

            if (revenueAccount) {
              // Revenue accounts increase with credits when they are account_to
              const newBalance = (revenueAccount.balance || 0) + orderData.total;
              const { error: updateRevenueError } = await supabase
                .from("accounts")
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq("id", revenueAccountId);
              
              if (updateRevenueError) {
                console.error("Error updating revenue account balance:", updateRevenueError);
              }
            }
          }
        } else {
          console.warn("Could not find required accounts for transaction:", {
            cashAccountId,
            revenueAccountId,
          });
        }
      }

      // Create activity log
      try {
        await createActivityLog({
          module: "sales",
          actionType: "create",
          description: `Created sales order ${orderData.orderNumber} for ${orderData.total?.toFixed(2)} MRU`,
          entityType: "sales_order",
          entityId: salesOrder.id,
          metadata: {
            orderNumber: orderData.orderNumber,
            total: orderData.total,
            customerName: orderData.customerName,
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
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
      ]);
      
      // Force immediate refetch to ensure balances are updated
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["accounts"] }),
        queryClient.refetchQueries({ queryKey: ["customers"] }),
        queryClient.refetchQueries({ queryKey: ["transactions"] }),
      ]);

      toast.success("Sales order created successfully");
      await fetchSales();
      return salesOrder;
    } catch (error: any) {
      console.error("Error creating sales order:", error);
      toast.error(error.message || "Failed to create sales order");
      throw error;
    }
  };

  const updateSalesOrder = async (id: string, orderData: Partial<SalesOrder>) => {
    try {
      // Update sales order
      const { error: orderError } = await supabase
        .from("sales_orders")
        .update({
          customer_id: orderData.customerId,
          order_date: orderData.date,
          status: orderData.status,
          subtotal: orderData.subtotal,
          discount_amount: orderData.discountAmount,
          tax_amount: orderData.taxAmount,
          total: orderData.total,
          paid_amount: orderData.paidAmount,
          balance: orderData.balance,
          notes: orderData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (orderError) throw orderError;

      // Delete existing line items and insert new ones
      if (orderData.lineItems) {
        const { error: deleteError } = await supabase
          .from("sales_line_items")
          .delete()
          .eq("sale_id", id);

        if (deleteError) throw deleteError;

        if (orderData.lineItems.length > 0) {
          const lineItemsData = orderData.lineItems.map((item) => ({
            sale_id: id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            total: item.total,
          }));

          const { error: lineItemsError } = await supabase
            .from("sales_line_items")
            .insert(lineItemsData);

          if (lineItemsError) throw lineItemsError;
        }
      }

      toast.success("Sales order updated successfully");
      await fetchSales();
    } catch (error: any) {
      console.error("Error updating sales order:", error);
      toast.error(error.message || "Failed to update sales order");
      throw error;
    }
  };

  const deleteSalesOrders = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from("sales_orders")
        .delete()
        .in("id", ids);

      if (error) throw error;

      toast.success(`${ids.length} sales order(s) deleted successfully`);
      await fetchSales();
    } catch (error: any) {
      console.error("Error deleting sales orders:", error);
      toast.error(error.message || "Failed to delete sales orders");
      throw error;
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: string) => {
    try {
      // If status is "paid", we need to update paidAmount and balance as well
      if (status === "paid") {
        // Fetch orders to get their totals
        const { data: orders, error: fetchError } = await supabase
          .from("sales_orders")
          .select("id, total")
          .in("id", ids);

        if (fetchError) throw fetchError;

        // Update each order with correct paidAmount and balance
        for (const order of orders || []) {
          const { error } = await supabase
            .from("sales_orders")
            .update({ 
              status, 
              paid_amount: order.total,
              balance: 0,
              updated_at: new Date().toISOString() 
            })
            .eq("id", order.id);

          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("sales_orders")
          .update({ status, updated_at: new Date().toISOString() })
          .in("id", ids);

        if (error) throw error;
      }

      toast.success(`${ids.length} sales order(s) updated successfully`);
      await fetchSales();
    } catch (error: any) {
      console.error("Error updating sales order status:", error);
      toast.error(error.message || "Failed to update sales order status");
      throw error;
    }
  };

  return {
    sales,
    loading,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrders,
    bulkUpdateStatus,
    refetch: fetchSales,
  };
}
