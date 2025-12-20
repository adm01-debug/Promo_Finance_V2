import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Map of routes to their lazy imports
const routeModules: Record<string, () => Promise<any>> = {
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
};

// Routes that are commonly navigated to from each page
const relatedRoutes: Record<string, string[]> = {
  '/': ['/contas-pagar', '/contas-receber', '/fluxo-caixa'],
  '/contas-pagar': ['/', '/fornecedores', '/conciliacao'],
  '/contas-receber': ['/', '/clientes', '/conciliacao'],
  '/fluxo-caixa': ['/', '/relatorios'],
  '/clientes': ['/contas-receber'],
  '/fornecedores': ['/contas-pagar'],
  '/conciliacao': ['/contas-pagar', '/contas-receber'],
  '/relatorios': ['/', '/fluxo-caixa'],
};

const prefetchedRoutes = new Set<string>();

export function usePrefetchRoutes() {
  const location = useLocation();

  const prefetchRoute = useCallback((route: string) => {
    if (prefetchedRoutes.has(route)) return;
    
    const moduleLoader = routeModules[route];
    if (moduleLoader) {
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          moduleLoader().then(() => {
            prefetchedRoutes.add(route);
          }).catch(() => {
            // Silently fail - prefetch is optional
          });
        }, { timeout: 2000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          moduleLoader().then(() => {
            prefetchedRoutes.add(route);
          }).catch(() => {});
        }, 100);
      }
    }
  }, []);

  const prefetchRelatedRoutes = useCallback(() => {
    const currentPath = location.pathname;
    const related = relatedRoutes[currentPath] || [];
    
    related.forEach(route => {
      prefetchRoute(route);
    });
  }, [location.pathname, prefetchRoute]);

  useEffect(() => {
    // Wait a bit before prefetching to not interfere with current page load
    const timer = setTimeout(prefetchRelatedRoutes, 1000);
    return () => clearTimeout(timer);
  }, [prefetchRelatedRoutes]);

  // Expose manual prefetch function for hover events
  return { prefetchRoute };
}

// Hook for link hover prefetching
export function useLinkPrefetch(to: string) {
  const { prefetchRoute } = usePrefetchRoutes();
  
  const handleMouseEnter = useCallback(() => {
    prefetchRoute(to);
  }, [to, prefetchRoute]);

  return { onMouseEnter: handleMouseEnter };
}
