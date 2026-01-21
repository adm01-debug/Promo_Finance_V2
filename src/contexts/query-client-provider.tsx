import { ReactNode, useState } from 'react';
import { 
  QueryClient, 
  QueryClientProvider as TanstackQueryClientProvider,
  MutationCache,
  QueryCache,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';

// Error handler
function handleError(error: unknown): void {
  console.error('Query Error:', error);
  
  const message = error instanceof Error 
    ? error.message 
    : 'Ocorreu um erro inesperado';

  // Don't show toast for canceled queries
  if (error instanceof Error && error.name === 'CanceledError') {
    return;
  }

  toast.error('Erro', {
    description: message,
  });
}

// Success handler for mutations
function handleMutationSuccess(data: unknown, variables: unknown, context: unknown, mutation: unknown): void {
  // Can add global success handling here
  console.log('Mutation successful', { data, variables, context, mutation });
}

// Create query client
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: how long data is considered fresh
        staleTime: 1000 * 60 * 5, // 5 minutes
        
        // Cache time: how long to keep inactive data in cache
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        
        // Network mode
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry configuration for mutations
        retry: 1,
        retryDelay: 1000,
        
        // Network mode
        networkMode: 'offlineFirst',
      },
    },
    queryCache: new QueryCache({
      onError: handleError,
    }),
    mutationCache: new MutationCache({
      onError: handleError,
      onSuccess: handleMutationSuccess,
    }),
  });
}

// Provider props
interface QueryClientProviderProps {
  children: ReactNode;
  showDevtools?: boolean;
}

// Provider component
export function QueryClientProvider({ 
  children,
  showDevtools = process.env.NODE_ENV === 'development',
}: QueryClientProviderProps) {
  // Create query client only once
  const [queryClient] = useState(() => createQueryClient());

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {showDevtools && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </TanstackQueryClientProvider>
  );
}

// Export query client for use outside of components
let globalQueryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!globalQueryClient) {
    globalQueryClient = createQueryClient();
  }
  return globalQueryClient;
}

// Utility functions for query keys
export const queryKeys = {
  // Contas a Pagar
  contasPagar: {
    all: ['contas-pagar'] as const,
    lists: () => [...queryKeys.contasPagar.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.contasPagar.lists(), filters] as const,
    details: () => [...queryKeys.contasPagar.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contasPagar.details(), id] as const,
    stats: () => [...queryKeys.contasPagar.all, 'stats'] as const,
  },

  // Contas a Receber
  contasReceber: {
    all: ['contas-receber'] as const,
    lists: () => [...queryKeys.contasReceber.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.contasReceber.lists(), filters] as const,
    details: () => [...queryKeys.contasReceber.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contasReceber.details(), id] as const,
    stats: () => [...queryKeys.contasReceber.all, 'stats'] as const,
  },

  // Clientes
  clientes: {
    all: ['clientes'] as const,
    lists: () => [...queryKeys.clientes.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.clientes.lists(), filters] as const,
    details: () => [...queryKeys.clientes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clientes.details(), id] as const,
    search: (query: string) => [...queryKeys.clientes.all, 'search', query] as const,
  },

  // Fornecedores
  fornecedores: {
    all: ['fornecedores'] as const,
    lists: () => [...queryKeys.fornecedores.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.fornecedores.lists(), filters] as const,
    details: () => [...queryKeys.fornecedores.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.fornecedores.details(), id] as const,
    search: (query: string) => [...queryKeys.fornecedores.all, 'search', query] as const,
  },

  // Categorias
  categorias: {
    all: ['categorias'] as const,
    lists: () => [...queryKeys.categorias.all, 'list'] as const,
    byType: (type: 'receita' | 'despesa') => 
      [...queryKeys.categorias.lists(), { type }] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    charts: () => [...queryKeys.dashboard.all, 'charts'] as const,
    recentTransactions: () => [...queryKeys.dashboard.all, 'recent-transactions'] as const,
    upcomingPayments: () => [...queryKeys.dashboard.all, 'upcoming-payments'] as const,
  },

  // Relatórios
  relatorios: {
    all: ['relatorios'] as const,
    fluxoCaixa: (params: Record<string, unknown>) => 
      [...queryKeys.relatorios.all, 'fluxo-caixa', params] as const,
    dre: (params: Record<string, unknown>) => 
      [...queryKeys.relatorios.all, 'dre', params] as const,
    porCategoria: (params: Record<string, unknown>) => 
      [...queryKeys.relatorios.all, 'por-categoria', params] as const,
  },

  // User
  user: {
    current: ['user', 'current'] as const,
    preferences: ['user', 'preferences'] as const,
  },
};

// Prefetch utilities
export async function prefetchDashboard(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: () => fetch('/api/dashboard/stats').then((r) => r.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.recentTransactions(),
      queryFn: () => fetch('/api/dashboard/recent-transactions').then((r) => r.json()),
    }),
  ]);
}

// Invalidation utilities
export function invalidateContasPagar(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.contasPagar.all,
  });
}

export function invalidateContasReceber(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.contasReceber.all,
  });
}

export function invalidateDashboard(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.all,
  });
}

export function invalidateAll(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries();
}

export default QueryClientProvider;
