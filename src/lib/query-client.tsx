import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

// Query keys factory
export const queryKeys = {
  all: ['finance-hub'] as const,
  
  // Contas a Pagar
  contasPagar: {
    all: () => [...queryKeys.all, 'contas-pagar'] as const,
    lists: () => [...queryKeys.contasPagar.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.contasPagar.lists(), filters] as const,
    details: () => [...queryKeys.contasPagar.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.contasPagar.details(), id] as const,
    totals: () => [...queryKeys.contasPagar.all(), 'totals'] as const,
    overdue: () => [...queryKeys.contasPagar.all(), 'overdue'] as const,
    upcoming: (days: number) => [...queryKeys.contasPagar.all(), 'upcoming', days] as const,
  },

  // Contas a Receber
  contasReceber: {
    all: () => [...queryKeys.all, 'contas-receber'] as const,
    lists: () => [...queryKeys.contasReceber.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.contasReceber.lists(), filters] as const,
    details: () => [...queryKeys.contasReceber.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.contasReceber.details(), id] as const,
    totals: () => [...queryKeys.contasReceber.all(), 'totals'] as const,
    overdue: () => [...queryKeys.contasReceber.all(), 'overdue'] as const,
    upcoming: (days: number) => [...queryKeys.contasReceber.all(), 'upcoming', days] as const,
  },

  // Fornecedores
  fornecedores: {
    all: () => [...queryKeys.all, 'fornecedores'] as const,
    lists: () => [...queryKeys.fornecedores.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.fornecedores.lists(), filters] as const,
    details: () => [...queryKeys.fornecedores.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.fornecedores.details(), id] as const,
    stats: () => [...queryKeys.fornecedores.all(), 'stats'] as const,
    search: (query: string) => [...queryKeys.fornecedores.all(), 'search', query] as const,
  },

  // Clientes
  clientes: {
    all: () => [...queryKeys.all, 'clientes'] as const,
    lists: () => [...queryKeys.clientes.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.clientes.lists(), filters] as const,
    details: () => [...queryKeys.clientes.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.clientes.details(), id] as const,
    stats: () => [...queryKeys.clientes.all(), 'stats'] as const,
    search: (query: string) => [...queryKeys.clientes.all(), 'search', query] as const,
  },

  // Dashboard
  dashboard: {
    all: () => [...queryKeys.all, 'dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all(), 'summary'] as const,
    charts: () => [...queryKeys.dashboard.all(), 'charts'] as const,
  },
} as const;

// Invalidation helpers
export const invalidateQueries = {
  contasPagar: () => queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all() }),
  contasReceber: () => queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all() }),
  fornecedores: () => queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all() }),
  clientes: () => queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all() }),
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() }),
  all: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
};
