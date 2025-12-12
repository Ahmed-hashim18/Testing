import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Transaction } from "@/types/transaction";
import { format } from "date-fns";

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({ transaction, open, onOpenChange }: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "posted":
        return "default";
      case "reconciled":
        return "default";
      case "pending":
        return "secondary";
      case "void":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case "sale":
      case "receipt":
        return "default";
      case "purchase":
      case "payment":
        return "secondary";
      case "expense":
        return "outline";
      case "refund":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Transaction Details
            <Badge variant={getStatusVariant(transaction.status)}>
              {transaction.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
              <p className="font-medium">{transaction.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date</p>
              <p className="font-medium">{format(new Date(transaction.date), "MMM dd, yyyy")}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-1">Type</p>
            <Badge variant={getTypeVariant(transaction.type)} className="capitalize">
              {transaction.type}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="font-medium">{transaction.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            {transaction.accountFrom && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">From Account</p>
                <p className="font-medium">{transaction.accountFrom}</p>
              </div>
            )}
            {transaction.accountTo && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">To Account</p>
                <p className="font-medium">{transaction.accountTo}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Amount</p>
            <p className="text-2xl font-bold text-primary">
              MRU {transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {transaction.reference && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Reference</p>
              <p className="font-medium">{transaction.reference}</p>
            </div>
          )}

          {transaction.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{transaction.notes}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Created By</p>
              <p className="font-medium">{transaction.createdBy}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Created At</p>
              <p className="font-medium">{format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}</p>
            </div>
            {transaction.updatedAt && (
              <>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Last Updated</p>
                  <p className="font-medium">{format(new Date(transaction.updatedAt), "MMM dd, yyyy HH:mm")}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
