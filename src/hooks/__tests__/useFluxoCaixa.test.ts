/**
 * Testes — useFluxoCaixa hooks
 * Valida cálculos de KPIs e projeção diária do fluxo de caixa.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const eqMock = vi.fn();
const inMock = vi.fn();
const gteMock = vi.fn();
const lteMock = vi.fn();
const orderMock = vi.fn();
const selectMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: selectMock })),
  },
}));

import { useFluxoCaixaKPIs, useFluxoCaixaProjetado, calcularProjecoesReais } from '../useFluxoCaixa';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useFluxoCaixaKPIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let call = 0;
    selectMock.mockImplementation(() => {
      call++;
      if (call === 1) {
        // contas_bancarias.select(...).eq(...)
        return { eq: eqMock.mockResolvedValueOnce({ data: [{ saldo_atual: 5000 }, { saldo_atual: 3000 }], error: null }) };
      }
      if (call === 2) {
        // contas_receber.select(...).in(...)
        return { in: inMock.mockResolvedValueOnce({ data: [{ valor: 1000, valor_recebido: 200 }], error: null }) };
      }
      // contas_pagar.select(...).in(...)
      return { in: inMock.mockResolvedValueOnce({ data: [{ valor: 600, valor_pago: 100 }], error: null }) };
    });
  });

  it('calcula saldoTotal, totalReceber, totalPagar e previsão', async () => {
    const { result } = renderHook(() => useFluxoCaixaKPIs(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.saldoTotal).toBe(8000);
    expect(result.current.data?.totalReceber).toBe(800); // 1000 - 200
    expect(result.current.data?.totalPagar).toBe(500); // 600 - 100
    expect(result.current.data?.previsaoSaldo30d).toBe(8000 + 800 - 500);
  });
});

describe('useFluxoCaixaProjetado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let call = 0;
    selectMock.mockImplementation(() => {
      call++;
      if (call === 1) {
        return { eq: vi.fn().mockResolvedValueOnce({ data: [{ saldo_atual: 10000 }], error: null }) };
      }
      // receber & pagar
      return {
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
          }),
        }),
      };
    });
  });

  it('retorna dias+1 entradas iniciadas com saldo inicial', async () => {
    const { result } = renderHook(() => useFluxoCaixaProjetado(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(8);
    expect(result.current.data?.[0].saldo).toBe(10000);
  });
});

describe('calcularProjecoesReais', () => {
  it('gera cenários otimista, realista e pessimista', () => {
    const fluxo = [
      { data: '2025-01-01', receitas: 1000, despesas: 500, saldo: 500 },
      { data: '2025-01-02', receitas: 2000, despesas: 800, saldo: 1700 },
    ];
    const cenarios = calcularProjecoesReais(fluxo, 0);
    expect(cenarios).toHaveProperty('otimista');
    expect(cenarios).toHaveProperty('realista');
    expect(cenarios).toHaveProperty('pessimista');
  });
});
