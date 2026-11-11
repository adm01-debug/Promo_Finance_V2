import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mockUseAuth = vi.fn();
const mockUseEmpresaScope = vi.fn();
const mockUseDashboardConfig = vi.fn();
const mockUseDashboardMetrics = vi.fn();
const mockUseQuery = vi.fn();
const selectMock = vi.fn();
const orderMock = vi.fn();
const inMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/useEmpresaScope', () => ({
  useEmpresaScope: () => mockUseEmpresaScope(),
}));

vi.mock('@/hooks/useDashboardConfig', () => ({
  useDashboardConfig: () => mockUseDashboardConfig(),
}));

vi.mock('@/hooks/useDashboardMetrics', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useDashboardMetrics')>(
    '@/hooks/useDashboardMetrics',
  );
  return {
    ...actual,
    useDashboardMetrics: () => mockUseDashboardMetrics(),
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQuery: (options: unknown) => mockUseQuery(options),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: (...args: unknown[]) => {
        selectMock(...args);
        return {
          order: (...orderArgs: unknown[]) => {
            orderMock(...orderArgs);
            return {
              in: (...inArgs: unknown[]) => inMock(...inArgs),
            };
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
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/components/dashboard/PrevisaoIA', () => ({ PrevisaoIA: () => <div>PrevisaoIA</div> }));
vi.mock('@/components/dashboard/AlertasPreditivosPanel', () => ({ AlertasPreditivosPanel: () => <div>AlertasPreditivosPanel</div> }));
vi.mock('@/components/dashboard/MetasFinanceirasPanel', () => ({ MetasFinanceirasPanel: () => <div>MetasFinanceirasPanel</div> }));
vi.mock('@/components/dashboard/DashboardConfigDialog', () => ({ DashboardConfigDialog: () => <div>DashboardConfigDialog</div> }));
vi.mock('@/components/dashboard/DashboardSkeleton', () => ({ DashboardSkeleton: () => <div>DashboardSkeleton</div> }));
vi.mock('@/components/dashboard/HeroKPICards', () => ({
  HeroKPIGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HeroKPICard: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('@/components/dashboard/DashboardFiltersHeader', () => ({
  DashboardFiltersHeader: () => <div>DashboardFiltersHeader</div>,
}));
vi.mock('@/components/dashboard/SecondaryKPICards', () => ({ SecondaryKPICards: () => <div>SecondaryKPICards</div> }));
vi.mock('@/components/dashboard/FluxoCaixaChart', () => ({ FluxoCaixaChart: () => <div>FluxoCaixaChart</div> }));
vi.mock('@/components/dashboard/SaldoPorBancoCard', () => ({ SaldoPorBancoCard: () => <div>SaldoPorBancoCard</div> }));
vi.mock('@/components/dashboard/TopClientesLeaderboard', () => ({ TopClientesLeaderboard: () => <div>TopClientesLeaderboard</div> }));
vi.mock('@/components/dashboard/StatusContasPieChart', () => ({ StatusContasPieChart: () => <div>StatusContasPieChart</div> }));
vi.mock('@/components/dashboard/TopCentrosCustoChart', () => ({ TopCentrosCustoChart: () => <div>TopCentrosCustoChart</div> }));
vi.mock('@/components/dashboard/CentroAcoesInteligentes', () => ({ CentroAcoesInteligentes: () => <div>CentroAcoesInteligentes</div> }));
vi.mock('@/components/bling/BlingNFeTab', () => ({ BlingNFeTab: () => <div>BlingNFeTab</div> }));
vi.mock('@/components/bling/BlingFinanceiroPanel', () => ({ BlingFinanceiroPanel: () => <div>BlingFinanceiroPanel</div> }));
vi.mock('@/components/analytics/InadimplenciaSegmentada', () => ({ InadimplenciaSegmentada: () => <div>InadimplenciaSegmentada</div> }));
vi.mock('@/components/analytics/BenchmarkingSetorial', () => ({ BenchmarkingSetorial: () => <div>BenchmarkingSetorial</div> }));
vi.mock('@/components/dashboard/AlertasOrcamento', () => ({ AlertasOrcamento: () => <div>AlertasOrcamento</div> }));
vi.mock('@/components/dashboard/AlertasCatalogosFiscaisCard', () => ({ AlertasCatalogosFiscaisCard: () => <div>AlertasCatalogosFiscaisCard</div> }));

import { DashboardExecutivo } from '@/components/dashboard/DashboardExecutivo';

describe('DashboardExecutivo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ currentEmpresaId: 'e1' });
    mockUseEmpresaScope.mockReturnValue({ ids: ['e1', 'e2'] });
    mockUseDashboardConfig.mockReturnValue({
      widgets: [],
      resetToDefault: vi.fn(),
    });
    mockUseDashboardMetrics.mockReturnValue({
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
      empresaIdsAtivos: ['e1', 'e2'],
    });
    mockUseQuery.mockReturnValue({ data: { count: 0, totalValue: 0 } });
    inMock.mockResolvedValue({ data: [], error: null });
  });

  it('inclui as empresas ativas no queryKey de duplicateStats', () => {
    render(<DashboardExecutivo />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['bloqueios-duplicidade-stats', ['e1', 'e2']],
      }),
    );
  });

  it('filtra duplicateStats pelas empresas ativas do dashboard', async () => {
    render(<DashboardExecutivo />);

    const firstCall = mockUseQuery.mock.calls[0]?.[0] as { queryFn: () => Promise<unknown> };
    await firstCall.queryFn();

    expect(selectMock).toHaveBeenCalledWith('empresa_id, valor_bloqueado');
    expect(inMock).toHaveBeenCalledWith('empresa_id', ['e1', 'e2']);
  });
});
