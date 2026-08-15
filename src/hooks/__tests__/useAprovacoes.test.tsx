import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock do supabase (vi.hoisted: o vi.mock é hoisted acima das declarações)
const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getUser: mockGetUser },
  },
}));

import { useComentariosAprovacao } from '@/hooks/useAprovacoes';

const makeWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

// Builder thenable: todos os métodos retornam o próprio builder (encadeamento),
// e o await no builder final resolve com { data, error }.
const buildChain = (resultado: { data: unknown; error: unknown } = { data: null, error: null }) => {
  const builder: Record<string, unknown> & PromiseLike<{ data: unknown; error: unknown }> = {
    eq: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    then: (onFulfilled?: (v: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve(resultado).then(onFulfilled),
  };
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.maybeSingle.mockReturnValue(builder);
  builder.single.mockReturnValue(builder);
  return builder;
};

describe('useComentariosAprovacao (contrato real user_id/comentario)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca comentarios com select simples (sem embed profiles — FK inexistente)', async () => {
    const comentariosReais = [
      {
        id: 'c1',
        solicitacao_id: 's1',
        user_id: 'u1',
        comentario: 'Aprovado com ressalvas',
        created_at: '2026-08-01T10:00:00Z',
      },
    ];
    const chain = buildChain({ data: comentariosReais, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useComentariosAprovacao('s1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('aprovacao_comentarios');
    // select SEM embed de profiles (nao ha FK user_id->profiles)
    const selectArg = chain.select.mock.calls[0][0];
    expect(String(selectArg).includes('profiles')).toBe(false);
    expect(result.current.data?.[0]?.comentario).toBe('Aprovado com ressalvas');
  });

  it('propaga erro do supabase', async () => {
    const chain = buildChain({ data: null, error: new Error('DB down') });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useComentariosAprovacao('s1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
