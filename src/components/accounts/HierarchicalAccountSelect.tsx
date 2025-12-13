import { Account, AccountType } from "@/types/account";
import { useMemo, useState, useEffect, useRef } from "react";
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

// Helper function to highlight search text
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery, lastIndex);

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }
    // Add highlighted match
    parts.push(
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {text.substring(index, index + query.length)}
      </mark>
    );
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
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
  // Track which parent account is expanded (only ONE at a time)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

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
        
        // Add all parents to the expand set (auto-expand all parents containing matches)
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
  
  // Determine which parents should be expanded
  // During search: auto-expand all parents containing matches
  // When not searching: only allow one manually expanded parent (accordion behavior)
  const effectiveExpandedIds = useMemo(() => {
    if (searchQuery.trim()) {
      // During search: return all auto-expanded parents
      return autoExpandedIds;
    }
    // Normal accordion: only one parent expanded
    return expandedId ? new Set([expandedId]) : new Set<string>();
  }, [searchQuery, autoExpandedIds, expandedId]);

  // Reset expanded state when search is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setExpandedId(null);
    }
  }, [searchQuery]);
  
  // Get selected account name for display
  const selectedAccount = useMemo(() => {
    if (!value) return null;
    return accounts.find(acc => acc.id === value);
  }, [value, accounts]);
  
  // Check if an account is a leaf (selectable)
  const isLeafAccount = (accountId: string): boolean => {
    return leafAccounts.some(acc => acc.id === accountId);
  };
  
  // Toggle expansion state (accordion: only ONE parent expanded at a time)
  const toggleExpanded = (accountId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedId(prev => {
      // If clicking the same parent, collapse it
      if (prev === accountId) {
        return null;
      }
      // Otherwise, expand this one (collapsing the previous)
      return accountId;
    });
  };

  // Handle ESC key to close dropdown only
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setSearchQuery("");
    }
  };
  
  // Recursively render account tree
  const renderAccountTree = (account: Account, level: number): React.ReactNode => {
    const isLeaf = isLeafAccount(account.id);
    const isExpanded = effectiveExpandedIds.has(account.id);
    const indent = level * 20;
    const children = childrenMap.get(account.id) || [];
    
    if (isLeaf) {
      // Leaf account - selectable, lighter weight
      const displayText = `${account.code} - ${account.name}`;
      return (
        <CommandItem
          key={account.id}
          value={`${account.code} ${account.name}`}
          onSelect={() => {
            onValueChange(account.id);
            setOpen(false);
            setSearchQuery("");
            setExpandedId(null);
          }}
          className="py-1"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4 shrink-0",
              value === account.id ? "opacity-100" : "opacity-0"
            )}
          />
          <span className={cn("font-normal", accountTypeColors[account.type])}>
            {searchQuery.trim() ? (
              <>
                {highlightText(account.code, searchQuery)} - {highlightText(account.name, searchQuery)}
              </>
            ) : (
              displayText
            )}
          </span>
        </CommandItem>
      );
    } else {
      // Parent account - collapsible, not selectable, slightly bolder
      const displayText = `${account.code} - ${account.name}`;
      return (
        <div key={account.id}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-sm",
              "select-none"
            )}
            style={{ paddingLeft: `${indent + 16}px` }}
            onClick={(e) => toggleExpanded(account.id, e)}
          >
            <div className="flex items-center gap-1.5 flex-1">
              {isExpanded ? (
                <Minus className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Plus className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className={cn("font-semibold", accountTypeColors[account.type])}>
                {searchQuery.trim() ? (
                  <>
                    {highlightText(account.code, searchQuery)} - {highlightText(account.name, searchQuery)}
                  </>
                ) : (
                  displayText
                )}
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
    <Popover 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setSearchQuery("");
          setExpandedId(null);
        }
      }}
    >
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
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onKeyDown={handleKeyDown}
      >
        <Command shouldFilter={false}>
          <CommandInput
            ref={searchInputRef}
            placeholder="Search by code or name..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[325px] overflow-y-auto">
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
