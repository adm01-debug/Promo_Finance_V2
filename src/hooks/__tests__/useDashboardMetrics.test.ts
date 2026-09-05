/**
 * Testes — useDashboardMetrics
 * Valida cálculos de KPIs do Dashboard Executivo a partir de dados financeiros mockados.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mocks dos hooks de dados financeiros
const mockEmpresas = vi.fn();
const mockCC = vi.fn();
const mockBancos = vi.fn();
const mockPagar = vi.fn();
const mockReceber = vi.fn();
const mockClientes = vi.fn();
const mockAprovacoes = vi.fn();
const mockDivergencias = vi.fn();
const mockUseAuth = vi.fn();
const mockTotaisPagar = vi.fn();
const mockTotaisReceber = vi.fn();

vi.mock('@/hooks/useFinancialData', () => ({
  useEmpresas: () => mockEmpresas(),
  useCentrosCusto: () => mockCC(),
  useContasBancarias: () => mockBancos(),
  useContasPagar: () => mockPagar(),
  useContasReceber: () => mockReceber(),
  useClientes: () => mockClientes(),
}));

// Totais agregados por RPC (SUM() no banco) — hook próprio, mockado à parte
// para manter os testes desta suíte síncronos (ver B2 em
// docs/VALIDACAO_EXAUSTIVA_R2_2026-09-03.md e useTotaisFinanceiros.ts).
vi.mock('@/hooks/financial/useTotaisFinanceiros', () => ({
  useTotaisContasPagar: () => mockTotaisPagar(),
  useTotaisContasReceber: () => mockTotaisReceber(),
}));

vi.mock('@/hooks/useAprovacoesPendentesCount', () => ({
  useAprovacoesPendentesCount: () => mockAprovacoes(),
}));

// Dependências auxiliares que tocam Supabase/react-query — mockadas para
// isolar a lógica de cálculo dos KPIs. currentEmpresaId nulo faz o filtro
// "all" incluir todas as linhas (ver useDashboardMetrics linhas 46/55/63).
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useDivergenciasConciliacao', () => ({
  useDivergenciasConciliacao: () => mockDivergencias(),
}));

vi.mock('@/hooks/useBoletos', () => ({
  useBoletos: () => ({ stats: {}, isLoading: false }),
}));

vi.mock('@/hooks/useCobrancas', () => ({
  useCobrancaKPIs: () => ({ data: {}, isLoading: false }),
}));

import { useDashboardMetrics } from '../useDashboardMetrics';

const FILTERS_ALL = { empresaFilter: 'all', centroCustoFilter: 'all', periodoFluxo: '30' };

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ currentEmpresaId: null });
    mockEmpresas.mockReturnValue({ data: [{ id: 'e1' }], isLoading: false });
    mockCC.mockReturnValue({ data: [], isLoading: false });
    mockBancos.mockReturnValue({
      data: [
        { id: 'b1', empresa_id: 'e1', saldo_atual: 10000 },
        { id: 'b2', empresa_id: 'e1', saldo_atual: 5000 },
      ],
      isLoading: false,
    });
    mockPagar.mockReturnValue({ data: [], isLoading: false });
    mockReceber.mockReturnValue({ data: [], isLoading: false });
    mockClientes.mockReturnValue({ data: [], isLoading: false });
    mockAprovacoes.mockReturnValue({ count: 0 });
    mockDivergencias.mockReturnValue({ divergencias: [] });
    mockTotaisPagar.mockReturnValue({
      data: { total_pagar: 0, total_vencidas_pagar: 0, despesas_mes: 0 },
      isLoading: false,
    });
    mockTotaisReceber.mockReturnValue({
      data: { total_receber: 0, total_vencidas_receber: 0, receitas_mes: 0 },
      isLoading: false,
    });
  });

  it('soma saldoTotal corretamente', () => {
    const { result } = renderHook(() => useDashboardMetrics(FILTERS_ALL));
    expect(result.current.saldoTotal).toBe(15000);
  });

  it('repassa totalReceber calculado pela RPC totais_contas_receber', () => {
    // A soma em si agora é feita no banco (SUM() via RPC, sem cap de 1000
    // linhas — ver useTotaisFinanceiros.ts); este teste valida apenas que o
    // hook repassa o valor, não a lógica de agregação (coberta na migration).
    mockTotaisReceber.mockReturnValue({
      data: { total_receber: 1500, total_vencidas_receber: 0, receitas_mes: 0 },
      isLoading: false,
    });
    const { result } = renderHook(() => useDashboardMetrics(FILTERS_ALL));
    expect(result.current.totalReceber).toBe(1500);
  });

  it('calcula inadimplência como percentual de vencidas sobre total a receber', () => {
    mockTotaisReceber.mockReturnValue({
      data: { total_receber: 1500, total_vencidas_receber: 500, receitas_mes: 0 },
      isLoading: false,
    });
    const { result } = renderHook(() => useDashboardMetrics(FILTERS_ALL));
    // Inadimplência = 500 / 1500 * 100 ≈ 33.33%
    expect(result.current.inadimplencia).toBeCloseTo(33.33, 1);
  });

  it('isLoading true se qualquer hook ainda carregando', () => {
    mockBancos.mockReturnValue({ data: [], isLoading: true });
    const { result } = renderHook(() => useDashboardMetrics(FILTERS_ALL));
    expect(result.current.isLoading).toBe(true);
  });

  it('filtra por empresaFilter específico', () => {
    mockBancos.mockReturnValue({
      data: [
        { id: 'b1', empresa_id: 'e1', saldo_atual: 10000 },
        { id: 'b2', empresa_id: 'e2', saldo_atual: 5000 },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useDashboardMetrics({ ...FILTERS_ALL, empresaFilter: 'e1' })
    );
    expect(result.current.saldoTotal).toBe(10000);
  });

  it('normaliza sentinelas sem expandir a autorização da empresa corrente', () => {
    mockUseAuth.mockReturnValue({ currentEmpresaId: 'e1' });
    mockBancos.mockReturnValue({
      data: [
        { id: 'b1', empresa_id: 'e1', saldo_atual: 10000 },
        { id: 'b2', empresa_id: 'e2', saldo_atual: 5000 },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useDashboardMetrics({ ...FILTERS_ALL, empresaFilter: 'default', centroCustoFilter: 'todas' })
    );

    expect(result.current.saldoTotal).toBe(10000);
  });

  it('conta divergências pela conta bancária vinculada à empresa filtrada', () => {
    mockBancos.mockReturnValue({
      data: [
        { id: 'b1', empresa_id: 'e1', saldo_atual: 10000 },
        { id: 'b2', empresa_id: 'e2', saldo_atual: 5000 },
      ],
      isLoading: false,
    });
    mockDivergencias.mockReturnValue({
      divergencias: [
        { id: 'd1', conta_bancaria_id: 'b1', status: 'pendente' },
        { id: 'd2', conta_bancaria_id: 'b2', status: 'pendente' },
        { id: 'd3', conta_bancaria_id: 'b1', status: 'corrigido' },
      ],
    });

    const { result } = renderHook(() =>
      useDashboardMetrics({ ...FILTERS_ALL, empresaFilter: 'e1' })
    );

    expect(result.current.totalDivergencias).toBe(1);
  });

  it('topClientesReceita ordena por receita desc e limita a 10', () => {
    mockClientes.mockReturnValue({
      data: [
        { id: 'c1', nome: 'A', score: 800 },
        { id: 'c2', nome: 'B', score: 600 },
      ],
      isLoading: false,
    });
    const contas = Array.from({ length: 12 }, (_, i) => ({
      id: `r${i}`,
      empresa_id: 'e1',
      cliente_id: `c${i}`,
      cliente_nome: `Cliente ${i}`,
      valor: (i + 1) * 100,
      valor_recebido: 0,
      status: 'pendente',
      data_vencimento: '2025-01-01',
    }));
    mockReceber.mockReturnValue({ data: contas, isLoading: false });
    const { result } = renderHook(() => useDashboardMetrics(FILTERS_ALL));
    expect(result.current.topClientesReceita).toHaveLength(10);
    expect(result.current.topClientesReceita[0].receita).toBeGreaterThanOrEqual(
      result.current.topClientesReceita[9].receita
    );
  });
});
