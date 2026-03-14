import { useState, useMemo, useCallback, useRef, useEffect, ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Filter, Download, MoreHorizontal, CheckSquare, Square, Columns, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  key: keyof T | string; header: string; width?: number | string; minWidth?: number; maxWidth?: number;
  sortable?: boolean; filterable?: boolean; resizable?: boolean; fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right'; render?: (value: unknown, row: T, index: number) => ReactNode;
  filterRender?: (value: string, onChange: (value: string) => void) => ReactNode;
}

interface DataGridProps<T> {
  data: T[]; columns: Column<T>[]; rowKey: keyof T | ((row: T) => string);
  loading?: boolean; selectable?: boolean; selectedRows?: string[]; onSelectionChange?: (selectedIds: string[]) => void;
  onRowClick?: (row: T) => void; onRowDoubleClick?: (row: T) => void;
  sortColumn?: string; sortDirection?: SortDirection; onSort?: (column: string, direction: SortDirection) => void;
  filters?: Record<string, string>; onFilterChange?: (filters: Record<string, string>) => void;
  stickyHeader?: boolean; rowHeight?: number; headerHeight?: number; maxHeight?: number | string;
  emptyMessage?: string; showToolbar?: boolean; onExport?: () => void; onRefresh?: () => void; className?: string;
}

