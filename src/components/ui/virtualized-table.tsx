import * as React from "react";
import { List } from "react-window";
import { cn } from "@/lib/utils";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "./table";

interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  height?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  getRowKey?: (item: T, index: number) => string | number;
}

interface RowComponentProps<T> {
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
}

function RowComponent<T extends Record<string, unknown>>({
  index,
  style,
  data,
  columns,
  onRowClick,
  getRowKey,
}: RowComponentProps<T>) {
  const item = data[index];
  const key = getRowKey ? getRowKey(item, index) : index;

  return (
    <div
      style={style}
      key={key}
      className={cn(
        "flex items-center border-b transition-colors hover:bg-muted/50",
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

export function VirtualizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 52,
  height = 400,
  className,
  onRowClick,
  emptyMessage = "Nenhum item encontrado",
  isLoading = false,
  getRowKey,
}: VirtualizedTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("relative w-full overflow-auto", className)}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
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
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // For small datasets, use regular table
  if (data.length <= 50) {
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
            {data.map((item, index) => {
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

  // For large datasets, use virtualization
  return (
    <div className={cn("relative w-full overflow-auto rounded-md border", className)}>
      {/* Fixed Header */}
      <div className="flex bg-muted/50 border-b sticky top-0 z-10">
        {columns.map((column, index) => (
          <div
            key={index}
            className={cn(
              "h-12 px-4 text-left font-medium text-muted-foreground flex items-center flex-shrink-0",
              column.className
            )}
            style={{ width: column.width || "auto", flex: column.width ? "none" : 1 }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <List
        rowCount={data.length}
        rowHeight={rowHeight}
        overscanCount={5}
        style={{ height }}
        rowProps={{ data, columns, onRowClick, getRowKey }}
        rowComponent={({ index, style, ...rowProps }) => (
          <RowComponent
            index={index}
            style={style}
            data={rowProps.data}
            columns={rowProps.columns}
            onRowClick={rowProps.onRowClick}
            getRowKey={rowProps.getRowKey}
            ariaAttributes={{ "aria-posinset": index + 1, "aria-setsize": data.length, role: "listitem" }}
          />
        )}
      />
    </div>
  );
}

export type { Column as VirtualizedTableColumn };
