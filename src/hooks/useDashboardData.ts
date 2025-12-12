import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  inventoryValue: number;
  lowStockCount: number;
  totalTransactions: number;
  avgOrderValue: number;
  activeProducts: number;
  revenueTrend: number;
  expensesTrend: number;
  profitTrend: number;
  inventoryTrend: number;
  // Additional metrics
  paidAmount: number;
  outstandingAmount: number;
  totalOrders: number;
}

export function useDashboardKPIs(dateRange: string) {
  const { data: kpis, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', dateRange],
    queryFn: async () => {
      const startDate = getStartDate(dateRange);
      const previousStartDate = getPreviousStartDate(dateRange);

      // Fetch all data in parallel for much faster loading
      const [salesResult, transResult, productsResult, prevSalesResult, prevTransResult] = await Promise.all([
        supabase
          .from('sales_orders')
          .select('total, paid_amount, balance, status')
          .gte('created_at', startDate),
        supabase
          .from('transactions')
          .select('amount, type')
          .gte('created_at', startDate),
        supabase
          .from('products')
          .select('current_stock, selling_price, reorder_level, status')
          .eq('status', 'active'),
        supabase
          .from('sales_orders')
          .select('total')
          .gte('created_at', previousStartDate)
          .lt('created_at', startDate),
        supabase
          .from('transactions')
          .select('amount, type')
          .gte('created_at', previousStartDate)
          .lt('created_at', startDate),
      ]);

      const salesData = salesResult.data || [];
      const transactionsData = transResult.data || [];
      const productsData = productsResult.data || [];
      const previousSales = prevSalesResult.data || [];
      const previousTransactions = prevTransResult.data || [];

      const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      const paidAmount = salesData.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0);
      const outstandingAmount = salesData.reduce((sum, sale) => sum + Number(sale.balance || 0), 0);
      const totalOrders = salesData.length;
      
      const totalExpenses = transactionsData
        .filter(t => t.type === 'expense' || t.type === 'purchase')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

      const inventoryValue = productsData.reduce(
        (sum, p) => sum + (Number(p.current_stock || 0) * Number(p.selling_price || 0)), 
        0
      );
      const lowStockCount = productsData.filter(
        p => (p.current_stock || 0) <= (p.reorder_level || 0)
      ).length;

      const previousRevenue = previousSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      const previousExpenses = previousTransactions
        .filter(t => t.type === 'expense' || t.type === 'purchase')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

      const revenueTrend = calculateTrend(totalRevenue, previousRevenue);
      const expensesTrend = calculateTrend(totalExpenses, previousExpenses);
      const netProfit = totalRevenue - totalExpenses;
      const previousProfit = previousRevenue - previousExpenses;
      const profitTrend = calculateTrend(netProfit, previousProfit);

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        inventoryValue,
        lowStockCount,
        totalTransactions: transactionsData.length,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        activeProducts: productsData.length,
        revenueTrend,
        expensesTrend,
        profitTrend,
        inventoryTrend: 0,
        paidAmount,
        outstandingAmount,
        totalOrders,
      } as DashboardKPIs;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  return { kpis: kpis || null, isLoading, error, refetch };
}

function getStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '7':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function getPreviousStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '7':
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    case '30':
      return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    case '90':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
    case 'ytd':
      return new Date(now.getFullYear() - 1, 0, 1).toISOString();
    default:
      return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
