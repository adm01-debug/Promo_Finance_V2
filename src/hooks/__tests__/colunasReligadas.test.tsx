/**
 * Testes — valores religados após a migration 20261113163037.
 *
 * Os hooks abaixo descartavam campos do formulário com TODO "coluna não
 * existe". Com as colunas criadas em produção, os payloads voltam a levá-los.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => {
  const channel = { on: vi.fn(() => channel), subscribe: vi.fn(() => channel) };
  return {
    supabase: {
      from: mockFrom,
      auth: { getUser: mockGetUser },
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    },
  };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/formatters', async (orig) => ({
  ...(await orig<typeof import('@/lib/formatters')>()),
  todayISOLocal: () => '2026-11-13',
}));

import { useCreateMovimentacao, useCancelTransferencia } from '../useFinancialOperations';
import { useCreditosTributarios } from '../useCreditosTributarios';
import { useAlertasTributarios } from '../useAlertasTributarios';

type Escrita = { tabela: string; metodo: string; payload: unknown };

function montaCliente(resultado: { data: unknown; error: unknown }) {
  const escritas: Escrita[] = [];
  mockFrom.mockImplementation((tabela: string) => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'insert', 'update', 'eq', 'is', 'in', 'order', 'range', 'single']) {
      chain[m] = vi.fn((...args: unknown[]) => {
        if (m === 'insert' || m === 'update')
          escritas.push({ tabela, metodo: m, payload: args[0] });
        return chain;
      });
    }
    chain.then = (r: (v: unknown) => unknown) => Promise.resolve(resultado).then(r);
    return chain;
  });
  return escritas;
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
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
});

describe('movimentações e transferências', () => {
  it('insert de movimentação leva conta, vínculos, origem e observações', async () => {
    const escritas = montaCliente({ data: { id: 'm1' }, error: null });
    const { result } = renderHook(() => useCreateMovimentacao(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        empresa_id: 'emp-1',
        conta_bancaria_id: 'cb-1',
        tipo: 'entrada',
        descricao: 'X',
        valor: 10,
        data_movimentacao: '2026-11-13',
        categoria_id: 'cat-1',
        conta_receber_id: 'cr-1',
        origem: 'conciliacao',
        observacoes: 'obs',
      });
    });

    expect(escritas[0]).toMatchObject({
      tabela: 'movimentacoes',
      payload: {
        conta_bancaria_id: 'cb-1',
        categoria_id: 'cat-1',
        conta_receber_id: 'cr-1',
        origem: 'conciliacao',
        observacoes: 'obs',
      },
    });
  });

  it('cancelar transferência grava cancelado_em', async () => {
    const escritas = montaCliente({ data: null, error: null });
    const { result } = renderHook(() => useCancelTransferencia(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('t-1');
    });

    const payload = escritas[0].payload as { status: string; cancelado_em: string };
    expect(payload.status).toBe('cancelado');
    expect(Number.isNaN(Date.parse(payload.cancelado_em))).toBe(false);
  });
});

describe('créditos tributários', () => {
  it('criarCredito envia documento, fornecedor, base e alíquota', async () => {
    const escritas = montaCliente({ data: [], error: null });
    const { result } = renderHook(() => useCreditosTributarios(), { wrapper });

    await act(async () => {
      await result.current.criarCredito.mutateAsync({
        empresa_id: 'emp-1',
        tipo_tributo: 'CBS',
        tipo_credito: 'aquisicao_mercadorias',
        documento_tipo: 'nfe',
        documento_numero: '123',
        documento_chave: 'chave',
        fornecedor_id: 'f-1',
        fornecedor_cnpj: '00000000000100',
        fornecedor_nome: 'ACME',
        valor_base: 1000,
        aliquota: 0.009,
        valor_credito: 9,
        data_origem: '2026-11-01',
        competencia_origem: '2026-11-01',
        observacoes: 'obs',
      });
    });

    expect(escritas.find((e) => e.metodo === 'insert')?.payload).toMatchObject({
      tipo_credito: 'aquisicao_mercadorias',
      documento_tipo: 'nfe',
      documento_numero: '123',
      documento_chave: 'chave',
      fornecedor_id: 'f-1',
      fornecedor_cnpj: '00000000000100',
      fornecedor_nome: 'ACME',
      valor_base: 1000,
      aliquota: 0.009,
      observacoes: 'obs',
    });
  });

  it('estornarCredito grava o motivo em observacoes', async () => {
    const escritas = montaCliente({ data: [], error: null });
    const { result } = renderHook(() => useCreditosTributarios(), { wrapper });

    await act(async () => {
      await result.current.estornarCredito.mutateAsync({ id: 'c-1', motivo: 'NF cancelada' });
    });

    expect(escritas.find((e) => e.metodo === 'update')?.payload).toEqual({
      status: 'estornado',
      observacoes: 'Estorno: NF cancelada',
    });
  });
});

describe('alertas tributários', () => {
  it('resolverAlerta grava resolvido_em e resolvido_por do usuário logado', async () => {
    const escritas = montaCliente({ data: [], error: null });
    const { result } = renderHook(() => useAlertasTributarios(), { wrapper });

    await act(async () => {
      await result.current.resolverAlerta.mutateAsync({ alertaId: 'a-1' });
    });

    const payload = escritas.find((e) => e.metodo === 'update')?.payload as Record<string, unknown>;
    expect(payload).toMatchObject({ resolvido: true, resolvido_por: 'user-1' });
    expect(typeof payload.resolvido_em).toBe('string');
  });
});
