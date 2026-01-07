import { Suspense, ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// PAGE SUSPENSE BOUNDARY
// Com loading state aprimorado e delay mínimo
// ============================================
interface PageSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  minDelay?: number;
}

function PageLoadingFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col"
    >
      {/* Header skeleton */}
      <div className="h-16 border-b border-border/50 px-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 border-r border-border/50 p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-9 w-32" />
            </div>
            
            {/* KPIs skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            
            {/* Content skeleton */}
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PageSuspense({ children, fallback, minDelay = 0 }: PageSuspenseProps) {
  const [showFallback, setShowFallback] = useState(minDelay > 0);

  useEffect(() => {
    if (minDelay > 0) {
      const timer = setTimeout(() => setShowFallback(false), minDelay);
      return () => clearTimeout(timer);
    }
  }, [minDelay]);

  if (showFallback) {
    return <>{fallback || <PageLoadingFallback />}</>;
  }

  return (
    <Suspense fallback={fallback || <PageLoadingFallback />}>
      {children}
    </Suspense>
  );
}

// ============================================
// COMPONENT SUSPENSE BOUNDARY
// Para componentes individuais com skeleton inline
// ============================================
interface ComponentSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  height?: number | string;
  className?: string;
}

function ComponentLoadingFallback({ 
  height = 'auto', 
  className 
}: { 
  height?: number | string; 
  className?: string;
}) {
  return (
    <div 
      className={cn('animate-pulse bg-muted/50 rounded-lg', className)} 
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    </div>
  );
}

export function ComponentSuspense({ 
  children, 
  fallback, 
  height,
  className 
}: ComponentSuspenseProps) {
  return (
    <Suspense fallback={fallback || <ComponentLoadingFallback height={height} className={className} />}>
      {children}
    </Suspense>
  );
}

// ============================================
// CARD SUSPENSE
// Para cards com skeleton específico
// ============================================
interface CardSuspenseProps {
  children: ReactNode;
  title?: boolean;
  rows?: number;
}

function CardLoadingFallback({ title = true, rows = 3 }: { title?: boolean; rows?: number }) {
  return (
    <div className="p-6 bg-card rounded-xl border border-border space-y-4">
      {title && <Skeleton className="h-6 w-40" />}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

export function CardSuspense({ children, title, rows }: CardSuspenseProps) {
  return (
    <Suspense fallback={<CardLoadingFallback title={title} rows={rows} />}>
      {children}
    </Suspense>
  );
}

// ============================================
// TABLE SUSPENSE
// Para tabelas com skeleton específico
// ============================================
interface TableSuspenseProps {
  children: ReactNode;
  columns?: number;
  rows?: number;
}

function TableLoadingFallback({ columns = 5, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-muted/50 px-4 h-12 gap-4 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex items-center px-4 h-14 gap-4 border-b border-border/50 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableSuspense({ children, columns, rows }: TableSuspenseProps) {
  return (
    <Suspense fallback={<TableLoadingFallback columns={columns} rows={rows} />}>
      {children}
    </Suspense>
  );
}

// ============================================
// CHART SUSPENSE
// Para gráficos com skeleton específico
// ============================================
interface ChartSuspenseProps {
  children: ReactNode;
  height?: number;
}

function ChartLoadingFallback({ height = 300 }: { height?: number }) {
  return (
    <div className="relative rounded-lg border border-border overflow-hidden" style={{ height }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
        >
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        </motion.div>
      </div>
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export function ChartSuspense({ children, height }: ChartSuspenseProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback height={height} />}>
      {children}
    </Suspense>
  );
}
