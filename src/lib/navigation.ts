/**
 * Metadados de navegação do app — fonte única para breadcrumbs,
 * título de página, resolução de "voltar/subir nível" e labels de rotas.
 */

export interface RouteMeta {
  label: string;
  /** Pai explícito quando o strip de segmento não resolve (ex.: /usuarios → /configuracoes). */
  parent?: string;
}

/** Rotas exatas com metadados. Rotas públicas/dev ficam de fora propositalmente. */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/': { label: 'Dashboard' },
  '/dashboard': { label: 'Dashboard', parent: '/' },
  '/dashboard-receber': { label: 'Dashboard Receber' },
  '/dashboard-empresa': { label: 'Dashboard Empresa' },
  '/bi': { label: 'BI Analytics' },
  '/contas-pagar': { label: 'Contas a Pagar' },
  '/contas-pagar/bloqueios': { label: 'Bloqueios', parent: '/contas-pagar' },
  '/contas-receber': { label: 'Contas a Receber' },
  '/notas-fiscais': { label: 'Notas Fiscais' },
  '/fluxo-caixa': { label: 'Fluxo de Caixa' },
  '/relatorios': { label: 'Relatórios' },
  '/expert': { label: 'Expert IA' },
  '/conciliacao': { label: 'Conciliação' },
  '/cobrancas': { label: 'Cobranças' },
  '/boletos': { label: 'Boletos' },
  '/financeiro': { label: 'Financeiro' },
  '/clientes': { label: 'Clientes' },
  '/clientes/portal-tokens': { label: 'Tokens do Portal', parent: '/clientes' },
  '/clientes/scoring': { label: 'Scoring de Clientes', parent: '/clientes' },
  '/fornecedores': { label: 'Fornecedores' },
  '/empresas': { label: 'Empresas' },
  '/organizacoes': { label: 'Organizações' },
  '/contas-bancarias': { label: 'Contas Bancárias' },
  '/centro-custos': { label: 'Centros de Custo' },
  '/categorias': { label: 'Categorias' },
  '/movimentacoes': { label: 'Movimentações' },
  '/tesouraria': { label: 'Tesouraria' },
  '/metas': { label: 'Metas' },
  '/orcamentos': { label: 'Orçamentos' },
  '/orcamento-evento': { label: 'Orçamento de Evento' },
  '/contratos': { label: 'Contratos' },
  '/compras': { label: 'Compras' },
  '/vendedores': { label: 'Vendedores' },
  '/pix-hub': { label: 'Hub PIX' },
  '/comprovante-ocr': { label: 'OCR de Comprovantes' },
  '/assinatura-digital': { label: 'Assinatura Digital' },
  '/simulador-antecipacao': { label: 'Simulador de Antecipação' },
  '/pagamentos-recorrentes': { label: 'Pagamentos Recorrentes' },
  '/benchmarking': { label: 'Benchmarking' },
  '/inteligencia': { label: 'Inteligência' },
  '/reforma-tributaria': { label: 'Reforma Tributária' },
  '/tributario': { label: 'Tributário' },
  '/tributario/arquitetura': { label: 'Arquitetura Tributária', parent: '/tributario' },
  '/tributario/auditoria': { label: 'Auditoria Tributária', parent: '/tributario' },
  '/tributario/auditoria-overlay': { label: 'Auditoria Overlay', parent: '/tributario' },
  '/tributario/calculadora': { label: 'Calculadora Tributária', parent: '/tributario' },
  '/tributario/cashback': { label: 'Cashback', parent: '/tributario' },
  '/tributario/catalogos-fiscais': { label: 'Catálogos Fiscais', parent: '/tributario' },
  '/tributario/certificados-digitais': { label: 'Certificados Digitais', parent: '/tributario' },
  '/tributario/comparativo': { label: 'Comparativo de Regimes', parent: '/tributario' },
  '/tributario/comparativo-conformidade': {
    label: 'Comparativo de Conformidade',
    parent: '/tributario',
  },
  '/tributario/conciliacao': { label: 'Conciliação Tributária', parent: '/tributario' },
  '/tributario/darf': { label: 'DARF', parent: '/tributario' },
  '/tributario/dashboard': { label: 'Dashboard Tributário', parent: '/tributario' },
  '/tributario/fechamento-mensal': { label: 'Fechamento Mensal', parent: '/tributario' },
  '/tributario/folha-encargos': { label: 'Folha e Encargos', parent: '/tributario' },
  '/tributario/glossario': { label: 'Glossário', parent: '/tributario' },
  '/tributario/historico-financeiro': { label: 'Histórico Financeiro', parent: '/tributario' },
  '/tributario/icms-st': { label: 'ICMS-ST', parent: '/tributario' },
  '/tributario/importacao-xml': { label: 'Importação de XML', parent: '/tributario' },
  '/tributario/incentivos': { label: 'Incentivos Fiscais', parent: '/tributario' },
  '/tributario/ipi-iss': { label: 'IPI/ISS', parent: '/tributario' },
  '/tributario/irpj-csll': { label: 'IRPJ/CSLL', parent: '/tributario' },
  '/tributario/monofasico': { label: 'Monofásico', parent: '/tributario' },
  '/tributario/nfe-recebidas': { label: 'NF-e Recebidas', parent: '/tributario' },
  '/tributario/obrigacoes': { label: 'Obrigações', parent: '/tributario' },
  '/tributario/observabilidade-digest': {
    label: 'Digest de Observabilidade',
    parent: '/tributario',
  },
  '/tributario/onboarding': { label: 'Onboarding Tributário', parent: '/tributario' },
  '/tributario/oportunidades-elisao': { label: 'Oportunidades de Economia', parent: '/tributario' },
  '/tributario/per-dcomp': { label: 'PER/DCOMP', parent: '/tributario' },
  '/tributario/pf-vinculada': { label: 'PF Vinculada', parent: '/tributario' },
  '/tributario/pis-cofins': { label: 'PIS/COFINS', parent: '/tributario' },
  '/tributario/preferencias-digest': { label: 'Preferências de Digest', parent: '/tributario' },
  '/tributario/projecao-reforma': { label: 'Projeção da Reforma', parent: '/tributario' },
  '/tributario/recomendacao': { label: 'Recomendações', parent: '/tributario' },
  '/tributario/relatorios-contabeis': { label: 'Relatórios Contábeis', parent: '/tributario' },
  '/tributario/retencoes': { label: 'Retenções', parent: '/tributario' },
  '/tributario/sefaz-observabilidade': { label: 'Observabilidade SEFAZ', parent: '/tributario' },
  '/tributario/simulacao-regimes': { label: 'Simulação de Regimes', parent: '/tributario' },
  '/tributario/sped': { label: 'SPED', parent: '/tributario' },
  '/tributario/split-payment': { label: 'Split Payment', parent: '/tributario' },
  '/admin/api': { label: 'API', parent: '/configuracoes' },
  '/admin/auditoria-ia': { label: 'Auditoria de IA', parent: '/configuracoes' },
  '/admin/bloat-monitor': { label: 'Monitor de Bundle', parent: '/configuracoes' },
  '/admin/campos-customizados': { label: 'Campos Customizados', parent: '/configuracoes' },
  '/admin/compliance': { label: 'Compliance', parent: '/configuracoes' },
  '/admin/edge-health': { label: 'Saúde das Edge Functions', parent: '/configuracoes' },
  '/admin/filtros-compartilhados': { label: 'Filtros Compartilhados', parent: '/configuracoes' },
  '/admin/insights-ia': { label: 'Insights de IA', parent: '/configuracoes' },
  '/admin/scim-audit': { label: 'Auditoria SCIM', parent: '/configuracoes' },
  '/admin/sre': { label: 'Centro SRE', parent: '/configuracoes' },
  '/admin/sso': { label: 'SSO', parent: '/configuracoes' },
  '/admin/sso-events': { label: 'Eventos SSO', parent: '/configuracoes' },
  '/admin/sso-jit-events': { label: 'Eventos JIT SSO', parent: '/configuracoes' },
  '/admin/system-health': { label: 'Saúde do Sistema', parent: '/configuracoes' },
  '/admin/telemetria': { label: 'Telemetria', parent: '/configuracoes' },
  '/configuracoes': { label: 'Configurações' },
  '/configuracoes/filtros-salvos': { label: 'Filtros Salvos', parent: '/configuracoes' },
  '/configuracoes/notificacoes/historico': {
    label: 'Histórico de Notificações',
    parent: '/configuracoes',
  },
  '/configuracoes/notificacoes/sino': {
    label: 'Central de Notificações',
    parent: '/configuracoes',
  },
  '/configuracoes/preferencias': { label: 'Preferências', parent: '/configuracoes' },
  '/configuracoes/privacidade': { label: 'Privacidade', parent: '/configuracoes' },
  '/usuarios': { label: 'Usuários', parent: '/configuracoes' },
  '/meu-perfil': { label: 'Meu Perfil', parent: '/configuracoes' },
  '/alertas': { label: 'Alertas' },
  '/aprovacoes': { label: 'Aprovações' },
  '/audit-logs': { label: 'Logs de Auditoria', parent: '/configuracoes' },
  '/audit-sso-profile-sync': { label: 'Auditoria SSO', parent: '/configuracoes' },
  '/seguranca': { label: 'Segurança', parent: '/configuracoes' },
  '/demonstrativos': { label: 'Demonstrativos' },
  '/contabilidade': { label: 'Contabilidade & SPED' },
  '/bitrix24': { label: 'Bitrix24', parent: '/integracoes' },
  '/asaas': { label: 'Asaas', parent: '/integracoes' },
  '/bling': { label: 'Bling', parent: '/integracoes' },
  '/integracoes': { label: 'Integrações' },
  '/status': { label: 'Status do Sistema' },
  '/style-guide': { label: 'Style Guide' },
};

