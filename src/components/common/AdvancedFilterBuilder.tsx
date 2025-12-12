import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdvancedFilterConfig, FilterCriterion, FilterOperator } from "@/types/filter";
import { getOperatorsForType, filterOperatorLabels } from "@/lib/filterOperators";

interface AdvancedFilterBuilderProps {
  config: AdvancedFilterConfig[];
  onAddCriterion: (criterion: FilterCriterion) => void;
}

export const AdvancedFilterBuilder = ({
  config,
  onAddCriterion,
}: AdvancedFilterBuilderProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedField, setSelectedField] = useState<AdvancedFilterConfig | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | "">("");
  const [filterValue, setFilterValue] = useState("");
  const [filterValue2, setFilterValue2] = useState(""); // For "between" operator

  const handleFieldChange = (fieldName: string) => {
    const field = config.find(c => c.field === fieldName);
    if (field) {
      setSelectedField(field);
      const operators = field.operators || getOperatorsForType(field.type);
      setSelectedOperator(operators[0] || "");
      setFilterValue("");
      setFilterValue2("");
    }
  };

  const handleAddFilter = () => {
    if (!selectedField || !selectedOperator) return;

    const criterion: FilterCriterion = {
      field: selectedField.field,
      label: selectedField.label,
      operator: selectedOperator as FilterOperator,
      value: selectedOperator === "between" 
        ? [filterValue, filterValue2]
        : selectedOperator === "in" || selectedOperator === "notIn"
        ? filterValue.split(",").map(v => v.trim())
        : filterValue,
    };

    onAddCriterion(criterion);
    setShowDialog(false);
    setSelectedField(null);
    setSelectedOperator("");
    setFilterValue("");
    setFilterValue2("");
  };

  const availableOperators = selectedField
    ? selectedField.operators || getOperatorsForType(selectedField.type)
    : [];

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Filter Criterion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Filter Criterion</DialogTitle>
          <DialogDescription>
            Create a custom filter to narrow down your results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Field</Label>
            <Select value={selectedField?.field || ""} onValueChange={handleFieldChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {config.map((field) => (
                  <SelectItem key={field.field} value={field.field}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedField && (
            <div className="space-y-2">
              <Label>Operator</Label>
              <Select value={selectedOperator} onValueChange={(v) => setSelectedOperator(v as FilterOperator)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {filterOperatorLabels[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedField && selectedOperator && (
            <>
              {selectedField.type === "select" ? (
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select value..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedField.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : selectedOperator === "between" ? (
                <>
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input
                      type={selectedField.type === "date" ? "date" : selectedField.type}
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder={selectedField.placeholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input
                      type={selectedField.type === "date" ? "date" : selectedField.type}
                      value={filterValue2}
                      onChange={(e) => setFilterValue2(e.target.value)}
                      placeholder={selectedField.placeholder}
                    />
                  </div>
                </>
              ) : (selectedOperator === "in" || selectedOperator === "notIn") ? (
                <div className="space-y-2">
                  <Label>Values (comma-separated)</Label>
                  <Input
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="value1, value2, value3"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type={selectedField.type === "date" ? "date" : selectedField.type}
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder={selectedField.placeholder}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddFilter}
            disabled={!selectedField || !selectedOperator || !filterValue}
          >
            Add Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
