import { useState } from "react";
import { Plus, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { format } from "date-fns";

export default function JournalEntries() {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(true); // Show all transactions by default
  const { accounts, isLoading: isLoadingAccounts, error: accountsError, refetch: refetchAccounts } = useAccounts();
  const { transactions, isLoading: isLoadingTransactions, error: transactionsError, refetch: refetchTransactions, createTransaction } = useTransactions();

  // Debug logging
  console.log("[JournalEntries] accounts:", accounts?.length || 0, "transactions:", transactions?.length || 0);

  // Filter transactions - show all by default, or only journal entries if filter is off
  const journalEntries = showAll 
    ? transactions 
    : transactions.filter(t => 
        t.type === 'adjustment' || t.type === 'transfer'
      );

  const [newEntry, setNewEntry] = useState({
    date: '',
    reference: '',
    description: '',
    accountFrom: '',
    accountTo: '',
    amount: '',
  });

  const handleSaveEntry = async () => {
    // Validate all required fields including accounts for double-entry bookkeeping
    if (!newEntry.date || !newEntry.description || !newEntry.amount || !newEntry.accountFrom || !newEntry.accountTo) {
      console.warn('Missing required fields for journal entry');
      return;
    }
    
    await createTransaction({
      date: newEntry.date,
      type: 'adjustment',
      description: newEntry.description,
      reference: newEntry.reference || `JE-${Date.now()}`,
      amount: parseFloat(newEntry.amount),
      status: 'pending',
      accountFrom: newEntry.accountFrom,
      accountTo: newEntry.accountTo,
    });
    
    setNewEntry({
      date: '',
      reference: '',
      description: '',
      accountFrom: '',
      accountTo: '',
      amount: '',
    });
    setOpen(false);
  };

  if (isLoadingAccounts || isLoadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingSpinner />
        <p className="text-muted-foreground">Loading journal entries...</p>
      </div>
    );
  }

  // Show error state
  if (accountsError || transactionsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Error loading data</p>
        <p className="text-sm text-muted-foreground">
          {accountsError?.message || transactionsError?.message || "Unknown error"}
        </p>
        <button 
          onClick={() => {
            refetchAccounts();
            refetchTransactions();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Journal Entries & Transactions</h2>
          <p className="text-muted-foreground">
            {showAll ? "All transactions from sales, purchases, and manual entries" : "Record manual accounting entries"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAll ? "default" : "outline"}
            onClick={() => setShowAll(true)}
          >
            All Transactions
          </Button>
          <Button
            variant={!showAll ? "default" : "outline"}
            onClick={() => setShowAll(false)}
          >
            Journal Entries Only
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input 
                    placeholder="JE-XXX" 
                    value={newEntry.reference}
                    onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  placeholder="Enter description..." 
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Journal Lines</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">Debit Account</Label>
                      <Select 
                        value={newEntry.accountTo}
                        onValueChange={(value) => setNewEntry({ ...newEntry, accountTo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.name}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5">
                      <Label className="text-xs">Credit Account</Label>
                      <Select 
                        value={newEntry.accountFrom}
                        onValueChange={(value) => setNewEntry({ ...newEntry, accountFrom: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.name}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Amount</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={newEntry.amount}
                        onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEntry}>Save Entry</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account From</TableHead>
                  <TableHead>Account To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  journalEntries.map((entry) => (
                    <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(entry.date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{entry.reference || '-'}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.accountFrom || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.accountTo || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        MRU {entry.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
