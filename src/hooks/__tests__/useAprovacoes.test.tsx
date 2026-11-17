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

import {
  useComentariosAprovacao,
  useConfiguracaoAprovacao,
  useUpdateConfiguracaoAprovacao,
  useConfiguracaoAprovacaoEditavel,
} from '@/hooks/useAprovacoes';

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
  const builder = {
    eq: vi.fn(),
    order: vi.fn(),
    select: vi.fn(),
    limit: vi.fn(),
    update: vi.fn(),
    neq: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    then: ((
      onFulfilled?: ((v: { data: unknown; error: unknown }) => unknown) | null,
      onRejected?: ((r: unknown) => unknown) | null
    ) =>
      Promise.resolve(resultado).then(onFulfilled as never, onRejected as never)) as PromiseLike<{
      data: unknown;
      error: unknown;
    }>['then'],
  };
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.neq.mockReturnValue(builder);
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

describe('useConfiguracaoAprovacao (alcada com varias faixas ativas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // As tres faixas de producao (5.000 / 50.000 / 999.999), semeadas duas vezes
  // em 2026-07-28: 6 linhas com ativo=true para a mesma empresa.
  const seisFaixasAtivas = [
    {
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_aprovacao: 5000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    },
    {
      id: 'b',
      empresa_id: 'e1',
      valor_minimo_aprovacao: 50000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    },
    {
      id: 'c',
      empresa_id: 'e1',
      valor_minimo_aprovacao: 999999,
      aprovadores_obrigatorios: 1,
      ativo: true,
    },
    {
      id: 'd',
      empresa_id: 'e1',
      valor_minimo_aprovacao: 5000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    },
    {
      id: 'e',
      empresa_id: 'e1',
      valor_minimo_aprovacao: 50000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    },
    {
      id: 'f',
      empresa_id: 'e1',
      valor_minimo_aprovacao: 999999,
      aprovadores_obrigatorios: 1,
      ativo: true,
    },
  ];

  it('carrega a configuracao com 6 faixas ativas, em vez de quebrar no maybeSingle', async () => {
    // Antes: .maybeSingle() com 6 linhas devolvia erro, o hook fazia throw, e os
    // consumidores caiam em requerAprovacao = false -- nenhum pagamento exigia
    // aprovacao, qualquer que fosse o valor.
    const chain = buildChain({ data: [seisFaixasAtivas[0]], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useConfiguracaoAprovacao('e1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.ativo).toBe(true);
    expect(result.current.data?.valor_minimo_aprovacao).toBe(5000);
  });

  it('pede a MENOR faixa ativa ao banco: ordena crescente e limita a 1', async () => {
    const chain = buildChain({ data: [seisFaixasAtivas[0]], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useConfiguracaoAprovacao('e1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('configuracoes_aprovacao');
    expect(chain.order).toHaveBeenCalledWith('valor_minimo_aprovacao', { ascending: true });
    expect(chain.limit).toHaveBeenCalledWith(1);
    // o contrato antigo nao pode voltar
    expect(chain.maybeSingle).not.toHaveBeenCalled();
    expect(chain.single).not.toHaveBeenCalled();
  });

  it('filtra por empresa quando o chamador informa, e nao filtra quando nao informa', async () => {
    const comEmpresa = buildChain({ data: [seisFaixasAtivas[0]], error: null });
    mockFrom.mockReturnValue(comEmpresa);
    const r1 = renderHook(() => useConfiguracaoAprovacao('e1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(r1.result.current.isSuccess).toBe(true));
    expect(comEmpresa.eq).toHaveBeenCalledWith('empresa_id', 'e1');

    vi.clearAllMocks();
    const semEmpresa = buildChain({ data: [seisFaixasAtivas[0]], error: null });
    mockFrom.mockReturnValue(semEmpresa);
    const r2 = renderHook(() => useConfiguracaoAprovacao(), { wrapper: makeWrapper() });
    await waitFor(() => expect(r2.result.current.isSuccess).toBe(true));
    expect(semEmpresa.eq).toHaveBeenCalledWith('ativo', true);
    expect(semEmpresa.eq).not.toHaveBeenCalledWith('empresa_id', expect.anything());
  });

  it('sem faixa ativa devolve null, e nao um objeto falso', async () => {
    const chain = buildChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useConfiguracaoAprovacao('e1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useUpdateConfiguracaoAprovacao (gravacao na faixa editada)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('grava nas duplicatas da faixa editada, e NAO nas outras faixas', async () => {
    // Revisao da PR #400, duas rodadas. Round 2 (Devin/Codex): gravar so o id
    // deixava a duplicata de 5.000 como a menor e o limite salvo nao fazia
    // efeito. Round 3 (Devin): gravar a empresa inteira apagava as faixas de
    // 50.000 e 999.999 -- perda de dado em producao. O escopo certo e a faixa:
    // empresa + o valor que o painel carregou.
    const chain = buildChain({ data: [{ id: 'a' }, { id: 'd' }], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_original: 5000,
      valor_minimo_aprovacao: 10000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.update).toHaveBeenCalledWith({
      valor_minimo_aprovacao: 10000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    });
    expect(chain.eq).toHaveBeenCalledWith('empresa_id', 'e1');
    // delimita a faixa pelo valor ORIGINAL: as outras faixas nao sao tocadas
    expect(chain.eq).toHaveBeenCalledWith('valor_minimo_aprovacao', 5000);
    expect(chain.eq).not.toHaveBeenCalledWith('id', 'a');
  });

  it('desativar atinge a faixa editada, nao os outros patamares', async () => {
    const chain = buildChain({ data: [{ id: 'a' }], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_original: 5000,
      valor_minimo_aprovacao: 5000,
      aprovadores_obrigatorios: 1,
      ativo: false,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
    expect(chain.eq).toHaveBeenCalledWith('valor_minimo_aprovacao', 5000);
  });

  it('sem empresa ou sem valor original, mantem a gravacao por id', async () => {
    const chain = buildChain({ data: [{ id: 'z' }], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'z',
      empresa_id: null,
      valor_minimo_aprovacao: 7000,
      aprovadores_obrigatorios: 2,
      ativo: true,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'z');
    expect(chain.eq).not.toHaveBeenCalledWith('empresa_id', expect.anything());
  });
  it('recusa subir o limite acima de outra faixa ativa, em vez de nao fazer efeito', async () => {
    // Revisao da PR #400, round 6 (Codex): salvar 100.000 atualizava as
    // duplicatas de 5.000 mas 50.000 seguia ativa; as duas leituras voltavam a
    // escolher 50.000, o card substituia o valor recem-salvo e pagamento de
    // 75.000 seguia bloqueado -- com toast de sucesso.
    const consulta = buildChain({ data: [{ valor_minimo_aprovacao: 50000 }], error: null });
    mockFrom.mockReturnValue(consulta);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_original: 5000,
      valor_minimo_aprovacao: 100000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(String(result.current.error?.message)).toMatch(/outra faixa ativa/i);
    expect(String(result.current.error?.message)).toMatch(/nao teria efeito/i);
    // recusou ANTES de gravar
    expect(consulta.update).not.toHaveBeenCalled();
  });

  it('recusa o limite IGUAL ao de outra faixa ativa (colisao de quorum)', async () => {
    // Revisao da PR #400, round 8 (Codex): salvar a faixa de 5.000 como 50.000 com
    // quorum 2 passava no `>`, mas o update so alcanca as linhas que estavam em
    // 5.000: sobrariam duas faixas ativas em 50.000 com quoruns diferentes, e a
    // leitura podia devolver a antiga, substituindo o quorum recem-salvo.
    const consulta = buildChain({ data: [{ valor_minimo_aprovacao: 50000 }], error: null });
    mockFrom.mockReturnValue(consulta);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_original: 5000,
      valor_minimo_aprovacao: 50000,
      aprovadores_obrigatorios: 2,
      ativo: true,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(String(result.current.error?.message)).toMatch(/no mesmo valor informado/i);
    expect(consulta.update).not.toHaveBeenCalled();
  });

  it('recusa desativar quando outra faixa ativa continuaria exigindo aprovacao', async () => {
    const consulta = buildChain({ data: [{ valor_minimo_aprovacao: 50000 }], error: null });
    mockFrom.mockReturnValue(consulta);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_original: 5000,
      valor_minimo_aprovacao: 5000,
      aprovadores_obrigatorios: 1,
      ativo: false,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(String(result.current.error?.message)).toMatch(/nao desliga o workflow/i);
    expect(consulta.update).not.toHaveBeenCalled();
  });

  it('sem outra faixa ativa, grava normalmente em UM unico update', async () => {
    // Um request so: o esquema de dois updates sem transacao deixava o limite
    // gravado quando o segundo falhava, e a nova tentativa acusava conflito
    // contra um valor que nao existia mais (Devin, round 6).
    const chain = buildChain({ data: [{ id: 'a' }, { id: 'd' }], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_original: 5000,
      valor_minimo_aprovacao: 10000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.update).toHaveBeenCalledTimes(1);
    expect(chain.update).toHaveBeenCalledWith({
      valor_minimo_aprovacao: 10000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    });
    expect(chain.eq).toHaveBeenCalledWith('valor_minimo_aprovacao', 5000);
  });

  it('conflito: zero linha atualizada NAO pode virar sucesso', async () => {
    // Revisao da PR #400, round 4 (Codex): dois administradores carregam a faixa
    // de 5.000; o primeiro muda para 10.000. O segundo salva, o filtro por
    // valor_minimo_original = 5000 nao casa mais nada, e o PostgREST devolve
    // `data: []` com `error: null` -- toast de sucesso sem gravar nada, que e o
    // mesmo tipo de mentira que esta PR comecou corrigindo.
    const chain = buildChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useUpdateConfiguracaoAprovacao(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      id: 'a',
      empresa_id: 'e1',
      valor_minimo_original: 5000,
      valor_minimo_aprovacao: 20000,
      aprovadores_obrigatorios: 1,
      ativo: true,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(String(result.current.error?.message)).toMatch(/alterada por outra pessoa/i);
    expect(result.current.isSuccess).toBe(false);
  });
});

describe('useConfiguracaoAprovacaoEditavel (painel nao fica trancado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acha a configuracao mesmo com TODAS as faixas inativas', async () => {
    // Revisao da PR #400 (Devin): com a leitura efetiva (ativo=true), desativar
    // o workflow deixava o painel sem registro e handleSave saia no
    // `if (!config)` -- nao havia como reativar pela tela.
    const chain = buildChain({
      data: [
        {
          id: 'a',
          empresa_id: 'e1',
          valor_minimo_aprovacao: 5000,
          aprovadores_obrigatorios: 1,
          ativo: false,
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useConfiguracaoAprovacaoEditavel('e1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.ativo).toBe(false);
    // o que garante a reativacao: nao filtra por ativo
    expect(chain.eq).not.toHaveBeenCalledWith('ativo', true);
    expect(chain.eq).toHaveBeenCalledWith('empresa_id', 'e1');
    expect(chain.order).toHaveBeenCalledWith('valor_minimo_aprovacao', { ascending: true });
  });

  it('prioriza a faixa ATIVA: o painel nao pode mostrar faixa inativa com outra ativa', async () => {
    // Revisao da PR #400 (Codex P2): com as tres faixas inativas, reativar
    // informando 100.000 passa pela validacao (ela so procura outras ATIVAS) e
    // grava na faixa de 5.000. Ordenando so por valor, o painel voltava a ler a
    // faixa INATIVA de 50.000 e anunciava "Workflow desativado. Todos os
    // pagamentos serao liberados automaticamente", enquanto o gate de pagamento
    // lia a ATIVA de 100.000 e seguia exigindo aprovacao.
    const chain = buildChain({
      data: [
        {
          id: 'a',
          empresa_id: 'e1',
          valor_minimo_aprovacao: 100000,
          aprovadores_obrigatorios: 1,
          ativo: true,
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useConfiguracaoAprovacaoEditavel('e1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // o que garante que a ativa vem primeiro (e NULL por ultimo: `ativo` e
    // nullable, e DESC traria NULL na frente)
    expect(chain.order).toHaveBeenCalledWith('ativo', { ascending: false, nullsFirst: false });
    expect(result.current.data?.ativo).toBe(true);
    expect(result.current.data?.valor_minimo_aprovacao).toBe(100000);
  });
});
