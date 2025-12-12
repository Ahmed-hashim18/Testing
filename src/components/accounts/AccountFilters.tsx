import { AccountType, AccountStatus } from "@/types/account";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccountFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: AccountType | 'all';
  onFilterTypeChange: (value: AccountType | 'all') => void;
  filterStatus: AccountStatus | 'all';
  onFilterStatusChange: (value: AccountStatus | 'all') => void;
  onReset: () => void;
}

const accountTypes: AccountType[] = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];

export function AccountFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  onReset,
}: AccountFiltersProps) {
  const hasActiveFilters = searchTerm || filterType !== 'all' || filterStatus !== 'all';

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[250px]">
        <Label htmlFor="search" className="mb-2 block">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="w-[200px]">
        <Label htmlFor="type" className="mb-2 block">Account Type</Label>
        <Select value={filterType} onValueChange={(value) => onFilterTypeChange(value as AccountType | 'all')}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Types</SelectItem>
            {accountTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[200px]">
        <Label htmlFor="status" className="mb-2 block">Status</Label>
        <Select value={filterStatus} onValueChange={(value) => onFilterStatusChange(value as AccountStatus | 'all')}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={onReset} size="default">
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      )}
    </div>
  );
}
