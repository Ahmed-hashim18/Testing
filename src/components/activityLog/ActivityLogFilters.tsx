import { useState } from "react";
import { Search, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityModule, ActivityActionType } from "@/types/activityLog";

interface ActivityLogFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  module: string;
  actionType: string;
  dateRange: string;
  userId: string;
}

export function ActivityLogFilters({ onFilterChange }: ActivityLogFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    module: "all",
    actionType: "all",
    dateRange: "7",
    userId: "all",
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      search: "",
      module: "all",
      actionType: "all",
      dateRange: "7",
      userId: "all",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.search !== "" ||
    filters.module !== "all" ||
    filters.actionType !== "all" ||
    filters.userId !== "all";

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Module Filter */}
        <Select value={filters.module} onValueChange={(value) => updateFilter("module", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="dashboard">Dashboard</SelectItem>
            <SelectItem value="transactions">Transactions</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="purchases">Purchases</SelectItem>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="chart_of_accounts">Chart of Accounts</SelectItem>
            <SelectItem value="accounting">Accounting</SelectItem>
            <SelectItem value="hr_payroll">HR & Payroll</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Type Filter */}
        <Select value={filters.actionType} onValueChange={(value) => updateFilter("actionType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="view">View</SelectItem>
            <SelectItem value="export">Export</SelectItem>
            <SelectItem value="import">Import</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="status_change">Status Change</SelectItem>
            <SelectItem value="bulk_action">Bulk Action</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select value={filters.dateRange} onValueChange={(value) => updateFilter("dateRange", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 Hours</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        {/* User Filter */}
        <Select value={filters.userId} onValueChange={(value) => updateFilter("userId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="user-1">John Doe</SelectItem>
            <SelectItem value="user-2">Jane Smith</SelectItem>
            <SelectItem value="user-3">Sarah Johnson</SelectItem>
            <SelectItem value="user-4">Mike Chen</SelectItem>
            <SelectItem value="user-5">Emily Brown</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
