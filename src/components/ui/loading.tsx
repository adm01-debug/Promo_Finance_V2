import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useGlobalLoading } from '@/contexts/loading-context';

// ============================================================================
// Types
// ============================================================================

interface LoadingOverlayProps {
  isLoading?: boolean;
  message?: string;
  progress?: number;
  blur?: boolean;
  className?: string;
}

interface GlobalLoadingOverlayProps {
  blur?: boolean;
  className?: string;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

interface LoadingDotsProps {
  className?: string;
}

interface LoadingBarProps {
  progress?: number;
  indeterminate?: boolean;
  className?: string;
}

// ============================================================================
// Loading Spinner
// ============================================================================

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeStyles[size], className)}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// Loading Dots
// ============================================================================

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} aria-hidden="true">
      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
    </div>
  );
}

// ============================================================================
// Loading Bar
// ============================================================================

export function LoadingBar({
  progress,
  indeterminate = false,
  className,
}: LoadingBarProps) {
  return (
    <div
      className={cn(
        'h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        className
      )}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <div className="h-full w-1/3 bg-primary rounded-full animate-[loading-bar_1.5s_ease-in-out_infinite]" />
      ) : (
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress ?? 0}%` }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Loading Overlay
// ============================================================================

export function LoadingOverlay({
  isLoading = false,
  message,
  progress,
  blur = true,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        blur ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm' : 'bg-black/50',
        className
      )}
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <LoadingSpinner size="xl" />
        
        {message && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
        
        {progress !== undefined && (
          <div className="w-48">
            <LoadingBar progress={progress} />
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Global Loading Overlay (connected to context)
// ============================================================================

export function GlobalLoadingOverlay({
  blur = true,
  className,
}: GlobalLoadingOverlayProps) {
  const { isLoading, message, progress } = useGlobalLoading();

  return (
    <LoadingOverlay
      isLoading={isLoading}
      message={message}
      progress={progress}
      blur={blur}
      className={className}
    />
  );
}

// ============================================================================
// Inline Loading
// ============================================================================

interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export function InlineLoading({ message = 'Carregando...', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2 text-gray-500 dark:text-gray-400', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

// ============================================================================
// Button Loading State
// ============================================================================

interface ButtonLoadingProps {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLoading({
  isLoading,
  loadingText,
  children,
  className,
}: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <span className={cn('flex items-center gap-2', className)}>
        <LoadingSpinner size="sm" />
        {loadingText && <span>{loadingText}</span>}
      </span>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// Skeleton Loading
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
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
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variantStyles[variant],
        animation !== 'wave' && animationStyles[animation],
        animation === 'wave' && animationStyles.wave,
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// Skeleton Text
// ============================================================================

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          className={cn(i === lines - 1 && 'w-3/4')}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Page Loading
// ============================================================================

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Carregando página...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Card Loading
// ============================================================================

export function CardLoading() {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <Skeleton variant="rectangular" height={24} width="60%" className="mb-4" />
      <SkeletonText lines={3} />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangular" height={36} width={80} />
        <Skeleton variant="rectangular" height={36} width={80} />
      </div>
    </div>
  );
}

// ============================================================================
// Table Loading
// ============================================================================

interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export function TableLoading({ rows = 5, columns = 4 }: TableLoadingProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={20} className="flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              height={16}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
