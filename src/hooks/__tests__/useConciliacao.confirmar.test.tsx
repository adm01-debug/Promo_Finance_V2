/**
 * Testes — useConciliacao.confirmarConciliacao (Etapas 17 e 21)
 *
 * Etapa 17: depois que o proxy confirmava a conciliação, dois updates seguiam
 * sem verificação — `transacoes_bancarias` e `contas_receber` — e o `onSuccess`
 * disparava `toastReconciliationSuccess` de qualquer forma. Havia ainda um
 * terceiro caminho silencioso: o `select` inicial descartava o erro e, com
 * `transacao` nula, os blocos de rastreabilidade eram pulados sem sinal.
 *
 * Etapa 21 elimina os dois updates. A RPC por trás do proxy já gravava
 * `status`, `conciliada`, `data_confirmacao`, `confirmado_por` e o vínculo
 * `contas_receber.transacao_conciliada_id` — o cliente estava reescrevendo
 * fora da transação o que o servidor já tinha gravado dentro dela. O único
 * dado que faltava, os metadados de compensação, agora viaja no próprio
 * payload de confirmação (`p_metadados`) e é aplicado no mesmo COMMIT.
 *
 * O que sobra ao cliente, e é o que estes testes cobrem: carregar a transação
 * sem engolir erro, montar os metadados certos, e não anunciar sucesso quando
 * o proxy recusa.
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

function montaCliente(opcoes: { select?: Resultado }) {
  const ordem: string[] = [];

  mockFrom.mockImplementation((tabela: string) => {
    if (tabela === 'transacoes_bancarias') {
      return criarChain(opcoes.select ?? { data: TRANSACAO, error: null }, ordem, tabela);
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
  it('confirma pelo proxy sem reescrever nada fora da transação', async () => {
    const ordem = montaCliente({});
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await result.current.confirmarConciliacao.mutateAsync({
      transacaoId: 'tx-1',
      contaReceberId: 'cr-1',
    });

    // Nenhuma escrita do cliente: era exatamente aí, entre o COMMIT da RPC e
    // estes updates, que a conciliação podia ficar pela metade.
    expect(ordem).toEqual([]);
    expect(mockInvokeEdge).toHaveBeenCalledTimes(1);
    expect(mockRegistrarEvento).toHaveBeenCalledTimes(1);
  });

  it('manda os metadados de compensação junto com a confirmação', async () => {
    montaCliente({});
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await result.current.confirmarConciliacao.mutateAsync({
      transacaoId: 'tx-1',
      contaReceberId: 'cr-1',
      ajusteCentavos: -0.03,
      motivo: 'Tolerância configurada',
      regraId: 'regra-1',
    });

    expect(mockInvokeEdge).toHaveBeenCalledWith('conciliacao-proxy', {
      action: 'confirmar',
      transacaoId: 'tx-1',
      contaPagarId: null,
      contaReceberId: 'cr-1',
      // Apesar do nome, o ajuste trafega em reais. O schema do proxy exigia
      // `.int()` e rejeitava com 400 justamente o valor que a tolerância produz.
      ajusteCentavos: -0.03,
      metadados: {
        regra_id: 'regra-1',
        compensacao_valor: -0.03,
        compensacao_motivo: 'Tolerância configurada',
        compensacao_classificacao: 'Desconto',
        compensacao_regra: 'Ajuste automático de centavos',
        compensacao_evidencia_url: null,
      },
    });
  });

  it('não manda bloco de compensação quando não houve ajuste', async () => {
    montaCliente({});
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await result.current.confirmarConciliacao.mutateAsync({
      transacaoId: 'tx-1',
      contaPagarId: 'cp-1',
    });

    const payload = mockInvokeEdge.mock.calls[0][1] as { metadados: Record<string, unknown> };
    expect(payload.metadados).toEqual({ regra_id: null });
  });

  it('falha quando o proxy recusa a confirmação, sem toast de sucesso', async () => {
    mockInvokeEdge.mockRejectedValueOnce(new Error('forbidden_empresa_access'));
    montaCliente({});
    const { result } = renderHook(() => useConciliacao(), { wrapper });

    await expect(
      result.current.confirmarConciliacao.mutateAsync({
        transacaoId: 'tx-1',
        contaReceberId: 'cr-1',
      })
    ).rejects.toThrow(/forbidden_empresa_access/);

    // A rastreabilidade não é gravada sobre uma conciliação que não aconteceu.
    expect(mockRegistrarEvento).not.toHaveBeenCalled();
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
