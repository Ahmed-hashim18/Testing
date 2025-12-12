import { useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { formatCurrency, formatNumber } from "@/lib/formatters";

export default function AccountingAnalytics() {
  const { accounts, isLoading: isLoadingAccounts, error: accountsError, refetch: refetchAccounts } = useAccounts();
  const { transactions, isLoading: isLoadingTransactions, error: transactionsError, refetch: refetchTransactions } = useTransactions();

  // Debug logging
  console.log("[AccountingAnalytics] accounts:", accounts?.length || 0, "transactions:", transactions?.length || 0);
  console.log("[AccountingAnalytics] errors:", { accountsError, transactionsError });

  const analytics = useMemo(() => {
    const assets = accounts.filter(a => a.type === 'Assets');
    const liabilities = accounts.filter(a => a.type === 'Liabilities');
    const equity = accounts.filter(a => a.type === 'Equity');
    const revenue = accounts.filter(a => a.type === 'Revenue');
    const expenses = accounts.filter(a => a.type === 'Expenses');

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);
    const totalRevenue = revenue.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate ratios
    const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0;
    const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    const returnOnAssets = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
    const returnOnEquity = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;

    // Account type data for chart
    const accountTypeData = [
      { type: 'Assets', value: totalAssets },
      { type: 'Liabilities', value: totalLiabilities },
      { type: 'Equity', value: totalEquity },
      { type: 'Revenue', value: totalRevenue },
      { type: 'Expenses', value: totalExpenses },
    ];

    // Monthly data from transactions
    const monthlyData = transactions.reduce((acc, txn) => {
      const date = new Date(txn.date);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, revenue: 0, expenses: 0, profit: 0 };
      }
      
      if ((txn.type === 'sale' || txn.type === 'receipt') && txn.status === 'posted') {
        acc[monthKey].revenue += txn.amount;
      } else if ((txn.type === 'expense' || txn.type === 'purchase' || txn.type === 'payment') && txn.status === 'posted') {
        acc[monthKey].expenses += txn.amount;
      }
      
      acc[monthKey].profit = acc[monthKey].revenue - acc[monthKey].expenses;
      return acc;
    }, {} as Record<string, { month: string; revenue: number; expenses: number; profit: number }>);

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      netProfit,
      profitMargin,
      currentRatio,
      debtToEquity,
      returnOnAssets,
      returnOnEquity,
      accountTypeData,
      monthlyData: Object.values(monthlyData),
    };
  }, [accounts, transactions]);

  if (isLoadingAccounts || isLoadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingSpinner />
        <p className="text-muted-foreground">Loading accounting data...</p>
      </div>
    );
  }

  // Show error state with retry button
  if (accountsError || transactionsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Error loading data</p>
        <p className="text-sm text-muted-foreground">
          {accountsError?.message || transactionsError?.message || "Unknown error"}
        </p>
        <button 
          onClick={() => {
            refetchAccounts();
            refetchTransactions();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show empty state if no data
  if (accounts.length === 0 && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No accounting data found</p>
        <p className="text-sm text-muted-foreground">
          Create accounts in Chart of Accounts and make some sales/purchases to see data here.
        </p>
        <button 
          onClick={() => {
            refetchAccounts();
            refetchTransactions();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.netProfit)}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              {analytics.netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {analytics.netProfit >= 0 ? 'Profit' : 'Loss'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalAssets)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Current + Fixed Assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.profitMargin.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Net profit / Revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No transaction data available for chart
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Balances by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.accountTypeData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.accountTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Balance" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No account data available for chart
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Key Financial Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Ratio</p>
              <p className="text-2xl font-bold">{analytics.currentRatio.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Current Assets / Current Liabilities</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Debt to Equity</p>
              <p className="text-2xl font-bold">{analytics.debtToEquity.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Liabilities / Total Equity</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Return on Assets</p>
              <p className="text-2xl font-bold">{analytics.returnOnAssets.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Net Income / Total Assets</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Return on Equity</p>
              <p className="text-2xl font-bold">{analytics.returnOnEquity.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Net Income / Total Equity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
