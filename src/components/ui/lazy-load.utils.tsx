import { Suspense, lazy, ComponentType, type ReactNode, useState, useEffect, useRef } from 'react';
import { DefaultFallback } from './lazy-load';

interface LazyComponentOptions {
  fallback?: ReactNode;
  delay?: number;
  preload?: boolean;
  retry?: number;
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

    // LazyComponent é resolvido dinamicamente — o cast preserva a passagem
    // de props sem introduzir `any` explícito nos consumidores do wrapper.
    const Comp = LazyComponent as unknown as ComponentType<Record<string, unknown>>;
    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        <Comp {...props} />
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