import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

/**
 * Trava o escopo por empresa do card de duplicidades (DashboardExecutivo.tsx:60-63).
 * A correção que o fez respeitar a empresa selecionada está em produção desde a
 * #355 e não tinha nenhum teste: a regressão — voltar a somar os bloqueios de
 * todas as empresas acessíveis — voltaria sem o CI acusar.
 *
 * O andaime de mocks vem da branch fix/codex-h111911-preserva-c696391 (trabalho
 * de outro agente que nunca foi mergeado). As asserções foram reescritas: a
 * branch travava a abordagem multi-empresa (`empresaIdsAtivos`, `.in()`,
 * queryKey com array) que o `main` NÃO adotou — aqui vale a precedência de
 * empresa única com `.eq()`.
 */

const mockUseAuth = vi.fn();
const mockUseDashboardConfig = vi.fn();
const mockUseDashboardMetrics = vi.fn();
const mockUseQuery = vi.fn();
const selectMock = vi.fn();
const orderMock = vi.fn();
const eqMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('@/hooks/useDashboardConfig', () => ({
  useDashboardConfig: () => mockUseDashboardConfig(),
}));
vi.mock('@/hooks/useDashboardMetrics', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useDashboardMetrics')>(
    '@/hooks/useDashboardMetrics'
  );
  return { ...actual, useDashboardMetrics: () => mockUseDashboardMetrics() };
});
vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return { ...actual, useQuery: (options: unknown) => mockUseQuery(options) };
});

const RESULTADO = { data: [{ valor_bloqueado: 10 }], error: null };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: (...args: unknown[]) => {
        selectMock(...args);
        // `.order()` precisa ser aguardável E ter `.eq()`: o código faz
        // `let query = ...order(...)`, às vezes `query = query.eq(...)`, e
        // depois `await query`.
        const aguardavel = {
          eq: (...eqArgs: unknown[]) => {
            eqMock(...eqArgs);
            return { then: (r: (v: unknown) => unknown) => r(RESULTADO) };
          },
          then: (r: (v: unknown) => unknown) => r(RESULTADO),
        };
        return {
          order: (...orderArgs: unknown[]) => {
            orderMock(...orderArgs);
            return aguardavel;
          },
        };
      },
    }),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/components/dashboard/PrevisaoIA', () => ({ PrevisaoIA: () => <div>PrevisaoIA</div> }));
vi.mock('@/components/dashboard/AlertasPreditivosPanel', () => ({
  AlertasPreditivosPanel: () => <div>AlertasPreditivosPanel</div>,
}));
vi.mock('@/components/dashboard/MetasFinanceirasPanel', () => ({
  MetasFinanceirasPanel: () => <div>MetasFinanceirasPanel</div>,
}));
vi.mock('@/components/dashboard/DashboardConfigDialog', () => ({
  DashboardConfigDialog: () => <div>DashboardConfigDialog</div>,
}));
vi.mock('@/components/dashboard/DashboardSkeleton', () => ({
  DashboardSkeleton: () => <div>DashboardSkeleton</div>,
}));
vi.mock('@/components/dashboard/DashboardFiltersHeader', () => ({
  DashboardFiltersHeader: () => <div>DashboardFiltersHeader</div>,
}));
vi.mock('@/components/dashboard/SecondaryKPICards', () => ({
  SecondaryKPICards: () => <div>SecondaryKPICards</div>,
}));
vi.mock('@/components/dashboard/FluxoCaixaChart', () => ({
  FluxoCaixaChart: () => <div>FluxoCaixaChart</div>,
}));
vi.mock('@/components/dashboard/SaldoPorBancoCard', () => ({
  SaldoPorBancoCard: () => <div>SaldoPorBancoCard</div>,
}));
vi.mock('@/components/dashboard/TopClientesLeaderboard', () => ({
  TopClientesLeaderboard: () => <div>TopClientesLeaderboard</div>,
}));
vi.mock('@/components/dashboard/StatusContasPieChart', () => ({
  StatusContasPieChart: () => <div>StatusContasPieChart</div>,
}));
vi.mock('@/components/dashboard/TopCentrosCustoChart', () => ({
  TopCentrosCustoChart: () => <div>TopCentrosCustoChart</div>,
}));
vi.mock('@/components/dashboard/CentroAcoesInteligentes', () => ({
  CentroAcoesInteligentes: () => <div>CentroAcoesInteligentes</div>,
}));
vi.mock('@/components/dashboard/AlertasOrcamento', () => ({
  AlertasOrcamento: () => <div>AlertasOrcamento</div>,
}));
vi.mock('@/components/dashboard/AlertasCatalogosFiscaisCard', () => ({
  AlertasCatalogosFiscaisCard: () => <div>AlertasCatalogosFiscaisCard</div>,
}));
vi.mock('@/components/dashboard/SectionDivider', () => ({
  SectionDivider: () => <div>SectionDivider</div>,
}));
vi.mock('@/components/dashboard/DashboardExecutivoConteudo', () => ({
  DashboardExecutivoConteudo: () => <div>DashboardExecutivoConteudo</div>,
}));
vi.mock('@/components/bling/BlingNFeTab', () => ({ BlingNFeTab: () => <div>BlingNFeTab</div> }));
vi.mock('@/components/bling/BlingFinanceiroPanel', () => ({
  BlingFinanceiroPanel: () => <div>BlingFinanceiroPanel</div>,
}));
vi.mock('@/components/analytics/InadimplenciaSegmentada', () => ({
  InadimplenciaSegmentada: () => <div>InadimplenciaSegmentada</div>,
}));
vi.mock('@/components/analytics/BenchmarkingSetorial', () => ({
  BenchmarkingSetorial: () => <div>BenchmarkingSetorial</div>,
}));

