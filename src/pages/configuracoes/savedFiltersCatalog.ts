/**
 * Catálogo central de módulos que possuem presets de filtros/colunas salvos.
 * Mantém em sincronia com instâncias de useManagedFilters / useSavedFilters em todo o app.
 *
 * Este arquivo é a fonte única de verdade para:
 *  - /configuracoes/filtros-salvos (diagnóstico de hidratação)
 *  - /configuracoes/preferencias  (gestão de presets salvos por módulo)
 */
export interface FilterCatalogEntry {
  /** Chave usada na coluna saved_filters.entity_type. */
  entityType: string;
  /** Rótulo exibido ao usuário. */
  label: string;
  /** Agrupamento exibido ao usuário (ex.: "Cadastros", "Financeiro"). */
  area: string;
  /** Rota da tela onde o preset é aplicado. */
  route: string;
  /** Chave do localStorage espelho (opcional). */
  localStorageKey?: string;
  /** Campos esperados em filters.payload — apenas informativo. */
  defaultsKeys: string[];
  /**
   * Marca entradas descobertas em runtime (Supabase ou localStorage) que ainda
   * não foram catalogadas manualmente. Permite que novas telas com
   * `useManagedFilters` apareçam em /configuracoes/filtros-salvos sem edição.
   */
  auto?: boolean;
}

export const SAVED_FILTERS_CATALOG: FilterCatalogEntry[] = [
  {
    entityType: 'clientes',
    label: 'Clientes',
    area: 'Cadastros',
    route: '/clientes',
    localStorageKey: 'clientes-filters',
    defaultsKeys: ['search', 'status', 'estado', 'score'],
  },
  {
    entityType: 'fornecedores',
    label: 'Fornecedores',
    area: 'Cadastros',
    route: '/fornecedores',
    localStorageKey: 'fornecedores-filters',
    defaultsKeys: ['search', 'status', 'estado'],
  },
  {
    entityType: 'audit-logs',
    label: 'Logs de Auditoria',
    area: 'Administração',
    route: '/audit-logs',
    localStorageKey: 'audit-logs-filters',
    defaultsKeys: ['search', 'action', 'table', 'user'],
  },
  {
    entityType: 'lancamentos-contabeis',
    label: 'Lançamentos Contábeis',
    area: 'Contabilidade',
    route: '/contabilidade',
    localStorageKey: 'app-lancamentos-filters',
    defaultsKeys: ['busca', 'preset', 'dataInicio', 'dataFim'],
  },
  {
    entityType: 'razao-diario',
    label: 'Razão & Diário',
    area: 'Contabilidade',
    route: '/contabilidade',
    localStorageKey: 'app-razao-diario-filters',
    defaultsKeys: ['modo', 'preset', 'dataInicio', 'dataFim', 'contaId', 'busca'],
  },
  {
    entityType: 'auditoria-ia',
    label: 'Auditoria IA',
    area: 'Administração',
    route: '/admin/auditoria-ia',
    localStorageKey: 'app-auditoria-ia-filters',
    defaultsKeys: ['userFilter', 'cnpjFilter', 'transacaoFilter', 'acaoFilter'],
  },
  {
    entityType: 'sso-jit-events',
    label: 'SSO JIT Events',
    area: 'Administração',
    route: '/admin/sso-jit',
    localStorageKey: 'app-sso-jit-filters',
    defaultsKeys: [
      'dateRange',
      'search',
      'providerFilter',
      'roleFilter',
      'viaFilter',
      'originFilter',
    ],
  },
  {
    entityType: 'dashboard-receber',
    label: 'Dashboard Receber',
    area: 'Financeiro',
    route: '/dashboard-receber',
    localStorageKey: 'app-dashboard-receber-filters',
    defaultsKeys: [
      'empresaId',
      'vendedorId',
      'ramoAtividade',
      'statusFilter',
      'clienteId',
      'periodo',
      'dataInicio',
      'dataFim',
    ],
  },
  {
    entityType: 'expert-history',
    label: 'Histórico do Expert',
    area: 'IA',
    route: '/expert',
    localStorageKey: 'app-expert-history-filters',
    defaultsKeys: ['searchQuery', 'dateFilter'],
  },
];

export function findCatalogEntry(entityType: string): FilterCatalogEntry | undefined {
  return SAVED_FILTERS_CATALOG.find((e) => e.entityType === entityType);
}

/**
 * Heurística para inferir uma chave razoável de localStorage a partir do
 * entityType, alinhada à convenção usada por `useManagedFilters` em todo o
 * app (`<entityType>-filters` ou `app-<entityType>-filters`). Usada quando
 * descobrimos uma entityType que ainda não foi catalogada.
 */
export function guessLocalStorageKey(entityType: string): string {
  // Convenção mais comum nas telas atuais
  return `app-${entityType}-filters`;
}

/**
 * Converte um entityType desconhecido em uma entrada de catálogo "auto",
 * com label legível derivado do próprio entityType.
 */
export function buildAutoEntry(
  entityType: string,
  opts: { localStorageKey?: string } = {},
): FilterCatalogEntry {
  const label = entityType
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return {
    entityType,
    label,
    area: 'Descobertas',
    route: '/configuracoes/filtros-salvos',
    localStorageKey: opts.localStorageKey ?? guessLocalStorageKey(entityType),
    defaultsKeys: [],
    auto: true,
  };
}

/**
 * Varre o localStorage do navegador procurando chaves que sigam a convenção
 * de `useManagedFilters` (`<algo>-filters` ou `app-<algo>-filters`) e
 * devolve um mapa { entityType → localStorageKey } para mesclar no catálogo.
 *
 * SSR-safe: retorna mapa vazio quando `window` é indefinido.
 */
export function discoverLocalStorageEntities(): Map<string, string> {
  const result = new Map<string, string>();
  if (typeof window === 'undefined') return result;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      // Padrões aceitos: "foo-filters" e "app-foo-filters"
      const match = key.match(/^(?:app-)?([a-z0-9][a-z0-9-]*)-filters$/i);
      if (!match) continue;
      const entityType = match[1];
      // Valida que é um payload usável (filters obj) — ignora lixo
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) ?? 'null');
        if (parsed && typeof parsed === 'object') result.set(entityType, key);
      } catch {
        // chave não-JSON: ignora
      }
    }
  } catch {
    // localStorage indisponível (Safari privado, quota, etc.)
  }
  return result;
}

/**
 * Mescla o catálogo central com `entityType`s descobertos em runtime
 * (Supabase + localStorage). Entradas catalogadas têm precedência;
 * desconhecidas viram `auto: true` com área "Descobertas".
 */
export function mergeWithDiscovered(
  remoteEntityTypes: string[],
  localKeysByEntity: Map<string, string>,
): FilterCatalogEntry[] {
  const known = new Set(SAVED_FILTERS_CATALOG.map((e) => e.entityType));
  const merged: FilterCatalogEntry[] = [...SAVED_FILTERS_CATALOG];

  const candidates = new Set<string>([
    ...remoteEntityTypes,
    ...localKeysByEntity.keys(),
  ]);

  for (const entityType of candidates) {
    if (known.has(entityType)) continue;
    merged.push(
      buildAutoEntry(entityType, {
        localStorageKey: localKeysByEntity.get(entityType),
      }),
    );
    known.add(entityType);
  }
  return merged;
}
