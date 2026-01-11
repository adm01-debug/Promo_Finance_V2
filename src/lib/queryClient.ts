import { QueryClient } from '@tanstack/react-query';

// ============================================
// QUERY CLIENT OTIMIZADO
// Configurações globais para melhor performance
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados são considerados frescos por 2 minutos
      staleTime: 2 * 60 * 1000,
      // Cache é mantido por 10 minutos após a última referência
      gcTime: 10 * 60 * 1000,
      // Retry com backoff exponencial
      retry: (failureCount, error: unknown) => {
        // Não retry em erros 4xx
        const httpError = error as { status?: number };
        if (httpError?.status && httpError.status >= 400 && httpError.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch automático
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Placeholder data para melhor UX
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// ============================================
// STALE TIMES POR TIPO DE DADOS
// ============================================
export const STALE_TIMES = {
  // Dados que mudam raramente (10 min)
  static: 10 * 60 * 1000,
  // Dados de configuração (5 min)
  config: 5 * 60 * 1000,
  // Dados financeiros (2 min)
  financial: 2 * 60 * 1000,
  // Dados em tempo real (30 seg)
  realtime: 30 * 1000,
  // Dados de dashboard (1 min)
  dashboard: 60 * 1000,
} as const;

// ============================================
// GC TIMES (Cache Time)
// ============================================
export const GC_TIMES = {
  // Dados estáticos ficam em cache por 30 min
  static: 30 * 60 * 1000,
  // Dados normais por 10 min
  normal: 10 * 60 * 1000,
  // Dados voláteis por 5 min
  volatile: 5 * 60 * 1000,
} as const;

// ============================================
// HELPER PARA CRIAR QUERY OPTIONS
// ============================================
export function createQueryOptions<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return {
    queryKey,
    queryFn,
    staleTime: options?.staleTime ?? STALE_TIMES.financial,
    gcTime: options?.gcTime ?? GC_TIMES.normal,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  };
}

// ============================================
// BATCH INVALIDATION
// ============================================
export function batchInvalidate(
  client: QueryClient,
  queryKeys: readonly unknown[][]
) {
  queryKeys.forEach(key => {
    client.invalidateQueries({ queryKey: key });
  });
}

// ============================================
// OPTIMISTIC UPDATE HELPER
// ============================================
export function createOptimisticUpdate<TData, TVariables>(
  queryKey: readonly unknown[],
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      if (previousData !== undefined) {
        queryClient.setQueryData<TData>(queryKey, (old) => 
          updateFn(old, variables)
        );
      }

      return { previousData };
    },
    onError: (
      _err: unknown,
      _variables: TVariables,
      context?: { previousData?: TData }
    ) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  };
}
