import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesOrder } from "@/types/sale";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, CreditCard } from "lucide-react";
import { formatAmount, formatCurrency } from "@/lib/formatters";

interface SalesAnalyticsProps {
  sales: SalesOrder[];
}

export function SalesAnalytics({ sales }: SalesAnalyticsProps) {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const paidRevenue = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const outstandingBalance = sales.reduce((sum, sale) => sum + sale.balance, 0);
  const totalOrders = sales.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statusCounts = sales.reduce((acc, sale) => {
    acc[sale.status] = (acc[sale.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueCustomers = new Set(sales.map(sale => sale.customerId)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {statusCounts.paid || 0} paid orders
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collected</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(paidRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {((paidRevenue / totalRevenue) * 100 || 0).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <TrendingDown className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(outstandingBalance)}</div>
          <p className="text-xs text-muted-foreground">
            {statusCounts.invoiced || 0} invoiced orders
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatAmount(totalOrders, 0)}</div>
          <p className="text-xs text-muted-foreground">
            {statusCounts.draft || 0} drafts, {statusCounts.confirmed || 0} confirmed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
          <p className="text-xs text-muted-foreground">
            Per order average
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Unique customers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
