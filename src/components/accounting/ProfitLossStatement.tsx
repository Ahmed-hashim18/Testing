import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportFilters from "./ReportFilters";
import { useAccounts } from "@/hooks/useAccounts";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function ProfitLossStatement() {
  const [period, setPeriod] = useState("current-month");
  const { accounts, isLoading } = useAccounts();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const revenue = accounts.filter(a => a.type === 'Revenue');
  const expenses = accounts.filter(a => a.type === 'Expenses');
  
  const totalRevenue = revenue.reduce((sum, acc) => sum + acc.balance, 0);
  const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
  const netIncome = totalRevenue - totalExpenses;
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  const handleExport = () => {
    console.log('Exporting P&L statement...');
  };

  return (
    <div className="space-y-6">
      <ReportFilters
        period={period}
        onPeriodChange={setPeriod}
        onExport={handleExport}
      />

      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <p className="text-sm text-muted-foreground">
            Period: {period.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Revenue Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Revenue</h3>
            <div className="space-y-2">
              {revenue.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2 px-4">No revenue accounts found</p>
              ) : (
                revenue.map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                    <span className="text-sm">{account.name}</span>
                    <span className="font-medium">MRU {account.balance.toLocaleString()}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Total Revenue</span>
                <span className="text-lg">MRU {totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Expenses</h3>
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2 px-4">No expense accounts found</p>
              ) : (
                expenses.map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                    <span className="text-sm">{account.name}</span>
                    <span className="font-medium">MRU {account.balance.toLocaleString()}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Total Expenses</span>
                <span className="text-lg">MRU {totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center py-3 px-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">Net Income</span>
                {netIncome >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  MRU {Math.abs(netIncome).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Net Margin: {netMargin.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
