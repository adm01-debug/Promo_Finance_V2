/**
 * Testes — aprovarPagamento (Etapas 16 e 21)
 *
 * Etapa 16: o update em `contas_pagar` era `await` sem verificação, e o
 * `toast.success('Pagamento aprovado com sucesso!')` disparava logo abaixo. Um
 * pagamento podia ser reportado como aprovado sem que o aprovador fosse gravado
 * — a forma exata do incidente PGRST204 registrado no repositório.
 *
 * Etapa 21: mesmo verificados, os dois updates eram requisições separadas, e o
 * PostgREST abre uma transação por requisição. Entre uma e outra existia uma
 * janela em que a conta já tinha aprovador e a solicitação seguia pendente.
 * `aprovar_solicitacao_pagamento` faz as duas gravações no mesmo COMMIT, com
 * `FOR UPDATE` na solicitação — o que também serializa dois aprovadores
 * clicando ao mesmo tempo. É SECURITY INVOKER: quem decide o que é visível
 * continua sendo o RLS.
 *
 * O que sobra ao cliente, e é o que estes testes cobrem: os pré-checks que
 * ainda falam português, chamar a função uma vez só, e não anunciar sucesso
 * quando ela recusa.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockRpc, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, rpc: mockRpc, auth: { getUser: mockGetUser } },
}));

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastMock }));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { aprovarPagamento } from '../financial-actions';

type Resultado = { data: unknown; error: unknown; count?: number | null };

/** Cadeia thenable: qualquer método devolve a própria cadeia; `await` resolve o resultado. */
function criarChain(resultado: Resultado, registro: string[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'or', 'in', 'maybeSingle']) {
    chain[metodo] = vi.fn((...args: unknown[]) => {
      if (['insert', 'update', 'delete'].includes(metodo)) {
        registro.push(`${tabela}.${metodo}`);
      }
      void args;
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

const SOLICITACAO = {
  id: 'sol-1',
  conta_pagar_id: 'cp-1',
  contas_pagar: { fornecedor_nome: 'ACME' },
};

/** @param busca resultado do SELECT da solicitação pendente. */
function montaCliente(busca: Resultado = { data: SOLICITACAO, error: null }) {
  const ordem: string[] = [];

  mockFrom.mockImplementation((tabela: string) => {
    if (tabela === 'solicitacoes_aprovacao') return criarChain(busca, ordem, tabela);
    throw new Error(`tabela inesperada: ${tabela}`);
  });

  return ordem;
}

const queryClient = { invalidateQueries: vi.fn() } as never;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockRpc.mockResolvedValue({
    data: {
      solicitacao_id: 'sol-1',
      conta_pagar_id: 'cp-1',
      fornecedor_nome: 'ACME',
      aprovado_por: 'user-1',
    },
    error: null,
  });
});

describe('aprovarPagamento', () => {
  it('aprova as duas tabelas numa transação só, sem escrita do cliente', async () => {
    const ordem = montaCliente();

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('aprovar_solicitacao_pagamento', {
      p_solicitacao_id: 'sol-1',
    });
    // Era entre os dois updates do cliente que a aprovação podia ficar pela
    // metade; agora não há update nenhum fora da função.
    expect(ordem).toEqual([]);
    expect(toastMock.success).toHaveBeenCalledWith('Pagamento aprovado com sucesso!');
  });

  it('usa o fornecedor lido dentro da transação, não o retrato anterior', async () => {
    mockRpc.mockResolvedValue({
      data: { solicitacao_id: 'sol-1', conta_pagar_id: 'cp-1', fornecedor_nome: 'ACME LTDA' },
      error: null,
    });
    montaCliente();

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado.message).toContain('ACME LTDA');
  });

  it('não confirma ao usuário quando a função recusa a gravação', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'conta_pagar_inacessivel' },
    });
    montaCliente();

    await expect(aprovarPagamento('sol-1', queryClient)).rejects.toThrow(
      /aprovar a solicitação de pagamento/
    );

    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('propaga a corrida entre dois aprovadores em vez de aprovar duas vezes', async () => {
    // `FOR UPDATE` serializa os dois cliques; o segundo já não encontra a
    // solicitação pendente e a função levanta `solicitacao_nao_pendente`.
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'P0002', message: 'solicitacao_nao_pendente' },
    });
    montaCliente();

    await expect(aprovarPagamento('sol-1', queryClient)).rejects.toThrow(
      /solicitacao_nao_pendente/
    );

    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('recusa a aprovação sem usuário autenticado, sem chamar a função', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const ordem = montaCliente();

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado).toEqual({
      success: false,
      message: 'Sessão expirada. Faça login novamente para aprovar.',
    });
    expect(mockRpc).not.toHaveBeenCalled();
    expect(ordem).toEqual([]);
  });

  it('recusa solicitação sem conta a pagar vinculada, sem chamar a função', async () => {
    // A função barra o mesmo caso (`solicitacao_sem_conta_pagar`), mas o
    // pré-check é o que mantém a explicação em português na tela.
    montaCliente({ data: { ...SOLICITACAO, conta_pagar_id: null }, error: null });

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado.success).toBe(false);
    expect(resultado.message).toContain('não está vinculada a uma conta a pagar');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('não chama a função quando a solicitação não está mais pendente', async () => {
    montaCliente({ data: null, error: null });

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado.success).toBe(false);
    expect(resultado.message).toContain('não encontrada ou já processada');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
