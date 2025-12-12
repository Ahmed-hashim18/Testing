import { Account, AccountType } from "@/types/account";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useMemo } from "react";

interface AccountAnalyticsProps {
  accounts: Account[];
}

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  Assets: "hsl(var(--chart-1))",
  Liabilities: "hsl(var(--chart-2))",
  Equity: "hsl(var(--chart-3))",
  Revenue: "hsl(var(--chart-4))",
  Expenses: "hsl(var(--chart-5))",
};

export function AccountAnalytics({ accounts }: AccountAnalyticsProps) {
  const analytics = useMemo(() => {
    // Account type distribution
    const typeDistribution = accounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + 1;
      return acc;
    }, {} as Record<AccountType, number>);

    const distributionData = Object.entries(typeDistribution).map(([type, count]) => ({
      name: type,
      value: count,
      color: ACCOUNT_TYPE_COLORS[type as AccountType],
    }));

    // Balance by account type
    const typeBalances = accounts.reduce((acc, account) => {
      acc[account.type] = (acc[account.type] || 0) + account.balance;
      return acc;
    }, {} as Record<AccountType, number>);

    const balanceData = Object.entries(typeBalances).map(([type, balance]) => ({
      type,
      balance,
      fill: ACCOUNT_TYPE_COLORS[type as AccountType],
    }));

    // Most active accounts (by absolute balance value)
    const topAccounts = [...accounts]
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 10)
      .map(acc => ({
        name: acc.name.length > 25 ? acc.name.slice(0, 25) + '...' : acc.name,
        balance: acc.balance,
        code: acc.code,
        type: acc.type,
      }));

    // Active vs Inactive
    const activeCount = accounts.filter(acc => acc.status === 'active').length;
    const inactiveCount = accounts.filter(acc => acc.status === 'inactive').length;

    // Calculate total balances for assets, liabilities, equity
    const totalAssets = typeBalances.Assets || 0;
    const totalLiabilities = typeBalances.Liabilities || 0;
    const totalEquity = typeBalances.Equity || 0;
    const totalRevenue = typeBalances.Revenue || 0;
    const totalExpenses = typeBalances.Expenses || 0;

    const netIncome = totalRevenue - totalExpenses;
    const balanceCheck = totalAssets - totalLiabilities - totalEquity;

    return {
      distributionData,
      balanceData,
      topAccounts,
      activeCount,
      inactiveCount,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome,
      balanceCheck,
    };
  }, [accounts]);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MRU',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }

  function formatCurrencyFull(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MRU',
    }).format(amount);
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].dataKey === 'value' 
              ? `${payload[0].value} accounts` 
              : formatCurrencyFull(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Assets</CardDescription>
            <CardTitle className="text-2xl text-chart-1">
              {formatCurrency(analytics.totalAssets)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Current asset position</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Liabilities</CardDescription>
            <CardTitle className="text-2xl text-chart-2">
              {formatCurrency(analytics.totalLiabilities)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Outstanding obligations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Equity</CardDescription>
            <CardTitle className="text-2xl text-chart-3">
              {formatCurrency(analytics.totalEquity)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Owner's equity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Income</CardDescription>
            <CardTitle className={`text-2xl ${analytics.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(analytics.netIncome)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs">
              {analytics.netIncome >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className="text-muted-foreground">Revenue - Expenses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Account Distribution</CardTitle>
            <CardDescription>Number of accounts by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-semibold text-success">{analytics.activeCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inactive</span>
                <span className="font-semibold text-muted-foreground">{analytics.inactiveCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance by Account Type */}
        <Card>
          <CardHeader>
            <CardTitle>Balance by Account Type</CardTitle>
            <CardDescription>Total balance per account category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.balanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="type" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="balance" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Accounts by Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Top 10 Accounts by Balance
          </CardTitle>
          <CardDescription>Accounts with the highest absolute balance values</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={analytics.topAccounts} 
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="balance" 
                fill="hsl(var(--primary))"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accounting Equation Check */}
      <Card>
        <CardHeader>
          <CardTitle>Accounting Equation Check</CardTitle>
          <CardDescription>Assets = Liabilities + Equity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-semibold">Assets</span>
              <span className="text-lg font-bold text-chart-1">
                {formatCurrencyFull(analytics.totalAssets)}
              </span>
            </div>
            <div className="flex items-center justify-center text-2xl font-bold text-muted-foreground">
              =
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-semibold">Liabilities</span>
              <span className="text-lg font-bold text-chart-2">
                {formatCurrencyFull(analytics.totalLiabilities)}
              </span>
            </div>
            <div className="flex items-center justify-center text-xl font-bold text-muted-foreground">
              +
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-semibold">Equity</span>
              <span className="text-lg font-bold text-chart-3">
                {formatCurrencyFull(analytics.totalEquity)}
              </span>
            </div>
            <div className="mt-4 p-4 rounded-lg border-2 border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Balance Check</span>
                <span className={`text-lg font-bold ${Math.abs(analytics.balanceCheck) < 0.01 ? 'text-success' : 'text-destructive'}`}>
                  {Math.abs(analytics.balanceCheck) < 0.01 ? '✓ Balanced' : `⚠ Off by ${formatCurrencyFull(analytics.balanceCheck)}`}
                </span>
              </div>
              {Math.abs(analytics.balanceCheck) >= 0.01 && (
                <p className="text-sm text-muted-foreground mt-2">
                  The accounting equation is not balanced. Please review your accounts.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
