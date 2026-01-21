import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState<T extends Record<string, unknown>> {
  values: T;
  search: string;
  dateRange: { start: Date; end: Date } | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  perPage: number;
}

interface UseFiltersOptions<T extends Record<string, unknown>> {
  initialValues?: Partial<T>;
  initialSearch?: string;
  initialDateRange?: { start: Date; end: Date } | null;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  initialPage?: number;
  initialPerPage?: number;
  syncWithUrl?: boolean;
}

export function useFilters<T extends Record<string, unknown> = Record<string, unknown>>({
  initialValues = {} as Partial<T>,
  initialSearch = '',
  initialDateRange = null,
  initialSortBy = '',
  initialSortOrder = 'desc',
  initialPage = 1,
  initialPerPage = 10,
  syncWithUrl = false,
}: UseFiltersOptions<T> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params if syncWithUrl is enabled
  const getInitialState = (): FilterState<T> => {
    if (syncWithUrl) {
      const urlPage = searchParams.get('page');
      const urlPerPage = searchParams.get('perPage');
      const urlSortBy = searchParams.get('sortBy');
      const urlSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';
      const urlSearch = searchParams.get('search');

      // Parse filter values from URL
      const urlValues: Partial<T> = {};
      searchParams.forEach((value, key) => {
        if (!['page', 'perPage', 'sortBy', 'sortOrder', 'search', 'startDate', 'endDate'].includes(key)) {
          (urlValues as Record<string, unknown>)[key] = value;
        }
      });

      // Parse date range
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const urlDateRange = startDate && endDate
        ? { start: new Date(startDate), end: new Date(endDate) }
        : initialDateRange;

      return {
        values: { ...initialValues, ...urlValues } as T,
        search: urlSearch || initialSearch,
        dateRange: urlDateRange,
        sortBy: urlSortBy || initialSortBy,
        sortOrder: urlSortOrder || initialSortOrder,
        page: urlPage ? parseInt(urlPage, 10) : initialPage,
        perPage: urlPerPage ? parseInt(urlPerPage, 10) : initialPerPage,
      };
    }

    return {
      values: initialValues as T,
      search: initialSearch,
      dateRange: initialDateRange,
      sortBy: initialSortBy,
      sortOrder: initialSortOrder,
      page: initialPage,
      perPage: initialPerPage,
    };
  };

  const [state, setState] = useState<FilterState<T>>(getInitialState);

  // Sync to URL
  const syncToUrl = useCallback((newState: FilterState<T>) => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();

    // Add filter values
    Object.entries(newState.values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, String(v)));
        } else {
          params.set(key, String(value));
        }
      }
    });

    // Add other params
    if (newState.search) params.set('search', newState.search);
    if (newState.sortBy) params.set('sortBy', newState.sortBy);
    if (newState.sortOrder !== 'desc') params.set('sortOrder', newState.sortOrder);
    if (newState.page !== 1) params.set('page', String(newState.page));
    if (newState.perPage !== initialPerPage) params.set('perPage', String(newState.perPage));
    if (newState.dateRange) {
      params.set('startDate', newState.dateRange.start.toISOString());
      params.set('endDate', newState.dateRange.end.toISOString());
    }

    setSearchParams(params);
  }, [syncWithUrl, setSearchParams, initialPerPage]);

  // Update filter values
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState((prev) => {
      const newState = {
        ...prev,
        values: { ...prev.values, [key]: value },
        page: 1, // Reset page when filter changes
      };
      syncToUrl(newState);
      return newState;
    });
  }, [syncToUrl]);

  // Update multiple filters at once
  const setFilters = useCallback((filters: Partial<T>) => {
    setState((prev) => {
      const newState = {
        ...prev,
        values: { ...prev.values, ...filters },
        page: 1,
      };
      syncToUrl(newState);
      return newState;
    });
  }, [syncToUrl]);

  // Update search
  const setSearch = useCallback((search: string) => {
    setState((prev) => {
      const newState = { ...prev, search, page: 1 };
      syncToUrl(newState);
      return newState;
    });
  }, [syncToUrl]);

  // Update date range
  const setDateRange = useCallback((dateRange: { start: Date; end: Date } | null) => {
    setState((prev) => {
      const newState = { ...prev, dateRange, page: 1 };
      syncToUrl(newState);
      return newState;
    });
  }, [syncToUrl]);

  // Update sorting
  const setSort = useCallback((sortBy: string, sortOrder?: 'asc' | 'desc') => {
    setState((prev) => {
      const newSortOrder = sortOrder || (prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc');
      const newState = { ...prev, sortBy, sortOrder: newSortOrder };
      syncToUrl(newState);
      return newState;
    });
  }, [syncToUrl]);

  // Update pagination
  const setPage = useCallback((page: number) => {
    setState((prev) => {
      const newState = { ...prev, page };
      syncToUrl(newState);
      return newState;
    });
  }, [syncToUrl]);

  const setPerPage = useCallback((perPage: number) => {
    setState((prev) => {
      const newState = { ...prev, perPage, page: 1 };
      syncToUrl(newState);
      return newState;
    });
  }, [syncToUrl]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const newState: FilterState<T> = {
      values: initialValues as T,
      search: '',
      dateRange: null,
      sortBy: initialSortBy,
      sortOrder: initialSortOrder,
      page: 1,
      perPage: initialPerPage,
    };
    setState(newState);
    syncToUrl(newState);
  }, [initialValues, initialSortBy, initialSortOrder, initialPerPage, syncToUrl]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      state.search !== '' ||
      state.dateRange !== null ||
      Object.values(state.values).some((v) =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''
      )
    );
  }, [state]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.search) count++;
    if (state.dateRange) count++;
    Object.values(state.values).forEach((v) => {
      if (Array.isArray(v)) {
        count += v.length;
      } else if (v !== undefined && v !== null && v !== '') {
        count++;
      }
    });
    return count;
  }, [state]);

  return {
    ...state,
    setFilter,
    setFilters,
    setSearch,
    setDateRange,
    setSort,
    setPage,
    setPerPage,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}

export default useFilters;
