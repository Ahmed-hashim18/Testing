import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Eye, Edit, Download, Trash2 } from "lucide-react";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionDetailDialog } from "@/components/transactions/TransactionDetailDialog";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { TransactionBulkActionsBar } from "@/components/transactions/TransactionBulkActionsBar";
import { CollapsibleFilters } from "@/components/common/CollapsibleFilters";
import { Transaction, TransactionFilters as Filters } from "@/types/transaction";
import { format } from "date-fns";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function Transactions() {
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransactions, bulkUpdateStatus } = useTransactions();
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    type: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          txn.description.toLowerCase().includes(searchLower) ||
          txn.id.toLowerCase().includes(searchLower) ||
          txn.reference?.toLowerCase().includes(searchLower) ||
          txn.accountFrom?.toLowerCase().includes(searchLower) ||
          txn.accountTo?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      if (filters.status !== "all" && txn.status !== filters.status) return false;
      if (filters.type !== "all" && txn.type !== filters.type) return false;

      if (filters.dateFrom && txn.date < filters.dateFrom) return false;
      if (filters.dateTo && txn.date > filters.dateTo) return false;

      if (filters.amountMin && txn.amount < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && txn.amount > parseFloat(filters.amountMax)) return false;

      return true;
    });
  }, [transactions, filters]);

  if (isLoading || isLoadingAccounts) {
    return <LoadingSpinner />;
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTransactions.map((txn) => txn.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleView = (transaction: Transaction) => {
    setDetailTransaction(transaction);
    setShowDetailDialog(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowFormDialog(true);
  };

  const handleCreate = () => {
    setEditTransaction(null);
    setShowFormDialog(true);
  };

  const handleSave = async (transactionData: Partial<Transaction>) => {
    if (editTransaction) {
      await updateTransaction({ id: editTransaction.id, data: transactionData });
    } else {
      await createTransaction(transactionData);
    }
  };

  const handleComplete = async () => {
    await bulkUpdateStatus({ ids: selectedIds, status: "posted" });
    setSelectedIds([]);
  };

  const handleCancelTransactions = async () => {
    await bulkUpdateStatus({ ids: selectedIds, status: "void" });
    setSelectedIds([]);
  };

  const handleDelete = async () => {
    await deleteTransactions(selectedIds);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "Date", "Type", "Description", "From Account", "To Account", "Amount", "Status", "Reference"].join(","),
      ...filteredTransactions.map((txn) =>
        [
          txn.id,
          txn.date,
          txn.type,
          `"${txn.description}"`,
          txn.accountFrom || "",
          txn.accountTo || "",
          txn.amount,
          txn.status,
          txn.reference || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "posted":
        return "default";
      case "pending":
        return "secondary";
      case "void":
        return "destructive";
      case "reconciled":
        return "default";
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage all financial transactions and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      <CollapsibleFilters title="Search & Filters">
        <TransactionFilters filters={filters} onFiltersChange={setFilters} />
      </CollapsibleFilters>

      {selectedIds.length > 0 && (
        <TransactionBulkActionsBar
          selectedCount={selectedIds.length}
          onComplete={handleComplete}
          onCancel={handleCancelTransactions}
          onDelete={handleDelete}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No transactions found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(txn.id)}
                        onCheckedChange={(checked) => handleSelectOne(txn.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{txn.id}</TableCell>
                    <TableCell>{format(new Date(txn.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeVariant(txn.type)} className="capitalize">
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{txn.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{txn.accountFrom || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{txn.accountTo || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      MRU {txn.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(txn.status)} className="capitalize">
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(txn)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(txn)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <TransactionDetailDialog
        transaction={detailTransaction}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <TransactionFormDialog
        transaction={editTransaction}
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        onSave={handleSave}
        accounts={accounts}
      />
    </div>
  );
}
