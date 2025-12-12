import { FilterOperator, FilterCriterion } from "@/types/filter";

export const filterOperatorLabels: Record<FilterOperator, string> = {
  equals: "Equals",
  notEquals: "Not Equals",
  contains: "Contains",
  notContains: "Does Not Contain",
  startsWith: "Starts With",
  endsWith: "Ends With",
  greaterThan: "Greater Than",
  lessThan: "Less Than",
  greaterThanOrEqual: "Greater Than or Equal",
  lessThanOrEqual: "Less Than or Equal",
  between: "Between",
  in: "In",
  notIn: "Not In",
};

export const getOperatorsForType = (type: string): FilterOperator[] => {
  switch (type) {
    case "text":
      return ["equals", "notEquals", "contains", "notContains", "startsWith", "endsWith"];
    case "number":
      return ["equals", "notEquals", "greaterThan", "lessThan", "greaterThanOrEqual", "lessThanOrEqual", "between"];
    case "date":
      return ["equals", "notEquals", "greaterThan", "lessThan", "between"];
    case "select":
      return ["equals", "notEquals", "in", "notIn"];
    case "boolean":
      return ["equals"];
    default:
      return ["equals", "notEquals"];
  }
};

export const applyFilter = (item: any, criterion: FilterCriterion): boolean => {
  const { field, operator, value } = criterion;
  const fieldValue = getNestedValue(item, field);

  if (fieldValue === undefined || fieldValue === null) return false;

  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "notEquals":
      return fieldValue !== value;
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case "notContains":
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case "startsWith":
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
    case "endsWith":
      return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
    case "greaterThan":
      return Number(fieldValue) > Number(value);
    case "lessThan":
      return Number(fieldValue) < Number(value);
    case "greaterThanOrEqual":
      return Number(fieldValue) >= Number(value);
    case "lessThanOrEqual":
      return Number(fieldValue) <= Number(value);
    case "between":
      return Number(fieldValue) >= Number(value[0]) && Number(fieldValue) <= Number(value[1]);
    case "in":
      return Array.isArray(value) && value.includes(fieldValue);
    case "notIn":
      return Array.isArray(value) && !value.includes(fieldValue);
    default:
      return true;
  }
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

export const applyAllFilters = <T>(items: T[], criteria: FilterCriterion[]): T[] => {
  if (!criteria || criteria.length === 0) return items;
  
  return items.filter(item => 
    criteria.every(criterion => applyFilter(item, criterion))
  );
};