import { DashboardExecutivo } from '@/components/dashboard/DashboardExecutivo';

function metricasVazias() {
  return {
    isLoading: false,
    empresas: [],
    centrosCusto: [],
    contasBancarias: [],
    contasBancariasFiltradas: [],
    contasPagarFiltradas: [],
    contasReceberFiltradas: [],
    clientes: [],
    aprovacoesPendentes: 0,
    saldoTotal: 0,
    receitasMes: 0,
    despesasMes: 0,
    totalReceber: 0,
    totalPagar: 0,
    totalVencidasReceber: 0,
    totalVencidasPagar: 0,
    inadimplencia: 0,
    venceHojeReceber: [],
    venceHojePagar: [],
    vencidasReceber: [],
    vencidasPagar: [],
    statusContasPagar: [],
    dadosPorCentroCusto: [],
    topClientesReceita: [],
    fluxoCaixaProjetado: [],
    totalDivergencias: 0,
    boletosStats: {},
    cobrancaKpis: {},
  };
}

function opcoesDaQueryDeDuplicidades() {
  const chamada = mockUseQuery.mock.calls.find(
    (c) => (c[0] as { queryKey?: unknown[] })?.queryKey?.[0] === 'bloqueios-duplicidade-stats'
  );
  return chamada?.[0] as { queryKey: unknown[]; queryFn: () => Promise<unknown> };
}

describe('DashboardExecutivo — escopo por empresa do card de duplicidades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboardConfig.mockReturnValue({
      widgets: [],
      resetToDefault: vi.fn(),
      toggleWidget: vi.fn(),
      resizeWidget: vi.fn(),
    });
    mockUseDashboardMetrics.mockReturnValue(metricasVazias());
    mockUseQuery.mockReturnValue({ data: { count: 0, totalValue: 0 } });
  });

  it('usa a empresa atual no queryKey e filtra a consulta por ela', async () => {
    mockUseAuth.mockReturnValue({ currentEmpresaId: 'empresa-1' });

    render(<DashboardExecutivo />);

    const opcoes = opcoesDaQueryDeDuplicidades();
    expect(opcoes.queryKey).toEqual(['bloqueios-duplicidade-stats', 'empresa-1']);

    await opcoes.queryFn();

    expect(selectMock).toHaveBeenCalledWith('valor_bloqueado');
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(eqMock).toHaveBeenCalledWith('empresa_id', 'empresa-1');
  });

  it('sem empresa atual não aplica filtro (sentinela "all" vira null)', async () => {
    mockUseAuth.mockReturnValue({ currentEmpresaId: null });

    render(<DashboardExecutivo />);

    const opcoes = opcoesDaQueryDeDuplicidades();
    expect(opcoes.queryKey).toEqual(['bloqueios-duplicidade-stats', null]);

    await opcoes.queryFn();

    expect(eqMock).not.toHaveBeenCalled();
  });
});
