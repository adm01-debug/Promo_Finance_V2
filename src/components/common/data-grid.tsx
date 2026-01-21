import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Download,
  Settings2,
  GripVertical,
  Eye,
  EyeOff,
  Pin,
  PinOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
  hidden?: boolean;
  cell?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataGridProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  virtualScroll?: boolean;
  stickyHeader?: boolean;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  onRowClick?: (row: T) => void;
  onSort?: (columnId: string, direction: SortDirection) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: number | string;
  resizableColumns?: boolean;
  reorderableColumns?: boolean;
  columnSettingsEnabled?: boolean;
}

export function DataGrid<T extends { id: string | number }>({
  data,
  columns: initialColumns,
  rowHeight = 48,
  virtualScroll = false,
  stickyHeader = true,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  onRowClick,
  onSort,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  className,
  maxHeight = 600,
  resizableColumns = false,
  reorderableColumns = false,
  columnSettingsEnabled = false,
}: DataGridProps<T>) {
  const [columns, setColumns] = useState(initialColumns);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Handle column visibility
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !col.hidden);
  }, [columns]);

  // Handle sorting
  const handleSort = useCallback(
    (columnId: string) => {
      let newDirection: SortDirection = 'asc';
      
      if (sortColumn === columnId) {
        if (sortDirection === 'asc') newDirection = 'desc';
        else if (sortDirection === 'desc') newDirection = null;
      }
      
      setSortColumn(newDirection ? columnId : null);
      setSortDirection(newDirection);
      onSort?.(columnId, newDirection);
    },
    [sortColumn, sortDirection, onSort]
  );

  // Handle row selection
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    
    if (selectedRows.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row) => row.id)));
    }
  }, [data, selectedRows, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: string | number) => {
      if (!onSelectionChange) return;
      
      const newSelection = new Set(selectedRows);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      onSelectionChange(newSelection);
    },
    [selectedRows, onSelectionChange]
  );

  // Virtual scroll calculations
  const virtualScrollData = useMemo(() => {
    if (!virtualScroll) return null;
    
    const containerHeight = typeof maxHeight === 'number' ? maxHeight : 600;
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(startIndex + visibleRows + 1, data.length);
    
    return {
      startIndex,
      endIndex,
      visibleData: data.slice(startIndex, endIndex),
      totalHeight: data.length * rowHeight,
      offsetY: startIndex * rowHeight,
    };
  }, [virtualScroll, maxHeight, rowHeight, scrollTop, data]);

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (virtualScroll) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  }, [virtualScroll]);

  // Column resize
  const handleColumnResize = useCallback(
    (columnId: string, width: number) => {
      setColumnWidths((prev) => ({ ...prev, [columnId]: width }));
    },
    []
  );

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, hidden: !col.hidden } : col
      )
    );
  }, []);

  // Get value from row
  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  // Render cell
  const renderCell = (row: T, column: Column<T>, index: number) => {
    const value = getCellValue(row, column);
    
    if (column.cell) {
      return column.cell(value, row, index);
    }
    
    return value as React.ReactNode;
  };

  const displayData = virtualScrollData?.visibleData ?? data;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      {/* Toolbar */}
      {columnSettingsEnabled && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {data.length} item(s)
            </span>
            {selectedRows.size > 0 && (
              <span className="text-sm text-primary-600 dark:text-primary-400">
                ({selectedRows.size} selecionado(s))
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Configurar colunas"
            >
              <Settings2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Column settings dropdown */}
      {showColumnSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Colunas visíveis
          </h4>
          <div className="flex flex-wrap gap-2">
            {columns.map((column) => (
              <button
                key={column.id}
                onClick={() => toggleColumnVisibility(column.id)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm',
                  column.hidden
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                )}
              >
                {column.hidden ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
                {column.header}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {virtualScroll && virtualScrollData && (
          <div style={{ height: virtualScrollData.totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${virtualScrollData.offsetY}px)` }}>
              <table className="w-full">
                <TableHeader
                  columns={visibleColumns}
                  selectable={selectable}
                  allSelected={selectedRows.size === data.length && data.length > 0}
                  onSelectAll={handleSelectAll}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  columnWidths={columnWidths}
                  stickyHeader={stickyHeader}
                  resizableColumns={resizableColumns}
                  onColumnResize={handleColumnResize}
                />
                <tbody>
                  {displayData.map((row, index) => (
                    <TableRow
                      key={row.id}
                      row={row}
                      columns={visibleColumns}
                      index={virtualScrollData.startIndex + index}
                      rowHeight={rowHeight}
                      selectable={selectable}
                      selected={selectedRows.has(row.id)}
                      onSelect={() => handleSelectRow(row.id)}
                      onClick={() => onRowClick?.(row)}
                      renderCell={renderCell}
                      columnWidths={columnWidths}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!virtualScroll && (
          <table className="w-full">
            <TableHeader
              columns={visibleColumns}
              selectable={selectable}
              allSelected={selectedRows.size === data.length && data.length > 0}
              onSelectAll={handleSelectAll}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              columnWidths={columnWidths}
              stickyHeader={stickyHeader}
              resizableColumns={resizableColumns}
              onColumnResize={handleColumnResize}
            />
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="py-12">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="py-12">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      {emptyMessage}
                    </div>
                  </td>
                </tr>
              ) : (
                displayData.map((row, index) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    columns={visibleColumns}
                    index={index}
                    rowHeight={rowHeight}
                    selectable={selectable}
                    selected={selectedRows.has(row.id)}
                    onSelect={() => handleSelectRow(row.id)}
                    onClick={() => onRowClick?.(row)}
                    renderCell={renderCell}
                    columnWidths={columnWidths}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Table Header Component
function TableHeader<T>({
  columns,
  selectable,
  allSelected,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
  columnWidths,
  stickyHeader,
  resizableColumns,
  onColumnResize,
}: {
  columns: Column<T>[];
  selectable: boolean;
  allSelected: boolean;
  onSelectAll: () => void;
  sortColumn: string | null;
  sortDirection: SortDirection;
  onSort: (columnId: string) => void;
  columnWidths: Record<string, number>;
  stickyHeader: boolean;
  resizableColumns: boolean;
  onColumnResize: (columnId: string, width: number) => void;
}) {
  return (
    <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
      <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        {selectable && (
          <th className="w-12 px-4 py-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.id}
            className={cn(
              'px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
              column.sticky === 'left' && 'sticky left-0 bg-gray-50 dark:bg-gray-900/50',
              column.sticky === 'right' && 'sticky right-0 bg-gray-50 dark:bg-gray-900/50'
            )}
            style={{
              width: columnWidths[column.id] || column.width,
              minWidth: column.minWidth,
            }}
            onClick={() => column.sortable && onSort(column.id)}
          >
            <div className="flex items-center gap-1">
              <span>{column.header}</span>
              {column.sortable && (
                <span className="flex-shrink-0">
                  {sortColumn === column.id ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-4 h-4 opacity-50" />
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

// Table Row Component
function TableRow<T extends { id: string | number }>({
  row,
  columns,
  index,
  rowHeight,
  selectable,
  selected,
  onSelect,
  onClick,
  renderCell,
  columnWidths,
}: {
  row: T;
  columns: Column<T>[];
  index: number;
  rowHeight: number;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
  onClick?: () => void;
  renderCell: (row: T, column: Column<T>, index: number) => React.ReactNode;
  columnWidths: Record<string, number>;
}) {
  return (
    <tr
      className={cn(
        'border-b border-gray-100 dark:border-gray-700/50 transition-colors',
        selected && 'bg-primary-50 dark:bg-primary-900/20',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
      )}
      style={{ height: rowHeight }}
      onClick={onClick}
    >
      {selectable && (
        <td className="w-12 px-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </td>
      )}
      {columns.map((column) => (
        <td
          key={column.id}
          className={cn(
            'px-4 py-3 text-sm text-gray-700 dark:text-gray-300',
            column.align === 'center' && 'text-center',
            column.align === 'right' && 'text-right',
            column.sticky === 'left' && 'sticky left-0 bg-white dark:bg-gray-800',
            column.sticky === 'right' && 'sticky right-0 bg-white dark:bg-gray-800'
          )}
          style={{ width: columnWidths[column.id] || column.width }}
        >
          {renderCell(row, column, index)}
        </td>
      ))}
    </tr>
  );
}

export type { Column, SortDirection };
export default DataGrid;
