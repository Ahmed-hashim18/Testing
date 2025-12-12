import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  category: string;
}

export function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLowStockItems() {
      try {
        const { data: products } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sku,
            current_stock,
            reorder_level,
            product_categories (name)
          `)
          .lte('current_stock', supabase.rpc('reorder_level'))
          .eq('status', 'active')
          .order('current_stock', { ascending: true })
          .limit(4);

        const formattedItems: LowStockItem[] = products?.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.current_stock,
          minStock: product.reorder_level,
          category: (product.product_categories as any)?.name || 'Uncategorized',
        })) || [];

        setLowStockItems(formattedItems);
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLowStockItems();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : lowStockItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">No low stock items</div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Package className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.sku} • {item.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-warning">
                    {item.currentStock} units
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.minStock}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Reorder
                </Button>
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
