import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados são considerados frescos por 2 minutos
      staleTime: 2 * 60 * 1000,
      // Cache é mantido por 10 minutos após a última referência
      gcTime: 10 * 60 * 1000,
      // Retry com backoff exponencial
      retry: (failureCount, error: unknown) => {
        const httpError = error as { status?: number };
        if (httpError?.status && httpError.status >= 400 && httpError.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      // Performance: evita refetch ao remontar quando os dados ainda estão frescos.
      // Combinado com placeholderData abaixo, garante navegação SPA instantânea
      // sem piscar telas de loading entre rotas.
      refetchOnMount: false,
      refetchOnReconnect: true,
      // structuralSharing está ativo por padrão — preserva referências e evita
      // re-renderizações desnecessárias em consumidores que usam selectors.
      placeholderData: (previousData: unknown) => previousData,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});


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

export const GC_TIMES = {
  // Dados estáticos ficam em cache por 30 min
  static: 30 * 60 * 1000,
  // Dados normais por 10 min
  normal: 10 * 60 * 1000,
  // Dados voláteis por 5 min
  volatile: 5 * 60 * 1000,
} as const;

/**
 * Configuração canônica por domínio de negócio.
 * Use `queryConfig('contasPagar')` para obter `{ staleTime, gcTime }` alinhados.
 *
 * Regra:
 * - `realtime` (30s / 5m): dados que precisam refletir mudanças de outros
 *   usuários rapidamente (dashboards, saldos ao vivo, alertas).
 * - `financial` (2m / 10m): default para operações CRUD financeiras.
 * - `config` (5m / 10m): configurações e preferências raramente alteradas.
 * - `static` (10m / 30m): catálogos e listas de referência (categorias,
 *   plano de contas, formas de pagamento).
 */
export const DOMAIN_QUERY_CONFIG = {
  // CRUD financeiro — comportamento default do sistema
  contasPagar:       { staleTime: STALE_TIMES.financial, gcTime: GC_TIMES.normal },
  contasReceber:     { staleTime: STALE_TIMES.financial, gcTime: GC_TIMES.normal },
  boletos:           { staleTime: STALE_TIMES.financial, gcTime: GC_TIMES.normal },
  movimentacoes:     { staleTime: STALE_TIMES.financial, gcTime: GC_TIMES.normal },
  transferencias:    { staleTime: STALE_TIMES.financial, gcTime: GC_TIMES.normal },

  // Cadastros — mudam pouco
  fornecedores:      { staleTime: STALE_TIMES.config,    gcTime: GC_TIMES.normal },
  clientes:          { staleTime: STALE_TIMES.config,    gcTime: GC_TIMES.normal },

  // Realtime — dashboards, saldos, alertas
  dashboard:         { staleTime: STALE_TIMES.dashboard, gcTime: GC_TIMES.volatile },
  saldos:            { staleTime: STALE_TIMES.realtime,  gcTime: GC_TIMES.volatile },
  alertas:           { staleTime: STALE_TIMES.realtime,  gcTime: GC_TIMES.volatile },
  views:             { staleTime: STALE_TIMES.dashboard, gcTime: GC_TIMES.normal },

  // Catálogos estáticos
  categorias:        { staleTime: STALE_TIMES.static,    gcTime: GC_TIMES.static },
  formasPagamento:   { staleTime: STALE_TIMES.static,    gcTime: GC_TIMES.static },
  planoContas:       { staleTime: STALE_TIMES.static,    gcTime: GC_TIMES.static },
  centrosCusto:      { staleTime: STALE_TIMES.static,    gcTime: GC_TIMES.static },

  // Tributário — dados densos, mudam mensalmente
  tributario:        { staleTime: STALE_TIMES.config,    gcTime: GC_TIMES.normal },
  apuracoes:         { staleTime: STALE_TIMES.config,    gcTime: GC_TIMES.normal },
} as const satisfies Record<string, { staleTime: number; gcTime: number }>;

export type QueryDomain = keyof typeof DOMAIN_QUERY_CONFIG;

/** Retorna `{ staleTime, gcTime }` padronizado para o domínio. */
export function queryConfig(domain: QueryDomain): { staleTime: number; gcTime: number } {
  return DOMAIN_QUERY_CONFIG[domain];
}

