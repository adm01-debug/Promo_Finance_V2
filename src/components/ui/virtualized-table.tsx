import * as React from "react";
import { List } from "react-window";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "./table";
import { Loader2, Database, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  height?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  isLoading?: boolean;
  getRowKey?: (item: T, index: number) => string | number;
  /** Enable row animations for small datasets */
  animated?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Highlight row on hover */
  hoverable?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Sort state */
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

interface RowProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
  striped?: boolean;
  hoverable?: boolean;
}

function RowComponent<T extends Record<string, unknown>>({
  index,
  style,
  data,
  columns,
  onRowClick,
  getRowKey,
  striped,
  hoverable,
}: {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: React.CSSProperties;
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
  striped?: boolean;
  hoverable?: boolean;
}): React.ReactElement {
  const item = data[index];
  const key = getRowKey ? getRowKey(item, index) : index;

  return (
    <div
      style={style}
      key={key}
      className={cn(
        "flex items-center border-b transition-colors duration-150",
        striped && index % 2 === 1 && "bg-muted/30",
        hoverable && "hover:bg-muted/50",
        onRowClick && "cursor-pointer"
      )}
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column, colIndex) => {
        const value = column.key in item ? item[column.key as keyof T] : null;
        return (
          <div
            key={`${key}-${colIndex}`}
            className={cn(
              "p-4 align-middle flex-shrink-0",
              column.className
            )}
            style={{ width: column.width || "auto", flex: column.width ? "none" : 1 }}
          >
            {column.render ? column.render(item, index) : String(value ?? "")}
          </div>
        );
      })}
    </div>
  );
}

// Enhanced loading skeleton for table
function TableLoadingSkeleton({ 
  columns, 
  rowCount = 5 
}: { 
  columns: Column<any>[]; 
  rowCount?: number;
}) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rowCount }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-4 border-b"
        >
          {columns.map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-muted/50 rounded animate-pulse"
              style={{ 
                flex: 1,
                animationDelay: `${(i + colIndex) * 50}ms`
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// Empty state for table
function TableEmptyState({ 
  message, 
  icon, 
  colSpan 
}: { 
  message: string; 
  icon?: React.ReactNode;
  colSpan: number;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-3 text-muted-foreground"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="p-3 rounded-full bg-muted/50"
          >
            {icon || <Database className="h-6 w-6" />}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium"
          >
            {message}
          </motion.p>
        </motion.div>
      </TableCell>
    </TableRow>
  );
}

// Sortable header component
function SortableHeader({
  column,
  sortColumn,
  sortDirection,
  onSort,
}: {
  column: Column<any>;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}) {
  const isSorted = sortColumn === column.key;
  
  if (!column.sortable || !onSort) {
    return <>{column.header}</>;
  }

  return (
    <button
      onClick={() => onSort(column.key as string)}
      className="flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {column.header}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {isSorted ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}

export function VirtualizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 52,
  height = 400,
  className,
  onRowClick,
  emptyMessage = "Nenhum item encontrado",
  emptyIcon,
  isLoading = false,
  getRowKey,
  animated = true,
  striped = false,
  hoverable = true,
  stickyHeader = true,
  sortColumn,
  sortDirection,
  onSort,
}: VirtualizedTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-lg border bg-card", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  style={{ width: column.width }}
                  className={column.className}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <TableLoadingSkeleton columns={columns} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-lg border bg-card", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  style={{ width: column.width }}
                  className={column.className}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmptyState 
              message={emptyMessage} 
              icon={emptyIcon}
              colSpan={columns.length} 
            />
          </TableBody>
        </Table>
      </div>
    );
  }

  // For small datasets, use regular table with optional animations
  if (data.length <= 50) {
    return (
      <div className={cn("relative w-full overflow-auto rounded-lg border bg-card", className)}>
        <Table>
          <TableHeader className={cn(stickyHeader && "sticky top-0 bg-card z-10")}>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  style={{ width: column.width }}
                  className={column.className}
                >
                  <SortableHeader
                    column={column}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {data.map((item, index) => {
                const key = getRowKey ? getRowKey(item, index) : index;
                
                const row = (
                  <TableRow
                    key={key}
                    className={cn(
                      striped && index % 2 === 1 && "bg-muted/30",
                      hoverable && "hover:bg-muted/50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {columns.map((column, colIndex) => {
                      const value = column.key in item ? item[column.key as keyof T] : null;
                      return (
                        <TableCell
                          key={`${key}-${colIndex}`}
                          style={{ width: column.width }}
                          className={column.className}
                        >
                          {column.render ? column.render(item, index) : String(value ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );

                if (animated && data.length <= 20) {
                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                      className={cn(
                        "border-b transition-colors",
                        striped && index % 2 === 1 && "bg-muted/30",
                        hoverable && "hover:bg-muted/50",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={() => onRowClick?.(item, index)}
                    >
                      {columns.map((column, colIndex) => {
                        const value = column.key in item ? item[column.key as keyof T] : null;
                        return (
                          <TableCell
                            key={`${key}-${colIndex}`}
                            style={{ width: column.width }}
                            className={column.className}
                          >
                            {column.render ? column.render(item, index) : String(value ?? "")}
                          </TableCell>
                        );
                      })}
                    </motion.tr>
                  );
                }

                return row;
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    );
  }

  // For large datasets, use virtualization with react-window v2 API
  const rowProps: RowProps<T> = { data, columns, onRowClick, getRowKey, striped, hoverable };

  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg border bg-card", className)}>
      {/* Fixed Header */}
      <div className={cn(
        "flex bg-muted/50 border-b",
        stickyHeader && "sticky top-0 z-10"
      )}>
        {columns.map((column, index) => (
          <div
            key={index}
            className={cn(
              "h-12 px-4 text-left font-medium text-muted-foreground flex items-center flex-shrink-0",
              column.className
            )}
            style={{ width: column.width || "auto", flex: column.width ? "none" : 1 }}
          >
            <SortableHeader
              column={column}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </div>
        ))}
      </div>

      {/* Virtualized Body - using react-window v2 API */}
      <List
        rowCount={data.length}
        rowHeight={rowHeight}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ height }}
        rowProps={rowProps}
        rowComponent={RowComponent as any}
      />
    </div>
  );
}

// Export utility for row selection
export function useTableSelection<T extends { id: string }>(data: T[]) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = React.useCallback(() => {
    setSelectedIds(new Set(data.map(item => item.id)));
  }, [data]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = React.useCallback((id: string) => selectedIds.has(id), [selectedIds]);
  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  return {
    selectedIds,
    selectedItems: data.filter(item => selectedIds.has(item.id)),
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
  };
}

export type { Column as VirtualizedTableColumn };
