import { useState } from "react";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Box
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesExpensesChart } from "@/components/dashboard/SalesExpensesChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardKPIs } from "@/hooks/useDashboardData";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/formatters";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("30");
  const { kpis, isLoading } = useDashboardKPIs(dateRange);
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your business performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Date Range</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading dashboard data...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Revenue"
              value={formatCurrency(kpis?.totalRevenue)}
              description="Compared to previous period"
              icon={DollarSign}
              iconColor="bg-success"
              trend={{ 
                value: formatPercent(kpis?.revenueTrend), 
                isPositive: (kpis?.revenueTrend || 0) >= 0 
              }}
            />
            <KPICard
              title="Total Expenses"
              value={formatCurrency(kpis?.totalExpenses)}
              description="Operational costs"
              icon={CreditCard}
              iconColor="bg-destructive"
              trend={{ 
                value: formatPercent(kpis?.expensesTrend), 
                isPositive: (kpis?.expensesTrend || 0) < 0 
              }}
            />
            <KPICard
              title="Net Profit"
              value={formatCurrency(kpis?.netProfit)}
              description={`${((kpis?.netProfit || 0) / (kpis?.totalRevenue || 1) * 100).toFixed(1)}% profit margin`}
              icon={TrendingUp}
              iconColor="bg-primary"
              trend={{ 
                value: formatPercent(kpis?.profitTrend), 
                isPositive: (kpis?.profitTrend || 0) >= 0 
              }}
            />
            <KPICard
              title="Inventory Value"
              value={formatCurrency(kpis?.inventoryValue)}
              description="Current stock valuation"
              icon={Package}
              iconColor="bg-chart-4"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Low Stock Items"
              value={formatNumber(kpis?.lowStockCount)}
              description="Require immediate attention"
              icon={AlertTriangle}
              iconColor="bg-warning"
            />
            <KPICard
              title="Total Transactions"
              value={formatNumber(kpis?.totalTransactions)}
              description="All recorded activities"
              icon={Receipt}
              iconColor="bg-chart-1"
            />
            <KPICard
              title="Avg Order Value"
              value={formatCurrency(kpis?.avgOrderValue)}
              description="Per transaction average"
              icon={ShoppingCart}
              iconColor="bg-success"
            />
            <KPICard
              title="Active Products"
              value={formatNumber(kpis?.activeProducts)}
              description="In current inventory"
              icon={Box}
              iconColor="bg-primary"
            />
          </div>
        </>
      )}

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Sales & Expenses Trend</h3>
          <p className="text-sm text-muted-foreground mb-4">Monthly performance comparison</p>
          <SalesExpensesChart />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Expense Breakdown</h3>
          <p className="text-sm text-muted-foreground mb-4">Current year expense distribution</p>
          <ExpenseBreakdownChart />
        </div>
      </div>

      {/* Recent Transactions & Low Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions />
        <LowStockAlerts />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Button 
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => navigate("/sales")}
          >
            <span className="font-semibold">Record Sale</span>
            <span className="text-xs opacity-90 mt-1">
              Add new sales transaction
            </span>
          </Button>
          <Button 
            className="h-auto flex-col items-start p-4 text-left" 
            variant="outline"
            onClick={() => navigate("/purchases")}
          >
            <span className="font-semibold">Record Purchase</span>
            <span className="text-xs text-muted-foreground mt-1">
              Add new purchase transaction
            </span>
          </Button>
          <Button 
            className="h-auto flex-col items-start p-4 text-left" 
            variant="outline"
            onClick={() => navigate("/products")}
          >
            <span className="font-semibold">Manage Products</span>
            <span className="text-xs text-muted-foreground mt-1">
              Update inventory & pricing
            </span>
          </Button>
          <Button 
            className="h-auto flex-col items-start p-4 text-left" 
            variant="outline"
            onClick={() => navigate("/transactions")}
          >
            <span className="font-semibold">View Transactions</span>
            <span className="text-xs text-muted-foreground mt-1">
              Review financial records
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
