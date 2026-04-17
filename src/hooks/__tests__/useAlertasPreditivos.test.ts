/**
 * Testes — useAlertasPreditivos
 * Valida geração de alertas: ruptura de caixa, concentração de risco, inadimplência e oportunidade.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}));

import { useAlertasPreditivos } from '../useAlertasPreditivos';

describe('useAlertasPreditivos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gera alerta de ruptura quando saldo projetado fica negativo', async () => {
    const { result } = renderHook(() => useAlertasPreditivos());

    await act(async () => {
      await result.current.analisarFluxoCaixa({
        saldoAtual: 1000,
        receitasPrevistas: [],
        despesasPrevistas: [
          { valor: 5000, dataVencimento: new Date(Date.now() + 5 * 86400000), entidade: 'Forn A' },
        ],
        historicoInadimplencia: [],
      });
    });

    const ruptura = result.current.alertas.find(a => a.tipo === 'ruptura');
    expect(ruptura).toBeDefined();
    expect(ruptura?.prioridade).toBe('alta');
  });

  it('detecta concentração de risco quando cliente >30% do total', async () => {
    const { result } = renderHook(() => useAlertasPreditivos());

    await act(async () => {
      await result.current.analisarFluxoCaixa({
        saldoAtual: 100000,
        receitasPrevistas: [
          { valor: 10000, dataVencimento: new Date(), entidade: 'Cliente A' },
          { valor: 1000, dataVencimento: new Date(), entidade: 'Cliente B' },
        ],
        despesasPrevistas: [],
        historicoInadimplencia: [],
      });
    });

    const concentracao = result.current.alertas.find(a => a.tipo === 'concentracao_risco');
    expect(concentracao).toBeDefined();
    expect(concentracao?.descricao).toContain('Cliente A');
  });

  it('não gera alertas se cenário saudável', async () => {
    const { result } = renderHook(() => useAlertasPreditivos());

    await act(async () => {
      await result.current.analisarFluxoCaixa({
        saldoAtual: 100000,
        receitasPrevistas: [
          { valor: 1000, dataVencimento: new Date(), entidade: 'A' },
          { valor: 1000, dataVencimento: new Date(), entidade: 'B' },
          { valor: 1000, dataVencimento: new Date(), entidade: 'C' },
          { valor: 1000, dataVencimento: new Date(), entidade: 'D' },
        ],
        despesasPrevistas: [],
        historicoInadimplencia: [],
      });
    });

    expect(result.current.alertas.find(a => a.tipo === 'ruptura')).toBeUndefined();
  });

  it('atualiza lastAnalysis após análise', async () => {
    const { result } = renderHook(() => useAlertasPreditivos());
    expect(result.current.lastAnalysis).toBeNull();

    await act(async () => {
      await result.current.analisarFluxoCaixa({
        saldoAtual: 1000,
        receitasPrevistas: [],
        despesasPrevistas: [],
        historicoInadimplencia: [],
      });
    });

    expect(result.current.lastAnalysis).toBeInstanceOf(Date);
  });

  it('detecta inadimplência provável com clientes em atraso > 15 dias', async () => {
    const { result } = renderHook(() => useAlertasPreditivos());

    await act(async () => {
      await result.current.analisarFluxoCaixa({
        saldoAtual: 50000,
        receitasPrevistas: [
          { valor: 5000, dataVencimento: new Date(), entidade: 'cliente-x' },
        ],
        despesasPrevistas: [],
        historicoInadimplencia: [
          { clienteId: 'cliente-x', diasAtraso: 20 },
        ],
      });
    });

    const inad = result.current.alertas.find(a => a.tipo === 'inadimplencia_provavel');
    expect(inad).toBeDefined();
    expect(inad?.impactoEstimado).toBe(5000);
  });
});
