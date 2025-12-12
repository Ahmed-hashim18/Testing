import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Vendor } from "@/types/vendor";
import { toast } from "sonner";

export function useVendors() {
  const queryClient = useQueryClient();

  const vendorsQuery = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name");

      if (error) throw error;
      
      // Map database fields to Vendor interface
      return (data || []).map((v: any) => ({
        id: v.id,
        code: v.code,
        name: v.name,
        email: v.email,
        phone: v.phone,
        address: v.address,
        city: v.city,
        country: v.country,
        taxId: v.tax_id,
        paymentTerms: v.payment_terms,
        creditLimit: v.credit_limit,
        status: v.status,
        createdAt: v.created_at,
      })) as Vendor[];
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async (vendorData: Partial<Vendor>) => {
      // Generate a unique vendor code if not provided
      let vendorCode = vendorData.code;
      if (!vendorCode) {
        // Generate code from name (first 3 letters uppercase + timestamp last 4 digits)
        const namePrefix = (vendorData.name || "VENDOR")
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, "A");
        const timestamp = Date.now().toString().slice(-4);
        vendorCode = `${namePrefix}${timestamp}`;
        
        // Check if code exists and generate a new one if needed
        let attempts = 0;
        while (attempts < 10) {
          const { data: existing } = await supabase
            .from("vendors")
            .select("code")
            .eq("code", vendorCode)
            .single();
          
          if (!existing) break; // Code is unique
          
          // Generate new code
          vendorCode = `${namePrefix}${Date.now().toString().slice(-4)}`;
          attempts++;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("vendors")
        .insert({
          code: vendorCode,
          name: vendorData.name,
          email: vendorData.email || null,
          phone: vendorData.phone || null,
          address: vendorData.address || null,
          city: vendorData.city || null,
          country: vendorData.country || null,
          tax_id: vendorData.taxId || null,
          payment_terms: vendorData.paymentTerms || null,
          status: vendorData.status || "active",
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create vendor: " + error.message);
    },
  });

  return {
    vendors: vendorsQuery.data ?? [],
    isLoading: vendorsQuery.isLoading,
    error: vendorsQuery.error,
    createVendor: createVendorMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  };
}
