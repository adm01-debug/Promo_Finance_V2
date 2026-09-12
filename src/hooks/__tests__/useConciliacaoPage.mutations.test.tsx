import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { wrapper } from './use-conciliacao-test-utils';
import { mocks, resetConciliacaoPageMocks } from './useConciliacaoPage.test-harness';
import { useConciliacaoPage } from '../useConciliacaoPage';

beforeEach(resetConciliacaoPageMocks);

function linha(id: string, tipo: 'receita' | 'despesa', conciliada = false, valor = 10) {
  return { id, data: '2025-01-01', descricao: id, valor, tipo, conciliada };
}

async function mountWithRows(rows: ReturnType<typeof linha>[]) {
  mocks.supabase.selectResp.transacoes_bancarias = { data: rows, error: null };
  const hook = renderHook(() => useConciliacaoPage(), { wrapper });
  act(() => hook.result.current.setSelectedBanco('bank-1'));
  await waitFor(() => expect(hook.result.current.transacoes).toHaveLength(rows.length));
  return hook;
}

describe('useConciliacaoPage — confirmação e conciliação manual', () => {
  it('persiste conta a pagar e só então altera o estado local', async () => {
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockResolvedValue(undefined);
    const { result } = await mountWithRows([linha('tx-a', 'despesa')]);
    await act(async () => result.current.handleConfirmarMatch('tx-a', 'lanc-99', 'pagar'));
    expect(mocks.mutations.confirmarConciliacao.mutateAsync).toHaveBeenCalledWith({
      transacaoId: 'tx-a',
      contaPagarId: 'lanc-99',
      contaReceberId: undefined,
    });
    expect(result.current.transacoes[0].conciliada).toBe(true);
  });

  it('persiste conta a receber no fluxo manual', async () => {
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockResolvedValue(undefined);
    const { result } = await mountWithRows([linha('tx-b', 'receita')]);
    await act(async () => result.current.handleManualSuccess('tx-b', 'lanc-r', 'receber'));
    expect(mocks.mutations.confirmarConciliacao.mutateAsync).toHaveBeenCalledWith({
      transacaoId: 'tx-b',
      contaReceberId: 'lanc-r',
      contaPagarId: undefined,
    });
    expect(result.current.transacoes[0].conciliada).toBe(true);
  });

  it('preserva estado não conciliado após rejeição da mutation', async () => {
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockRejectedValue(
      new Error('rpc failed')
    );
    const { result } = await mountWithRows([linha('tx-fail', 'despesa')]);
    await act(async () => result.current.handleConfirmarMatch('tx-fail', 'lanc-x', 'pagar'));
    await act(async () => result.current.handleManualSuccess('tx-fail', 'lanc-x', 'pagar'));
    expect(result.current.transacoes[0].conciliada).toBe(false);
  });
});

describe('useConciliacaoPage — desfazer e ignorar', () => {
  it('desfaz a conciliação somente depois da mutation bem-sucedida', async () => {
    vi.mocked(mocks.mutations.desfazerConciliacao.mutateAsync).mockResolvedValue(undefined);
    const { result } = await mountWithRows([linha('tx-c', 'receita', true, 40)]);
    await act(async () => result.current.handleDesfazerConciliacao('tx-c'));
    expect(result.current.transacoes[0].conciliada).toBe(false);
  });

  it('preserva conciliação se o desfazer falhar', async () => {
    vi.mocked(mocks.mutations.desfazerConciliacao.mutateAsync).mockRejectedValue(
      new Error('rpc down')
    );
    const { result } = await mountWithRows([linha('tx-d', 'receita', true, 50)]);
    await act(async () => result.current.handleDesfazerConciliacao('tx-d'));
    expect(result.current.transacoes[0].conciliada).toBe(true);
  });

  it('mantém a transação visível quando ignorar não persistir', async () => {
    mocks.supabase.updateResp.transacoes_bancarias = {
      data: null,
      error: { message: 'permission denied' },
    };
    const { result } = await mountWithRows([linha('tx-e', 'despesa', false, 60)]);
    await act(async () => result.current.handleIgnorar('tx-e'));
    expect(mocks.toasts.error).toHaveBeenCalledWith('Erro ao ignorar transação');
    expect(result.current.transacoes).toHaveLength(1);
  });

  it('remove apenas a transação cuja ação ignorar foi persistida', async () => {
    const { result } = await mountWithRows([linha('tx-f', 'despesa', false, 70)]);
    await act(async () => result.current.handleIgnorar('tx-f'));
    expect(mocks.supabase.updates.transacoes_bancarias?.[0]).toMatchObject({
      payload: { conciliada: true, compensacao_motivo: 'Ignorado pelo usuário' },
      filters: { id: 'tx-f' },
    });
    expect(result.current.transacoes).toHaveLength(0);
  });
});
