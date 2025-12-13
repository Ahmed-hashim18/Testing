import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account, AccountType } from "@/types/account";
import { useMemo, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Track which parent accounts are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Build hierarchy and find leaf accounts (accounts without children)
  const { hierarchicalAccounts, leafAccounts, childrenMap } = useMemo(() => {
    const activeAccounts = accounts.filter(acc => acc.status === "active");
    
    // Build parent-child relationships
    const childMap = new Map<string, Account[]>();
    
    activeAccounts.forEach(acc => {
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
    };
  }, [accounts]);
  
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
    const isExpanded = expandedIds.has(account.id);
    const indent = level * 20;
    const children = childrenMap.get(account.id) || [];
    
    if (isLeaf) {
      // Leaf account - selectable
      return (
        <SelectItem
          key={account.id}
          value={account.id}
          className="pl-4"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          <span className={accountTypeColors[account.type]}>
            {account.code} - {account.name}
          </span>
        </SelectItem>
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
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder}>
          {selectedAccount ? (
            <span className={accountTypeColors[selectedAccount.type]}>
              {selectedAccount.code} - {selectedAccount.name}
            </span>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px] overflow-y-auto">
        {Array.from(hierarchicalAccounts.entries())
          .sort(([typeA], [typeB]) => {
            const order: AccountType[] = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];
            return order.indexOf(typeA) - order.indexOf(typeB);
          })
          .map(([type, accountList]) => (
            <div key={type}>
              {/* Type Header - Not selectable */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background z-10 border-b">
                {type}
              </div>
              
              {/* Accounts in this type - render tree recursively */}
              {accountList.map(({ account }) => renderAccountTree(account, 0))}
            </div>
          ))}
      </SelectContent>
    </Select>
  );
}

