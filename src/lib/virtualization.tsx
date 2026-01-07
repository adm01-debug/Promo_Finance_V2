// ============================================
// VIRTUALIZATION: Lista virtualizada para grandes volumes
// Performance otimizada para milhares de itens
// ============================================

import React, { useCallback, useRef, useState, useMemo } from 'react';
import { FixedSizeList as RWFixedSizeList, VariableSizeList as RWVariableSizeList, FixedSizeGrid as RWFixedSizeGrid } from 'react-window';

// Re-export types
type FixedSizeList = RWFixedSizeList;
type VariableSizeList = RWVariableSizeList;
type FixedSizeGrid = RWFixedSizeGrid;

// ============================================
// TIPOS
// ============================================

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscanCount?: number;
  className?: string;
  onScroll?: (scrollOffset: number) => void;
  initialScrollOffset?: number;
}

interface VirtualGridProps<T> {
  items: T[];
  height: number;
  width: number;
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  renderItem: (item: T, rowIndex: number, columnIndex: number, style: React.CSSProperties) => React.ReactNode;
  overscanRowCount?: number;
  overscanColumnCount?: number;
  className?: string;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  height: number;
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  selectedIndex?: number;
}

interface VirtualTableColumn<T> {
  key: string;
  header: string;
  width: number;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

// ============================================
// VIRTUAL LIST - Lista fixa ou variável
// ============================================

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscanCount = 5,
  className = '',
  onScroll,
  initialScrollOffset = 0,
}: VirtualListProps<T>) {
  const listRef = useRef<FixedSizeList | VariableSizeList>(null);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    onScroll?.(scrollOffset);
  }, [onScroll]);

  // Lista de tamanho fixo
  if (typeof itemHeight === 'number') {
    return (
      <RWFixedSizeList
        ref={listRef as React.RefObject<FixedSizeList>}
        height={height}
        width="100%"
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscanCount}
        onScroll={handleScroll}
        initialScrollOffset={initialScrollOffset}
        className={className}
      >
        {({ index, style }) => (
          <div style={style}>
            {renderItem(items[index], index, style)}
          </div>
        )}
      </RWFixedSizeList>
    );
  }

  // Lista de tamanho variável
  return (
    <RWVariableSizeList
      ref={listRef as React.RefObject<VariableSizeList>}
      height={height}
      width="100%"
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscanCount}
      onScroll={handleScroll}
      initialScrollOffset={initialScrollOffset}
      className={className}
    >
      {({ index, style }) => (
        <div style={style}>
          {renderItem(items[index], index, style)}
        </div>
      )}
    </RWVariableSizeList>
  );
}

// ============================================
// VIRTUAL GRID - Grid virtualizado
// ============================================

export function VirtualGrid<T>({
  items,
  height,
  width,
  columnCount,
  rowHeight,
  columnWidth,
  renderItem,
  overscanRowCount = 2,
  overscanColumnCount = 2,
  className = '',
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);

  const getItem = useCallback((rowIndex: number, columnIndex: number): T | null => {
    const index = rowIndex * columnCount + columnIndex;
    return index < items.length ? items[index] : null;
  }, [items, columnCount]);

  return (
    <RWFixedSizeGrid
      height={height}
      width={width}
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      overscanRowCount={overscanRowCount}
      overscanColumnCount={overscanColumnCount}
      className={className}
    >
      {({ columnIndex, rowIndex, style }) => {
        const item = getItem(rowIndex, columnIndex);
        if (!item) return <div style={style} />;
        return renderItem(item, rowIndex, columnIndex, style);
      }}
    </RWFixedSizeGrid>
  );
}

// ============================================
// VIRTUAL TABLE - Tabela virtualizada
// ============================================

export function VirtualTable<T>({
  data,
  columns,
  height,
  rowHeight = 48,
  headerHeight = 48,
  className = '',
  onRowClick,
  selectedIndex,
}: VirtualTableProps<T>) {
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0),
    [columns]
  );

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];
    const isSelected = selectedIndex === index;

    return (
      <div
        style={style}
        className={`flex border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/10' : ''
        }`}
        onClick={() => onRowClick?.(item, index)}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width, minWidth: column.width }}
            className={`flex items-center px-4 text-sm ${
              column.align === 'center' ? 'justify-center' :
              column.align === 'right' ? 'justify-end' : 'justify-start'
            }`}
          >
            {column.render 
              ? column.render(item, index)
              : String((item as Record<string, unknown>)[column.key] ?? '-')
            }
          </div>
        ))}
      </div>
    );
  }, [data, columns, selectedIndex, onRowClick]);

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="flex bg-muted border-b border-border"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width, minWidth: column.width }}
            className={`flex items-center px-4 font-medium text-sm ${
              column.align === 'center' ? 'justify-center' :
              column.align === 'right' ? 'justify-end' : 'justify-start'
            }`}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <RWFixedSizeList
        height={height - headerHeight}
        width={totalWidth}
        itemCount={data.length}
        itemSize={rowHeight}
        overscanCount={5}
      >
        {Row}
      </RWFixedSizeList>
    </div>
  );
}

