import { useRef, useEffect, useCallback, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading?: boolean;
  threshold?: number;
  className?: string;
  emptyState?: ReactNode;
  loadingComponent?: ReactNode;
  endMessage?: ReactNode;
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading = false,
  threshold = 200,
  className,
  emptyState,
  loadingComponent,
  endMessage,
}: InfiniteScrollProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    
    setIsLoadingMore(true);
    try {
      await loadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [loadMore, hasMore, isLoading, isLoadingMore]);

  // Intersection Observer para detectar quando chegou no final
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          handleLoadMore();
        }
      },
      {
        root: containerRef.current,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    const loadingElement = loadingRef.current;
    if (loadingElement) {
      observer.observe(loadingElement);
    }

    return () => {
      if (loadingElement) {
        observer.unobserve(loadingElement);
      }
    };
  }, [handleLoadMore, hasMore, isLoading, isLoadingMore, threshold]);

  // Loading inicial
  if (isLoading && items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        {loadingComponent || (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        {emptyState || (
          <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.3) }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </div>

      {/* Loading trigger / indicator */}
      <div ref={loadingRef} className="py-4">
        {(isLoadingMore || (isLoading && items.length > 0)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Carregando mais...
            </span>
          </motion.div>
        )}
        
        {!hasMore && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            {endMessage || (
              <p className="text-sm text-muted-foreground">
                Você chegou ao fim da lista
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Hook para paginação com infinite scroll
interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>;
  pageSize?: number;
  enabled?: boolean;
}

export function useInfiniteScrollData<T>({
  fetchFn,
  pageSize = 20,
  enabled = true,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar primeira página
  useEffect(() => {
    if (!enabled) return;
    
    const loadInitial = async () => {
      setIsInitialLoading(true);
      setError(null);
      try {
        const result = await fetchFn(1, pageSize);
        setItems(result.data);
        setHasMore(result.hasMore);
        setPage(1);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitial();
  }, [enabled, pageSize]);

  // Função para carregar mais
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const nextPage = page + 1;
      const result = await fetchFn(nextPage, pageSize);
      
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, page, pageSize, isLoading, hasMore]);

  // Reset
  const reset = useCallback(async () => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setIsInitialLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn(1, pageSize);
      setItems(result.data);
      setHasMore(result.hasMore);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchFn, pageSize]);

  return {
    items,
    hasMore,
    isLoading,
    isInitialLoading,
    error,
    loadMore,
    reset,
  };
}
