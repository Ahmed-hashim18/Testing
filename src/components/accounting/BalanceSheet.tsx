import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportFilters from "./ReportFilters";
import { useAccounts } from "@/hooks/useAccounts";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function BalanceSheet() {
  const [period, setPeriod] = useState("current-month");
  const { accounts, isLoading } = useAccounts();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const assets = accounts.filter(a => a.type === 'Assets');
  const liabilities = accounts.filter(a => a.type === 'Liabilities');
  const equity = accounts.filter(a => a.type === 'Equity');
  
  const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
  const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

  const handleExport = () => {
    console.log('Exporting Balance Sheet...');
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
          <CardTitle>Balance Sheet</CardTitle>
          <p className="text-sm text-muted-foreground">
            As of: {period.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assets Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Assets</h3>
            <div className="space-y-2">
              {assets.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2 px-4">No asset accounts found</p>
              ) : (
                assets.map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                    <span className="text-sm" style={{ paddingLeft: `${(account.code.length - 4) * 12}px` }}>
                      {account.name}
                    </span>
                    <span className="font-medium">MRU {account.balance.toLocaleString()}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Total Assets</span>
                <span className="text-lg">MRU {totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Liabilities Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Liabilities</h3>
            <div className="space-y-2">
              {liabilities.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2 px-4">No liability accounts found</p>
              ) : (
                liabilities.map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                    <span className="text-sm" style={{ paddingLeft: `${(account.code.length - 4) * 12}px` }}>
                      {account.name}
                    </span>
                    <span className="font-medium">MRU {account.balance.toLocaleString()}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Total Liabilities</span>
                <span className="text-lg">MRU {totalLiabilities.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Equity Section */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Equity</h3>
            <div className="space-y-2">
              {equity.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2 px-4">No equity accounts found</p>
              ) : (
                equity.map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-2 px-4 hover:bg-muted/50 rounded">
                    <span className="text-sm">{account.name}</span>
                    <span className="font-medium">MRU {account.balance.toLocaleString()}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 px-4 bg-muted rounded font-semibold">
                <span>Total Equity</span>
                <span className="text-lg">MRU {totalEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center py-3 px-4 bg-primary/10 rounded-lg">
              <span className="text-xl font-bold">Total Liabilities & Equity</span>
              <span className="text-2xl font-bold">MRU {(totalLiabilities + totalEquity).toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {totalAssets === totalLiabilities + totalEquity ? '✓ Balanced' : '⚠ Not Balanced'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
