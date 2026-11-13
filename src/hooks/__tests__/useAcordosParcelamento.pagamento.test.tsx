/**
 * Testes — useAcordosParcelamento (Etapa 20)
 *
 * Dois defeitos, ambos com toast de sucesso por cima:
 *
 *  - `registrarPagamento` decidia a quitação com
 *    `parcelas?.every((p) => p.status === 'pago')`. Errava nos dois sentidos:
 *    select falhando ⇒ `undefined` ⇒ acordo nunca quitado; select devolvendo
 *    `[]` (o que a RLS produz) ⇒ `[].every()` é `true` ⇒ acordo quitado sem
 *    nenhuma parcela paga. E o update de quitação era descartado.
 *  - `cancelarAcordo` descartava o cancelamento das parcelas e não verificava
 *    se o acordo existia.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';

const { mockFrom, toastErro, toastSucesso } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  toastErro: vi.fn(),
  toastSucesso: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));
vi.mock('sonner', () => ({ toast: { success: toastSucesso, error: toastErro } }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useAcordosParcelamento } from '../useAcordosParcelamento';
import {
  PAGAMENTO,
  criarQueryClient,
  criarWrapper,
  filaParcelas,
  montaClienteCom,
  type Resultado,
} from './useAcordosParcelamento.harness';

let queryClient: QueryClient;
const wrapper = criarWrapper(() => queryClient);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = criarQueryClient();
});

async function montaHook(respostas: Record<string, Resultado[]>) {
  const escritas = montaClienteCom(mockFrom, respostas);
  const { result } = renderHook(() => useAcordosParcelamento(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return { result, escritas };
}

describe('registrarPagamento', () => {
  it('grava data_pagamento e valor_pago na parcela', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: filaParcelas({ data: [{ status: 'pendente' }], error: null }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(escritas.some((e) => e.tabela === 'parcelas_acordo' && e.metodo === 'update')).toBe(
        true
      )
    );
    expect(
      escritas.find((e) => e.tabela === 'parcelas_acordo' && e.metodo === 'update')?.payload
    ).toEqual({ status: 'pago', data_pagamento: '2026-04-10', valor_pago: 500 });
  });

  it('quita o acordo quando todas as parcelas estão pagas', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1' }], error: null },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }, { status: 'pago' }],
        error: null,
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(
        escritas.some((e) => e.tabela === 'acordos_parcelamento' && e.metodo === 'update')
      ).toBe(true)
    );
  });

  it('quita o acordo e reverte contas_receber vinculadas para "recebido"', async () => {
    // Regressão: quitação total marcava o acordo como 'quitado' mas nunca
    // tocava contas_receber, que ficava 'em_acordo' para sempre mesmo paga.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        // Acordo com desconto: total pago (640) < nominal das contas (800).
        {
          data: [{ id: 'ac-1', contas_receber_ids: ['cr-1', 'cr-2'], valor_total_acordo: 640 }],
          error: null,
        },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }, { status: 'pago' }],
        error: null,
      }),
      // 1ª chamada: select do conjunto contratado (id+valor+valor_recebido+
      // status); as demais são os updates linha a linha (valor_recebido é
      // por linha — não dá para ratear num update em massa via PostgREST).
      contas_receber: [
        {
          data: [
            { id: 'cr-1', valor: 500, valor_recebido: 0, status: 'em_acordo' },
            { id: 'cr-2', valor: 300, valor_recebido: 0, status: 'em_acordo' },
          ],
          error: null,
        },
        { data: [{ id: 'cr-ok' }], error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(escritas.some((e) => e.tabela === 'contas_receber' && e.metodo === 'update')).toBe(
        true
      )
    );

    const escritaContasReceber = escritas.find(
      (e) => e.tabela === 'contas_receber' && e.metodo === 'update'
    );
    expect(escritaContasReceber?.payload).toMatchObject({ status: 'recebido' });
    expect(
      (escritaContasReceber?.payload as { data_recebimento?: string })?.data_recebimento
    ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // valor_recebido recebe a cota pro-rata do valor_total_acordo (o que foi
    // pago de fato: 640 × 500/800 = 400) — nunca o nominal, senão o desconto
    // do acordo apareceria como caixa recebido nos KPIs.
    expect((escritaContasReceber?.payload as { valor_recebido?: number })?.valor_recebido).toBe(
      400
    );
  });

  it('quita o acordo sem quebrar quando contas_receber_ids vem vazio/nulo', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1', contas_receber_ids: null }], error: null },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }],
        error: null,
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(
        escritas.some((e) => e.tabela === 'acordos_parcelamento' && e.metodo === 'update')
      ).toBe(true)
    );
    expect(escritas.some((e) => e.tabela === 'contas_receber')).toBe(false);
  });

  it('não quita quando ainda há parcela pendente', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }, { status: 'pendente' }],
        error: null,
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalled());
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento')).toBe(false);
  });

  it('não quita acordo cujas parcelas voltaram vazias — [].every() é true', async () => {
    // A RLS devolvendo zero linhas fazia o acordo ser quitado sem nenhuma
    // parcela paga, e o toast confirmava.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: filaParcelas({ data: [], error: null }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalled());
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento')).toBe(false);
  });

  it('falha quando a conferência das parcelas dá erro', async () => {
    const { result } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: filaParcelas({
        data: null,
        error: { code: '42501', message: 'sem permissão' },
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastSucesso).not.toHaveBeenCalled();
  });

  it('falha quando a quitação não atinge linha alguma', async () => {
    const { result } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      parcelas_acordo: filaParcelas({ data: [{ status: 'pago' }], error: null }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastSucesso).not.toHaveBeenCalled();
  });
});

describe('cancelarAcordo', () => {
  it('cancela parcelas pendentes e o acordo', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1' }], error: null },
      ],
      parcelas_acordo: [{ data: [], error: null }],
    });

    act(() => result.current.cancelarAcordo('ac-1'));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith('Acordo cancelado'));
    expect(escritas.map((e) => `${e.tabela}.${e.metodo}`)).toEqual([
      'parcelas_acordo.update',
      'acordos_parcelamento.update',
    ]);
  });

  it('acordo sem parcelas pendentes não é tratado como falha', async () => {
    // Zero linhas aqui é o resultado correto: todas as parcelas já estavam
    // pagas. Exigir linha alguma seria transformar um caso válido em erro.
    const { result } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1' }], error: null },
      ],
      parcelas_acordo: [{ data: [], error: null, count: 0 }],
    });

    act(() => result.current.cancelarAcordo('ac-1'));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith('Acordo cancelado'));
  });

  it('falha quando o cancelamento das parcelas é recusado', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: [{ data: null, error: { code: '42501', message: 'sem permissão' } }],
    });

    act(() => result.current.cancelarAcordo('ac-1'));

    await waitFor(() => expect(toastErro).toHaveBeenCalledWith('Erro ao cancelar acordo'));
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento')).toBe(false);
  });

  it('falha quando o acordo não existe', async () => {
    const { result } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      parcelas_acordo: [{ data: [], error: null }],
    });

    act(() => result.current.cancelarAcordo('ac-inexistente'));

    await waitFor(() => expect(toastErro).toHaveBeenCalledWith('Erro ao cancelar acordo'));
    expect(toastSucesso).not.toHaveBeenCalled();
  });
});
