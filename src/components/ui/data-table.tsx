import { useState, useMemo, ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface Column<T> {
  key: string; header: string | ReactNode; accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean; width?: string; align?: 'left' | 'center' | 'right'; className?: string; headerClassName?: string;
}

export type SortDirection = 'asc' | 'desc' | null;
export interface SortState { key: string; direction: SortDirection; }

interface DataTableProps<T> {
  data: T[]; columns: Column<T>[]; keyExtractor: (row: T) => string;
  loading?: boolean; emptyMessage?: string; emptyIcon?: ReactNode;
  sortable?: boolean; defaultSort?: SortState; onSort?: (sort: SortState) => void;
  pagination?: boolean; pageSize?: number; pageSizeOptions?: number[];
  selectable?: boolean; selectedKeys?: Set<string>; onSelectionChange?: (keys: Set<string>) => void;
  className?: string; striped?: boolean; hoverable?: boolean; compact?: boolean;
  onRowClick?: (row: T) => void; rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  data, columns, keyExtractor, loading = false, emptyMessage = 'Nenhum registro encontrado', emptyIcon,
  sortable = false, defaultSort, onSort, pagination = false, pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50], selectable = false, selectedKeys = new Set(), onSelectionChange,
  className, striped = false, hoverable = true, compact = false, onRowClick, rowClassName,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(defaultSort || null);
  const sort = onSort ? defaultSort || null : internalSort;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSort = (key: string) => {
    if (!sortable) return;
    const column = columns.find((c) => c.key === key);
    if (!column?.sortable) return;
    let newDirection: SortDirection = 'asc';
    if (sort?.key === key) { if (sort.direction === 'asc') newDirection = 'desc'; else if (sort.direction === 'desc') newDirection = null; }
    const newSort = newDirection ? { key, direction: newDirection } : { key: '', direction: null };
    if (onSort) onSort(newSort); else setInternalSort(newSort.direction ? newSort : null);
  };

  const sortedData = useMemo(() => {
    if (!sort?.key || !sort.direction) return data;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return data;
    return [...data].sort((a, b) => {
      const accessor = column.accessor;
      const aValue = typeof accessor === 'function' ? accessor(a) : a[accessor];
      const bValue = typeof accessor === 'function' ? accessor(b) : b[accessor];
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      const comparison = aValue < bValue ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sort, columns]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedData.length);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const allKeys = new Set(paginatedData.map(keyExtractor));
    const allSelected = paginatedData.every((row) => selectedKeys.has(keyExtractor(row)));
    if (allSelected) { const ns = new Set(selectedKeys); paginatedData.forEach((row) => ns.delete(keyExtractor(row))); onSelectionChange(ns); }
    else onSelectionChange(new Set([...selectedKeys, ...allKeys]));
  };

  const handleSelectRow = (row: T) => {
    if (!onSelectionChange) return;
    const key = keyExtractor(row);
    const ns = new Set(selectedKeys);
    if (ns.has(key)) ns.delete(key); else ns.add(key);
    onSelectionChange(ns);
  };

  const renderCell = (row: T, column: Column<T>) => { const a = column.accessor; return typeof a === 'function' ? a(row) : row[a] as ReactNode; };

  const getSortIcon = (column: Column<T>) => {
    if (!sortable || !column.sortable) return null;
    if (sort?.key !== column.key) return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
    if (sort.direction === 'asc') return <ChevronUp className="h-4 w-4" />;
    if (sort.direction === 'desc') return <ChevronDown className="h-4 w-4" />;
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedKeys.has(keyExtractor(row)));
  const isSomeSelected = paginatedData.some((row) => selectedKeys.has(keyExtractor(row)));

  return (
    <div className={cn('bg-card rounded-lg shadow overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected && !isAllSelected; }} onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                </th>
              )}
              {columns.map((column) => (
                <th key={column.key} className={cn('px-6 text-xs font-medium text-muted-foreground uppercase tracking-wider', compact ? 'py-2' : 'py-3',
                  column.align === 'center' && 'text-center', column.align === 'right' && 'text-right', column.align !== 'center' && column.align !== 'right' && 'text-left',
                  sortable && column.sortable && 'cursor-pointer select-none hover:bg-muted', column.headerClassName)}
                  style={{ width: column.width }} onClick={() => sortable && column.sortable && handleSort(column.key)}>
                  <div className={cn('flex items-center gap-1', column.align === 'center' && 'justify-center', column.align === 'right' && 'justify-end')}>
                    {column.header}{getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-12 text-center">
                <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              </td></tr>
            ) : paginatedData.length === 0 ? (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-12 text-center text-muted-foreground">
                {emptyIcon && <div className="mb-4">{emptyIcon}</div>}<p>{emptyMessage}</p>
              </td></tr>
            ) : paginatedData.map((row, rowIndex) => {
              const key = keyExtractor(row);
              const isSelected = selectedKeys.has(key);
              return (
                <tr key={key} className={cn(hoverable && 'hover:bg-muted/50', striped && rowIndex % 2 === 1 && 'bg-muted/25', isSelected && 'bg-primary/5', onRowClick && 'cursor-pointer', rowClassName?.(row))} onClick={() => onRowClick?.(row)}>
                  {selectable && (
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(row)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-6 text-sm text-foreground', compact ? 'py-2' : 'py-4', column.align === 'center' && 'text-center', column.align === 'right' && 'text-right', column.className)}>
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrando</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="h-8 rounded-md border border-border bg-background text-sm text-foreground focus:border-primary focus:ring-primary">
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <span className="text-sm text-muted-foreground">de {sortedData.length} registros</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{startIndex}-{endIndex} de {sortedData.length}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /><ChevronLeft className="h-4 w-4 -ml-2" /></Button>
              <Button variant="outline" size="icon-sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon-sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon-sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /><ChevronRight className="h-4 w-4 -ml-2" /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
