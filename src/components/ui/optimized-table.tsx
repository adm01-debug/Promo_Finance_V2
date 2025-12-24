import * as React from "react";
import { VirtualizedTable, VirtualizedTableColumn } from "./virtualized-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface OptimizedTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: VirtualizedTableColumn<T>[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string | number;
  virtualizationThreshold?: number;
  virtualizedHeight?: number;
  rowHeight?: number;
  className?: string;
  /** Custom render function for table rows - used when NOT virtualized */
  renderRow?: (item: T, index: number) => React.ReactNode;
}

/**
 * OptimizedTable automatically switches between regular table and 
 * VirtualizedTable based on the dataset size for optimal performance.
 * 
 * - Small datasets (< threshold): Regular table with full animations
 * - Large datasets (>= threshold): VirtualizedTable for smooth scrolling
 */
export function OptimizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  emptyState,
  onRowClick,
  getRowKey,
  virtualizationThreshold = 50,
  virtualizedHeight = 500,
  rowHeight = 52,
  className,
  renderRow,
}: OptimizedTableProps<T>) {
  const shouldVirtualize = data.length > virtualizationThreshold;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return (
      <div className={cn("relative w-full overflow-auto", className)}>
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
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                Nenhum item encontrado
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // Use virtualization for large datasets
  if (shouldVirtualize && !renderRow) {
    return (
      <VirtualizedTable
        data={data}
        columns={columns}
        height={virtualizedHeight}
        rowHeight={rowHeight}
        onRowClick={onRowClick}
        getRowKey={getRowKey}
        className={className}
      />
    );
  }

  // Regular table for small datasets or when custom renderRow is provided
  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
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
          {renderRow
            ? data.map((item, index) => renderRow(item, index))
            : data.map((item, index) => {
                const key = getRowKey ? getRowKey(item, index) : index;
                return (
                  <TableRow
                    key={key}
                    className={cn(onRowClick && "cursor-pointer")}
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
              })}
        </TableBody>
      </Table>
    </div>
  );
}

export type { VirtualizedTableColumn as OptimizedTableColumn };
