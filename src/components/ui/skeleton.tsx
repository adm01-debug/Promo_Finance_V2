import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

function Skeleton({ className, shimmer = true, variant = 'default', ...props }: SkeletonProps) {
  const variantStyles = {
    default: '',
    card: 'rounded-xl',
    text: 'h-4 rounded',
    avatar: 'rounded-full aspect-square',
    button: 'h-10 rounded-lg',
  };

  return (
    <div 
      className={cn(
        "bg-muted relative overflow-hidden",
        variantStyles[variant],
        shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        !shimmer && "animate-pulse",
        className
      )} 
      {...props} 
    />
  );
}

// Skeleton para cards
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="w-24" />
      </div>
    </div>
  );
}

// Skeleton para tabelas
function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-5" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 flex gap-4 border-t">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="text" 
              className={cn("flex-1", colIndex === 0 && "w-1/4 flex-none")} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton para lista
function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
          <Skeleton variant="avatar" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="text" className="w-1/3 h-3" />
          </div>
          <Skeleton variant="button" className="w-20 h-8" />
        </div>
      ))}
    </div>
  );
}

// Skeleton para dashboard
function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <Skeleton variant="text" className="w-1/2 h-4 mb-2" />
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton variant="text" className="w-full h-3" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6">
          <Skeleton variant="text" className="w-1/3 h-5 mb-4" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <div className="rounded-xl border bg-card p-6">
          <Skeleton variant="text" className="w-1/3 h-5 mb-4" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList, 
  SkeletonDashboard 
};
