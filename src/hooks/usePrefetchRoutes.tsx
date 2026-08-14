import { useEffect, useRef, type ReactNode } from 'react';
import { usePrefetchRoutes } from './usePrefetchRoutes';

// Component wrapper for prefetching on visibility
export function PrefetchOnVisible({ 
  route, 
  children 
}: { 
  route: string; 
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { prefetchRoute, prefetchData } = usePrefetchRoutes();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (!ref.current || hasPrefetched.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPrefetched.current) {
          hasPrefetched.current = true;
          prefetchRoute(route);
          prefetchData(route);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [route, prefetchRoute, prefetchData]);

  return (
    <div ref={ref}>{children}</div>
  );
}
