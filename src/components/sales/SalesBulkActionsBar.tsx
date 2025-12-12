import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trash2, FileDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface SalesBulkActionsBarProps {
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export function SalesBulkActionsBar({
  selectedCount,
  onConfirm,
  onCancel,
  onDelete,
  onExport,
  onClearSelection,
}: SalesBulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="font-medium">{selectedCount} selected</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onConfirm}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirm
            </Button>
            <Button variant="secondary" size="sm" onClick={onCancel}>
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={onExport}>
              <FileDown className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-primary-foreground hover:text-primary-foreground/80">
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} sales order(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
