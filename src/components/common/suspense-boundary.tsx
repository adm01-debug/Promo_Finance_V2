import React, { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Default loading spinner
 */
function DefaultSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
    </div>
  );
}

/**
 * Full page loading state
 */
export function PageLoader({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-lg">{message}</p>
    </div>
  );
}

/**
 * Card skeleton loader
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse',
        className
      )}
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>
    </div>
  );
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              style={{ width: `${100 / columns}%` }}
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
        >
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                style={{
                  width: `${100 / columns}%`,
                  animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Stats cards skeleton
 */
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Chart skeleton
 */
export function ChartSkeleton({ className, height = 300 }: { className?: string; height?: number }) {
  return (
    <div
      className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-6', className)}
      style={{ height }}
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse" />
      <div className="h-full bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
    </div>
  );
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-3">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    </div>
  );
}

/**
 * List skeleton
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsCardsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={350} />
        <ChartSkeleton height={350} />
      </div>
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

/**
 * Inline loader for buttons/text
 */
export function InlineLoader({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />;
}

/**
 * Overlay loader
 */
export function OverlayLoader({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        {message && (
          <p className="mt-3 text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Suspense boundary wrapper
 */
export function SuspenseBoundary({
  children,
  fallback,
  className,
}: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback || <DefaultSpinner className={className} />}>
      {children}
    </Suspense>
  );
}

/**
 * Page suspense boundary
 */
export function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

/**
 * Component suspense boundary
 */
export function ComponentSuspense({
  children,
  fallback = 'spinner',
}: {
  children: ReactNode;
  fallback?: 'spinner' | 'card' | 'table' | ReactNode;
}) {
  let fallbackComponent: ReactNode;

  if (typeof fallback === 'string') {
    switch (fallback) {
      case 'card':
        fallbackComponent = <CardSkeleton />;
        break;
      case 'table':
        fallbackComponent = <TableSkeleton />;
        break;
      default:
        fallbackComponent = <DefaultSpinner />;
    }
  } else {
    fallbackComponent = fallback;
  }

  return <Suspense fallback={fallbackComponent}>{children}</Suspense>;
}

/**
 * Lazy load component with suspense
 */
export function lazyWithSuspense<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = React.lazy(importFn);

  return function LazyWithSuspense(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <DefaultSpinner />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

export default SuspenseBoundary;