export function createQueryOptions<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
    refetchInterval?: number;
    domain?: QueryDomain;
  }
) {
  const domainDefaults = options?.domain ? DOMAIN_QUERY_CONFIG[options.domain] : undefined;
  return {
    queryKey,
    queryFn,
    staleTime: options?.staleTime ?? domainDefaults?.staleTime ?? STALE_TIMES.financial,
    gcTime: options?.gcTime ?? domainDefaults?.gcTime ?? GC_TIMES.normal,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  };
}

export function batchInvalidate(
  client: QueryClient,
  queryKeys: readonly unknown[][]
) {
  queryKeys.forEach(key => {
    client.invalidateQueries({ queryKey: key });
  });
}

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

export const queryKeys = {
  all: ['promo-finance'] as const,
  
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

  fornecedores: {
    all: () => [...queryKeys.all, 'fornecedores'] as const,
    lists: () => [...queryKeys.fornecedores.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.fornecedores.lists(), filters] as const,
    details: () => [...queryKeys.fornecedores.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.fornecedores.details(), id] as const,
    stats: () => [...queryKeys.fornecedores.all(), 'stats'] as const,
    search: (query: string) => [...queryKeys.fornecedores.all(), 'search', query] as const,
  },

  clientes: {
    all: () => [...queryKeys.all, 'clientes'] as const,
    lists: () => [...queryKeys.clientes.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.clientes.lists(), filters] as const,
    details: () => [...queryKeys.clientes.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.clientes.details(), id] as const,
    stats: () => [...queryKeys.clientes.all(), 'stats'] as const,
    search: (query: string) => [...queryKeys.clientes.all(), 'search', query] as const,
  },

  dashboard: {
    all: () => [...queryKeys.all, 'dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all(), 'summary'] as const,
    charts: () => [...queryKeys.dashboard.all(), 'charts'] as const,
  },

  views: {
    all: () => ['views'] as const,
    saldos: (empresaId?: string) => [...queryKeys.views.all(), 'saldos-contas', empresaId] as const,
    dre: (empresaId?: string) => [...queryKeys.views.all(), 'dre-mensal', empresaId] as const,
    fluxoCaixa: () => [...queryKeys.views.all(), 'fluxo-caixa'] as const,
    fluxoDiario: (empresaId?: string) => [...queryKeys.views.all(), 'fluxo-caixa-diario', empresaId] as const,
    dsoAging: (empresaId?: string) => [...queryKeys.views.all(), 'dso-aging', empresaId] as const,
    gastosCentroCusto: () => [...queryKeys.views.all(), 'gastos-centro-custo'] as const,
    metricasCobranca: (empresaId?: string) => [...queryKeys.views.all(), 'metricas-cobranca', empresaId] as const,
  },

  movimentacoes: {
    all: () => ['movimentacoes'] as const,
    list: (contaId?: string) => [...queryKeys.movimentacoes.all(), contaId] as const,
  },

  transferencias: {
    all: () => ['transferencias'] as const,
    list: (empresaId?: string) => [...queryKeys.transferencias.all(), empresaId] as const,
  },

  categorias: {
    all: () => ['categorias'] as const,
    byTipo: (tipo?: string) => [...queryKeys.categorias.all(), tipo] as const,
  },

  formasPagamento: {
    all: () => ['formas-pagamento'] as const,
  },

  planoContas: {
    all: () => ['plano-contas'] as const,
  },
} as const;

export const invalidateQueries = {
  contasPagar: () => queryClient.invalidateQueries({ queryKey: queryKeys.contasPagar.all() }),
  contasReceber: () => queryClient.invalidateQueries({ queryKey: queryKeys.contasReceber.all() }),
  fornecedores: () => queryClient.invalidateQueries({ queryKey: queryKeys.fornecedores.all() }),
  clientes: () => queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all() }),
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() }),
  views: () => queryClient.invalidateQueries({ queryKey: queryKeys.views.all() }),
  movimentacoes: () => queryClient.invalidateQueries({ queryKey: queryKeys.movimentacoes.all() }),
  transferencias: () => queryClient.invalidateQueries({ queryKey: queryKeys.transferencias.all() }),
  categorias: () => queryClient.invalidateQueries({ queryKey: queryKeys.categorias.all() }),
  all: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
};
