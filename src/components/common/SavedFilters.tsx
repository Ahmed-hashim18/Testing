import { useState } from "react";
import { Star, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SavedFilter } from "@/types/filter";
import { Badge } from "@/components/ui/badge";

interface SavedFiltersProps {
  savedFilters: SavedFilter[];
  onLoad: (filterId: string) => void;
  onSave: (name: string, description?: string) => void;
  onDelete: (filterId: string) => void;
  onSetDefault: (filterId: string) => void;
  hasActiveCriteria: boolean;
}

export const SavedFilters = ({
  savedFilters,
  onLoad,
  onSave,
  onDelete,
  onSetDefault,
  hasActiveCriteria,
}: SavedFiltersProps) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");

  const handleSave = () => {
    if (filterName.trim()) {
      onSave(filterName.trim(), filterDescription.trim() || undefined);
      setFilterName("");
      setFilterDescription("");
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {savedFilters.length > 0 && (
        <div className="flex-1">
          <Select onValueChange={onLoad}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Load saved filter..." />
            </SelectTrigger>
            <SelectContent>
              {savedFilters.map((filter) => (
                <SelectItem key={filter.id} value={filter.id}>
                  <div className="flex items-center gap-2">
                    {filter.name}
                    {filter.isDefault && (
                      <Star className="h-3 w-3 fill-primary text-primary" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasActiveCriteria}
          >
            <Download className="h-4 w-4 mr-2" />
            Save Filter
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save your current filter criteria as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name*</Label>
              <Input
                id="filter-name"
                placeholder="e.g., High Value Customers"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-description">Description</Label>
              <Textarea
                id="filter-description"
                placeholder="Optional description..."
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!filterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {savedFilters.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Manage ({savedFilters.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Saved Filters</DialogTitle>
              <DialogDescription>
                View, set as default, or delete your saved filter presets.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{filter.name}</h4>
                      {filter.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    {filter.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {filter.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {filter.criteria.length} criteria · Created{" "}
                      {new Date(filter.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSetDefault(filter.id)}
                      className={filter.isDefault ? "text-primary" : ""}
                    >
                      <Star className={`h-4 w-4 ${filter.isDefault ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(filter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
