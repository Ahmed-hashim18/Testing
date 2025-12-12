import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReportFilters from "./ReportFilters";
import { useAccounts } from "@/hooks/useAccounts";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function TrialBalance() {
  const [period, setPeriod] = useState("current-month");
  const { accounts, isLoading } = useAccounts();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Calculate debits and credits for each account
  const accountBalances = accounts.map(account => {
    const isDebitAccount = ['Assets', 'Expenses'].includes(account.type);
    return {
      ...account,
      debit: isDebitAccount && account.balance >= 0 ? account.balance : 0,
      credit: !isDebitAccount || account.balance < 0 ? Math.abs(account.balance) : 0,
    };
  });

  const totalDebits = accountBalances.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredits = accountBalances.reduce((sum, acc) => sum + acc.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleExport = () => {
    console.log('Exporting Trial Balance...');
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
          <CardTitle>Trial Balance</CardTitle>
          <p className="text-sm text-muted-foreground">
            As of: {period.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountBalances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  accountBalances.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded bg-muted">
                          {account.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {account.debit > 0 ? `MRU ${account.debit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {account.credit > 0 ? `MRU ${account.credit.toLocaleString()}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right text-lg">
                    MRU {totalDebits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    MRU {totalCredits.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow className={isBalanced ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}>
                  <TableCell colSpan={3} className="font-semibold">
                    {isBalanced ? '✓ Balanced' : '⚠ Out of Balance'}
                  </TableCell>
                  <TableCell className="text-right font-semibold" colSpan={2}>
                    Difference: MRU {Math.abs(totalDebits - totalCredits).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
