import { Account, AccountType } from "@/types/account";
import { useMemo, useState } from "react";
import { Plus, Minus, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HierarchicalAccountSelectProps {
  accounts: Account[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

// Color mapping for account types
const accountTypeColors: Record<AccountType, string> = {
  'Assets': 'text-blue-600 dark:text-blue-400',
  'Liabilities': 'text-red-600 dark:text-red-400',
  'Equity': 'text-green-600 dark:text-green-400',
  'Revenue': 'text-purple-600 dark:text-purple-400',
  'Expenses': 'text-orange-600 dark:text-orange-400',
};

export function HierarchicalAccountSelect({
  accounts,
  value,
  onValueChange,
  placeholder = "Select account",
  id,
}: HierarchicalAccountSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Track which parent accounts are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Build hierarchy and find leaf accounts (accounts without children)
  const { hierarchicalAccounts, leafAccounts, childrenMap, accountMap } = useMemo(() => {
    const activeAccounts = accounts.filter(acc => acc.status === "active");
    
    // Build parent-child relationships and account map
    const childMap = new Map<string, Account[]>();
    const accMap = new Map<string, Account>();
    
    activeAccounts.forEach(acc => {
      accMap.set(acc.id, acc);
      if (acc.parentId) {
        if (!childMap.has(acc.parentId)) {
          childMap.set(acc.parentId, []);
        }
        childMap.get(acc.parentId)!.push(acc);
      }
    });
    
    // Find leaf accounts (accounts without children)
    const leaf = activeAccounts.filter(acc => !childMap.has(acc.id));
    
    // Build hierarchical structure by type
    const buildHierarchy = (parentId: string | null, level: number = 0): Array<{ account: Account; level: number }> => {
      const result: Array<{ account: Account; level: number }> = [];
      
      activeAccounts
        .filter(acc => acc.parentId === parentId)
        .sort((a, b) => a.code.localeCompare(b.code))
        .forEach(acc => {
          result.push({ account: acc, level });
        });
      
      return result;
    };
    
    // Group by account type
    const byType = new Map<AccountType, Array<{ account: Account; level: number }>>();
    const rootAccounts = buildHierarchy(null);
    
    rootAccounts.forEach(({ account, level }) => {
      if (!byType.has(account.type)) {
        byType.set(account.type, []);
      }
      byType.get(account.type)!.push({ account, level });
    });
    
    return {
      hierarchicalAccounts: byType,
      leafAccounts: leaf,
      childrenMap: childMap,
      accountMap: accMap,
    };
  }, [accounts]);
  
  // Filter accounts based on search query and determine which parents to auto-expand
  const { filteredHierarchicalAccounts, autoExpandedIds } = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        filteredHierarchicalAccounts: hierarchicalAccounts,
        autoExpandedIds: new Set<string>(),
      };
    }
    
    const query = searchQuery.toLowerCase().trim();
    const matchingAccountIds = new Set<string>();
    const parentsToExpand = new Set<string>();
    
    // Find all accounts that match the search (by code or name)
    accountMap.forEach((account) => {
      const matchesCode = account.code.toLowerCase().includes(query);
      const matchesName = account.name.toLowerCase().includes(query);
      
      if (matchesCode || matchesName) {
        matchingAccountIds.add(account.id);
        
        // Add all parents to the expand set
        let currentId: string | null = account.parentId;
        while (currentId) {
          parentsToExpand.add(currentId);
          const parent = accountMap.get(currentId);
          currentId = parent?.parentId || null;
        }
      }
    });
    
    // Filter hierarchy: only show accounts that match or have matching descendants
    const hasMatchingDescendant = (accountId: string): boolean => {
      if (matchingAccountIds.has(accountId)) return true;
      const children = childrenMap.get(accountId) || [];
      return children.some(child => hasMatchingDescendant(child.id));
    };
    
    const filteredByType = new Map<AccountType, Array<{ account: Account; level: number }>>();
    
    hierarchicalAccounts.forEach((accountList, type) => {
      const filtered = accountList.filter(({ account }) => hasMatchingDescendant(account.id));
      if (filtered.length > 0) {
        filteredByType.set(type, filtered);
      }
    });
    
    return {
      filteredHierarchicalAccounts: filteredByType,
      autoExpandedIds: parentsToExpand,
    };
  }, [searchQuery, hierarchicalAccounts, childrenMap, accountMap]);
  
  // Merge auto-expanded IDs with manually expanded ones
  const effectiveExpandedIds = useMemo(() => {
    const merged = new Set(expandedIds);
    autoExpandedIds.forEach(id => merged.add(id));
    return merged;
  }, [expandedIds, autoExpandedIds]);
  
  // Get selected account name for display
  const selectedAccount = useMemo(() => {
    if (!value) return null;
    return accounts.find(acc => acc.id === value);
  }, [value, accounts]);
  
  // Check if an account is a leaf (selectable)
  const isLeafAccount = (accountId: string): boolean => {
    return leafAccounts.some(acc => acc.id === accountId);
  };
  
  // Toggle expansion state
  const toggleExpanded = (accountId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };
  
  // Recursively render account tree
  const renderAccountTree = (account: Account, level: number): React.ReactNode => {
    const isLeaf = isLeafAccount(account.id);
    const isExpanded = effectiveExpandedIds.has(account.id);
    const indent = level * 20;
    const children = childrenMap.get(account.id) || [];
    
    if (isLeaf) {
      // Leaf account - selectable
      return (
        <CommandItem
          key={account.id}
          value={`${account.code} ${account.name}`}
          onSelect={() => {
            onValueChange(account.id);
            setOpen(false);
            setSearchQuery("");
          }}
          className="pl-4"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              value === account.id ? "opacity-100" : "opacity-0"
            )}
          />
          <span className={accountTypeColors[account.type]}>
            {account.code} - {account.name}
          </span>
        </CommandItem>
      );
    } else {
      // Parent account - collapsible, not selectable
      return (
        <div key={account.id}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-sm",
              "select-none"
            )}
            style={{ paddingLeft: `${indent + 16}px` }}
            onClick={(e) => toggleExpanded(account.id, e)}
          >
            <div className="flex items-center gap-1.5 flex-1">
              {isExpanded ? (
                <Minus className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span className={cn("opacity-80", accountTypeColors[account.type])}>
                {account.code} - {account.name}
              </span>
            </div>
          </div>
          {isExpanded && children.length > 0 && (
            <div>
              {children
                .sort((a, b) => a.code.localeCompare(b.code))
                .map(child => renderAccountTree(child, level + 1))}
            </div>
          )}
        </div>
      );
    }
  };
  
  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setSearchQuery("");
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          id={id}
        >
          {selectedAccount ? (
            <span className={accountTypeColors[selectedAccount.type]}>
              {selectedAccount.code} - {selectedAccount.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by code or name..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No account found.</CommandEmpty>
            {Array.from(filteredHierarchicalAccounts.entries())
              .sort(([typeA], [typeB]) => {
                const order: AccountType[] = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];
                return order.indexOf(typeA) - order.indexOf(typeB);
              })
              .map(([type, accountList]) => (
                <CommandGroup key={type} heading={type}>
                  {/* Accounts in this type - render tree recursively */}
                  {accountList.map(({ account }) => renderAccountTree(account, 0))}
                </CommandGroup>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

