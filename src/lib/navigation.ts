/**
 * Metadados de navegação do app — fonte única para breadcrumbs,
 * título de página, resolução de "voltar/subir nível" e labels de rotas.
 */
import type { AppRole } from '@/hooks/useAuth';

export interface RouteMeta {
  label: string;
  /** Pai explícito quando o strip de segmento não resolve (ex.: /usuarios → /configuracoes). */
  parent?: string;
  /**
   * Papéis exigidos pelo ProtectedRoute da rota (espelho de App.tsx —
   * manter em sincronia). Usado para não gravar em "recentes" uma rota
   * que a autorização vai recusar.
   */
  requiredRoles?: AppRole[];
  /**
   * Rótulos por valor do parâmetro final da rota (ex.: abas na URL).
   * Sem ele, /rota/:tab anuncia o mesmo label do pai.
   */
  tabLabels?: Record<string, string>;
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
  '/admin/api': { label: 'API', parent: '/configuracoes', requiredRoles: ['admin'] },
  '/admin/auditoria-ia': {
    label: 'Auditoria de IA',
    parent: '/configuracoes',
    requiredRoles: ['admin', 'financeiro'],
  },
  '/admin/bloat-monitor': {
    label: 'Monitor de Bundle',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/admin/campos-customizados': {
    label: 'Campos Customizados',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/admin/compliance': { label: 'Compliance', parent: '/configuracoes', requiredRoles: ['admin'] },
  '/admin/edge-health': {
    label: 'Saúde das Edge Functions',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/admin/filtros-compartilhados': {
    label: 'Filtros Compartilhados',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/admin/insights-ia': {
    label: 'Insights de IA',
    parent: '/configuracoes',
    requiredRoles: ['admin', 'financeiro'],
  },
  '/admin/scim-audit': {
    label: 'Auditoria SCIM',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/admin/sre': { label: 'Centro SRE', parent: '/configuracoes', requiredRoles: ['admin'] },
  '/admin/sso': { label: 'SSO', parent: '/configuracoes', requiredRoles: ['admin'] },
  '/admin/sso-events': { label: 'Eventos SSO', parent: '/configuracoes', requiredRoles: ['admin'] },
  '/admin/sso-jit-events': {
    label: 'Eventos JIT SSO',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/admin/system-health': {
    label: 'Saúde do Sistema',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/admin/telemetria': { label: 'Telemetria', parent: '/configuracoes', requiredRoles: ['admin'] },
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
  '/audit-sso-profile-sync': {
    label: 'Auditoria SSO',
    parent: '/configuracoes',
    requiredRoles: ['admin'],
  },
  '/seguranca': { label: 'Segurança', parent: '/configuracoes' },
  '/demonstrativos': { label: 'Demonstrativos' },
  '/contabilidade': { label: 'Contabilidade & SPED', requiredRoles: ['admin', 'financeiro'] },
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
    meta: {
      label: 'Reforma Tributária',
      parent: '/reforma-tributaria',
      tabLabels: {
        'visao-geral': 'Visão Geral',
        calculadora: 'Calculadora',
        'calcular-tributos': 'Calcular Tributos',
        creditos: 'Créditos',
        'pis-cofins': 'PIS/COFINS',
        regras: 'Regras de Transição',
        simulador: 'Simulador',
      },
    },
  },
  {
    pattern: '/admin/insights-ia/anomalia/:id',
    meta: {
      label: 'Anomalia',
      parent: '/admin/insights-ia',
      requiredRoles: ['admin', 'financeiro'],
    },
  },
];

function matchPattern(pathname: string, pattern: string): boolean {
  const segs = pathname.split('/');
  const psegs = pattern.split('/');
  if (segs.length !== psegs.length) return false;
  return psegs.every((seg, i) => seg.startsWith(':') || seg === segs[i]);
}

/** `/usuarios/` ≡ `/usuarios` — a barra final não muda a rota resolvida. */
function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getRouteMeta(pathname: string): RouteMeta | undefined {
  // O React Router casa rotas sem diferenciar maiúsculas: a consulta
  // aos metadados segue a mesma regra ou /Usuarios perde label/parent.
  const normalized = normalizePathname(pathname).toLowerCase();
  const exact = ROUTE_META[normalized];
  if (exact) return exact;
  for (const { pattern, meta } of PATTERN_ROUTES) {
    if (matchPattern(normalized, pattern)) return meta;
  }
  return undefined;
}

export function getRouteLabel(pathname: string): string {
  const meta = getRouteMeta(pathname);
  if (meta) {
    // Rota com parâmetro final (aba na URL): o item atual é a aba —
    // tabLabels explícito, senão o segmento humanizado, nunca o label
    // do pai duplicado.
    const lastSeg = normalizePathname(pathname).split('/').pop()?.toLowerCase() ?? '';
    if (meta.tabLabels) {
      // hasOwnProperty: o segmento vem da URL e `__proto__` retornaria um
      // objeto herdado em vez de rótulo (derruba o header móvel).
      return Object.prototype.hasOwnProperty.call(meta.tabLabels, lastSeg)
        ? meta.tabLabels[lastSeg]
        : lastSeg.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    }
    return meta.label;
  }
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

  let candidate = normalizePathname(pathname);
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
// Entradas truncadas por um POP para trás, na ordem em que o Avançar
// nativo as revisitária (topo = próxima). Um POP cuja key é o topo daqui
// é um avanço: a entrada é restaurada em vez de reiniciar a pilha.
const forwardStack: NavEntry[] = [];
let navStackVersion = 0;
const navStackListeners = new Set<() => void>();

function notifyNavStack(): void {
  navStackVersion++;
  navStackListeners.forEach((l) => l());
}

/** Assinatura reativa da pilha (useSyncExternalStore). */
export function subscribeNavStack(listener: () => void): () => void {
  navStackListeners.add(listener);
  return () => {
    navStackListeners.delete(listener);
  };
}

export function getNavStackVersion(): number {
  return navStackVersion;
}

/** Reseta a pilha (cruzar rota excluída, testes). */
export function resetNavStack(): void {
  if (navStack.length === 0 && forwardStack.length === 0) return;
  navStack.length = 0;
  forwardStack.length = 0;
  notifyNavStack();
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
      // POP para trás: guarda as entradas truncadas para um eventual
      // Avançar nativo (revertidas — topo = próxima a revisitar).
      const removed = navStack.splice(idx + 1);
      forwardStack.push(...removed.reverse());
      notifyNavStack();
      return;
    }
    const forward = forwardStack[forwardStack.length - 1];
    if (forward?.key === entry.key) {
      // Avançar nativo sobre entrada truncada: restaura sem perder o
      // anterior real (ex.: A→B, Voltar, Avançar — Voltar volta a B).
      forwardStack.pop();
      navStack.push(entry);
      notifyNavStack();
      return;
    }
    // POP para chave desconhecida (ex.: Voltar nativo após reload): a
    // pilha em memória não sabe a direção — empilhar produziria um
    // "anterior" que na verdade está à frente no histórico. Reinicia.
    navStack.length = 0;
    forwardStack.length = 0;
    navStack.push(entry);
    notifyNavStack();
    return;
  } else if (type === 'REPLACE' && navStack.length > 0) {
    // replaceState não descarta as entradas à frente do browser: o
    // forwardStack continua válido e o Avançar até ele restaura a pilha.
    navStack[navStack.length - 1] = entry;
    notifyNavStack();
    return;
  }
  // PUSH ou REPLACE sem pilha: descarta o avanço registrado — o
  // histórico à frente do browser foi invalidado pela nova entrada.
  forwardStack.length = 0;
  navStack.push(entry);
  notifyNavStack();
}

/** Rotas públicas cujo path carrega segredo (token de convite/contador). */
const SENSITIVE_ROUTE_PREFIXES = ['/contador/', '/convite/'];

export function isSensitiveRoute(pathname: string): boolean {
  // O React Router casa rotas sem diferenciar maiúsculas — /Convite/x
  // alcança o fluxo público igual a /convite/x e o token não pode vazar
  // no document.title nem nos itens recentes.
  const path = pathname.toLowerCase();
  return SENSITIVE_ROUTE_PREFIXES.some((p) => path.startsWith(p));
}

/** Entrada in-app anterior à atual, se existir. */
export function previousNavEntry(): NavEntry | undefined {
  return navStack.length > 1 ? navStack[navStack.length - 2] : undefined;
}
