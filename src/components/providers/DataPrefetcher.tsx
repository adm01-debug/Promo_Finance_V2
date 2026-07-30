import { usePrefetchCriticalData } from '@/hooks/useOptimizedQueries';
import { usePrefetchRoutes } from '@/hooks/usePrefetchRoutes';

/**
 * Component that handles prefetching of critical data and routes on app load.
 * Must be rendered inside QueryClientProvider and AuthProvider.
 */
export function DataPrefetcher({ children }: { children: React.ReactNode }) {
  // Prefetch critical data (empresas, contas bancarias, centros de custo)
  usePrefetchCriticalData();
  
  // Prefetch likely navigation routes
  usePrefetchRoutes();
  
  return <>{children}</>;
}
