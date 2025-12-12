import { useState, useMemo, useEffect } from "react";
import { Plus, Download, BarChart3, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Account, AccountType, AccountStatus, AccountWithChildren } from "@/types/account";
import { useAccounts } from "@/hooks/useAccounts";
import { AccountHierarchy } from "@/components/accounts/AccountHierarchy";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountDetailDialog } from "@/components/accounts/AccountDetailDialog";
import { AccountFilters } from "@/components/accounts/AccountFilters";
import { BulkActionsBar } from "@/components/accounts/BulkActionsBar";
import { AccountAnalytics } from "@/components/accounts/AccountAnalytics";
import { ImportAccountsDialog } from "@/components/accounts/ImportAccountsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChartOfAccounts() {
  const { 
    accounts, 
    isLoading, 
    error: accountsError,
    createAccount, 
    updateAccount, 
    deleteAccount: deleteAccountMutation,
    bulkDeleteAccounts,
    bulkUpdateStatus,
    importAccounts,
    refetch: refetchAccounts
  } = useAccounts();

  // Debug logging
  console.log("[ChartOfAccounts] accounts:", accounts?.length || 0, "isLoading:", isLoading, "error:", accountsError);
  
  // Force refetch accounts periodically to ensure balances are up to date
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAccounts();
    }, 10000); // Refetch every 10 seconds
    
    return () => clearInterval(interval);
  }, [refetchAccounts]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [deleteAccountState, setDeleteAccountState] = useState<Account | null>(null);

  // Build hierarchy
  const hierarchicalAccounts = useMemo(() => {
    const filtered = accounts.filter(account => {
      const matchesSearch = searchTerm === '' || 
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || account.type === filterType;
      const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });

    function buildTree(parentId: string | null, level: number = 0): AccountWithChildren[] {
      return filtered
        .filter(acc => acc.parentId === parentId)
        .map(acc => ({
          ...acc,
          level,
          children: buildTree(acc.id, level + 1),
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    }

    return buildTree(null);
  }, [accounts, searchTerm, filterType, filterStatus]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    function getAllIds(accts: AccountWithChildren[]): string[] {
      let ids: string[] = [];
      accts.forEach(acc => {
        ids.push(acc.id);
        if (acc.children.length > 0) {
          ids = ids.concat(getAllIds(acc.children));
        }
      });
      return ids;
    }

    const allIds = getAllIds(hierarchicalAccounts);
    if (allIds.length > 0 && allIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleSaveAccount = async (accountData: Partial<Account>) => {
    if (editingAccount) {
      await updateAccount({ id: editingAccount.id, data: accountData });
    } else {
      await createAccount(accountData);
    }
    setEditingAccount(null);
    setFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleteAccountState) {
      await deleteAccountMutation(deleteAccountState.id);
      setDeleteAccountState(null);
    }
  };

  const handleBulkActivate = async () => {
    await bulkUpdateStatus({ ids: Array.from(selectedIds), status: 'active' });
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = async () => {
    await bulkUpdateStatus({ ids: Array.from(selectedIds), status: 'inactive' });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    await bulkDeleteAccounts(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
  };

  const handleExport = () => {
    // Export functionality
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingSpinner />
        <p className="text-muted-foreground">Loading chart of accounts...</p>
      </div>
    );
  }

  // Show error state
  if (accountsError) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive font-medium">Error loading accounts</p>
          <p className="text-sm text-muted-foreground">
            {accountsError?.message || "Unknown error occurred"}
          </p>
          <button 
            onClick={() => refetchAccounts()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chart of Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your accounting structure and account hierarchy
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Accounts
          </Button>
          <Button onClick={() => { setEditingAccount(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Accounts</CardDescription>
                <CardTitle className="text-3xl">{totalAccounts}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{activeAccounts} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Balance</CardDescription>
                <CardTitle className="text-3xl">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'MRU',
                    notation: 'compact',
                  }).format(totalBalance)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Across all accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Selected</CardDescription>
                <CardTitle className="text-3xl">{selectedIds.size}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 ? 'Bulk actions available' : 'No selection'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                onReset={handleResetFilters}
              />
            </CardContent>
          </Card>

          <AccountHierarchy
            accounts={hierarchicalAccounts}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onView={(account) => {
              setViewingAccount(account);
              setDetailOpen(true);
            }}
            onEdit={(account) => {
              setEditingAccount(account);
              setFormOpen(true);
            }}
            onDelete={(account) => {
              if (account.isImported) {
                alert("No se puede eliminar una cuenta importada. Las cuentas importadas son permanentes.");
                return;
              }
              setDeleteAccountState(account);
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AccountAnalytics accounts={accounts} />
        </TabsContent>
      </Tabs>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editingAccount}
        accounts={accounts}
        onSave={handleSaveAccount}
      />

      <AccountDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        account={viewingAccount}
        transactions={[]}
      />

      <AlertDialog open={!!deleteAccountState} onOpenChange={(open) => !open && setDeleteAccountState(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAccountState?.name}"? This action cannot be undone
              and will remove all transaction history for this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportAccountsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={importAccounts}
        existingAccounts={accounts}
      />

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
