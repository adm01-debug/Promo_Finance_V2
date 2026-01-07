// ============================================
// VIRTUALIZATION: Lista virtualizada para grandes volumes
// Performance otimizada para milhares de itens
// ============================================

import React, { useCallback, useRef, useState, useMemo, CSSProperties, ReactElement } from 'react';
import { List, Grid, ListImperativeAPI, GridImperativeAPI, useDynamicRowHeight } from 'react-window';

// ============================================
// TIPOS
// ============================================

interface VirtualListProps<T> {
  items: T[];
  height?: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
  overscanCount?: number;
  className?: string;
  onScroll?: (scrollOffset: number) => void;
  style?: CSSProperties;
}

interface VirtualGridProps<T> {
  items: T[];
  height?: number;
  width?: number;
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  renderItem: (item: T, rowIndex: number, columnIndex: number, style: CSSProperties) => ReactElement;
  overscanCount?: number;
  className?: string;
  style?: CSSProperties;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  height?: number;
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

interface RowProps<T> {
  items: T[];
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
}

function RowComponent<T>({ 
  index, 
  style, 
  items, 
  renderItem 
}: { 
  ariaAttributes: unknown;
  index: number; 
  style: CSSProperties;
  items: T[];
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
}): ReactElement {
  return renderItem(items[index], index, style);
}

export function VirtualList<T>({
  items,
  height = 400,
  itemHeight,
  renderItem,
  overscanCount = 5,
  className = '',
  style,
}: VirtualListProps<T>) {
  const listRef = useRef<ListImperativeAPI>(null);

  const rowHeightValue = typeof itemHeight === 'function' 
    ? (index: number) => itemHeight(index)
    : itemHeight;

  return (
    <List
      listRef={listRef}
      rowCount={items.length}
      rowHeight={rowHeightValue}
      overscanCount={overscanCount}
      className={className}
      style={{ height, ...style }}
      rowComponent={(props) => (
        <RowComponent 
          {...props} 
          items={items} 
          renderItem={renderItem}
        />
      )}
      rowProps={{ items, renderItem }}
    />
  );
}

// ============================================
// VIRTUAL GRID - Grid virtualizado
// ============================================

interface CellProps<T> {
  items: T[];
  columnCount: number;
  renderItem: (item: T, rowIndex: number, columnIndex: number, style: CSSProperties) => ReactElement;
}

function CellComponent<T>({ 
  rowIndex, 
  columnIndex,
  style, 
  items, 
  columnCount,
  renderItem 
}: { 
  ariaAttributes: unknown;
  rowIndex: number;
  columnIndex: number;
  style: CSSProperties;
  items: T[];
  columnCount: number;
  renderItem: (item: T, rowIndex: number, columnIndex: number, style: CSSProperties) => ReactElement;
}): ReactElement {
  const index = rowIndex * columnCount + columnIndex;
  const item = items[index];
  
  if (!item) {
    return <div style={style} />;
  }
  
  return renderItem(item, rowIndex, columnIndex, style);
}

export function VirtualGrid<T>({
  items,
  height = 400,
  width = 800,
  columnCount,
  rowHeight,
  columnWidth,
  renderItem,
  overscanCount = 2,
  className = '',
  style,
}: VirtualGridProps<T>) {
  const gridRef = useRef<GridImperativeAPI>(null);
  const rowCount = Math.ceil(items.length / columnCount);

  return (
    <Grid
      gridRef={gridRef}
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      overscanCount={overscanCount}
      className={className}
      style={{ height, width, ...style }}
      cellComponent={(props) => (
        <CellComponent 
          {...props} 
          items={items}
          columnCount={columnCount}
          renderItem={renderItem}
        />
      )}
      cellProps={{ items, columnCount, renderItem }}
    />
  );
}

// ============================================
// VIRTUAL TABLE - Tabela virtualizada
// ============================================

interface TableRowProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  selectedIndex?: number;
  onRowClick?: (item: T, index: number) => void;
}

function TableRowComponent<T>({ 
  index, 
  style, 
  data,
  columns,
  selectedIndex,
  onRowClick,
}: { 
  ariaAttributes: unknown;
  index: number; 
  style: CSSProperties;
  data: T[];
  columns: VirtualTableColumn<T>[];
  selectedIndex?: number;
  onRowClick?: (item: T, index: number) => void;
}): ReactElement {
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
}

export function VirtualTable<T>({
  data,
  columns,
  height = 400,
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
      <List
        rowCount={data.length}
        rowHeight={rowHeight}
        overscanCount={5}
        style={{ height: height - headerHeight, width: totalWidth }}
        rowComponent={(props) => (
          <TableRowComponent 
            {...props}
            data={data}
            columns={columns}
            selectedIndex={selectedIndex}
            onRowClick={onRowClick}
          />
        )}
        rowProps={{ data, columns, selectedIndex, onRowClick }}
      />
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
  height?: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  threshold?: number;
  className?: string;
}

interface InfiniteRowProps<T> {
  items: T[];
  hasMore: boolean;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
  loadingComponent?: React.ReactNode;
}

function InfiniteRowComponent<T>({ 
  index, 
  style, 
  items,
  hasMore,
  renderItem,
  loadingComponent,
}: { 
  ariaAttributes: unknown;
  index: number; 
  style: CSSProperties;
  items: T[];
  hasMore: boolean;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactElement;
  loadingComponent?: React.ReactNode;
}): ReactElement {
  if (index >= items.length) {
    return (
      <div style={style} className="flex items-center justify-center">
        {loadingComponent || (
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        )}
      </div>
    );
  }

  return renderItem(items[index], index, style);
}

export function InfiniteScroll<T>({
  items,
  hasMore,
  isLoading,
  loadMore,
  height = 400,
  itemHeight,
  renderItem,
  loadingComponent,
  endComponent,
  threshold = 5,
  className = '',
}: InfiniteScrollProps<T>) {
  const listRef = useRef<ListImperativeAPI>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const itemCount = items.length + (hasMore ? 1 : 0);

  const handleRowsRendered = useCallback((
    visibleRows: { startIndex: number; stopIndex: number },
    _allRows: { startIndex: number; stopIndex: number }
  ) => {
    if (isLoading || !hasMore) return;
    
    if (visibleRows.stopIndex >= items.length - threshold) {
      loadMoreRef.current();
    }
  }, [isLoading, hasMore, items.length, threshold]);

  return (
    <div className={className}>
      <List
        listRef={listRef}
        rowCount={itemCount}
        rowHeight={itemHeight}
        overscanCount={threshold}
        onRowsRendered={handleRowsRendered}
        style={{ height }}
        rowComponent={(props) => (
          <InfiniteRowComponent 
            {...props}
            items={items}
            hasMore={hasMore}
            renderItem={renderItem}
            loadingComponent={loadingComponent}
          />
        )}
        rowProps={{ items, hasMore, renderItem, loadingComponent }}
      />
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

// Hook para scroll restoration
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

// Hook para altura dinâmica de linhas
export function useVirtualDynamicHeight(defaultRowHeight: number, key?: string | number) {
  return useDynamicRowHeight({ defaultRowHeight, key });
}

// Export the original useDynamicRowHeight from react-window
export { useDynamicRowHeight };
