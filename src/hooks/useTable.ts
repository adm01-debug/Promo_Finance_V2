/**
 * Enhanced Table Hooks
 * Reusable table logic with sorting, filtering, pagination, and selection
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PAGINATION } from '@/lib/constants';

// ==========================================
// TYPES
// ==========================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterConfig<T> {
  field: keyof T;
  value: string | number | boolean | null;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
}

interface UseTableOptions<T> {
  data: T[];
  initialSort?: SortConfig<T>;
  initialPageSize?: number;
  initialFilters?: FilterConfig<T>[];
  searchFields?: (keyof T)[];
  persistState?: boolean;
  stateKey?: string;
}

interface UseTableReturn<T> {
  // Data
  displayData: T[];
  totalItems: number;
  
  // Sorting
  sortConfig: SortConfig<T>;
  handleSort: (key: keyof T) => void;
  clearSort: () => void;
  
  // Pagination
  pagination: PaginationConfig;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Filters
  filters: FilterConfig<T>[];
  addFilter: (filter: FilterConfig<T>) => void;
  removeFilter: (field: keyof T) => void;
  clearFilters: () => void;
  setFilters: (filters: FilterConfig<T>[]) => void;
  
  // Selection
  selectedItems: T[];
  selectedIds: Set<string>;
  isSelected: (item: T, idKey?: keyof T) => boolean;
  toggleSelection: (item: T, idKey?: keyof T) => void;
  selectAll: (idKey?: keyof T) => void;
  deselectAll: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  
  // Reset
  reset: () => void;
}

// ==========================================
// MAIN TABLE HOOK
// ==========================================

export function useTable<T extends Record<string, unknown>>({
  data,
  initialSort = { key: null, direction: 'asc' },
  initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  initialFilters = [],
  searchFields = [],
  persistState = false,
  stateKey = 'table',
}: UseTableOptions<T>): UseTableReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL if persistState is true
  const getInitialState = useCallback(() => {
    if (persistState) {
      const page = parseInt(searchParams.get(`${stateKey}_page`) || '1');
      const pageSize = parseInt(searchParams.get(`${stateKey}_size`) || String(initialPageSize));
      const sortKey = searchParams.get(`${stateKey}_sort`) as keyof T | null;
      const sortDir = searchParams.get(`${stateKey}_dir`) as SortDirection || 'asc';
      const search = searchParams.get(`${stateKey}_q`) || '';
      
      return { page, pageSize, sortKey, sortDir, search };
    }
    return {
      page: 1,
      pageSize: initialPageSize,
      sortKey: initialSort.key,
      sortDir: initialSort.direction,
      search: '',
    };
  }, [persistState, searchParams, stateKey, initialPageSize, initialSort]);

  const initial = getInitialState();
  
  // State
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: initial.sortKey,
    direction: initial.sortDir,
  });
  const [currentPage, setCurrentPage] = useState(initial.page);
  const [pageSize, setPageSizeState] = useState(initial.pageSize);
  const [searchTerm, setSearchTermState] = useState(initial.search);
  const [filters, setFiltersState] = useState<FilterConfig<T>[]>(initialFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Persist state to URL
  useEffect(() => {
    if (!persistState) return;
    
    const params = new URLSearchParams(searchParams);
    params.set(`${stateKey}_page`, String(currentPage));
    params.set(`${stateKey}_size`, String(pageSize));
    if (sortConfig.key) params.set(`${stateKey}_sort`, String(sortConfig.key));
    params.set(`${stateKey}_dir`, sortConfig.direction);
    if (searchTerm) params.set(`${stateKey}_q`, searchTerm);
    
    setSearchParams(params, { replace: true });
  }, [persistState, stateKey, currentPage, pageSize, sortConfig, searchTerm, searchParams, setSearchParams]);

  // Filter data by search term
  const searchedData = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, searchFields]);

  // Apply filters
  const filteredData = useMemo(() => {
    if (filters.length === 0) return searchedData;
    
    return searchedData.filter(item =>
      filters.every(filter => {
        const value = item[filter.field];
        const filterValue = filter.value;
        const operator = filter.operator || 'eq';
        
        if (filterValue == null) return true;
        
        switch (operator) {
          case 'eq':
            return value === filterValue;
          case 'neq':
            return value !== filterValue;
          case 'gt':
            return Number(value) > Number(filterValue);
          case 'gte':
            return Number(value) >= Number(filterValue);
          case 'lt':
            return Number(value) < Number(filterValue);
          case 'lte':
            return Number(value) <= Number(filterValue);
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          default:
            return true;
        }
      })
    );
  }, [searchedData, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'pt-BR');
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const displayData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  // Handlers
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  const goToPage = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    setCurrentPage(1);
  }, []);

  const addFilter = useCallback((filter: FilterConfig<T>) => {
    setFiltersState(prev => {
      const existing = prev.findIndex(f => f.field === filter.field);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = filter;
        return updated;
      }
      return [...prev, filter];
    });
    setCurrentPage(1);
  }, []);

  const removeFilter = useCallback((field: keyof T) => {
    setFiltersState(prev => prev.filter(f => f.field !== field));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState([]);
    setCurrentPage(1);
  }, []);

  const setFilters = useCallback((newFilters: FilterConfig<T>[]) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
  }, []);

  // Selection
  const isSelected = useCallback((item: T, idKey: keyof T = 'id' as keyof T) => {
    const id = String(item[idKey]);
    return selectedIds.has(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((item: T, idKey: keyof T = 'id' as keyof T) => {
    const id = String(item[idKey]);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((idKey: keyof T = 'id' as keyof T) => {
    const ids = displayData.map(item => String(item[idKey]));
    setSelectedIds(new Set(ids));
  }, [displayData]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedItems = useMemo(() => {
    return displayData.filter(item => selectedIds.has(String((item as Record<string, unknown>).id)));
  }, [displayData, selectedIds]);

  const isAllSelected = displayData.length > 0 && displayData.every(item => 
    selectedIds.has(String((item as Record<string, unknown>).id))
  );
  
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const reset = useCallback(() => {
    setSortConfig(initialSort);
    setCurrentPage(1);
    setPageSizeState(initialPageSize);
    setSearchTermState('');
    setFiltersState(initialFilters);
    setSelectedIds(new Set());
  }, [initialSort, initialPageSize, initialFilters]);

  return {
    displayData,
    totalItems,
    sortConfig,
    handleSort,
    clearSort,
    pagination: { page: currentPage, pageSize, total: totalItems },
    currentPage,
    pageSize,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    setFilters,
    selectedItems,
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    isAllSelected,
    isSomeSelected,
    reset,
  };
}

// ==========================================
// COLUMN VISIBILITY HOOK
// ==========================================

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  visible: boolean;
  sortable?: boolean;
  width?: string;
}

interface UseColumnVisibilityReturn<T> {
  columns: ColumnConfig<T>[];
  visibleColumns: ColumnConfig<T>[];
  toggleColumn: (key: keyof T) => void;
  showColumn: (key: keyof T) => void;
  hideColumn: (key: keyof T) => void;
  showAll: () => void;
  hideAll: () => void;
  reset: () => void;
}

export function useColumnVisibility<T>(
  initialColumns: ColumnConfig<T>[],
  persistKey?: string
): UseColumnVisibilityReturn<T> {
  const [columns, setColumns] = useState<ColumnConfig<T>[]>(() => {
    if (persistKey) {
      const stored = localStorage.getItem(`columns_${persistKey}`);
      if (stored) {
        try {
          const visibility = JSON.parse(stored) as Record<string, boolean>;
          return initialColumns.map(col => ({
            ...col,
            visible: visibility[String(col.key)] ?? col.visible,
          }));
        } catch {
          // Ignore
        }
      }
    }
    return initialColumns;
  });

  // Persist visibility
  useEffect(() => {
    if (persistKey) {
      const visibility = Object.fromEntries(
        columns.map(col => [String(col.key), col.visible])
      );
      localStorage.setItem(`columns_${persistKey}`, JSON.stringify(visibility));
    }
  }, [columns, persistKey]);

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible),
  [columns]);

  const toggleColumn = useCallback((key: keyof T) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  }, []);

  const showColumn = useCallback((key: keyof T) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, visible: true } : col
    ));
  }, []);

  const hideColumn = useCallback((key: keyof T) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, visible: false } : col
    ));
  }, []);

  const showAll = useCallback(() => {
    setColumns(prev => prev.map(col => ({ ...col, visible: true })));
  }, []);

  const hideAll = useCallback(() => {
    setColumns(prev => prev.map(col => ({ ...col, visible: false })));
  }, []);

  const reset = useCallback(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  return {
    columns,
    visibleColumns,
    toggleColumn,
    showColumn,
    hideColumn,
    showAll,
    hideAll,
    reset,
  };
}

// ==========================================
// ROW EXPANSION HOOK
// ==========================================

interface UseRowExpansionReturn {
  expandedRows: Set<string>;
  isExpanded: (id: string) => boolean;
  toggleExpansion: (id: string) => void;
  expandRow: (id: string) => void;
  collapseRow: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
}

export function useRowExpansion(
  allowMultiple = true
): UseRowExpansionReturn {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const isExpanded = useCallback((id: string) => {
    return expandedRows.has(id);
  }, [expandedRows]);

  const toggleExpansion = useCallback((id: string) => {
    setExpandedRows(prev => {
      const next = allowMultiple ? new Set(prev) : new Set<string>();
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [allowMultiple]);

  const expandRow = useCallback((id: string) => {
    setExpandedRows(prev => {
      if (allowMultiple) {
        return new Set([...prev, id]);
      }
      return new Set([id]);
    });
  }, [allowMultiple]);

  const collapseRow = useCallback((id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    if (allowMultiple) {
      setExpandedRows(new Set(ids));
    }
  }, [allowMultiple]);

  const collapseAll = useCallback(() => {
    setExpandedRows(new Set());
  }, []);

  return {
    expandedRows,
    isExpanded,
    toggleExpansion,
    expandRow,
    collapseRow,
    expandAll,
    collapseAll,
  };
}
