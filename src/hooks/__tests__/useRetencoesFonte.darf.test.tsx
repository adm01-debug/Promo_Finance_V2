/**
 * Testes — useRetencoesFonte: DARF (Etapas 18 e 21)
 *
 * Etapa 18 tornou verificáveis dois no-ops silenciosos com efeito fiscal
 * direto: retenção que não era marcada voltava à lista de pendentes e entrava
 * no DARF seguinte (recolhimento em duplicidade), e `pagarDARF` lia
 * `retencoes_ids` da lista **em cache**, filtrada por empresa/competência.
 *
 * A Etapa 21 resolve a causa: as duas sequências eram multi-passo, e o
 * PostgREST abre uma transação por requisição — entre a guia e a marcação das
 * retenções havia sempre uma janela em que o banco ficava inconsistente. Agora
 * cada fluxo é uma função Postgres única (`gerar_darf_retencoes` e
 * `pagar_darf_retencoes`), então o que resta ao cliente é: mandar o payload
 * certo, não mandar nada quando a seleção já está inválida, e não engolir o
 * erro que a função levantar.
 *
 * O que estes testes cobrem é justamente isso. As invariantes de banco
 * (dedupe, soma server-side, `darf_gerado = false`, ROW_COUNT, idempotência do
 * pagamento) estão na própria função e foram exercitadas contra um Postgres
 * real — aqui elas apareceriam como asserção sobre um mock, sem valor.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown; count?: number | null };

const { mockFrom, mockRpc, toastErro, toastSucesso } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  toastErro: vi.fn(),
  toastSucesso: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));
vi.mock('sonner', () => ({ toast: { success: toastSucesso, error: toastErro } }));

import { useRetencoesFonte } from '../useRetencoesFonte';

const RETENCAO = {
  id: 'ret-1',
  empresa_id: 'emp-1',
  tipo_retencao: 'irrf',
  valor_retido: 150,
  status: 'pendente',
  darf_gerado: false,
  competencia: '2026-03',
};

/** Chain que responde a qualquer encadeamento e registra a escrita. */
function criarChain(resultado: Resultado, registro: string[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'order',
    'single',
    'maybeSingle',
  ]) {
    chain[metodo] = vi.fn(() => {
      if (['insert', 'update', 'delete'].includes(metodo)) {
        registro.push(`${tabela}.${metodo}`);
      }
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

/**
 * `respostas` é consumida por tabela, na ordem em que `from()` é chamado.
 * A última resposta de cada tabela se repete se faltarem entradas.
 */
function montaCliente(respostas: Record<string, Resultado[]>) {
  const ordem: string[] = [];
  const consumidas: Record<string, number> = {};

  mockFrom.mockImplementation((tabela: string) => {
    const fila = respostas[tabela] ?? [{ data: [], error: null }];
    const i = Math.min(consumidas[tabela] ?? 0, fila.length - 1);
    consumidas[tabela] = (consumidas[tabela] ?? 0) + 1;
    return criarChain(fila[i], ordem, tabela);
  });

  return ordem;
}

/** Resposta da RPC. Sem isto, `mockRpc` devolveria `undefined` e o `await` quebraria. */
function respondeRpc(resultado: Resultado) {
  mockRpc.mockResolvedValue(resultado);
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  respondeRpc({ data: { id: 'darf-1' }, error: null });
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

async function montaHook(respostas: Record<string, Resultado[]>) {
  const ordem = montaCliente(respostas);
  const { result } = renderHook(() => useRetencoesFonte('emp-1', '2026-03'), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return { result, ordem };
}

describe('gerarDARF', () => {
  const argumentos = {
    empresaId: 'emp-1',
    competencia: '2026-03',
    tipoRetencao: 'irrf' as const,
    retencoesIds: ['ret-1'],
  };

  it('emite a guia e marca as retenções numa única transação', async () => {
    const { result, ordem } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
    });

    await result.current.gerarDARF.mutateAsync(argumentos);

    expect(mockRpc).toHaveBeenCalledWith('gerar_darf_retencoes', {
      p_empresa_id: 'emp-1',
      p_competencia: '2026-03',
      p_codigo_receita: '0561',
      p_descricao_receita: 'IRRF - Rendimentos do Trabalho',
      // Competência 2026-03 vence no fim do mês seguinte.
      p_data_vencimento: '2026-04-30',
      p_retencoes_ids: ['ret-1'],
    });

    // O ponto da etapa: nenhuma segunda requisição de escrita. Era ali, entre
    // o insert da guia e o update das retenções, que o banco ficava inconsistente.
    expect(ordem).not.toContain('darfs.insert');
    expect(ordem).not.toContain('retencoes_fonte.update');
  });

  it('não soma valores no cliente: o valor da guia não viaja no payload', async () => {
    // A lista em cache é filtrada pelo RLS. Somar `valor_retido` aqui produzia
    // uma guia menor do que o devido sempre que uma retenção ficasse de fora.
    const { result } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
    });

    await result.current.gerarDARF.mutateAsync(argumentos);

    const payload = mockRpc.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(payload)).not.toContain('p_valor_principal');
    expect(Object.keys(payload)).not.toContain('p_valor_total');
  });

  it('id repetido não vira lote parcial', async () => {
    const { result } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
    });

    await expect(
      result.current.gerarDARF.mutateAsync({ ...argumentos, retencoesIds: ['ret-1', 'ret-1'] })
    ).resolves.toBeTruthy();

    expect(mockRpc.mock.calls[0][1]).toMatchObject({ p_retencoes_ids: ['ret-1'] });
  });

  it('recusa id selecionado que sumiu da lista sem chamar a função', async () => {
    const { result } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
    });

    await expect(
      result.current.gerarDARF.mutateAsync({ ...argumentos, retencoesIds: ['ret-1', 'sumiu'] })
    ).rejects.toThrow(/não está mais disponível/);

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('recusa seleção vazia sem chamar a função', async () => {
    const { result } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
    });

    await expect(
      result.current.gerarDARF.mutateAsync({ ...argumentos, retencoesIds: [] })
    ).rejects.toThrow(/Nenhuma retenção selecionada/);

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('propaga a recusa da função em vez de anunciar sucesso', async () => {
    // `retencoes_indisponiveis` é o que a função levanta quando uma das
    // retenções já entrou noutra guia — dupla inclusão barrada na origem.
    respondeRpc({
      data: null,
      error: {
        code: 'P0001',
        message: 'retencoes_indisponiveis: 1 de 2 retenções estão disponíveis',
      },
    });

    const { result } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
    });

    await expect(result.current.gerarDARF.mutateAsync(argumentos)).rejects.toThrow(
      /gerar o DARF das retenções/
    );

    expect(toastSucesso).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(toastErro).toHaveBeenCalledWith(expect.stringContaining('retencoes_indisponiveis'))
    );
  });
});

