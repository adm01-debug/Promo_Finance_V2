import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

interface SearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  debounceMs?: number;
  minChars?: number;
}

interface SearchResult<T> {
  results: T[];
  search: string;
  setSearch: (search: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
  hasResults: boolean;
  resultCount: number;
}

/**
 * Hook for searching through local data
 */
export function useSearch<T>({
  data,
  searchFields,
  debounceMs = 300,
  minChars = 2,
}: SearchOptions<T>): SearchResult<T> {
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSearching(true);

    timeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [search, debounceMs]);

  // Filter results
  const results = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < minChars) {
      return data;
    }

    const searchLower = debouncedSearch.toLowerCase();

    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, debouncedSearch, searchFields, minChars]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState('');
    setDebouncedSearch('');
  }, []);

  return {
    results,
    search,
    setSearch,
    clearSearch,
    isSearching,
    hasResults: results.length > 0,
    resultCount: results.length,
  };
}

/**
 * Hook for highlighting search matches in text
 */
export function useHighlight(text: string, search: string): string[] {
  return useMemo(() => {
    if (!search || search.length < 2) {
      return [text];
    }

    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(searchLower);

    if (index === -1) {
      return [text];
    }

    return [
      text.slice(0, index),
      text.slice(index, index + search.length),
      text.slice(index + search.length),
    ];
  }, [text, search]);
}

/**
 * Component to highlight search matches
 */
export function HighlightMatch({
  text,
  search,
  highlightClass = 'bg-warning/30',
}: {
  text: string;
  search: string;
  highlightClass?: string;
}) {
  const parts = useHighlight(text, search);

  if (parts.length === 1) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {parts[0]}
      <span className={highlightClass}>{parts[1]}</span>
      {parts[2]}
    </span>
  );
}

/**
 * Hook for fuzzy search with scoring
 */
export function useFuzzySearch<T>({
  data,
  searchFields,
  debounceMs = 300,
  minChars = 2,
  maxResults = 50,
}: SearchOptions<T> & { maxResults?: number }) {
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSearching(true);

    timeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [search, debounceMs]);

  // Calculate fuzzy score
  const calculateScore = useCallback((text: string, searchTerm: string): number => {
    const textLower = text.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    // Exact match
    if (textLower === searchLower) return 100;

    // Starts with
    if (textLower.startsWith(searchLower)) return 90;

    // Contains
    if (textLower.includes(searchLower)) return 80;

    // Fuzzy match (all characters in order)
    let searchIndex = 0;
    for (let i = 0; i < text.length && searchIndex < searchTerm.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }

    if (searchIndex === searchTerm.length) {
      return 50 + (searchTerm.length / text.length) * 30;
    }

    return 0;
  }, []);

  // Filter and score results
  const results = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < minChars) {
      return data;
    }

    const scored = data
      .map((item) => {
        let maxScore = 0;
        searchFields.forEach((field) => {
          const value = item[field];
          if (value !== null && value !== undefined) {
            const score = calculateScore(String(value), debouncedSearch);
            maxScore = Math.max(maxScore, score);
          }
        });
        return { item, score: maxScore };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return scored.map(({ item }) => item);
  }, [data, debouncedSearch, searchFields, minChars, maxResults, calculateScore]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState('');
    setDebouncedSearch('');
  }, []);

  return {
    results,
    search,
    setSearch,
    clearSearch,
    isSearching,
    hasResults: results.length > 0,
    resultCount: results.length,
  };
}

export default useSearch;
