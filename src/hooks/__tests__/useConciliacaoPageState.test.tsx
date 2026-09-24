import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useContaBancariaSelecionada,
  useTransacoesBancariasSelecionadas,
} from '../useConciliacaoPageState';
import type { TransacaoExtrato } from '../conciliacaoPage.types';
import { wrapper } from './use-conciliacao-test-utils';

const mocks = vi.hoisted(() => ({ carregarTransacoesBanco: vi.fn() }));

vi.mock('@/lib/conciliacao-page-helpers', () => ({
  carregarTransacoesBanco: mocks.carregarTransacoesBanco,
}));

describe('useContaBancariaSelecionada', () => {
  it('limpa a seleção local quando o filtro global é removido explicitamente', async () => {
    const { result, rerender } = renderHook(
      ({ contaGlobal }) => useContaBancariaSelecionada(contaGlobal),
      { initialProps: { contaGlobal: null as string | null } }
    );

    act(() => result.current[1]('conta-local'));
    expect(result.current[0]).toBe('conta-local');

    rerender({ contaGlobal: 'conta-global' });
    await waitFor(() => expect(result.current[0]).toBe('conta-global'));

    rerender({ contaGlobal: null });
    await waitFor(() => expect(result.current[0]).toBe(''));
  });
});

describe('useTransacoesBancariasSelecionadas', () => {
  beforeEach(() => mocks.carregarTransacoesBanco.mockReset());

  it('descarta uma resposta tardia e mantém a lista vazia até a conta ativa carregar', async () => {
    const transacaoAntiga: TransacaoExtrato = {
      id: 'transacao-antiga',
      data: new Date('2026-09-12'),
      descricao: 'Transação antiga',
      valor: 10,
      tipo: 'credito',
      conciliada: false,
    };
    const transacaoAtual: TransacaoExtrato = {
      ...transacaoAntiga,
      id: 'transacao-atual',
      descricao: 'Transação atual',
    };
    let resolverContaA: (valor: TransacaoExtrato[] | null) => void;
    let resolverContaB: (valor: TransacaoExtrato[] | null) => void;
    const contaA = new Promise<TransacaoExtrato[] | null>((resolve) => {
      resolverContaA = resolve;
    });
    const contaB = new Promise<TransacaoExtrato[] | null>((resolve) => {
      resolverContaB = resolve;
    });
    mocks.carregarTransacoesBanco.mockReturnValueOnce(contaA).mockReturnValueOnce(contaB);

    const { result, rerender } = renderHook(
      ({ conta }) => useTransacoesBancariasSelecionadas(conta),
      { initialProps: { conta: 'conta-a' }, wrapper }
    );
    await waitFor(() => expect(mocks.carregarTransacoesBanco).toHaveBeenCalledWith('conta-a'));

    rerender({ conta: 'conta-b' });
    await waitFor(() => expect(mocks.carregarTransacoesBanco).toHaveBeenCalledWith('conta-b'));
    expect(result.current.transacoes).toEqual([]);

    await act(async () => resolverContaA!([transacaoAntiga]));
    // A conta-a mudou de query key: sua resposta tardia atualiza apenas o
    // cache dela e não vaza para o que a conta ativa (conta-b) exibe.
    expect(result.current.transacoes).toEqual([]);

    await act(async () => resolverContaB!([transacaoAtual]));
    await waitFor(() => expect(result.current.transacoes).toEqual([transacaoAtual]));
  });

  it('expõe isLoading/isError e permite tentar novamente após falha', async () => {
    mocks.carregarTransacoesBanco.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useTransacoesBancariasSelecionadas('conta-c'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.transacoes).toEqual([]);

    const transacaoRetry: TransacaoExtrato = {
      id: 'transacao-retry',
      data: new Date('2026-09-20'),
      descricao: 'Recuperada no retry',
      valor: 42,
      tipo: 'debito',
      conciliada: false,
    };
    mocks.carregarTransacoesBanco.mockResolvedValueOnce([transacaoRetry]);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.transacoes).toEqual([transacaoRetry]);
  });

  it('não consulta quando nenhuma conta está selecionada', () => {
    const { result } = renderHook(() => useTransacoesBancariasSelecionadas(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.transacoes).toEqual([]);
    expect(mocks.carregarTransacoesBanco).not.toHaveBeenCalled();
  });
});
