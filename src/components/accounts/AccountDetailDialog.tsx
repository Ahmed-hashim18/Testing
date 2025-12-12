import { Account, AccountTransaction } from "@/types/account";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface AccountDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  transactions: AccountTransaction[];
}

export function AccountDetailDialog({
  open,
  onOpenChange,
  account,
  transactions,
}: AccountDetailDialogProps) {
  if (!account) return null;

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MRU',
    }).format(amount);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-muted-foreground">{account.code}</span>
            <span>{account.name}</span>
            <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
              {account.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Account details and transaction history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Type</h3>
              <p className="text-lg font-semibold text-foreground">{account.type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Balance</h3>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(account.balance)}</p>
            </div>
            {account.description && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-foreground">{account.description}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
              <p className="text-foreground">{format(account.createdAt, 'PPP')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
              <p className="text-foreground">{format(account.updatedAt, 'PPP')}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Transaction History</h3>
            {transactions.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(transaction.date, 'PP')}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {transaction.reference}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(transaction.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No transactions recorded for this account</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
