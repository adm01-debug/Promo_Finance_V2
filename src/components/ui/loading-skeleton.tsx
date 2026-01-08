import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader } from './card';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'table' | 'cards' | 'form' | 'stats' | 'list' | 'chart' | 'kpi' | 'transactions' | 'calendar';
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingSkeleton({ 
  variant = 'table', 
  rows = 5, 
  columns = 4,
  className 
}: LoadingSkeletonProps) {
  if (variant === 'stats') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
            <Skeleton className="h-1 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'kpi') {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-10" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <Card className={cn("h-[400px]", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-end gap-2 pt-4">
          {/* Simulated bar chart skeleton */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton 
                className="w-full rounded-t" 
                style={{ height: `${Math.random() * 60 + 40}%` }} 
              />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'transactions') {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-14 ml-auto" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'calendar') {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-44" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar grid skeleton */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={cn("space-y-6", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  // Default: table
  return (
    <div className={cn("", className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "w-1/4",
                colIndex === columns - 1 && "w-16"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}


// Full page loading with centered spinner
export function PageLoading({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-muted animate-pulse" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
    </div>
  );
}




// Shimmer skeleton row with animation
function ShimmerRow({ columns, isFirst = false }: { columns: number; isFirst?: boolean }) {
  return (
    <tr className={cn("border-b border-border/50", !isFirst && "animate-pulse")}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="relative overflow-hidden rounded">
            <Skeleton 
              className={cn(
                "h-4",
                i === 0 && "w-40",
                i === 1 && "w-48", 
                i === 2 && "w-24",
                i === 3 && "w-28",
                i === 4 && "w-20",
                i === 5 && "w-16",
                i === 6 && "w-20",
                i >= 7 && "w-12"
              )} 
            />
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </td>
      ))}
    </tr>
  );
}

// Table skeleton with shimmer effect for financial tables
interface TableShimmerSkeletonProps {
  rows?: number;
  columns?: number;
  showCheckbox?: boolean;
  showAvatar?: boolean;
  className?: string;
}

export function TableShimmerSkeleton({ 
  rows = 5, 
  columns = 7,
  showCheckbox = true,
  showAvatar = true,
  className 
}: TableShimmerSkeletonProps) {
  const totalColumns = columns + (showCheckbox ? 1 : 0);
  
  return (
    <div className={cn("w-full", className)}>
      {/* Table Header Skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
        {showCheckbox && (
          <div className="w-[40px] flex-shrink-0">
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        )}
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={cn(
            "flex-1",
            i === 0 && "max-w-[250px]",
            i === columns - 1 && "max-w-[80px]"
          )}>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      
      {/* Table Rows Skeleton with staggered animation */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex items-center gap-4 px-4 py-4 border-b border-border/50"
          style={{ 
            animationDelay: `${rowIndex * 100}ms`,
            opacity: 1 - (rowIndex * 0.1)
          }}
        >
          {showCheckbox && (
            <div className="w-[40px] flex-shrink-0">
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          )}
          
          {/* First column with avatar */}
          <div className="flex-1 max-w-[250px] flex items-center gap-3">
            {showAvatar && <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />}
            <div className="space-y-1.5 flex-1">
              <div className="relative overflow-hidden rounded">
                <Skeleton className="h-4 w-28" />
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animationDelay: `${rowIndex * 150}ms` }} />
              </div>
              <div className="relative overflow-hidden rounded">
                <Skeleton className="h-3 w-20" />
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animationDelay: `${rowIndex * 150 + 50}ms` }} />
              </div>
            </div>
          </div>
          
          {/* Other columns */}
          {Array.from({ length: columns - 2 }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <div className="relative overflow-hidden rounded">
                <Skeleton 
                  className={cn(
                    "h-4",
                    colIndex === 0 && "w-32",
                    colIndex === 1 && "w-24",
                    colIndex === 2 && "w-28",
                    colIndex === 3 && "w-20",
                    colIndex >= 4 && "w-16"
                  )} 
                />
                <div 
                  className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" 
                  style={{ animationDelay: `${rowIndex * 150 + colIndex * 50}ms` }} 
                />
              </div>
            </div>
          ))}
          
          {/* Actions column */}
          <div className="w-[80px] flex-shrink-0 flex justify-end">
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
