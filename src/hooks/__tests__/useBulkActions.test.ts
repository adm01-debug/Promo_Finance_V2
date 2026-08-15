/**
 * Testes — useBulkActions
 * Cobre seleção (toggle/selectAll/limpar), execução de ações bulk e
 * as ações default (delete / mark-done) com mock de supabase.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkActions } from '../useBulkActions';

const { mockFrom, mockToast } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
  useToast: () => ({ toast: mockToast }),
}));

interface Item {
  id: string;
}

/** Chain thenable: todos os métodos retornam a própria chain e `await` resolve o resultado configurado. */
function criarChain(resultado: unknown): any {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    then: (resolve: (v: unknown) => void) => resolve(resultado),
  };
  return chain;
}

describe('useBulkActions', () => {
  const items: Item[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const getItemId = (i: Item) => i.id;
  const props = { items, getItemId };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(criarChain({ data: null, error: null }));
  });

  it('toggle adiciona e remove id da seleção', () => {
    const { result } = renderHook(() => useBulkActions(props));

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.selectionCount).toBe(1);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isSomeSelected).toBe(true);

    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(false);
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.isSomeSelected).toBe(false);
  });

  it('selectAll seleciona todos e limpa quando já estão todos selecionados', () => {
    const { result } = renderHook(() => useBulkActions(props));

    act(() => result.current.selectAll());
    expect(result.current.selectionCount).toBe(3);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.isSomeSelected).toBe(false);

    // Segundo selectAll com tudo selecionado limpa a seleção
    act(() => result.current.selectAll());
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('deselectAll/clearSelection limpa a seleção', () => {
    const { result } = renderHook(() => useBulkActions(props));

    act(() => result.current.select('a'));
    act(() => result.current.select('b'));
    act(() => result.current.deselectAll());
    expect(result.current.selectionCount).toBe(0);

    act(() => result.current.select('c'));
    act(() => result.current.clearSelection());
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.isSelected('c')).toBe(false);
  });

  it('execute chama handler com os itens selecionados, limpa seleção, toast e onSuccess', async () => {
    const onSuccess = vi.fn();
    const handler = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBulkActions({ ...props, onSuccess, successMessage: 'OK' }),
    );

    act(() => result.current.select('a'));
    act(() => result.current.select('c'));

    await act(async () => {
      await result.current.execute({ id: 'x', label: 'X', handler });
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith([{ id: 'a' }, { id: 'c' }]);
    expect(result.current.selectionCount).toBe(0);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'OK', description: '2 item(s) processado(s)' }),
    );
    expect(result.current.isExecuting).toBe(false);
  });

  it('execute sem seleção não chama handler', async () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useBulkActions(props));

    await act(async () => {
      await result.current.execute({ id: 'x', label: 'X', handler });
    });

    expect(handler).not.toHaveBeenCalled();
    expect(result.current.isExecuting).toBe(false);
  });

  it('execute propaga erro para onError e toast destructive', async () => {
    const onError = vi.fn();
    const handler = vi.fn().mockRejectedValue(new Error('falhou'));
    const { result } = renderHook(() =>
      useBulkActions({ ...props, onError, errorMessage: 'ERRO' }),
    );

    act(() => result.current.select('a'));

    await act(async () => {
      await result.current.execute({ id: 'x', label: 'X', handler });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'ERRO', variant: 'destructive' }),
    );
    expect(result.current.isExecuting).toBe(false);
  });

  it('ação default delete chama supabase.from(table).delete().in(id, ids)', async () => {
    const { result } = renderHook(() =>
      useBulkActions({ ...props, tableName: 'contas_pagar' }),
    );

    act(() => result.current.select('a'));
    act(() => result.current.select('b'));

    const del = result.current.defaultActions.find((a) => a.id === 'delete');
    expect(del).toBeDefined();
    expect(del?.confirm?.title).toBe('Confirmar exclusão');

    const chain = criarChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await del!.handler([{ id: 'a' }, { id: 'b' }]);
    });

    expect(mockFrom).toHaveBeenCalledWith('contas_pagar');
    expect(chain.delete).toHaveBeenCalledTimes(1);
    expect(chain.in).toHaveBeenCalledWith('id', ['a', 'b']);
  });

  it('ação default mark-done chama update({status:pago}).in(id, ids)', async () => {
    const { result } = renderHook(() =>
      useBulkActions({ ...props, tableName: 'boletos' }),
    );

    act(() => result.current.select('a'));

    const markDone = result.current.defaultActions.find((a) => a.id === 'mark-done');
    expect(markDone).toBeDefined();

    const chain = criarChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await markDone!.handler([{ id: 'a' }]);
    });

    expect(mockFrom).toHaveBeenCalledWith('boletos');
    expect(chain.update).toHaveBeenCalledWith({ status: 'pago' });
    expect(chain.in).toHaveBeenCalledWith('id', ['a']);
  });

  it('sem tableName, defaultActions fica vazio', () => {
    const { result } = renderHook(() => useBulkActions(props));
    expect(result.current.defaultActions).toHaveLength(0);
  });

  it('executeBulkAction itera por id, limpa seleção, atualiza progresso e dispara toast', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useBulkActions({ ...props, successMessage: 'LOTE' }));

    act(() => result.current.select('a'));
    act(() => result.current.select('b'));

    await act(async () => {
      await result.current.executeBulkAction(action, { showProgress: true });
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(action).toHaveBeenNthCalledWith(1, 'a');
    expect(action).toHaveBeenNthCalledWith(2, 'b');
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.progress).toBe(100);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'LOTE', description: '2 item(s) processado(s)' }),
    );
  });

  it('executeBulkAction sem seleção não executa nada', async () => {
    const action = vi.fn();
    const { result } = renderHook(() => useBulkActions(props));

    await act(async () => {
      await result.current.executeBulkAction(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });
});