describe('pagarDARF', () => {
  it('paga a guia e recolhe as retenções numa única transação', async () => {
    // A lista de DARFs em cache vem vazia — exatamente o caso em que o
    // `darfs.find(...)` antigo devolvia undefined e pulava a marcação inteira.
    // Os ids agora saem da linha travada dentro da função.
    const { result, ordem } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
      darfs: [{ data: [], error: null }],
    });

    await result.current.pagarDARF.mutateAsync({
      darfId: 'darf-1',
      dataPagamento: '2026-04-20',
    });

    expect(mockRpc).toHaveBeenCalledWith('pagar_darf_retencoes', {
      p_darf_id: 'darf-1',
      p_data_pagamento: '2026-04-20',
    });
    expect(ordem).not.toContain('darfs.update');
    expect(ordem).not.toContain('retencoes_fonte.update');
  });

  it('avisa o usuário quando a função recusa o pagamento', async () => {
    respondeRpc({ data: null, error: { code: 'P0001', message: 'darf_nao_pagavel' } });

    const { result } = await montaHook({
      retencoes_fonte: [{ data: [RETENCAO], error: null }],
      darfs: [{ data: [], error: null }],
    });

    await expect(
      result.current.pagarDARF.mutateAsync({ darfId: 'darf-1', dataPagamento: '2026-04-20' })
    ).rejects.toThrow(/registrar o pagamento do DARF/);

    await waitFor(() =>
      expect(toastErro).toHaveBeenCalledWith(expect.stringContaining('registrar o pagamento'))
    );
  });
});
