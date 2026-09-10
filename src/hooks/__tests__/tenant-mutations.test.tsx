import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import {
  useCategorias,
  useCreateCategoria,
  useDeleteCategoria,
  useUpdateCategoria,
} from '@/hooks/useCategorias';
import {
  useAtualizarCentroCusto,
  useCriarCentroCusto,
  useExcluirCentroCusto,
  useReativarCentroCusto,
} from '@/hooks/useCentrosCusto';

function criarChain(resultado: { data: unknown; error: unknown } = { data: {}, error: null }) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    then: (resolve: (valor: unknown) => unknown) => Promise.resolve(resultado).then(resolve),
  };
  return chain;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mockUseAuth.mockReturnValue({ currentEmpresaId: 'empresa-atual' });
});

describe('isolamento multiempresa em categorias', () => {
  it('não consulta categorias sem empresa ativa', () => {
    mockUseAuth.mockReturnValue({ currentEmpresaId: null });

    renderHook(() => useCategorias('despesa'), { wrapper });

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('lista categorias somente da empresa ativa', async () => {
    const chain = criarChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCategorias('receita'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFrom).toHaveBeenCalledWith('categorias');
    expect(chain.eq).toHaveBeenNthCalledWith(1, 'ativo', true);
    expect(chain.eq).toHaveBeenNthCalledWith(2, 'empresa_id', 'empresa-atual');
    expect(chain.eq).toHaveBeenNthCalledWith(3, 'tipo', 'receita');
  });

  it('vincula criação, atualização e exclusão à empresa ativa e ignora empresa forjada', async () => {
    const criar = criarChain({ data: { id: 'cat-1' }, error: null });
    mockFrom.mockReturnValue(criar);
    const { result: criacao } = renderHook(() => useCreateCategoria(), { wrapper });
    await criacao.current.mutateAsync({ nome: 'Frete', tipo: 'despesa', empresa_id: 'outra-empresa' });
    expect(criar.insert).toHaveBeenCalledWith({
      nome: 'Frete',
      tipo: 'despesa',
      ativo: true,
      empresa_id: 'empresa-atual',
    });

    const atualizar = criarChain({ data: { id: 'cat-1' }, error: null });
    mockFrom.mockReturnValue(atualizar);
    const { result: edicao } = renderHook(() => useUpdateCategoria(), { wrapper });
    await edicao.current.mutateAsync({ id: 'cat-1', data: { nome: 'Frete nacional', empresa_id: 'outra-empresa' } });
    expect(atualizar.update).toHaveBeenCalledWith({ nome: 'Frete nacional' });
    expect(atualizar.eq).toHaveBeenNthCalledWith(1, 'id', 'cat-1');
    expect(atualizar.eq).toHaveBeenNthCalledWith(2, 'empresa_id', 'empresa-atual');

    const excluir = criarChain({ data: null, error: null });
    mockFrom.mockReturnValue(excluir);
    const { result: exclusao } = renderHook(() => useDeleteCategoria(), { wrapper });
    await exclusao.current.mutateAsync('cat-1');
    expect(excluir.update).toHaveBeenCalledWith({ ativo: false });
    expect(excluir.eq).toHaveBeenNthCalledWith(1, 'id', 'cat-1');
    expect(excluir.eq).toHaveBeenNthCalledWith(2, 'empresa_id', 'empresa-atual');
  });
});

describe('isolamento multiempresa em centros de custo', () => {
  it('vincula criação à empresa ativa e rejeita mutações sem contexto', async () => {
    const chain = criarChain({ data: { id: 'cc-1' }, error: null });
    mockFrom.mockReturnValue(chain);
    const { result } = renderHook(() => useCriarCentroCusto(), { wrapper });
    await result.current.mutateAsync({ nome: 'Operações', empresa_id: 'outra-empresa' });
    expect(chain.insert).toHaveBeenCalledWith({ nome: 'Operações', empresa_id: 'empresa-atual' });

    mockUseAuth.mockReturnValue({ currentEmpresaId: null });
    const { result: semEmpresa } = renderHook(() => useCriarCentroCusto(), { wrapper });
    await expect(semEmpresa.current.mutateAsync({ nome: 'Sem escopo' })).rejects.toThrow('Empresa não selecionada');
  });

  it('restringe atualizar, desativar e reativar à empresa ativa', async () => {
    const atualizar = criarChain({ data: { id: 'cc-1' }, error: null });
    mockFrom.mockReturnValue(atualizar);
    const { result: edicao } = renderHook(() => useAtualizarCentroCusto(), { wrapper });
    await edicao.current.mutateAsync({ id: 'cc-1', data: { nome: 'Operações Brasil', empresa_id: 'outra-empresa' } });
    expect(atualizar.update).toHaveBeenCalledWith({ nome: 'Operações Brasil' });
    expect(atualizar.eq).toHaveBeenNthCalledWith(1, 'id', 'cc-1');
    expect(atualizar.eq).toHaveBeenNthCalledWith(2, 'empresa_id', 'empresa-atual');

    const desativar = criarChain({ data: null, error: null });
    mockFrom.mockReturnValue(desativar);
    const { result: exclusao } = renderHook(() => useExcluirCentroCusto(), { wrapper });
    await exclusao.current.mutateAsync('cc-1');
    expect(desativar.update).toHaveBeenCalledWith({ ativo: false });
    expect(desativar.eq).toHaveBeenNthCalledWith(2, 'empresa_id', 'empresa-atual');

    const reativar = criarChain({ data: null, error: null });
    mockFrom.mockReturnValue(reativar);
    const { result: reativacao } = renderHook(() => useReativarCentroCusto(), { wrapper });
    await reativacao.current.mutateAsync('cc-1');
    expect(reativar.update).toHaveBeenCalledWith({ ativo: true });
    expect(reativar.eq).toHaveBeenNthCalledWith(2, 'empresa_id', 'empresa-atual');
  });
});
