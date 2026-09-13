/**
 * Testes — aprovarPagamento (Etapa 16)
 *
 * O defeito corrigido: o update em `contas_pagar` era `await` sem verificação,
 * e o `toast.success('Pagamento aprovado com sucesso!')` disparava logo abaixo.
 * Um pagamento podia ser reportado como aprovado sem que o aprovador fosse
 * gravado — a forma exata do incidente PGRST204 registrado no repositório, e a
 * L82 ainda carrega o TODO de uma coluna removida dessa mesma tabela.
 *
 * Os testes cobrem as três falhas que ficavam invisíveis: erro do PostgREST,
 * update que não atinge linha alguma, e a ordem dos dois passos.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
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

/**
 * @param contasPagar resultado do update em `contas_pagar`
 * @param solicitacaoUpdate resultado do update em `solicitacoes_aprovacao`
 */
function montaCliente(
  contasPagar: Resultado,
  solicitacaoUpdate: Resultado = { data: [{ id: 'sol-1' }], error: null },
  busca: Resultado = { data: SOLICITACAO, error: null }
) {
  const ordem: string[] = [];
  let primeiraChamadaSolicitacoes = true;

  mockFrom.mockImplementation((tabela: string) => {
    if (tabela === 'contas_pagar') return criarChain(contasPagar, ordem, 'contas_pagar');
    if (tabela === 'solicitacoes_aprovacao') {
      // a primeira chamada é o SELECT da solicitação pendente
      if (primeiraChamadaSolicitacoes) {
        primeiraChamadaSolicitacoes = false;
        return criarChain(busca, ordem, 'solicitacoes_aprovacao');
      }
      return criarChain(solicitacaoUpdate, ordem, 'solicitacoes_aprovacao');
    }
    throw new Error(`tabela inesperada: ${tabela}`);
  });

  return ordem;
}

const queryClient = { invalidateQueries: vi.fn() } as never;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
});

describe('aprovarPagamento', () => {
  it('aprova e grava o aprovador na conta antes de encerrar a solicitação', async () => {
    const ordem = montaCliente({ data: [{ id: 'cp-1' }], error: null });

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado.success).toBe(true);
    // A ordem importa: se o segundo passo falhar, a solicitação continua
    // pendente e reaprovar é idempotente.
    expect(ordem).toEqual(['contas_pagar.update', 'solicitacoes_aprovacao.update']);
    expect(toastMock.success).toHaveBeenCalledWith('Pagamento aprovado com sucesso!');
  });

  it('não encerra a solicitação nem confirma ao usuário quando o PostgREST recusa a conta', async () => {
    const ordem = montaCliente({
      data: null,
      error: { code: 'PGRST204', message: "Could not find the 'aprovado_por' column" },
    });

    await expect(aprovarPagamento('sol-1', queryClient)).rejects.toThrow(
      /Campo inexistente na tabela/
    );

    expect(ordem).toEqual(['contas_pagar.update']);
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('falha quando o update não atinge linha alguma — o no-op silencioso', async () => {
    // `.eq('id', <inexistente>)` devolve error null e zero linhas. Era este o
    // caso que passava direto mesmo com checagem de erro.
    const ordem = montaCliente({ data: [], error: null });

    await expect(aprovarPagamento('sol-1', queryClient)).rejects.toThrow(
      /nenhuma linha foi afetada/
    );

    expect(ordem).toEqual(['contas_pagar.update']);
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('recusa a aprovação sem usuário autenticado, sem escrever nada', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const ordem = montaCliente({ data: [{ id: 'cp-1' }], error: null });

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado).toEqual({
      success: false,
      message: 'Sessão expirada. Faça login novamente para aprovar.',
    });
    expect(ordem).toEqual([]);
  });

  it('recusa solicitação sem conta a pagar vinculada, sem escrever nada', async () => {
    const ordem = montaCliente(
      { data: [{ id: 'cp-1' }], error: null },
      { data: [{ id: 'sol-1' }], error: null },
      { data: { ...SOLICITACAO, conta_pagar_id: null }, error: null }
    );

    const resultado = await aprovarPagamento('sol-1', queryClient);

    expect(resultado.success).toBe(false);
    expect(resultado.message).toContain('não está vinculada a uma conta a pagar');
    expect(ordem).toEqual([]);
  });

  it('propaga a falha do encerramento da solicitação em vez de confirmar sucesso', async () => {
    const ordem = montaCliente({ data: [{ id: 'cp-1' }], error: null }, { data: [], error: null });

    await expect(aprovarPagamento('sol-1', queryClient)).rejects.toThrow(
      /encerrar a solicitação de aprovação/
    );

    expect(ordem).toEqual(['contas_pagar.update', 'solicitacoes_aprovacao.update']);
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
