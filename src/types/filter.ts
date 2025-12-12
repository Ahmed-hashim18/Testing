export type FilterOperator = 
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "notIn";

export interface FilterCriterion {
  field: string;
  operator: FilterOperator;
  value: any;
  label?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  criteria: FilterCriterion[];
  module: string;
  createdAt: string;
  updatedAt?: string;
  isDefault?: boolean;
}

export interface AdvancedFilterConfig {
  field: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "multiselect" | "boolean";
  operators?: FilterOperator[];
  options?: { label: string; value: string }[];
  placeholder?: string;
}
