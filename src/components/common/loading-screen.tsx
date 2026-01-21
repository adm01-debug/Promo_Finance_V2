import { DollarSign, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  variant?: 'full' | 'inline' | 'overlay';
  size?: 'sm' | 'md' | 'lg';
  showLogo?: boolean;
}

export function LoadingScreen({
  message = 'Carregando...',
  variant = 'full',
  size = 'lg',
  showLogo = true,
}: LoadingScreenProps) {
  const sizeClasses = {
    sm: {
      logo: 'w-8 h-8',
      icon: 'w-4 h-4',
      spinner: 'w-6 h-6',
      text: 'text-sm',
    },
    md: {
      logo: 'w-12 h-12',
      icon: 'w-6 h-6',
      spinner: 'w-8 h-8',
      text: 'text-base',
    },
    lg: {
      logo: 'w-16 h-16',
      icon: 'w-8 h-8',
      spinner: 'w-12 h-12',
      text: 'text-lg',
    },
  };

  const sizes = sizeClasses[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {showLogo && (
        <div className={cn('bg-primary-600 rounded-xl flex items-center justify-center', sizes.logo)}>
          <DollarSign className={cn('text-white', sizes.icon)} />
        </div>
      )}
      
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn('text-primary-600 animate-spin', sizes.spinner)} />
        <p className={cn('text-gray-600 dark:text-gray-400 animate-pulse', sizes.text)}>
          {message}
        </p>
      </div>
    </div>
  );

  if (variant === 'full') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        {content}
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        {content}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  );
}

// Simple spinner component
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={cn('animate-spin text-primary-600', sizeClasses[size], className)} 
    />
  );
}

// Skeleton loading component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
}

// Page loading skeleton
export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height={32} variant="rounded" />
          <Skeleton width={300} height={20} variant="rounded" />
        </div>
        <Skeleton width={120} height={40} variant="rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Skeleton width={100} height={16} variant="rounded" className="mb-2" />
            <Skeleton width={80} height={32} variant="rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton width={200} height={40} variant="rounded" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton width={40} height={40} variant="circular" />
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height={20} variant="rounded" />
                <Skeleton width="40%" height={16} variant="rounded" />
              </div>
              <Skeleton width={100} height={32} variant="rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Table loading skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton 
            key={i} 
            width={`${100 / columns}%`} 
            height={20} 
            variant="rounded" 
          />
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                width={`${100 / columns}%`} 
                height={20} 
                variant="rounded" 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Card loading skeleton
export function CardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton width={48} height={48} variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} variant="rounded" />
          <Skeleton width="40%" height={16} variant="rounded" />
        </div>
      </div>
      <Skeleton width="100%" height={100} variant="rounded" />
    </div>
  );
}

export default LoadingScreen;
