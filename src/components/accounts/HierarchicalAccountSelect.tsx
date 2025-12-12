import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account, AccountType } from "@/types/account";
import { useMemo } from "react";

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
  // Build hierarchy and find leaf accounts (accounts without children)
  const { hierarchicalAccounts, leafAccounts } = useMemo(() => {
    const activeAccounts = accounts.filter(acc => acc.status === "active");
    
    // Build parent-child relationships
    const accountMap = new Map<string, Account>();
    const childrenMap = new Map<string, Account[]>();
    
    activeAccounts.forEach(acc => {
      accountMap.set(acc.id, acc);
      if (acc.parentId) {
        if (!childrenMap.has(acc.parentId)) {
          childrenMap.set(acc.parentId, []);
        }
        childrenMap.get(acc.parentId)!.push(acc);
      }
    });
    
    // Find leaf accounts (accounts without children)
    const leafAccounts = activeAccounts.filter(acc => !childrenMap.has(acc.id));
    
    // Build hierarchical structure
    const buildHierarchy = (parentId: string | null, level: number = 0): Array<{ account: Account; level: number }> => {
      const result: Array<{ account: Account; level: number }> = [];
      
      activeAccounts
        .filter(acc => acc.parentId === parentId)
        .sort((a, b) => a.code.localeCompare(b.code))
        .forEach(acc => {
          result.push({ account: acc, level });
          // Recursively add children
          const children = buildHierarchy(acc.id, level + 1);
          result.push(...children);
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
      leafAccounts,
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
      <SelectContent className="max-h-[300px]">
        {Array.from(hierarchicalAccounts.entries())
          .sort(([typeA], [typeB]) => {
            const order: AccountType[] = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];
            return order.indexOf(typeA) - order.indexOf(typeB);
          })
          .map(([type, accountList]) => (
            <div key={type}>
              {/* Type Header - Not selectable */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {type}
              </div>
              
              {/* Accounts in this type */}
              {accountList.map(({ account, level }) => {
                const isLeaf = isLeafAccount(account.id);
                const indent = level * 20;
                
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
                  // Parent account - not selectable, just a label
                  return (
                    <div
                      key={account.id}
                      className="px-2 py-1.5 text-sm text-muted-foreground cursor-not-allowed"
                      style={{ paddingLeft: `${indent + 16}px` }}
                    >
                      <span className="opacity-60">
                        └── {account.code} - {account.name}
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          ))}
      </SelectContent>
    </Select>
  );
}

