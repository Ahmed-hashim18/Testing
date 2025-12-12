import { useState, useMemo } from "react";
import { Activity, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityLogFilters, FilterState } from "@/components/activityLog/ActivityLogFilters";
import { ActivityLogTable } from "@/components/activityLog/ActivityLogTable";
import { useActivityLogs } from "@/hooks/useActivityLog";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { CollapsibleFilters } from "@/components/common/CollapsibleFilters";

export default function ActivityLog() {
  const { activityLogs, isLoading } = useActivityLogs();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    module: "all",
    actionType: "all",
    dateRange: "7",
    userId: "all",
  });

  const filteredLogs = useMemo(() => {
    let filtered = [...activityLogs];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.description.toLowerCase().includes(searchLower) ||
          log.userName.toLowerCase().includes(searchLower) ||
          log.userEmail.toLowerCase().includes(searchLower)
      );
    }

    // Module filter
    if (filters.module !== "all") {
      filtered = filtered.filter((log) => log.module === filters.module);
    }

    // Action type filter
    if (filters.actionType !== "all") {
      filtered = filtered.filter((log) => log.actionType === filters.actionType);
    }

    // User filter
    if (filters.userId !== "all") {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter((log) => log.timestamp >= cutoffDate);
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filters, activityLogs]);

  const handleExport = () => {
    // Placeholder for export functionality
    console.log("Exporting activity logs...", filteredLogs);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Monitor and track all system activities across modules
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Activities</div>
          <div className="text-2xl font-bold mt-1">{filteredLogs.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Today</div>
          <div className="text-2xl font-bold mt-1">
            {
              filteredLogs.filter((log) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return log.timestamp >= today;
              }).length
            }
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Active Users</div>
          <div className="text-2xl font-bold mt-1">
            {new Set(filteredLogs.map((log) => log.userId)).size}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Modules Accessed</div>
          <div className="text-2xl font-bold mt-1">
            {new Set(filteredLogs.map((log) => log.module)).size}
          </div>
        </div>
      </div>

      {/* Filters */}
      <CollapsibleFilters title="Search & Filters">
        <ActivityLogFilters onFilterChange={setFilters} />
      </CollapsibleFilters>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span>{" "}
          {filteredLogs.length === 1 ? "activity" : "activities"}
        </div>
      </div>

      {/* Table */}
      <ActivityLogTable logs={filteredLogs} />
    </div>
  );
}
