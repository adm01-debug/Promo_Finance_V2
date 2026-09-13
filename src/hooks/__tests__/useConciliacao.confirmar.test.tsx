/**
 * Testes — useConciliacao.confirmarConciliacao (Etapa 17)
 *
 * O defeito corrigido: depois que o proxy confirmava a conciliação, dois
 * updates seguiam sem verificação — `transacoes_bancarias.status` e
 * `contas_receber.transacao_conciliada_id` — e o `onSuccess` disparava
 * `toastReconciliationSuccess` de qualquer forma. A conciliação era reportada
 * como concluída com o vínculo nunca gravado.
 *
 * Havia ainda um terceiro caminho silencioso: o `select` inicial da transação
 * descartava o erro, e com `transacao` nula os dois blocos de rastreabilidade
 * eram pulados sem qualquer sinal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown; count?: number | null };

const { mockFrom, mockGetUser, mockInvokeEdge, mockRegistrarEvento, toastSucesso } = vi.hoisted(
  () => ({
    mockFrom: vi.fn(),
    mockGetUser: vi.fn(),
    mockInvokeEdge: vi.fn(),
    mockRegistrarEvento: vi.fn(),
    toastSucesso: vi.fn(),
  })
);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
}));
vi.mock('@/lib/edge-function-error', () => ({
  invokeEdge: mockInvokeEdge,
  handleEdgeError: vi.fn(),
}));
vi.mock('@/lib/financeiro/registrarEvento', () => ({
  registrarEventoFinanceiroOrThrow: mockRegistrarEvento,
}));
vi.mock('@/lib/toast-confetti', () => ({
  toastReconciliationSuccess: toastSucesso,
  toastImportSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useConciliacao } from '../useConciliacao';

function criarChain(resultado: Resultado, registro: string[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'single']) {
    chain[metodo] = vi.fn(() => {
      if (['insert', 'update', 'delete'].includes(metodo)) registro.push(`${tabela}.${metodo}`);
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

const TRANSACAO = { id: 'tx-1', data: '2026-01-15', valor: 100 };

function montaCliente(opcoes: {
  select?: Resultado;
  updateTransacao?: Resultado;
  updateContaReceber?: Resultado;
}) {
  const ordem: string[] = [];
  let primeiraTransacoes = true;

  mockFrom.mockImplementation((tabela: string) => {
    if (tabela === 'transacoes_bancarias') {
      if (primeiraTransacoes) {
        primeiraTransacoes = false;
        return criarChain(opcoes.select ?? { data: TRANSACAO, error: null }, ordem, tabela);
      }
      return criarChain(
        opcoes.updateTransacao ?? { data: [{ id: 'tx-1' }], error: null },
        ordem,
        tabela
      );
    }
    if (tabela === 'contas_receber') {
      return criarChain(
        opcoes.updateContaReceber ?? { data: [{ id: 'cr-1' }], error: null },
        ordem,
        tabela
      );
    }
    throw new Error(`tabela inesperada: ${tabela}`);
  });

  return ordem;
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
  mockInvokeEdge.mockResolvedValue({ ok: true });
  mockRegistrarEvento.mockResolvedValue(undefined);
});

describe('confirmarConciliacao', () => {
  it('confirma a transação e grava o vínculo na conta a receber', async () => {
    const ordem = montaCliente({});
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await result.current.confirmarConciliacao.mutateAsync({
      transacaoId: 'tx-1',
      contaReceberId: 'cr-1',
    });

    expect(ordem).toEqual(['transacoes_bancarias.update', 'contas_receber.update']);
    expect(mockRegistrarEvento).toHaveBeenCalledTimes(1);
  });

  it('falha quando o PostgREST recusa a confirmação da transação', async () => {
    const ordem = montaCliente({
      updateTransacao: { data: null, error: { code: 'PGRST204', message: 'coluna some' } },
    });
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await expect(
      result.current.confirmarConciliacao.mutateAsync({
        transacaoId: 'tx-1',
        contaReceberId: 'cr-1',
      })
    ).rejects.toThrow(/marcar a transação bancária como confirmada/);

    // não chega a tocar na conta a receber
    expect(ordem).toEqual(['transacoes_bancarias.update']);
    expect(toastSucesso).not.toHaveBeenCalled();
  });

  it('falha quando o vínculo na conta a receber não atinge linha alguma', async () => {
    // O caso que a checagem de `error` sozinha não pega: id fora do escopo da
    // empresa ou já removido devolve `error: null` e zero linhas.
    montaCliente({ updateContaReceber: { data: [], error: null } });
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await expect(
      result.current.confirmarConciliacao.mutateAsync({
        transacaoId: 'tx-1',
        contaReceberId: 'cr-1',
      })
    ).rejects.toThrow(/vincular a transação à conta a receber.*nenhuma linha/s);

    expect(toastSucesso).not.toHaveBeenCalled();
  });

  it('falha ao carregar a transação em vez de pular a rastreabilidade em silêncio', async () => {
    const ordem = montaCliente({
      select: { data: null, error: { code: 'PGRST116', message: 'no rows' } },
    });
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await expect(
      result.current.confirmarConciliacao.mutateAsync({
        transacaoId: 'tx-inexistente',
        contaReceberId: 'cr-1',
      })
    ).rejects.toThrow(/carregar a transação bancária a conciliar/);

    // nem o proxy é chamado: nada é confirmado do lado do servidor
    expect(mockInvokeEdge).not.toHaveBeenCalled();
    expect(ordem).toEqual([]);
  });
});
