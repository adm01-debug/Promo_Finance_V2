import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/constants';

interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface UsePaginationReturn {
  // Estado atual
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  
  // Índices
  startIndex: number;
  endIndex: number;
  
  // Navegação
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Page size
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];
  
  // Estado
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  
  // Range de páginas para UI
  pageRange: number[];
  
  // Reset
  reset: () => void;
}

/**
 * Hook para gerenciar paginação
 */
export function usePagination({
  totalItems,
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = PAGE_SIZE_OPTIONS as unknown as number[],
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Cálculos derivados
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const startIndex = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize - 1, totalItems - 1),
    [startIndex, pageSize, totalItems]
  );

  // Estado booleano
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  // Navegação
  const goToPage = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages));
      setPage(clampedPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((p) => p + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage((p) => p - 1);
    }
  }, [hasPrevPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  // Page size
  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      // Reset para primeira página ao mudar tamanho
      setPage(1);
    },
    []
  );

  // Reset
  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  // Range de páginas para UI (ex: [1, 2, 3, ..., 10])
  const pageRange = useMemo(() => {
    const range: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Mostrar todas as páginas
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Lógica para páginas com "..."
      const leftSiblings = Math.max(page - 2, 1);
      const rightSiblings = Math.min(page + 2, totalPages);
      
      if (leftSiblings > 2) {
        range.push(1, -1); // -1 representa "..."
      } else {
        for (let i = 1; i < leftSiblings; i++) {
          range.push(i);
        }
      }
      
      for (let i = leftSiblings; i <= rightSiblings; i++) {
        range.push(i);
      }
      
      if (rightSiblings < totalPages - 1) {
        range.push(-1, totalPages);
      } else {
        for (let i = rightSiblings + 1; i <= totalPages; i++) {
          range.push(i);
        }
      }
    }
    
    return range;
  }, [page, totalPages]);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    pageSizeOptions,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    pageRange,
    reset,
  };
}

/**
 * Hook para paginar array localmente
 */
export function usePaginatedData<T>(
  data: T[],
  options: Omit<UsePaginationOptions, 'totalItems'> = {}
) {
  const pagination = usePagination({
    ...options,
    totalItems: data.length,
  });

  const paginatedData = useMemo(
    () => data.slice(pagination.startIndex, pagination.endIndex + 1),
    [data, pagination.startIndex, pagination.endIndex]
  );

  return {
    ...pagination,
    data: paginatedData,
  };
}
