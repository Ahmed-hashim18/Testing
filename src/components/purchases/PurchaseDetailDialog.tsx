import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PurchaseOrder } from "@/types/purchase";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface PurchaseDetailDialogProps {
  purchase: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  received: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export function PurchaseDetailDialog({ purchase, open, onOpenChange }: PurchaseDetailDialogProps) {
  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Purchase Order Details</span>
            <Badge className={statusStyles[purchase.status]}>{purchase.status.toUpperCase()}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-semibold">{purchase.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-semibold">{format(new Date(purchase.date), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-semibold">{purchase.vendorName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-semibold">{purchase.createdBy}</p>
            </div>
          </div>

          {/* Dates */}
          {(purchase.receivedDate || purchase.paymentDate) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {purchase.receivedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Received Date</p>
                    <p className="font-semibold">{format(new Date(purchase.receivedDate), "MMM dd, yyyy")}</p>
                  </div>
                )}
                {purchase.paymentDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Date</p>
                    <p className="font-semibold">{format(new Date(purchase.paymentDate), "MMM dd, yyyy")}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Line Items */}
          <Separator />
          <div>
            <h4 className="font-semibold mb-4">Line Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Product</th>
                    <th className="text-right p-3 text-sm font-medium">Quantity</th>
                    <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.lineItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">{item.productName}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">MRU {item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold">MRU {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">MRU {purchase.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({purchase.taxRate}%)</span>
              <span className="font-semibold">MRU {purchase.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold">MRU {purchase.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Amount Paid</span>
              <span className="font-semibold">MRU {purchase.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-orange-600 dark:text-orange-400">
              <span>Balance Due</span>
              <span className="font-semibold">MRU {purchase.balance.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm bg-muted p-3 rounded-md">{purchase.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
