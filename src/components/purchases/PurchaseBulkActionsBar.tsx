import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Trash2, Download } from "lucide-react";

interface PurchaseBulkActionsBarProps {
  selectedCount: number;
  onMarkOrdered: () => void;
  onMarkReceived: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export function PurchaseBulkActionsBar({
  selectedCount,
  onMarkOrdered,
  onMarkReceived,
  onMarkPaid,
  onCancel,
  onDelete,
  onExport,
  onClearSelection,
}: PurchaseBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-lg rounded-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5">
      <span className="font-semibold text-sm">
        {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
      </span>

      <div className="h-6 w-px bg-border" />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onMarkOrdered}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark Ordered
        </Button>
        <Button variant="outline" size="sm" onClick={onMarkReceived}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark Received
        </Button>
        <Button variant="outline" size="sm" onClick={onMarkPaid}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark Paid
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <XCircle className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear
      </Button>
    </div>
  );
}
