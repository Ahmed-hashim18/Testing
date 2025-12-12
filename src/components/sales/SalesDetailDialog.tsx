import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SalesOrder } from "@/types/sale";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Calendar, CreditCard, User, FileText } from "lucide-react";

interface SalesDetailDialogProps {
  sale: SalesOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  draft: "bg-gray-500",
  confirmed: "bg-blue-500",
  invoiced: "bg-purple-500",
  paid: "bg-green-500",
  cancelled: "bg-red-500",
};

export function SalesDetailDialog({ sale, open, onOpenChange }: SalesDetailDialogProps) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{sale.orderNumber}</DialogTitle>
            <Badge className={statusColors[sale.status]}>
              {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Customer</span>
              </div>
              <p className="font-medium">{sale.customerName}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Order Date</span>
              </div>
              <p className="font-medium">{format(new Date(sale.date), "PPP")}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Due Date</span>
              </div>
              <p className="font-medium">{format(new Date(sale.dueDate), "PPP")}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>Payment Status</span>
              </div>
              <p className="font-medium">
                {sale.paidAmount === sale.total ? "Fully Paid" : sale.paidAmount > 0 ? "Partially Paid" : "Unpaid"}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Line Items
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Product</th>
                    <th className="text-right p-3 text-sm font-medium">Qty</th>
                    <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                    <th className="text-right p-3 text-sm font-medium">Discount</th>
                    <th className="text-right p-3 text-sm font-medium">Tax</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.lineItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">{item.sku}</p>
                        </div>
                      </td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">MRU {item.unitPrice.toFixed(2)}</td>
                      <td className="text-right p-3">{item.discount}%</td>
                      <td className="text-right p-3">{item.tax}%</td>
                      <td className="text-right p-3 font-medium">MRU {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">MRU {sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount:</span>
              <span className="font-medium text-red-500">-MRU {sale.discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">MRU {sale.taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>MRU {sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-medium text-green-600">MRU {sale.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Due:</span>
              <span className="font-medium text-orange-600">MRU {sale.balance.toFixed(2)}</span>
            </div>
          </div>

          {sale.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{sale.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