// ============================================
// INFINITE SCROLL - Carregamento infinito
// ============================================

interface InfiniteScrollProps<T> {
  items: T[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function InfiniteScroll<T>({
  items,
  hasMore,
  isLoading,
  loadMore,
  height,
  itemHeight,
  renderItem,
  loadingComponent,
  endComponent,
  threshold = 5,
  className = '',
}: InfiniteScrollProps<T>) {
  const listRef = useRef<FixedSizeList>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const itemCount = items.length + (hasMore ? 1 : 0);

  const isItemLoaded = useCallback((index: number) => {
    return !hasMore || index < items.length;
  }, [hasMore, items.length]);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center">
          {loadingComponent || (
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          )}
        </div>
      );
    }

    return renderItem(items[index], index, style);
  }, [items, isItemLoaded, renderItem, loadingComponent]);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (isLoading || !hasMore) return;

    const scrollHeight = itemCount * itemHeight;
    const scrollPosition = scrollOffset + height;
    const loadThreshold = scrollHeight - (threshold * itemHeight);

    if (scrollPosition >= loadThreshold) {
      loadMoreRef.current();
    }
  }, [isLoading, hasMore, itemCount, itemHeight, height, threshold]);

  return (
    <div className={className}>
      <RWFixedSizeList
        ref={listRef}
        height={height}
        width="100%"
        itemCount={itemCount}
        itemSize={itemHeight}
        onScroll={handleScroll}
        overscanCount={threshold}
      >
        {Row}
      </RWFixedSizeList>
      {!hasMore && items.length > 0 && endComponent && (
        <div className="py-4 text-center text-muted-foreground">
          {endComponent}
        </div>
      )}
    </div>
  );
}

// ============================================
// HOOKS
// ============================================

// Hook para scroll infinito customizado
export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
  initialData = [],
}: {
  fetchFn: (page: number, pageSize: number) => Promise<T[]>;
  pageSize?: number;
  initialData?: T[];
}) {
  const [items, setItems] = useState<T[]>(initialData);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await fetchFn(page, pageSize);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      setItems(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, page, pageSize, isLoading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    reset();
    setIsLoading(true);
    
    try {
      const newItems = await fetchFn(0, pageSize);
      setItems(newItems);
      setPage(1);
      setHasMore(newItems.length >= pageSize);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, pageSize, reset]);

  return {
    items,
    hasMore,
    isLoading,
    error,
    loadMore,
    reset,
    refresh,
  };
}

// Hook para virtualização com seleção
export function useVirtualSelection<T>(items: T[]) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const toggle = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setLastSelectedIndex(index);
  }, []);

  const select = useCallback((index: number) => {
    setSelectedIndices(new Set([index]));
    setLastSelectedIndex(index);
  }, []);

  const selectRange = useCallback((toIndex: number) => {
    if (lastSelectedIndex === null) {
      select(toIndex);
      return;
    }

    const start = Math.min(lastSelectedIndex, toIndex);
    const end = Math.max(lastSelectedIndex, toIndex);
    const range = new Set<number>();

    for (let i = start; i <= end; i++) {
      range.add(i);
    }

    setSelectedIndices(range);
  }, [lastSelectedIndex, select]);

  const selectAll = useCallback(() => {
    setSelectedIndices(new Set(items.map((_, i) => i)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
    setLastSelectedIndex(null);
  }, []);

  const isSelected = useCallback((index: number) => {
    return selectedIndices.has(index);
  }, [selectedIndices]);

  const selectedItems = useMemo(() => {
    return Array.from(selectedIndices)
      .sort((a, b) => a - b)
      .map(index => items[index])
      .filter(Boolean);
  }, [selectedIndices, items]);

  return {
    selectedIndices,
    selectedItems,
    toggle,
    select,
    selectRange,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIndices.size,
  };
}

// Hook para scroll restauration
export function useScrollRestoration(key: string) {
  const [scrollOffset, setScrollOffset] = useState<number>(() => {
    const saved = sessionStorage.getItem(`scroll_${key}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const saveScroll = useCallback((offset: number) => {
    setScrollOffset(offset);
    sessionStorage.setItem(`scroll_${key}`, String(offset));
  }, [key]);

  const clearScroll = useCallback(() => {
    setScrollOffset(0);
    sessionStorage.removeItem(`scroll_${key}`);
  }, [key]);

  return {
    scrollOffset,
    saveScroll,
    clearScroll,
  };
}

export default {
  VirtualList,
  VirtualGrid,
  VirtualTable,
  InfiniteScroll,
  useInfiniteScroll,
  useVirtualSelection,
  useScrollRestoration,
};
