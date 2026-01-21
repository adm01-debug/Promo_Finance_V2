import { useState, useMemo, useCallback, useRef, useEffect, ReactNode } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  CheckSquare,
  Square,
  Columns,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => ReactNode;
  filterRender?: (value: string, onChange: (value: string) => void) => ReactNode;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T | ((row: T) => string);
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  filters?: Record<string, string>;
  onFilterChange?: (filters: Record<string, string>) => void;
  stickyHeader?: boolean;
  rowHeight?: number;
  headerHeight?: number;
  maxHeight?: number | string;
  emptyMessage?: string;
  showToolbar?: boolean;
  onExport?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function DataGrid<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  onRowDoubleClick,
  sortColumn,
  sortDirection,
  onSort,
  filters = {},
  onFilterChange,
  stickyHeader = true,
  rowHeight = 48,
  headerHeight = 48,
  maxHeight,
  emptyMessage = 'Nenhum dado encontrado',
  showToolbar = true,
  onExport,
  onRefresh,
  className,
}: DataGridProps<T>) {
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((c) => String(c.key))
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Get row key
  const getRowKey = useCallback(
    (row: T): string => {
      if (typeof rowKey === 'function') {
        return rowKey(row);
      }
      return String(row[rowKey]);
    },
    [rowKey]
  );

  // Filter visible columns
  const displayColumns = useMemo(() => {
    return columns.filter((c) => visibleColumns.includes(String(c.key)));
  }, [columns, visibleColumns]);

  // Check if all rows are selected
  const allSelected = useMemo(() => {
    return data.length > 0 && data.every((row) => selectedRows.includes(getRowKey(row)));
  }, [data, selectedRows, getRowKey]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map((row) => getRowKey(row)));
    }
  }, [allSelected, data, getRowKey, onSelectionChange]);

  // Handle row select
  const handleRowSelect = useCallback(
    (row: T) => {
      const id = getRowKey(row);
      if (selectedRows.includes(id)) {
        onSelectionChange?.(selectedRows.filter((r) => r !== id));
      } else {
        onSelectionChange?.([...selectedRows, id]);
      }
    },
    [selectedRows, getRowKey, onSelectionChange]
  );

  // Handle sort
  const handleSort = useCallback(
    (column: string) => {
      if (!onSort) return;

      let newDirection: SortDirection;
      if (sortColumn !== column) {
        newDirection = 'asc';
      } else if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else {
        newDirection = null;
      }

      onSort(column, newDirection);
    },
    [sortColumn, sortDirection, onSort]
  );

  // Handle column resize
  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setResizing(columnKey);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  // Get column width
  const getColumnWidth = (column: Column<T>): string | number => {
    const key = String(column.key);
    if (columnWidths[key]) return columnWidths[key];
    if (column.width) return column.width;
    return 'auto';
  };

  // Get cell value
  const getCellValue = (row: T, column: Column<T>): unknown => {
    const key = String(column.key);
    if (key.includes('.')) {
      return key.split('.').reduce((obj, k) => (obj as Record<string, unknown>)?.[k], row);
    }
    return row[key as keyof T];
  };

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((k) => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  return (
    <div className={cn('flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                showFilters
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              )}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            {/* Column selector */}
            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <Columns className="w-4 h-4" />
                Colunas
              </button>
              
              {showColumnSelector && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                  {columns.map((column) => (
                    <label
                      key={String(column.key)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(String(column.key))}
                        onChange={() => toggleColumn(String(column.key))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {column.header}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </button>
            )}
            
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter row */}
      {showFilters && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {displayColumns
            .filter((c) => c.filterable !== false)
            .map((column) => (
              <div key={String(column.key)} className="flex-1 max-w-xs">
                {column.filterRender ? (
                  column.filterRender(
                    filters[String(column.key)] || '',
                    (value) => onFilterChange?.({ ...filters, [String(column.key)]: value })
                  )
                ) : (
                  <input
                    type="text"
                    placeholder={`Filtrar ${column.header}`}
                    value={filters[String(column.key)] || ''}
                    onChange={(e) =>
                      onFilterChange?.({ ...filters, [String(column.key)]: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Table container */}
      <div
        ref={tableRef}
        className="overflow-auto"
        style={{ maxHeight: maxHeight || 'none' }}
      >
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              {/* Selection column */}
              {selectable && (
                <th
                  className="w-12 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
                  style={{ height: headerHeight }}
                >
                  <button onClick={handleSelectAll} className="p-1">
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
              )}

              {/* Data columns */}
              {displayColumns.map((column) => {
                const key = String(column.key);
                const isSorted = sortColumn === key;
                
                return (
                  <th
                    key={key}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700',
                      column.sortable !== false && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    style={{
                      width: getColumnWidth(column),
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      height: headerHeight,
                    }}
                    onClick={() => column.sortable !== false && handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.header}</span>
                      {column.sortable !== false && (
                        <span className="flex-shrink-0">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-4 h-4 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Resize handle */}
                    {column.resizable !== false && (
                      <div
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary-500',
                          resizing === key && 'bg-primary-500'
                        )}
                        onMouseDown={(e) => handleResizeStart(e, key)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {selectable && (
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  )}
                  {displayColumns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={displayColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, rowIndex) => {
                const id = getRowKey(row);
                const isSelected = selectedRows.includes(id);

                return (
                  <tr
                    key={id}
                    className={cn(
                      'border-b border-gray-100 dark:border-gray-700/50 transition-colors',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/10',
                      !isSelected && 'hover:bg-gray-50 dark:hover:bg-gray-700/30',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                    onDoubleClick={() => onRowDoubleClick?.(row)}
                    style={{ height: rowHeight }}
                  >
                    {/* Selection cell */}
                    {selectable && (
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowSelect(row);
                          }}
                          className="p-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                    )}

                    {/* Data cells */}
                    {displayColumns.map((column) => {
                      const value = getCellValue(row, column);
                      
                      return (
                        <td
                          key={String(column.key)}
                          className={cn(
                            'px-4 py-3 text-sm text-gray-900 dark:text-gray-100',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.render
                            ? column.render(value, row, rowIndex)
                            : String(value ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with selection info */}
      {selectable && selectedRows.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-600 dark:text-gray-400">
          {selectedRows.length} item(s) selecionado(s)
        </div>
      )}
    </div>
  );
}

export type { Column, SortDirection };
export default DataGrid;
