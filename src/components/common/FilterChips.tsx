import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterCriterion } from "@/types/filter";
import { filterOperatorLabels } from "@/lib/filterOperators";

interface FilterChipsProps {
  criteria: FilterCriterion[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
}

export const FilterChips = ({ criteria, onRemove, onClearAll }: FilterChipsProps) => {
  if (criteria.length === 0) return null;

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return String(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border">
      <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
      
      {criteria.map((criterion, index) => (
        <Badge key={index} variant="secondary" className="gap-1 pr-1">
          <span className="text-xs">
            {criterion.label || criterion.field}: {filterOperatorLabels[criterion.operator]} "{formatValue(criterion.value)}"
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {criteria.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 text-xs"
        >
          Clear All
        </Button>
      )}
    </div>
  );
};
