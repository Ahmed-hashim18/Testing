import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrder } from "@/types/purchase";
import { DollarSign, Package, TrendingUp, AlertCircle } from "lucide-react";

interface PurchaseAnalyticsProps {
  purchases: PurchaseOrder[];
}

export function PurchaseAnalytics({ purchases }: PurchaseAnalyticsProps) {
  const totalSpent = purchases
    .filter((p) => p.status !== "cancelled")
    .reduce((sum, p) => sum + p.total, 0);

  const totalPaid = purchases
    .filter((p) => p.status !== "cancelled")
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const outstandingBalance = purchases
    .filter((p) => p.status !== "cancelled" && p.status !== "paid")
    .reduce((sum, p) => sum + p.balance, 0);

  const totalOrders = purchases.filter((p) => p.status !== "cancelled").length;

  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const pendingOrders = purchases.filter((p) => p.status === "draft" || p.status === "ordered").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">MRU {totalSpent.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All-time purchases</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">MRU {totalPaid.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Paid to vendors</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">MRU {outstandingBalance.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Balance due</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrders}</div>
          <p className="text-xs text-muted-foreground">{pendingOrders} pending</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">MRU {avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <p className="text-xs text-muted-foreground">Per purchase order</p>
        </CardContent>
      </Card>
    </div>
  );
}
