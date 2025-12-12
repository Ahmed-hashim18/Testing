import { useState, useCallback, useMemo } from "react";
import { FilterCriterion, SavedFilter } from "@/types/filter";
import { applyAllFilters } from "@/lib/filterOperators";

export const useAdvancedFilter = <T>(
  data: T[],
  module: string,
  initialCriteria: FilterCriterion[] = []
) => {
  const [criteria, setCriteria] = useState<FilterCriterion[]>(initialCriteria);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const stored = localStorage.getItem(`${module}-saved-filters`);
    return stored ? JSON.parse(stored) : [];
  });

  const filteredData = useMemo(() => {
    return applyAllFilters(data, criteria);
  }, [data, criteria]);

  const addCriterion = useCallback((criterion: FilterCriterion) => {
    setCriteria(prev => [...prev, criterion]);
  }, []);

  const removeCriterion = useCallback((index: number) => {
    setCriteria(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateCriterion = useCallback((index: number, criterion: FilterCriterion) => {
    setCriteria(prev => prev.map((c, i) => i === index ? criterion : c));
  }, []);

  const clearCriteria = useCallback(() => {
    setCriteria([]);
  }, []);

  const saveFilter = useCallback((name: string, description?: string) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      description,
      criteria,
      module,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(`${module}-saved-filters`, JSON.stringify(updated));
  }, [criteria, module, savedFilters]);

  const loadFilter = useCallback((filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      setCriteria(filter.criteria);
    }
  }, [savedFilters]);

  const deleteFilter = useCallback((filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem(`${module}-saved-filters`, JSON.stringify(updated));
  }, [module, savedFilters]);

  const setDefaultFilter = useCallback((filterId: string) => {
    const updated = savedFilters.map(f => ({
      ...f,
      isDefault: f.id === filterId,
    }));
    setSavedFilters(updated);
    localStorage.setItem(`${module}-saved-filters`, JSON.stringify(updated));
  }, [module, savedFilters]);

  return {
    criteria,
    filteredData,
    savedFilters,
    addCriterion,
    removeCriterion,
    updateCriterion,
    clearCriteria,
    saveFilter,
    loadFilter,
    deleteFilter,
    setDefaultFilter,
  };
};
