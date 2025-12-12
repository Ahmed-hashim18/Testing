import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyData {
  month: string;
  sales: number;
  expenses: number;
}

interface ExpenseCategory {
  category: string;
  value: number;
  fill: string;
}

export function useMonthlyChartData() {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMonthlyData() {
      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1).toISOString();
        
        // Fetch sales data
        const { data: salesData } = await supabase
          .from('sales_orders')
          .select('total, date, created_at')
          .gte('date', startDate.split('T')[0]);

        // Fetch expense transactions (purchases and expense type transactions)
        const { data: expenseData } = await supabase
          .from('transactions')
          .select('amount, date, created_at, type')
          .in('type', ['purchase', 'expense'])
          .gte('date', startDate.split('T')[0]);

        // Group by month
        const monthlyData: Record<number, { sales: number; expenses: number }> = {};
        
        for (let i = 0; i < 12; i++) {
          monthlyData[i] = { sales: 0, expenses: 0 };
        }

        salesData?.forEach(sale => {
          const month = new Date(sale.date || sale.created_at).getMonth();
          monthlyData[month].sales += Number(sale.total || 0);
        });

        expenseData?.forEach(expense => {
          const month = new Date(expense.date || expense.created_at).getMonth();
          monthlyData[month].expenses += Math.abs(Number(expense.amount || 0));
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedData = months.map((month, index) => ({
          month,
          sales: monthlyData[index].sales,
          expenses: monthlyData[index].expenses,
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching monthly chart data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMonthlyData();
  }, []);

  return { chartData, isLoading };
}

export function useExpenseBreakdown() {
  const [expenseData, setExpenseData] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenseBreakdown() {
      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1).toISOString();

        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, description, type, date, created_at')
          .in('type', ['purchase', 'expense'])
          .gte('date', startDate.split('T')[0]);

        // Categorize expenses based on description keywords
        const categories: Record<string, number> = {
          Salaries: 0,
          Rent: 0,
          Utilities: 0,
          Marketing: 0,
          Supplies: 0,
          Other: 0,
        };

        transactions?.forEach(transaction => {
          const desc = transaction.description?.toLowerCase() || '';
          const amount = Math.abs(Number(transaction.amount));

          if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) {
            categories.Salaries += amount;
          } else if (desc.includes('rent') || desc.includes('lease')) {
            categories.Rent += amount;
          } else if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
            categories.Utilities += amount;
          } else if (desc.includes('marketing') || desc.includes('advertising') || desc.includes('promotion')) {
            categories.Marketing += amount;
          } else if (desc.includes('supply') || desc.includes('supplies') || desc.includes('office')) {
            categories.Supplies += amount;
          } else {
            categories.Other += amount;
          }
        });

        const colors = [
          'hsl(var(--chart-1))',
          'hsl(var(--chart-2))',
          'hsl(var(--chart-3))',
          'hsl(var(--chart-4))',
          'hsl(var(--chart-5))',
          'hsl(var(--muted))',
        ];

        const formattedData = Object.entries(categories).map(([category, value], index) => ({
          category,
          value,
          fill: colors[index],
        }));

        setExpenseData(formattedData);
      } catch (error) {
        console.error('Error fetching expense breakdown:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpenseBreakdown();
  }, []);

  return { expenseData, isLoading };
}
