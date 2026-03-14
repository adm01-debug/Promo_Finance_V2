import {
  Suspense,
  lazy,
  ComponentType,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  delay?: number;
  minHeight?: number | string;
  className?: string;
}

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface LazyComponentOptions {
  fallback?: ReactNode;
  delay?: number;
  preload?: boolean;
  retry?: number;
}

// Default loading spinner
function DefaultFallback({ minHeight }: { minHeight?: number | string }) {
  return (
    <div
      className="flex items-center justify-center p-8"
      style={{ minHeight }}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Lazy Load Wrapper
export function LazyLoad({
  children,
  fallback,
  delay = 0,
  minHeight = 200,
  className,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldRender(true), delay);
        return () => clearTimeout(timer);
      }
      setShouldRender(true);
    }
  }, [isVisible, delay]);

  return (
    <div ref={ref} className={className}>
      {shouldRender ? (
        <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
          {children}
        </Suspense>
      ) : (
        fallback || <DefaultFallback minHeight={minHeight} />
      )}
    </div>
  );
}

// Lazy Image Component
export function LazyImage({
  src,
  alt,
  width,
  height,
  placeholder,
  className,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = () => { setIsLoaded(true); onLoad?.(); };
  const handleError = () => { setHasError(true); onError?.(); };

  const defaultPlaceholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width || 400} ${height || 300}'%3E%3Crect fill='%23e5e7eb' width='100%25' height='100%25'/%3E%3C/svg%3E`;

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {!isLoaded && !hasError && (
        <img
          src={placeholder || defaultPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
          aria-hidden="true"
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Erro ao carregar</span>
        </div>
      )}

      {isVisible && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {isVisible && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Create lazy component with retry logic
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): ComponentType<Record<string, unknown>> {
  const { fallback, delay = 0, preload = false, retry = 3 } = options;

  let retryCount = 0;

  const lazyImport = () =>
    importFn().catch((error) => {
      if (retryCount < retry) {
        retryCount++;
        return new Promise<{ default: T }>((resolve) =>
          setTimeout(() => resolve(lazyImport()), 1000 * Math.pow(2, retryCount - 1))
        );
      }
      throw error;
    });

  const LazyComponent = lazy(lazyImport);

  if (preload) lazyImport();

  function LazyWrapper(props: Record<string, unknown>) {
    const [shouldRender, setShouldRender] = useState(delay === 0);

    useEffect(() => {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldRender(true), delay);
        return () => clearTimeout(timer);
      }
    }, []);

    if (!shouldRender) return fallback || <DefaultFallback />;

    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  }

  return LazyWrapper;
}

// Preload a lazy component
export function preloadComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): void {
  importFn();
}

// Hook for lazy loading data
interface UseLazyDataOptions<T> {
  fetchFn: () => Promise<T>;
  enabled?: boolean;
  delay?: number;
}

export function useLazyData<T>({
  fetchFn,
  enabled = true,
  delay = 0,
}: UseLazyDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled || !isVisible) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setIsLoading(false);
      }
    };

    if (delay > 0) {
      const timer = setTimeout(loadData, delay);
      return () => clearTimeout(timer);
    }

    loadData();
  }, [enabled, isVisible, fetchFn, delay]);

  return { data, isLoading, error, ref, isVisible };
}

// Skeleton component for loading states
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className,
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-muted',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
}

// Content placeholder (skeleton group)
interface ContentPlaceholderProps {
  lines?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
  className?: string;
}

export function ContentPlaceholder({
  lines = 3,
  showAvatar = false,
  showTitle = true,
  className,
}: ContentPlaceholderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {(showAvatar || showTitle) && (
        <div className="flex items-center gap-3">
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          {showTitle && (
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? '80%' : '100%'} height={12} />
        ))}
      </div>
    </div>
  );
}

export default LazyLoad;
