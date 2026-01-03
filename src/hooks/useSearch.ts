import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================
// TIPOS
// ============================================

export interface SearchOptions {
  columns: string[];
  minChars?: number;
  debounceMs?: number;
  limit?: number;
}

interface UseSearchResult<T> {
  results: T[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  hasResults: boolean;
}

// ============================================
// HOOK DE DEBOUNCE
// ============================================

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// HOOK PARA BUSCA LOCAL (em memória)
// ============================================

export function useSearch<T extends Record<string, unknown>>(
  data: T[],
  options: SearchOptions
): UseSearchResult<T> {
  const { columns, minChars = 2, debounceMs = 300 } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebouncedValue(searchTerm, debounceMs);

  const results = useMemo(() => {
    if (debouncedTerm.length < minChars) return data;

    const lowerTerm = debouncedTerm.toLowerCase();
    
    return data.filter((item) =>
      columns.some((col) => {
        const value = item[col];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerTerm);
      })
    );
  }, [data, debouncedTerm, columns, minChars]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    results,
    isLoading: false,
    error: null,
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasResults: results.length > 0 && debouncedTerm.length >= minChars,
  };
}

export function useLocalSearch<T extends Record<string, unknown>>(
  data: T[],
  options: SearchOptions
): UseSearchResult<T> {
  return useSearch(data, options);
}

export default useSearch;
