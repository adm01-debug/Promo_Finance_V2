import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Grava em lote do enquadramento padrao (etapa 86).
 *
 * O teste do dialogo prova que ele pede a unificacao uma vez; aqui o alvo e o
 * proprio `salvarVarios`: um upsert unico para todos os produtos do SKU, para
 * uma falha de rede nao deixar metade dos produtos com o enquadramento novo.
 */
const { upsert, toastError } = vi.hoisted(() => ({ upsert: vi.fn(), toastError: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      upsert: (linhas: unknown, opcoes: unknown) => upsert(linhas, opcoes),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: toastError } }));

import { useProdutoCclasstribPadraoMutations } from '@/hooks/useProdutoCclasstribPadrao';

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

/** Tres produtos do Bling que dividem o SKU `KIT-01`. */
const skuCompartilhado = [
  { produto_id: '900', codigo: 'KIT-01', ncm: '20003200', cst: '102', cclasstrib: '000001' },
  { produto_id: '456', codigo: 'KIT-01', ncm: '20003200', cst: '102', cclasstrib: '000001' },
  { produto_id: '457', codigo: 'KIT-01', ncm: '20003200', cst: '102', cclasstrib: '000001' },
];

beforeEach(() => {
  upsert.mockReset();
  toastError.mockReset();
});

describe('useProdutoCclasstribPadraoMutations.salvarVarios', () => {
  it('grava todos os produtos do SKU num unico upsert', async () => {
    upsert.mockResolvedValue({ error: null });
    const { wrapper } = montar();
    const { result } = renderHook(() => useProdutoCclasstribPadraoMutations(), { wrapper });

    await act(async () => {
      await result.current.salvarVarios.mutateAsync(skuCompartilhado);
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    const [linhas, opcoes] = upsert.mock.calls[0];
    expect(opcoes).toEqual({ onConflict: 'produto_id' });
    // Payload inteiro, nao so os IDs: com o banco simulado, conferir apenas
    // `produto_id` passaria mesmo com NCM, CST ou cClassTrib omitidos, e o
    // enquadramento gravado sairia incompleto.
    expect(linhas).toEqual(
      skuCompartilhado.map((produto) => ({
        produto_id: produto.produto_id,
        codigo: produto.codigo,
        ncm: produto.ncm,
        cst: produto.cst,
        cclasstrib: produto.cclasstrib,
        atualizado_em: expect.any(String),
      }))
    );
    for (const linha of linhas as Array<{ atualizado_em: string }>) {
      expect(Number.isNaN(Date.parse(linha.atualizado_em))).toBe(false);
    }
    expect(toastError).not.toHaveBeenCalled();
  });

  it('nao chama o banco quando a lista de produtos vem vazia', async () => {
    const { wrapper } = montar();
    const { result } = renderHook(() => useProdutoCclasstribPadraoMutations(), { wrapper });

    await act(async () => {
      await result.current.salvarVarios.mutateAsync([]);
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it('propaga o erro do banco em vez de engolir a gravacao parcial', async () => {
    upsert.mockResolvedValue({ error: { message: 'duplicate key' } });
    const { wrapper } = montar();
    const { result } = renderHook(() => useProdutoCclasstribPadraoMutations(), { wrapper });

    await act(async () => {
      await expect(result.current.salvarVarios.mutateAsync(skuCompartilhado)).rejects.toThrow(
        'duplicate key'
      );
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('Nao foi possivel salvar: duplicate key');
  });
});
