/**
 * Testes — useOrganizacoes
 * Cobre listagem de organizações (multi-tenancy), erro de query e o gate
 * de `enabled` quando não há usuário logado.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrganizacoes } from '../useOrganizacoes';

const { mockFrom, mockUseAuth } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

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

const ORGANIZACAO = {
  id: 'o1',
  nome: 'Org A',
  cnpj: null,
  tipo: 'EMPRESA',
  responsavel_id: 'u1',
  ativo: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

describe('useOrganizacoes', () => {
  it('lista organizações quando há usuário logado', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
    const chain = criarChain({ data: [ORGANIZACAO], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useOrganizacoes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('organizacoes');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result.current.data).toEqual([ORGANIZACAO]);
  });

  it('propaga erro da listagem', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
    mockFrom.mockReturnValue(criarChain({ data: null, error: { message: 'RLS negou' } }));

    const { result } = renderHook(() => useOrganizacoes(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as { message: string }).message).toBe('RLS negou');
  });

  it('não dispara query sem usuário logado (enabled=false)', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockFrom.mockReturnValue(criarChain({ data: [], error: null }));

    const { result } = renderHook(() => useOrganizacoes(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
