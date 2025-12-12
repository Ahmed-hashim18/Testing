import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatAmount } from "@/lib/formatters";

interface Transaction {
  id: string;
  type: string;
  name: string;
  amount: number;
  status: string;
  date: string;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentTransactions() {
      try {
        // Fetch recent sales
        const { data: salesData } = await supabase
          .from('sales_orders')
          .select('id, customer_name, total_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch recent purchases
        const { data: purchasesData } = await supabase
          .from('purchase_orders')
          .select('id, vendor_name, total_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(2);

        const formattedTransactions: Transaction[] = [];

        salesData?.forEach(sale => {
          formattedTransactions.push({
            id: sale.id,
            type: 'sale',
            name: sale.customer_name || 'Unknown Customer',
            amount: Number(sale.total_amount),
            status: sale.status,
            date: format(new Date(sale.created_at), 'yyyy-MM-dd'),
          });
        });

        purchasesData?.forEach(purchase => {
          formattedTransactions.push({
            id: purchase.id,
            type: 'purchase',
            name: purchase.vendor_name || 'Unknown Vendor',
            amount: -Number(purchase.total_amount),
            status: purchase.status,
            date: format(new Date(purchase.created_at), 'yyyy-MM-dd'),
          });
        });

        // Sort by date
        formattedTransactions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setTransactions(formattedTransactions.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentTransactions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No transactions found</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    transaction.type === "sale"
                      ? "bg-success/10"
                      : "bg-destructive/10"
                  }`}
                >
                  {transaction.type === "sale" ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {transaction.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.id.slice(0, 8)} • {transaction.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`text-sm font-semibold ${
                    transaction.amount > 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : "-"}
                  {formatAmount(Math.abs(transaction.amount))} MRU
                </p>
                <Badge
                  variant={
                    transaction.status === "posted" ? "default" : "secondary"
                  }
                >
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
