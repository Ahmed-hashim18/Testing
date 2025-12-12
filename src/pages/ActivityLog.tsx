import { useState, useMemo } from "react";
import { Activity, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityLogFilters, FilterState } from "@/components/activityLog/ActivityLogFilters";
import { ActivityLogTable } from "@/components/activityLog/ActivityLogTable";
import { useActivityLogs } from "@/hooks/useActivityLog";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { CollapsibleFilters } from "@/components/common/CollapsibleFilters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ActivityLog() {
  const { activityLogs, isLoading, resetActivityLogs } = useActivityLogs();
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    module: "all",
    actionType: "all",
    dateRange: "7",
    userId: "all",
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetDays, setResetDays] = useState<number | undefined>(undefined);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await resetActivityLogs({ olderThanDays: resetDays });
      toast({
        title: "Activity logs reset",
        description: resetDays 
          ? `Deleted logs older than ${resetDays} days` 
          : "All activity logs deleted",
      });
      setResetDialogOpen(false);
      setResetDays(undefined);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset activity logs",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
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
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
          <Button onClick={() => setResetDialogOpen(true)} variant="outline" className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Reset Logs
          </Button>
        </div>
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

      {/* Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Activity Logs</DialogTitle>
            <DialogDescription>
              This action cannot be undone. You can delete all logs or only logs older than a specified number of days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-option">Reset Option</Label>
              <Select 
                value={resetDays === undefined ? "all" : "older"} 
                onValueChange={(value) => setResetDays(value === "all" ? undefined : 30)}
              >
                <SelectTrigger id="reset-option">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Delete All Logs</SelectItem>
                  <SelectItem value="older">Delete Logs Older Than X Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {resetDays !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="days">Days</Label>
                <Input
                  id="days"
                  type="number"
                  min="0"
                  value={resetDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setResetDays(Number.isNaN(value) ? 30 : value);
                  }}
                  placeholder="30"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset Logs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