export function DataGrid<T extends Record<string, unknown>>({
  data, columns, rowKey, loading = false, selectable = false, selectedRows = [], onSelectionChange,
  onRowClick, onRowDoubleClick, sortColumn, sortDirection, onSort, filters = {}, onFilterChange,
  stickyHeader = true, rowHeight = 48, headerHeight = 48, maxHeight, emptyMessage = 'Nenhum dado encontrado',
  showToolbar = true, onExport, onRefresh, className,
}: DataGridProps<T>) {
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((c) => String(c.key)));
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const getRowKey = useCallback((row: T): string => typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]), [rowKey]);
  const displayColumns = useMemo(() => columns.filter((c) => visibleColumns.includes(String(c.key))), [columns, visibleColumns]);
  const allSelected = useMemo(() => data.length > 0 && data.every((row) => selectedRows.includes(getRowKey(row))), [data, selectedRows, getRowKey]);

  const handleSelectAll = useCallback(() => { allSelected ? onSelectionChange?.([]) : onSelectionChange?.(data.map((row) => getRowKey(row))); }, [allSelected, data, getRowKey, onSelectionChange]);
  const handleRowSelect = useCallback((row: T) => { const id = getRowKey(row); selectedRows.includes(id) ? onSelectionChange?.(selectedRows.filter((r) => r !== id)) : onSelectionChange?.([...selectedRows, id]); }, [selectedRows, getRowKey, onSelectionChange]);

  const handleSort = useCallback((column: string) => {
    if (!onSort) return;
    let newDirection: SortDirection;
    if (sortColumn !== column) newDirection = 'asc'; else if (sortDirection === 'asc') newDirection = 'desc'; else newDirection = null;
    onSort(column, newDirection);
  }, [sortColumn, sortDirection, onSort]);

  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault(); setResizing(columnKey);
    const startX = e.clientX; const startWidth = columnWidths[columnKey] || 150;
    const handleMouseMove = (moveEvent: MouseEvent) => { setColumnWidths((prev) => ({ ...prev, [columnKey]: Math.max(50, startWidth + moveEvent.clientX - startX) })); };
    const handleMouseUp = () => { setResizing(null); document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  const getColumnWidth = (column: Column<T>): string | number => columnWidths[String(column.key)] || column.width || 'auto';
  const getCellValue = (row: T, column: Column<T>): unknown => { const key = String(column.key); return key.includes('.') ? key.split('.').reduce((obj, k) => (obj as Record<string, unknown>)?.[k], row) : row[key as keyof T]; };
  const toggleColumn = (columnKey: string) => setVisibleColumns((prev) => prev.includes(columnKey) ? prev.filter((k) => k !== columnKey) : [...prev, columnKey]);

  return (
    <div className={cn('flex flex-col bg-card rounded-lg border border-border', className)}>
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                showFilters ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground')}>
              <Filter className="w-4 h-4" />Filtros
            </button>
            <div className="relative">
              <button onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-muted text-muted-foreground">
                <Columns className="w-4 h-4" />Colunas
              </button>
              {showColumnSelector && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-popover rounded-lg shadow-lg border border-border py-2 z-10">
                  {columns.map((column) => (
                    <label key={String(column.key)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer">
                      <input type="checkbox" checked={visibleColumns.includes(String(column.key))} onChange={() => toggleColumn(String(column.key))} className="rounded border-border" />
                      <span className="text-sm text-foreground">{column.header}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && <button onClick={onRefresh} disabled={loading} className="p-2 hover:bg-muted rounded-lg text-muted-foreground disabled:opacity-50"><RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /></button>}
            {onExport && <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-muted text-muted-foreground"><Download className="w-4 h-4" />Exportar</button>}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/50">
          {displayColumns.filter((c) => c.filterable !== false).map((column) => (
            <div key={String(column.key)} className="flex-1 max-w-xs">
              {column.filterRender ? column.filterRender(filters[String(column.key)] || '', (value) => onFilterChange?.({ ...filters, [String(column.key)]: value })) : (
                <input type="text" placeholder={`Filtrar ${column.header}`} value={filters[String(column.key)] || ''}
                  onChange={(e) => onFilterChange?.({ ...filters, [String(column.key)]: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={tableRef} className="overflow-auto" style={{ maxHeight: maxHeight || 'none' }}>
        <table className="w-full border-collapse">
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-muted/50">
              {selectable && <th className="w-12 px-4 py-3 border-b border-border" style={{ height: headerHeight }}><button onClick={handleSelectAll} className="p-1">{allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}</button></th>}
              {displayColumns.map((column) => {
                const key = String(column.key); const isSorted = sortColumn === key;
                return (
                  <th key={key} className={cn('px-4 py-3 text-left text-sm font-medium text-muted-foreground border-b border-border', column.sortable !== false && 'cursor-pointer hover:bg-muted', column.align === 'center' && 'text-center', column.align === 'right' && 'text-right')}
                    style={{ width: getColumnWidth(column), minWidth: column.minWidth, maxWidth: column.maxWidth, height: headerHeight }} onClick={() => column.sortable !== false && handleSort(key)}>
                    <div className="flex items-center gap-1">
                      <span>{column.header}</span>
                      {column.sortable !== false && <span className="flex-shrink-0">{isSorted ? (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <ChevronsUpDown className="w-4 h-4 opacity-30" />}</span>}
                    </div>
                    {column.resizable !== false && <div className={cn('absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary', resizing === key && 'bg-primary')} onMouseDown={(e) => handleResizeStart(e, key)} />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {selectable && <td className="px-4 py-3"><div className="w-4 h-4 bg-muted rounded animate-pulse" /></td>}
                  {displayColumns.map((column) => <td key={String(column.key)} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={displayColumns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">{emptyMessage}</td></tr>
            ) : (
              data.map((row, rowIndex) => {
                const id = getRowKey(row); const isSelected = selectedRows.includes(id);
                return (
                  <tr key={id} className={cn('border-b border-border/50 transition-colors', isSelected && 'bg-primary/5', !isSelected && 'hover:bg-muted/50', onRowClick && 'cursor-pointer')}
                    onClick={() => onRowClick?.(row)} onDoubleClick={() => onRowDoubleClick?.(row)} style={{ height: rowHeight }}>
                    {selectable && <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); handleRowSelect(row); }} className="p-1">{isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}</button></td>}
                    {displayColumns.map((column) => (
                      <td key={String(column.key)} className={cn('px-4 py-3 text-sm text-foreground', column.align === 'center' && 'text-center', column.align === 'right' && 'text-right')}>
                        {column.render ? column.render(getCellValue(row, column), row, rowIndex) : String(getCellValue(row, column) ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectable && selectedRows.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/50 text-sm text-muted-foreground">
          {selectedRows.length} item(s) selecionado(s)
        </div>
      )}
    </div>
  );
}

export type { Column, SortDirection };
export default DataGrid;