/** Rotas com parâmetros — casadas por segmento. */
const PATTERN_ROUTES: Array<{ pattern: string; meta: RouteMeta }> = [
  {
    pattern: '/reforma-tributaria/:tab',
    meta: { label: 'Reforma Tributária', parent: '/reforma-tributaria' },
  },
  {
    pattern: '/admin/insights-ia/anomalia/:id',
    meta: { label: 'Anomalia', parent: '/admin/insights-ia' },
  },
];

function matchPattern(pathname: string, pattern: string): boolean {
  const segs = pathname.split('/');
  const psegs = pattern.split('/');
  if (segs.length !== psegs.length) return false;
  return psegs.every((seg, i) => seg.startsWith(':') || seg === segs[i]);
}

export function getRouteMeta(pathname: string): RouteMeta | undefined {
  const exact = ROUTE_META[pathname];
  if (exact) return exact;
  for (const { pattern, meta } of PATTERN_ROUTES) {
    if (matchPattern(pathname, pattern)) return meta;
  }
  return undefined;
}

export function getRouteLabel(pathname: string): string {
  const meta = getRouteMeta(pathname);
  if (meta) return meta.label;
  // Fallback: último segmento legível
  const last = pathname.split('/').filter(Boolean).pop() ?? 'dashboard';
  return last.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function isKnownRoute(pathname: string): boolean {
  return getRouteMeta(pathname) !== undefined;
}

/**
 * Sobe um nível na hierarquia do app: meta.parent explícito, depois
 * strip de segmento até uma rota conhecida, senão Dashboard.
 */
export function resolveParentRoute(pathname: string): string {
  const meta = getRouteMeta(pathname);
  if (meta?.parent) return meta.parent;

  let candidate = pathname;
  while (candidate !== '/') {
    const idx = candidate.lastIndexOf('/');
    candidate = idx <= 0 ? '/' : candidate.slice(0, idx);
    if (candidate === '/' || isKnownRoute(candidate)) return candidate;
  }
  return '/';
}

/* ------------------------------------------------------------------ */
/* Pilha de navegação in-app — alimentada pelo NavigationTracker.       */
/* Garante que "Voltar" só usa navigate(-1) quando a entrada anterior   */
/* é conhecida e interna; caso contrário sobe para a rota-pai.          */
/* ------------------------------------------------------------------ */

export interface NavEntry {
  key: string;
  pathname: string;
  search: string;
}

const navStack: NavEntry[] = [];

/** Reseta a pilha (usado em testes). */
export function resetNavStack(): void {
  navStack.length = 0;
}

/**
 * Registra uma mudança de localização. `type` vem de useNavigationType().
 * Em POP, trunca a pilha até a entrada com a mesma location.key (a key é
 * estável entre idas e voltas do histórico do browser).
 */
export function recordNavEntry(entry: NavEntry, type: 'POP' | 'PUSH' | 'REPLACE'): void {
  const top = navStack[navStack.length - 1];
  if (top?.key === entry.key) return; // StrictMode/remount: mesma location
  if (type === 'POP') {
    const idx = navStack.findIndex((e) => e.key === entry.key);
    if (idx >= 0) {
      navStack.length = idx + 1;
      return;
    }
  } else if (type === 'REPLACE' && navStack.length > 0) {
    navStack[navStack.length - 1] = entry;
    return;
  }
  // PUSH, REPLACE sem pilha, ou POP para entrada desconhecida
  navStack.push(entry);
}

/** Entrada in-app anterior à atual, se existir. */
export function previousNavEntry(): NavEntry | undefined {
  return navStack.length > 1 ? navStack[navStack.length - 2] : undefined;
}
