import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ReportFiltersProps {
  period: string;
  onPeriodChange: (value: string) => void;
  onExport?: () => void;
  showExport?: boolean;
}

export default function ReportFilters({
  period,
  onPeriodChange,
  onExport,
  showExport = true,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-card rounded-lg border">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Period
        </Label>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Current Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="current-quarter">Current Quarter</SelectItem>
            <SelectItem value="last-quarter">Last Quarter</SelectItem>
            <SelectItem value="current-year">Current Year (YTD)</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showExport && (
        <Button onClick={onExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      )}
    </div>
  );
}
