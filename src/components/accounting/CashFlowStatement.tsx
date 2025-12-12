import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportFilters from "./ReportFilters";
import { useTransactions } from "@/hooks/useTransactions";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function CashFlowStatement() {
  const [period, setPeriod] = useState("current-month");
  const { transactions, isLoading } = useTransactions();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Calculate cash flow categories
  const postedTransactions = transactions.filter(t => t.status === 'posted');
  
  const salesCash = postedTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expensesCash = postedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const operatingCashFlow = postedTransactions
    .filter(t => ['sale', 'purchase', 'expense'].includes(t.type))
    .reduce((sum, t) => {
      if (t.type === 'sale') return sum + t.amount;
      return sum - t.amount;
    }, 0);

  const investingCashFlow = postedTransactions
    .filter(t => t.type === 'adjustment')
    .reduce((sum, t) => sum - t.amount, 0);

  const financingCashFlow = postedTransactions
    .filter(t => ['transfer', 'payment'].includes(t.type))
    .reduce((sum, t) => sum + (t.type === 'transfer' ? t.amount : -t.amount), 0);

  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
  const beginningCash = 100000; // This should come from opening balance
  const endingCash = beginningCash + netCashFlow;

  const handleExport = () => {
    console.log('Exporting Cash Flow Statement...');
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
          <CardTitle>Cash Flow Statement</CardTitle>
          <p className="text-sm text-muted-foreground">
            Period: {period.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Operating Activities */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Operating Activities</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                <span className="text-sm">Cash from Sales</span>
                <span className="font-medium text-green-600">
                  MRU {salesCash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                <span className="text-sm">Cash for Expenses</span>
                <span className="font-medium text-red-600">
                  -MRU {expensesCash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Net Cash from Operating Activities</span>
                <span className={operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  MRU {operatingCashFlow.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Investing Activities</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                <span className="text-sm">Equipment & Asset Purchases</span>
                <span className="font-medium text-red-600">
                  MRU {Math.abs(investingCashFlow).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Net Cash from Investing Activities</span>
                <span className={investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  MRU {investingCashFlow.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Financing Activities</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                <span className="text-sm">Loans & Transfers</span>
                <span className="font-medium">MRU {Math.abs(financingCashFlow).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Net Cash from Financing Activities</span>
                <span className={financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  MRU {financingCashFlow.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center py-2 px-4 rounded">
              <span className="font-medium">Beginning Cash Balance</span>
              <span className="font-medium">MRU {beginningCash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-4 rounded">
              <span className="font-medium">Net Change in Cash</span>
              <span className={`font-medium ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                MRU {netCashFlow.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-primary/10 rounded-lg">
              <span className="text-xl font-bold">Ending Cash Balance</span>
              <span className="text-2xl font-bold">MRU {endingCash.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
