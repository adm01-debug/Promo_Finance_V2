import { useState, useMemo } from 'react';
import type { SortDirection } from './sortable-header';

// Hook para gerenciar ordenação
export function useSorting<T>(data: T[], initialSort?: string) {
  const [sortKey, setSortKey] = useState<string | null>(initialSort || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const keys = sortKey.split('.');
      let aValue: unknown = a;
      let bValue: unknown = b;

      for (const k of keys) {
        aValue = (aValue as Record<string, unknown>)?.[k];
        bValue = (bValue as Record<string, unknown>)?.[k];
      }

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle dates
      if (aValue instanceof Date || (typeof aValue === 'string' && !isNaN(Date.parse(aValue)))) {
        const dateA = new Date(aValue as string | Date).getTime();
        const dateB = new Date(bValue as string | Date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();
      const comparison = strA.localeCompare(strB, 'pt-BR');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  return {
    sortedData,
    sortKey,
    sortDirection,
    handleSort,
  };
}
