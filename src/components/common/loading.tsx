import { cn } from '@/lib/utils';

// Basic Spinner
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
  className?: string;
}

export function Spinner({ size = 'md', variant = 'default', className }: SpinnerProps) {
  const sizes = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2',
    xl: 'h-12 w-12 border-3',
  };

  const colors = {
    default: 'border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400',
    primary: 'border-blue-200 border-t-blue-600',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizes[size],
        colors[variant],
        className
      )}
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

// Full Page Spinner
interface FullPageSpinnerProps {
  message?: string;
  className?: string;
}

export function FullPageSpinner({ message, className }: FullPageSpinnerProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50',
        className
      )}
    >
      <Spinner size="xl" />
      {message && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}

// Page Loading (for lazy loaded pages)
interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message = 'Carregando página...', className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px]',
        className
      )}
    >
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

// Content Loading (for sections within a page)
interface ContentLoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ContentLoading({ message, className, size = 'md' }: ContentLoadingProps) {
  const heights = {
    sm: 'min-h-[100px]',
    md: 'min-h-[200px]',
    lg: 'min-h-[300px]',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        heights[size],
        className
      )}
    >
      <Spinner size="md" />
      {message && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}

// Inline Loading (for buttons, etc)
interface InlineLoadingProps {
  className?: string;
}

export function InlineLoading({ className }: InlineLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Spinner size="xs" />
      <span className="text-sm">Carregando...</span>
    </span>
  );
}

// Button Loading State
interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoading({ loading, children, loadingText }: ButtonLoadingProps) {
  if (!loading) return <>{children}</>;
  
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size="sm" variant="white" />
      {loadingText && <span>{loadingText}</span>}
    </span>
  );
}

// Overlay Loading (for forms, cards)
interface OverlayLoadingProps {
  message?: string;
  className?: string;
}

export function OverlayLoading({ message, className }: OverlayLoadingProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 rounded-lg',
        className
      )}
    >
      <Spinner size="lg" />
      {message && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}

// Loading Dots Animation
interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={cn('inline-flex gap-1', className)}>
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

// Loading Bar (top of page)
interface LoadingBarProps {
  progress?: number;
  indeterminate?: boolean;
  className?: string;
}

export function LoadingBar({ progress = 0, indeterminate = false, className }: LoadingBarProps) {
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50 overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'h-full bg-blue-600 transition-all duration-300',
          indeterminate && 'animate-indeterminate'
        )}
        style={!indeterminate ? { width: `${progress}%` } : undefined}
      />
    </div>
  );
}

// Pulse Loading Placeholder
interface PulseLoadingProps {
  className?: string;
  children?: React.ReactNode;
}

export function PulseLoading({ className, children }: PulseLoadingProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {children || (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      )}
    </div>
  );
}

// Loading State Wrapper
interface LoadingStateProps {
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  minHeight?: string;
}

export function LoadingState({
  loading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  minHeight = '200px',
}: LoadingStateProps) {
  if (loading) {
    return loadingComponent || (
      <ContentLoading className={`min-h-[${minHeight}]`} />
    );
  }

  if (error) {
    return errorComponent || (
      <div className={`flex flex-col items-center justify-center min-h-[${minHeight}]`}>
        <p className="text-red-600 dark:text-red-400 mb-4">
          Erro ao carregar dados
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

export default Spinner;
