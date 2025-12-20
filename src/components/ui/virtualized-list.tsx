import * as React from "react";
import { List } from "react-window";
import { cn } from "@/lib/utils";

interface VirtualizedListProps<T> {
  data: T[];
  rowHeight?: number | ((index: number) => number);
  height?: number;
  className?: string;
  overscanCount?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  isLoading?: boolean;
}

interface RowProps<T> {
  data: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
}

function RowComponent<T>({
  index,
  style,
  data,
  renderItem,
  getItemKey,
}: {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: React.CSSProperties;
  data: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
}): React.ReactElement {
  const item = data[index];
  const key = getItemKey ? getItemKey(item, index) : index;

  return (
    <div style={style} key={key}>
      {renderItem(item, index, style)}
    </div>
  );
}

export function VirtualizedList<T>({
  data,
  rowHeight = 48,
  height = 400,
  className,
  overscanCount = 5,
  renderItem,
  getItemKey,
  emptyMessage = "Nenhum item encontrado",
  isLoading = false,
}: VirtualizedListProps<T>) {
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
      <div className={cn("flex items-center justify-center h-24 text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  // For small datasets, render normally
  if (data.length <= 30) {
    return (
      <div className={cn("relative w-full overflow-auto", className)} style={{ maxHeight: height }}>
        {data.map((item, index) => {
          const key = getItemKey ? getItemKey(item, index) : index;
          return (
            <div key={key}>
              {renderItem(item, index, {})}
            </div>
          );
        })}
      </div>
    );
  }

  // For larger datasets, use virtualization with react-window v2 API
  const rowProps: RowProps<T> = { data, renderItem, getItemKey };

  return (
    <List
      rowCount={data.length}
      rowHeight={typeof rowHeight === "function" ? rowHeight : rowHeight}
      overscanCount={overscanCount}
      className={className}
      style={{ height }}
      rowProps={rowProps}
      rowComponent={RowComponent as any}
    />
  );
}

export type { VirtualizedListProps };
