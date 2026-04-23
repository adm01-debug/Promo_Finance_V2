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
