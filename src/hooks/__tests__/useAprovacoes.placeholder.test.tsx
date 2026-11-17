/**
 * Revisao da PR #400 (Codex P1): `placeholderData: (previousData) => previousData`
 * e default GLOBAL em src/lib/queryClient.ts:27. Ao trocar de empresa sem cache,
 * os hooks de alcada entregavam a configuracao da empresa ANTERIOR enquanto a
 * nova carregava -- e `RegistrarPagamentoDialog` decide com a config recebida,
 * com `isLoading` false durante o placeholder. Com 50.000 em B e 5.000 em A, um
 * titulo de 10.000 de A podia ser pago sem aprovacao nesse intervalo.
 *
 * Arquivo separado do useAprovacoes.test.tsx porque aquele bateu no limite de
 * 400 linhas do eslint (max-lines), que vale para teste tambem.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args), auth: { getUser: vi.fn() } },
}));

import { useConfiguracaoAprovacao, useConfiguracaoAprovacaoEditavel } from '@/hooks/useAprovacoes';

/** Builder thenable: encadeia e resolve com { data, error }. */
function chain(resultado: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'neq', 'order', 'limit']) {
    b[m] = vi.fn(() => b);
  }
  b.then = ((ok?: (v: typeof resultado) => unknown, err?: (r: unknown) => unknown) =>
    Promise.resolve(resultado).then(ok as never, err as never)) as never;
  return b;
}

/** Nunca resolve: simula a consulta da nova empresa ainda em voo. */
function chainPendente() {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'neq', 'order', 'limit']) {
    b[m] = vi.fn(() => b);
  }
  b.then = (() => new Promise(() => {})) as never;
  return b;
}

const FAIXA_B = {
  id: 'b',
  empresa_id: 'e-b',
  valor_minimo_aprovacao: 50000,
  aprovadores_obrigatorios: 1,
  ativo: true,
};

/** QueryClient com o placeholder GLOBAL ligado, como em producao. */
function wrapperComPlaceholderGlobal() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, placeholderData: (anterior: unknown) => anterior },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe.each([
  ['useConfiguracaoAprovacao (gate de pagamento)', useConfiguracaoAprovacao],
  ['useConfiguracaoAprovacaoEditavel (painel)', useConfiguracaoAprovacaoEditavel],
])('%s — troca de empresa', (_nome, hook) => {
  beforeEach(() => vi.clearAllMocks());

  it('nao entrega a configuracao da empresa anterior enquanto a nova carrega', async () => {
    mockFrom.mockReturnValue(chain({ data: [FAIXA_B], error: null }));

    const { result, rerender } = renderHook(({ id }: { id: string }) => hook(id), {
      wrapper: wrapperComPlaceholderGlobal(),
      initialProps: { id: 'e-b' },
    });
    await waitFor(() => expect(result.current.data?.valor_minimo_aprovacao).toBe(50000));

    // empresa A: consulta em voo
    mockFrom.mockReturnValue(chainPendente());
    rerender({ id: 'e-a' });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBe(true);
  });
});
