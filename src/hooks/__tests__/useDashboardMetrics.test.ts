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

vi.mock('@/hooks/useFinancialData', () => ({
  useEmpresas: () => mockEmpresas(),
  useCentrosCusto: () => mockCC(),
  useContasBancarias: () => mockBancos(),
  useContasPagar: () => mockPagar(),
  useContasReceber: () => mockReceber(),
  useClientes: () => mockClientes(),
}));

vi.mock('@/hooks/useAprovacoesPendentesCount', () => ({
  useAprovacoesPendentesCount: () => mockAprovacoes(),
}));

import { useDashboardMetrics } from '../useDashboardMetrics';

const FILTERS_ALL = { empresaFilter: 'all', centroCustoFilter: 'all', periodoFluxo: '30' };

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('soma saldoTotal corretamente', () => {
    const { result } = renderHook(() => useDashboardMetrics(FILTERS_ALL));
    expect(result.current.saldoTotal).toBe(15000);
  });

  it('calcula totalReceber excluindo pagas e canceladas', () => {
    mockReceber.mockReturnValue({
      data: [
        { id: '1', empresa_id: 'e1', valor: 1000, valor_recebido: 0, status: 'pendente', data_vencimento: '2025-01-01' },
        { id: '2', empresa_id: 'e1', valor: 500, valor_recebido: 500, status: 'pago', data_vencimento: '2025-01-01' },
        { id: '3', empresa_id: 'e1', valor: 200, valor_recebido: 0, status: 'cancelado', data_vencimento: '2025-01-01' },
        { id: '4', empresa_id: 'e1', valor: 800, valor_recebido: 300, status: 'parcial', data_vencimento: '2025-01-01' },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useDashboardMetrics(FILTERS_ALL));
    expect(result.current.totalReceber).toBe(1000 + 500); // 1000 pendente + (800-300) parcial
  });

  it('calcula inadimplência como percentual de vencidas sobre total a receber', () => {
    mockReceber.mockReturnValue({
      data: [
        { id: '1', empresa_id: 'e1', valor: 1000, valor_recebido: 0, status: 'pendente', data_vencimento: '2025-12-01' },
        { id: '2', empresa_id: 'e1', valor: 500, valor_recebido: 0, status: 'vencido', data_vencimento: '2024-01-01' },
      ],
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
      useDashboardMetrics({ ...FILTERS_ALL, empresaFilter: 'e1' }),
    );
    expect(result.current.saldoTotal).toBe(10000);
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
      result.current.topClientesReceita[9].receita,
    );
  });
});
