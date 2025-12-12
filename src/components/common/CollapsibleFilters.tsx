import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CollapsibleFiltersProps {
  children: ReactNode;
  title?: string;
  defaultOpen?: boolean;
}

export function CollapsibleFilters({ 
  children, 
  title = "Filters", 
  defaultOpen = false 
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2"
        >
          {isOpen ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show
            </>
          )}
        </Button>
      </div>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </Card>
  );
}

