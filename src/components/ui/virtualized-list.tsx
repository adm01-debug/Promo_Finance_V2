import * as React from "react";
import { List } from "react-window";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, Inbox } from "lucide-react";

interface VirtualizedListProps<T> {
  data: T[];
  rowHeight?: number | ((index: number) => number);
  height?: number;
  className?: string;
  overscanCount?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  isLoading?: boolean;
  /** Enable row animations for small datasets */
  animated?: boolean;
  /** Threshold to switch to virtualization */
  virtualizationThreshold?: number;
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

// Enhanced loading skeleton
function ListLoadingSkeleton({ height, rowCount = 5 }: { height: number; rowCount?: number }) {
  return (
    <div className="space-y-2 p-2" style={{ height }}>
      {Array.from({ length: rowCount }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="h-12 bg-muted/50 rounded-lg animate-pulse"
          style={{ 
            animationDelay: `${i * 100}ms`,
            background: `linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted)/0.5) 50%, hsl(var(--muted)) 100%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      ))}
    </div>
  );
}

// Empty state component
function ListEmptyState({ 
  message, 
  icon 
}: { 
  message: string; 
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground gap-3"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="p-4 rounded-full bg-muted/50"
      >
        {icon || <Inbox className="h-8 w-8" />}
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
  );
}

// Animated row wrapper for small datasets
function AnimatedRow<T>({
  item,
  index,
  renderItem,
  getItemKey,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
}) {
  const key = getItemKey ? getItemKey(item, index) : index;
  
  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ 
        duration: 0.2, 
        delay: Math.min(index * 0.03, 0.3) 
      }}
      layout
    >
      {renderItem(item, index, {})}
    </motion.div>
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
  emptyIcon,
  isLoading = false,
  animated = true,
  virtualizationThreshold = 30,
}: VirtualizedListProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-lg border bg-card", className)}>
        <ListLoadingSkeleton height={height} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-lg border bg-card", className)} style={{ height }}>
        <ListEmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    );
  }

  // For small datasets, render with animations
  if (data.length <= virtualizationThreshold) {
    return (
      <div 
        className={cn("relative w-full overflow-auto rounded-lg", className)} 
        style={{ maxHeight: height }}
      >
        <AnimatePresence mode="popLayout">
          {data.map((item, index) => (
            animated ? (
              <AnimatedRow
                key={getItemKey ? getItemKey(item, index) : index}
                item={item}
                index={index}
                renderItem={renderItem}
                getItemKey={getItemKey}
              />
            ) : (
              <div key={getItemKey ? getItemKey(item, index) : index}>
                {renderItem(item, index, {})}
              </div>
            )
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // For larger datasets, use virtualization with react-window v2 API
  const rowProps: RowProps<T> = { data, renderItem, getItemKey };

  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg border", className)}>
      <List
        rowCount={data.length}
        rowHeight={typeof rowHeight === "function" ? rowHeight : rowHeight}
        overscanCount={overscanCount}
        className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ height }}
        rowProps={rowProps}
        rowComponent={RowComponent as any}
      />
    </div>
  );
}

// Utility component for scroll-to-top indicator
export function ScrollIndicator({ 
  visible, 
  onClick 
}: { 
  visible: boolean; 
  onClick: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={onClick}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export type { VirtualizedListProps };
