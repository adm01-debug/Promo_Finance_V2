/**
 * Testes — useContratos
 * Cobre listagem (com/sem filtro de empresa), erro de query e a mutation
 * de criação com payload alinhado ao schema canônico de contratos.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useContratos,
  useCreateContrato,
  useUpdateContrato,
  useDeleteContrato,
} from '../useContratos';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
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

const SELECT_JOIN =
  '*, cliente:clientes(id, razao_social), fornecedor:fornecedores(id, razao_social)';

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

describe('useContratos (listagem)', () => {
  it('lista contratos com join de cliente/fornecedor e order desc', async () => {
    const contratos = [{ id: 'c1', descricao: 'Contrato A' }];
    const chain = criarChain({ data: contratos, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useContratos(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('contratos');
    expect(chain.select).toHaveBeenCalledWith(SELECT_JOIN);
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(chain.eq).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(contratos);
  });

  it('aplica filtro eq(empresa_id) quando empresaId é informado', async () => {
    const chain = criarChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useContratos('emp-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('empresa_id', 'emp-1');
  });

  it('propaga erro da listagem', async () => {
    mockFrom.mockReturnValue(criarChain({ data: null, error: { message: 'falha' } }));

    const { result } = renderHook(() => useContratos(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as { message: string }).message).toBe('falha');
  });
});

describe('useCreateContrato (insert)', () => {
  it('insere payload alinhado ao schema canônico, sem campos fora dele', async () => {
    const criado = { id: 'c1', descricao: 'Contrato X' };
    const chain = criarChain({ data: criado, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCreateContrato(), { wrapper });
    const spyInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const input = {
      descricao: 'Contrato X',
      tipo: 'servico',
      data_inicio: '2026-01-01',
      data_fim: '2027-01-01',
      valor_mensal: 1000,
      valor_total: 12000,
      empresa_id: 'emp-1',
      renovacao_automatica: true,
      numero_contrato: 'CT-001',
      // Campos fora do schema canônico não devem ir ao payload enviado:
      cliente_id: 'cli-1',
      fornecedor_id: 'forn-1',
      dias_aviso_renovacao: 30,
      observacoes: 'obs',
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(mockFrom).toHaveBeenCalledWith('contratos');
    expect(chain.insert).toHaveBeenCalledWith({
      descricao: 'Contrato X',
      tipo: 'servico',
      data_inicio: '2026-01-01',
      data_fim: '2027-01-01',
      valor_mensal: 1000,
      valor_total: 12000,
      empresa_id: 'emp-1',
      renovacao_automatica: true,
      numero_contrato: 'CT-001',
      status: 'ativo',
    });
    expect(chain.select).toHaveBeenCalledTimes(1);
    expect(chain.single).toHaveBeenCalledTimes(1);
    expect(spyInvalidate).toHaveBeenCalledWith({ queryKey: ['contratos'] });
    expect(toast.success).toHaveBeenCalledWith('Contrato criado!');
    await waitFor(() => expect(result.current.data).toEqual(criado));
  });

  it('propaga erro do insert e mostra toast de erro', async () => {
    mockFrom.mockReturnValue(criarChain({ data: null, error: { message: 'duplicado' } }));

    const { result } = renderHook(() => useCreateContrato(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          descricao: 'X',
          tipo: 'servico',
          data_inicio: '2026-01-01',
        });
      } catch {
        // erro esperado — propagado pelo mutateAsync
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Erro: duplicado');
  });
});

describe('useUpdateContrato / useDeleteContrato', () => {
  it('update envia patch com eq(id) e invalida cache', async () => {
    const chain = criarChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateContrato(), { wrapper });
    const spyInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await result.current.mutateAsync({ id: 'c1', valor_mensal: 999, status: 'ativo' });
    });

    expect(mockFrom).toHaveBeenCalledWith('contratos');
    expect(chain.update).toHaveBeenCalledWith({ valor_mensal: 999, status: 'ativo' });
    expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
    expect(spyInvalidate).toHaveBeenCalledWith({ queryKey: ['contratos'] });
    expect(toast.success).toHaveBeenCalledWith('Contrato atualizado!');
  });

  it('delete marca status cancelado com eq(id)', async () => {
    const chain = criarChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useDeleteContrato(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('c1');
    });

    expect(mockFrom).toHaveBeenCalledWith('contratos');
    expect(chain.update).toHaveBeenCalledWith({ status: 'cancelado' });
    expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
    expect(toast.success).toHaveBeenCalledWith('Contrato cancelado!');
  });
});
