import { useCallback, useEffect, type ComponentType } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { buscarAlertas } from '@/hooks/useAlertas';

// Define a type for lazy-loaded React components
interface LazyModule {
  default: ComponentType<unknown>;
}

// Map of routes to their lazy imports
const routeModules: Record<string, () => Promise<LazyModule>> = {
  '/': () => import('@/pages/Index'),
  '/dashboard': () => import('@/pages/Index'),
  '/contas-pagar': () => import('@/pages/ContasPagar'),
  '/contas-receber': () => import('@/pages/ContasReceber'),
  '/fluxo-caixa': () => import('@/pages/FluxoCaixa'),
  '/conciliacao': () => import('@/pages/Conciliacao'),
  '/clientes': () => import('@/pages/Clientes'),
  '/fornecedores': () => import('@/pages/Fornecedores'),
  '/relatorios': () => import('@/pages/Relatorios'),
  '/alertas': () => import('@/pages/Alertas'),
  '/configuracoes': () => import('@/pages/Configuracoes'),
  '/expert': () => import('@/pages/Expert'),
  '/aprovacoes': () => import('@/pages/Aprovacoes'),
  '/boletos': () => import('@/pages/Boletos'),
  '/notas-fiscais': () => import('@/pages/NotasFiscais'),
  '/bi': () => import('@/pages/BI'),
  '/demonstrativos': () => import('@/pages/Demonstrativos'),
};

// Routes that are commonly navigated to from each page
const relatedRoutes: Record<string, string[]> = {
  '/': ['/contas-pagar', '/contas-receber', '/fluxo-caixa', '/expert'],
  '/contas-pagar': ['/', '/fornecedores', '/conciliacao', '/aprovacoes'],
  '/contas-receber': ['/', '/clientes', '/conciliacao'],
  '/fluxo-caixa': ['/', '/relatorios', '/bi'],
  '/clientes': ['/contas-receber'],
  '/fornecedores': ['/contas-pagar'],
  '/conciliacao': ['/contas-pagar', '/contas-receber'],
  '/relatorios': ['/', '/fluxo-caixa', '/bi'],
  '/expert': ['/', '/fluxo-caixa'],
  '/aprovacoes': ['/contas-pagar'],
  '/alertas': ['/', '/contas-pagar', '/contas-receber'],
  '/bi': ['/', '/relatorios', '/fluxo-caixa'],
};

// Só registramos carregadores cujo contrato de chave e escopo é estável. Consultas
// financeiras dependentes de empresa, conta, paginação e filtros não podem ser
// aquecidas com uma chave genérica, pois isso misturaria caches de contextos distintos.
const routeDataPrefetchers: Record<
  string,
  Array<{ queryKey: string[]; queryFn: () => Promise<unknown> }>
> = {
  '/alertas': [{ queryKey: ['alertas'], queryFn: buscarAlertas }],
};

const prefetchedRoutes = new Set<string>();
const prefetchedQueries = new Set<string>();

export function usePrefetchRoutes() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const prefetchRoute = useCallback((route: string) => {
    if (prefetchedRoutes.has(route)) return;

    const moduleLoader = routeModules[route];
    if (moduleLoader) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => {
            moduleLoader()
              .then(() => {
                prefetchedRoutes.add(route);
              })
              .catch(() => {});
          },
          { timeout: 2000 }
        );
      } else {
        setTimeout(() => {
          moduleLoader()
            .then(() => {
              prefetchedRoutes.add(route);
            })
            .catch(() => {});
        }, 100);
      }
    }
  }, []);

  const prefetchData = useCallback(
    async (route: string) => {
      const prefetchers = routeDataPrefetchers[route];
      if (!prefetchers) return;

      for (const { queryKey, queryFn } of prefetchers) {
        const keyString = JSON.stringify(queryKey);
        if (prefetchedQueries.has(keyString)) continue;

        try {
          const existingData = queryClient.getQueryData(queryKey);
          const queryState = queryClient.getQueryState(queryKey);

          if (existingData && queryState?.dataUpdatedAt) {
            const age = Date.now() - queryState.dataUpdatedAt;
            if (age < 2 * 60 * 1000) {
              prefetchedQueries.add(keyString);
              continue;
            }
          }

          const prefetch = () =>
            queryClient
              .prefetchQuery({
                queryKey,
                queryFn,
                staleTime: 2 * 60 * 1000,
              })
              .then(() => {
                prefetchedQueries.add(keyString);
              })
              .catch(() => {});

          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(prefetch, { timeout: 3000 });
          } else {
            setTimeout(prefetch, 0);
          }
        } catch {
          // Silently fail
        }
      }
    },
    [queryClient]
  );

  const prefetchRelatedRoutes = useCallback(() => {
    const currentPath = location.pathname;
    const related = relatedRoutes[currentPath] || [];

    related.forEach((route) => {
      prefetchRoute(route);
      prefetchData(route);
    });
  }, [location.pathname, prefetchRoute, prefetchData]);

  useEffect(() => {
    const timer = setTimeout(prefetchRelatedRoutes, 1500);
    return () => clearTimeout(timer);
  }, [prefetchRelatedRoutes]);

  useEffect(() => {
    const handleRefresh = () => {
      prefetchedQueries.clear();
    };

    window.addEventListener('refresh-data', handleRefresh);
    return () => window.removeEventListener('refresh-data', handleRefresh);
  }, []);

  return { prefetchRoute, prefetchData };
}

// Hook for link hover prefetching
export function useLinkPrefetch(to: string) {
  const { prefetchRoute, prefetchData } = usePrefetchRoutes();

  const handleMouseEnter = useCallback(() => {
    prefetchRoute(to);
    prefetchData(to);
  }, [to, prefetchRoute, prefetchData]);

  const handleFocus = useCallback(() => {
    prefetchRoute(to);
    prefetchData(to);
  }, [to, prefetchRoute, prefetchData]);

  return {
    onMouseEnter: handleMouseEnter,
    onFocus: handleFocus,
  };
}
