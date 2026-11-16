/**
 * Regressão: ao passar a respeitar a empresa selecionada, a projeção do Fluxo
 * de Caixa ficou por empresa, mas `alertasDismissed` seguia global — e o id do
 * alerta é só `tipo-cenario-data` (cashflow-scenarios.ts:150), sem empresa.
 * Dispensar um alerta na empresa A escondia a ruptura da empresa B na mesma
 * data e cenário; se todos coincidissem, a tela informava fluxo saudável.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

let empresaAtual: string | null = 'empresa-A';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ currentEmpresaId: empresaAtual }),
}));

const PROJECAO = [
  { data: '2026-12-01', receitas: 0, despesas: 100000, saldo: -5000 },
  { data: '2026-12-02', receitas: 0, despesas: 100000, saldo: -9000 },
];

vi.mock('@/hooks/useFluxoCaixa', () => ({
  useFluxoCaixaKPIs: () => ({ data: { saldoTotal: 0 }, isLoading: false, refetch: vi.fn() }),
  useFluxoCaixaProjetado: () => ({ data: PROJECAO, isLoading: false, refetch: vi.fn() }),
  calcularProjecoesReais: () => ({
    otimista: PROJECAO,
    realista: PROJECAO,
    pessimista: PROJECAO,
  }),
}));

import { useFluxoCaixaPage } from '../useFluxoCaixaPage';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useFluxoCaixaPage — dispensas de alerta por empresa', () => {
  beforeEach(() => {
    empresaAtual = 'empresa-A';
  });

  it('dispensar na empresa A não esconde o mesmo alerta na empresa B', () => {
    // SEM desmontar: é a troca de empresa na própria tela que expõe o bug.
    // Com unmount o estado do React zera e a versão global também passaria.
    const { result, rerender } = renderHook(() => useFluxoCaixaPage(), { wrapper });
    const antes = result.current.alertas.length;
    expect(antes).toBeGreaterThan(0);

    const id = result.current.alertas[0].id;
    act(() => result.current.handleDismissAlerta(id));
    expect(result.current.alertas.some((x) => x.id === id)).toBe(false);

    empresaAtual = 'empresa-B';
    rerender();

    expect(result.current.alertas.length).toBe(antes);
    expect(result.current.alertas.some((x) => x.id === id)).toBe(true);
  });

  it('voltar para a empresa A preserva a dispensa feita nela', () => {
    const { result, rerender } = renderHook(() => useFluxoCaixaPage(), { wrapper });
    const id = result.current.alertas[0].id;
    act(() => result.current.handleDismissAlerta(id));

    empresaAtual = 'empresa-B';
    rerender();
    expect(result.current.alertas.some((x) => x.id === id)).toBe(true);

    empresaAtual = 'empresa-A';
    rerender();
    expect(result.current.alertas.some((x) => x.id === id)).toBe(false);
  });

  it('o id do alerta não carrega a empresa, que é a razão da separação', () => {
    const a = renderHook(() => useFluxoCaixaPage(), { wrapper });
    expect(a.result.current.alertas[0].id).not.toContain('empresa-A');
  });
});
