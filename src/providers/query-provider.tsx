import React, { ReactNode, useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  DefaultOptions,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';

// Default query options
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache time: 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && 'status' in error) {
        const status = (error as Error & { status: number }).status;
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
  },
  mutations: {
    retry: false,
  },
};

// Error handler for queries
function handleQueryError(error: Error): void {
  console.error('Query error:', error);

  // Check for specific error types
  if (error.message.includes('Network')) {
    toast.error('Erro de conexão. Verifique sua internet.');
  } else if (error.message.includes('timeout')) {
    toast.error('A requisição demorou muito. Tente novamente.');
  } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    toast.error('Sessão expirada. Faça login novamente.');
    // Optionally redirect to login
    // window.location.href = '/login';
  } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
    toast.error('Você não tem permissão para esta ação.');
  } else if (error.message.includes('404') || error.message.includes('Not Found')) {
    toast.error('Recurso não encontrado.');
  } else if (error.message.includes('500')) {
    toast.error('Erro interno do servidor. Tente novamente mais tarde.');
  }
}

// Error handler for mutations
function handleMutationError(error: Error): void {
  console.error('Mutation error:', error);
  
  // Show error toast
  const message = error.message || 'Ocorreu um erro ao processar sua solicitação.';
  toast.error(message);
}

// Success handler for mutations
function handleMutationSuccess(data: unknown, variables: unknown, context: unknown): void {
  // Log successful mutations in development
  if (import.meta.env.DEV) {
    console.debug('Mutation success:', { data, variables, context });
  }
}

/**
 * Create a configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
    queryCache: new QueryCache({
      onError: handleQueryError,
    }),
    mutationCache: new MutationCache({
      onError: handleMutationError,
      onSuccess: handleMutationSuccess,
    }),
  });
}

interface QueryProviderProps {
  children: ReactNode;
  client?: QueryClient;
}

/**
 * Query Provider Component
 * Wraps the application with React Query context
 */
export function QueryProvider({ children, client }: QueryProviderProps): JSX.Element {
  // Create a stable query client instance
  const [queryClient] = useState(() => client || createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

// Singleton instance for use outside of React
let globalQueryClient: QueryClient | null = null;

/**
 * Get the global query client instance
 * Creates one if it doesn't exist
 */
export function getQueryClient(): QueryClient {
  if (!globalQueryClient) {
    globalQueryClient = createQueryClient();
  }
  return globalQueryClient;
}

/**
 * Invalidate queries by key
 */
export function invalidateQueries(queryKey: string | string[]): void {
  const client = getQueryClient();
  client.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
}

/**
 * Prefetch query data
 */
export async function prefetchQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  staleTime?: number
): Promise<void> {
  const client = getQueryClient();
  await client.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
}

/**
 * Set query data directly
 */
export function setQueryData<T>(queryKey: string[], data: T): void {
  const client = getQueryClient();
  client.setQueryData(queryKey, data);
}

/**
 * Get query data from cache
 */
export function getQueryData<T>(queryKey: string[]): T | undefined {
  const client = getQueryClient();
  return client.getQueryData<T>(queryKey);
}

/**
 * Remove query from cache
 */
export function removeQuery(queryKey: string[]): void {
  const client = getQueryClient();
  client.removeQueries({ queryKey });
}

/**
 * Clear all queries from cache
 */
export function clearQueries(): void {
  const client = getQueryClient();
  client.clear();
}

/**
 * Reset queries to initial state
 */
export function resetQueries(queryKey?: string[]): void {
  const client = getQueryClient();
  if (queryKey) {
    client.resetQueries({ queryKey });
  } else {
    client.resetQueries();
  }
}

// Query key factory helpers
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (period?: string) => ['dashboard', 'stats', period] as const,
    transactions: (limit?: number) => ['dashboard', 'transactions', limit] as const,
    upcoming: () => ['dashboard', 'upcoming'] as const,
    overdue: () => ['dashboard', 'overdue'] as const,
  },
  
  // Contas a Pagar
  contasPagar: {
    all: ['contas-pagar'] as const,
    list: (filters?: Record<string, unknown>) => ['contas-pagar', 'list', filters] as const,
    detail: (id: string) => ['contas-pagar', 'detail', id] as const,
    stats: () => ['contas-pagar', 'stats'] as const,
  },
  
  // Contas a Receber
  contasReceber: {
    all: ['contas-receber'] as const,
    list: (filters?: Record<string, unknown>) => ['contas-receber', 'list', filters] as const,
    detail: (id: string) => ['contas-receber', 'detail', id] as const,
    stats: () => ['contas-receber', 'stats'] as const,
  },
  
  // Clientes
  clientes: {
    all: ['clientes'] as const,
    list: (filters?: Record<string, unknown>) => ['clientes', 'list', filters] as const,
    detail: (id: string) => ['clientes', 'detail', id] as const,
    search: (term: string) => ['clientes', 'search', term] as const,
  },
  
  // Fornecedores
  fornecedores: {
    all: ['fornecedores'] as const,
    list: (filters?: Record<string, unknown>) => ['fornecedores', 'list', filters] as const,
    detail: (id: string) => ['fornecedores', 'detail', id] as const,
    search: (term: string) => ['fornecedores', 'search', term] as const,
    categorias: () => ['fornecedores', 'categorias'] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    summary: (filters?: Record<string, unknown>) => ['reports', 'summary', filters] as const,
    cashFlow: (filters?: Record<string, unknown>) => ['reports', 'cashFlow', filters] as const,
    aging: (type: string) => ['reports', 'aging', type] as const,
  },
  
  // User
  user: {
    current: () => ['user', 'current'] as const,
    profile: () => ['user', 'profile'] as const,
    preferences: () => ['user', 'preferences'] as const,
  },
};

export default QueryProvider;
