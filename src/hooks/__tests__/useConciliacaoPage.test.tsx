import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { wrapper } from './use-conciliacao-test-utils';
import { mocks, resetConciliacaoPageMocks } from './useConciliacaoPage.test-harness';
import { useConciliacaoPage } from '../useConciliacaoPage';

beforeEach(resetConciliacaoPageMocks);

function transacao(
  id: string,
  tipo: 'receita' | 'despesa',
  conciliada = false,
  valor = 10,
  descricao = id
) {
  return { id, data: '2025-01-01', descricao, valor, tipo, conciliada };
}

async function mountWith(rows: ReturnType<typeof transacao>[]) {
  mocks.supabase.selectResp.transacoes_bancarias = { data: rows, error: null };
  const hook = renderHook(() => useConciliacaoPage(), { wrapper });
  act(() => hook.result.current.setSelectedBanco('bank-1'));
  await waitFor(() => expect(hook.result.current.transacoes).toHaveLength(rows.length));
  return hook;
}

describe('useConciliacaoPage — seleção, lote, filtros e KPIs', () => {
  it('não confirma em lote sem lançamento vinculado', async () => {
    const { result } = await mountWith([
      transacao('a', 'receita'),
      transacao('b', 'receita', false, 20),
    ]);
    act(() => {
      result.current.toggleSelect('a');
      result.current.toggleSelect('b');
    });
    act(() => result.current.handleBulkConciliar());
    expect(mocks.toasts.warning).toHaveBeenCalledWith(
      'Selecione o lançamento de cada transação para confirmar a conciliação.'
    );
    expect(result.current.selectedIds.size).toBe(2);
    expect(result.current.transacoes.every((item) => !item.conciliada)).toBe(true);
  });

  it('remove em lote somente após cada persistência confirmada', async () => {
    const { result } = await mountWith([
      transacao('a', 'receita'),
      transacao('b', 'receita', false, 20),
    ]);
    act(() => {
      result.current.toggleSelect('a');
      result.current.toggleSelect('b');
    });
    await act(async () => result.current.handleBulkIgnorar());
    expect(mocks.supabase.updates.transacoes_bancarias).toHaveLength(2);
    expect(mocks.toasts.success).toHaveBeenCalledWith('2 transações ignoradas e persistidas');
    expect(result.current.transacoes).toHaveLength(0);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('alterna a seleção de todos os pendentes e a seleção individual', async () => {
    const { result } = await mountWith([
      transacao('a', 'receita'),
      transacao('b', 'receita', true, 20),
    ]);
    act(() => result.current.toggleSelectAll());
    expect(result.current.selectedIds).toEqual(new Set(['a']));
    act(() => result.current.toggleSelectAll());
    expect(result.current.selectedIds).toEqual(new Set());
    act(() => result.current.toggleSelect('a'));
    expect(result.current.selectedIds).toEqual(new Set(['a']));
    act(() => result.current.toggleSelect('a'));
    expect(result.current.selectedIds).toEqual(new Set());
  });

  it('combina tipo, período, valor, status e busca nos filtros', async () => {
    const { result } = await mountWith([
      { ...transacao('a', 'receita', false, 100, 'PIX Cliente'), data: '2025-01-05' },
      { ...transacao('b', 'despesa', false, 500, 'Boleto Fornecedor'), data: '2025-02-05' },
      { ...transacao('c', 'despesa', true, 5, 'Taxa Bancária'), data: '2025-03-05' },
    ]);
    act(() => {
      result.current.setFilters({
        periodoInicio: '2025-01-01',
        periodoFim: '2025-02-28',
        valorMin: '10',
        valorMax: '1000',
        tipo: 'debito',
        confiancaIA: 'todos',
        centroCustoId: 'todos',
      });
      result.current.setStatusTab('pendentes');
      result.current.setSearchTerm('boleto');
    });
    await waitFor(() =>
      expect(result.current.filteredTransacoes.map((item) => item.id)).toEqual(['b'])
    );
  });

  it('mantém conciliadas + pendentes igual ao total', async () => {
    const { result } = await mountWith([
      transacao('a', 'receita'),
      transacao('b', 'receita', true, 20),
      transacao('c', 'despesa', false, 30),
    ]);
    expect(result.current.totalTransacoes).toBe(3);
    expect(result.current.conciliadas + result.current.pendentes).toBe(
      result.current.totalTransacoes
    );
    expect(result.current.percentualConciliado).toBeCloseTo((1 / 3) * 100);
  });
});

describe('useConciliacaoPage — persistência de filtros', () => {
  it('hidrata estado válido e persiste alterações no localStorage', async () => {
    const stored = {
      periodoInicio: '2025-01-01',
      periodoFim: '',
      valorMin: '',
      valorMax: '',
      tipo: 'credito',
      confiancaIA: 'todos',
      centroCustoId: 'todos',
    } as const;
    (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify(stored));
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    expect(result.current.filters.tipo).toBe('credito');
    expect(result.current.filters.periodoInicio).toBe('2025-01-01');
    act(() => result.current.setFilters({ ...stored, valorMin: '42' }));
    await waitFor(() =>
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'conciliacao_filters',
        expect.stringContaining('"valorMin":"42"')
      )
    );
  });

  it('descarta estado inválido salvo para não interromper a conciliação', () => {
    (window.localStorage.getItem as any).mockReturnValueOnce('{invalido');
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    expect(result.current.filters.tipo).toBe('todos');
  });
});
