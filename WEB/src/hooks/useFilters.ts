import { useState } from 'react';

export interface FilterState {
  searchTerm: string;
  categoryFilter: string;
  statusFilter: string;
  departmentFilter: string;
}

export const useFilters = (initialState?: Partial<FilterState>) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    departmentFilter: 'all',
    ...initialState
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      categoryFilter: 'all',
      statusFilter: 'all',
      departmentFilter: 'all'
    });
  };

  const hasActiveFilters = () => {
    return filters.searchTerm !== '' ||
           filters.categoryFilter !== 'all' ||
           filters.statusFilter !== 'all' ||
           filters.departmentFilter !== 'all';
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
};
