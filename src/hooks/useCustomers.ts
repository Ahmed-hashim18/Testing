import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { toast } from "sonner";

export function useCustomers() {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        async (payload) => {
          console.log('Customer change detected:', payload.eventType);
          // Invalidate and immediately refetch for real-time updates
          await queryClient.invalidateQueries({ queryKey: ["customers"] });
          await queryClient.refetchQueries({ queryKey: ["customers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      return (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        city: c.city || "",
        country: c.country || "",
        taxId: c.tax_id || undefined,
        creditLimit: c.credit_limit || 0,
        balance: c.balance || 0,
        status: c.status as "active" | "inactive",
        createdAt: c.created_at,
      })) as Customer[];
    },
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchOnWindowFocus: true,
  });

  const generateCustomerCode = () => {
    const prefix = "CUST";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  };

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("customers")
        .insert({
          code: generateCustomerCode(),
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
          address: customerData.address || null,
          city: customerData.city || null,
          country: customerData.country || null,
          tax_id: customerData.taxId || null,
          credit_limit: customerData.creditLimit || 0,
          balance: customerData.balance || 0,
          status: customerData.status || "active",
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.refetchQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create customer: " + error.message);
    },
  });

  return {
    customers: customersQuery.data ?? [],
    loading: customersQuery.isLoading,
    error: customersQuery.error,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      return queryClient.refetchQueries({ queryKey: ["customers"] });
    },
    createCustomer: createCustomerMutation.mutateAsync,
  };
}
