import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Transaction, TransactionStatus, TransactionType } from "@/types/transaction";
import { Account } from "@/types/account";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { HierarchicalAccountSelect } from "@/components/accounts/HierarchicalAccountSelect";

interface TransactionFormDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Partial<Transaction>) => Promise<void>;
  accounts: Account[];
}

export function TransactionFormDialog({ transaction, open, onOpenChange, onSave, accounts }: TransactionFormDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    type: "sale",
    description: "",
    accountFrom: "",
    accountTo: "",
    amount: undefined,
    status: "pending",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    if (transaction) {
      setFormData(transaction);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: "sale",
        description: "",
        accountFrom: "",
        accountTo: "",
        amount: undefined,
        status: "pending",
        reference: "",
        notes: "",
      });
    }
  }, [transaction, open]);

  // Filter active accounts and find leaf accounts (accounts without children)
  const { activeAccounts, leafAccountIds } = useMemo(() => {
    const active = accounts.filter(acc => acc.status === "active");
    
    // Build children map to find parent accounts
    const childrenMap = new Map<string, Account[]>();
    active.forEach(acc => {
      if (acc.parentId) {
        if (!childrenMap.has(acc.parentId)) {
          childrenMap.set(acc.parentId, []);
        }
        childrenMap.get(acc.parentId)!.push(acc);
      }
    });
    
    // Leaf accounts are those without children
    const leafIds = new Set(
      active
        .filter(acc => !childrenMap.has(acc.id))
        .map(acc => acc.id)
    );
    
    return { activeAccounts: active, leafAccountIds: leafIds };
  }, [accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || formData.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.accountFrom || !formData.accountTo) {
      toast({
        title: "Validation Error",
        description: "Please select both From and To accounts.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that selected accounts are leaf accounts (not parents)
    if (!leafAccountIds.has(formData.accountFrom)) {
      toast({
        title: "Validation Error",
        description: "From Account must be a leaf account (not a parent account).",
        variant: "destructive",
      });
      return;
    }
    
    if (!leafAccountIds.has(formData.accountTo)) {
      toast({
        title: "Validation Error",
        description: "To Account must be a leaf account (not a parent account).",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
    toast({
      title: transaction ? "Transaction Updated" : "Transaction Created",
      description: `Transaction has been ${transaction ? "updated" : "created"} successfully.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaction" : "Create New Transaction"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter transaction description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountFrom">From Account *</Label>
              <HierarchicalAccountSelect
                accounts={accounts}
                value={formData.accountFrom || ""}
                onValueChange={(value) => setFormData({ ...formData, accountFrom: value })}
                placeholder="Select source account"
                id="accountFrom"
              />
            </div>

            <div>
              <Label htmlFor="accountTo">To Account *</Label>
              <HierarchicalAccountSelect
                accounts={accounts}
                value={formData.accountTo || ""}
                onValueChange={(value) => setFormData({ ...formData, accountTo: value })}
                placeholder="Select destination account"
                id="accountTo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ 
                    ...formData, 
                    amount: val === "" ? undefined : parseFloat(val) || undefined 
                  });
                }}
                placeholder="Enter amount"
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as TransactionStatus })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="reconciled">Reconciled</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Invoice #, PO #, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or comments"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {transaction ? "Update Transaction" : "Create Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
