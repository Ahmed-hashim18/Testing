import { ChevronRight, ChevronDown, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Account, AccountWithChildren } from "@/types/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface AccountHierarchyProps {
  accounts: AccountWithChildren[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onView: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountHierarchy({
  accounts,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
}: AccountHierarchyProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const allIds = getAllAccountIds(accounts);
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function getAllAccountIds(accts: AccountWithChildren[]): string[] {
    let ids: string[] = [];
    accts.forEach(acc => {
      ids.push(acc.id);
      if (acc.children.length > 0) {
        ids = ids.concat(getAllAccountIds(acc.children));
      }
    });
    return ids;
  }

  function formatBalance(balance: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MRU',
    }).format(balance);
  }

  function renderAccount(account: AccountWithChildren) {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedIds.has(account.id);
    const isSelected = selectedIds.has(account.id);

    return (
      <div key={account.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-4 hover:bg-muted/50 border-b border-border transition-colors",
            isSelected && "bg-muted"
          )}
          style={{ paddingLeft: `${account.level * 24 + 16}px` }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(account.id)}
          />
          
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpanded(account.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 grid grid-cols-5 gap-4 items-center">
            <div className="font-mono text-sm text-muted-foreground">
              {account.code}
            </div>
            <div className="col-span-2 font-medium text-foreground">
              {account.name}
            </div>
            <div className="text-right font-semibold text-foreground">
              {formatBalance(account.balance)}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                {account.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem onClick={() => onView(account)} className="cursor-pointer">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(account)} className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(account)} 
                    disabled={account.isImported}
                    className={account.isImported ? "opacity-50 cursor-not-allowed" : "cursor-pointer text-destructive focus:text-destructive"}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {account.isImported ? "(Imported)" : ""}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {account.children.map(child => renderAccount(child))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center gap-2 py-3 px-4 bg-muted/50 border-b border-border font-semibold text-sm">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
        />
        <div className="w-6" />
        <div className="flex-1 grid grid-cols-5 gap-4">
          <div>Code</div>
          <div className="col-span-2">Account Name</div>
          <div className="text-right">Balance</div>
          <div>Status</div>
        </div>
      </div>
      <div>
        {accounts.map(account => renderAccount(account))}
      </div>
    </div>
  );
}
