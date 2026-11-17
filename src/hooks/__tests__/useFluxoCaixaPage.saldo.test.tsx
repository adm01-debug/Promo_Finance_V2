/**
 * Achado F07, parte que vivia no HOOK e nao na funcao pura (apontado na revisao
 * da PR #415): `metricaAtiva?.saldoFinal || saldoInicial` trocava saldo final
 * legitimamente ZERO pelo saldo inicial -- a tela mostrava dinheiro que o
 * cenario tinha consumido, e a variacao aparecia como 0 em vez de negativa.
 * E, com projecao vazia, o curto-circuito do hook devolvia zeros fixos,
 * anunciando caixa zerado quando nada havia sido projetado.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const SALDO_INICIAL = 250000;
let projetado: Array<{ data: string; receitas: number; despesas: number; saldo: number }> = [];

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ currentEmpresaId: 'empresa-A' }),
}));

vi.mock('@/hooks/useFluxoCaixa', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/hooks/useFluxoCaixa')>();
  return {
    ...real,
    useFluxoCaixaKPIs: () => ({
      data: { saldoTotal: SALDO_INICIAL },
      isLoading: false,
      refetch: vi.fn(),
    }),
    useFluxoCaixaProjetado: () => ({ data: projetado, isLoading: false, refetch: vi.fn() }),
  };
});

import { useFluxoCaixaPage } from '../useFluxoCaixaPage';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useFluxoCaixaPage — saldo final zero e projeção vazia (F07)', () => {
  it('saldo final legitimamente ZERO nao e trocado pelo saldo inicial', () => {
    // receitas 0 (o fator de atraso multiplica zero por qualquer coisa) e
    // despesas iguais ao saldo inicial: o cenario consome o caixa exatamente.
    projetado = [{ data: '2026-12-01', receitas: 0, despesas: SALDO_INICIAL, saldo: 0 }];

    const { result } = renderHook(() => useFluxoCaixaPage(), { wrapper });

    expect(result.current.saldoFinal).toBe(0);
    expect(result.current.variacao).toBe(-SALDO_INICIAL);
  });

  it('projecao vazia preserva o saldo inicial e variacao zero', () => {
    projetado = [];

    const { result } = renderHook(() => useFluxoCaixaPage(), { wrapper });

    expect(result.current.saldoFinal).toBe(SALDO_INICIAL);
    expect(result.current.variacao).toBe(0);
    expect(result.current.metricasCenarios.realista.saldoMinimo).toBe(SALDO_INICIAL);
  });
});
