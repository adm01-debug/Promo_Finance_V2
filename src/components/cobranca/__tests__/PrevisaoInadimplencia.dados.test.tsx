/**
 * Segunda metade dos testes da previsao: escala do score, atraso no historico e
 * paginacao. Separado de PrevisaoInadimplencia.escopo.test.tsx porque o arquivo
 * bateu no limite de 400 linhas do eslint (max-lines), que vale para teste.
 *
 * Contexto original: 589 linhas em 4 arquivos (PrevisaoInadimplencia + previsao/*)
 * estavam prontas e SEM nenhum caminho na UI -- nenhum import, nenhuma rota,
 * nenhum lazy(). E docs/INVENTARIO_FUNCIONALIDADES.md:270 e
 * docs/FUNCIONALIDADES_SISTEMA.md:111 listavam a funcionalidade como entregue.
 *
 * Ao ligar na tela, as duas consultas do hook nao filtravam empresa: a analise
 * somaria clientes de todas as empresas acessiveis num unico ranking de risco, e
 * atraso do mesmo cliente em OUTRA empresa elevaria o risco aqui.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Filtro = { metodo: string; coluna?: string; valor?: unknown };
const { mockFrom, filtros } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  filtros: [] as Filtro[],
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { PrevisaoInadimplencia } from '../PrevisaoInadimplencia';

/**
 * Builder que registra cada filtro e PAGINA de verdade: `range(de, ate)` devolve
 * a fatia correspondente e a contagem exata, como o PostgREST com
 * `count: 'exact'`. Sem isso o teste nao distingue leitura completa de leitura
 * truncada na primeira pagina.
 */
function builder(resultado: { data: unknown; error: unknown; tetoServidor?: number }) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'in', 'gte', 'lte', 'lt', 'eq', 'order']) {
    b[m] = vi.fn((coluna?: unknown, valor?: unknown) => {
      filtros.push({ metodo: m, coluna: coluna as string, valor });
      return b;
    });
  }
  const linhas = Array.isArray(resultado.data) ? (resultado.data as unknown[]) : null;
  b.range = vi.fn((de: number, ate: number) => {
    filtros.push({ metodo: 'range', coluna: String(de), valor: ate });
    if (resultado.error) return Promise.resolve({ data: null, error: resultado.error });
    const janela = linhas ? linhas.slice(de, ate + 1) : null;
    return Promise.resolve({
      // teto do servidor: devolve MENOS que a janela pedida, como um
      // db-max-rows menor que o range
      data: janela
        ? resultado.tetoServidor
          ? janela.slice(0, resultado.tetoServidor)
          : janela
        : resultado.data,
      error: null,
      count: linhas ? linhas.length : null,
    });
  });
  b.then = ((ok?: (v: typeof resultado) => unknown, err?: (r: unknown) => unknown) =>
    Promise.resolve(resultado).then(ok as never, err as never)) as never;
  return b;
}

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

/**
 * Vencimento sempre a 20 dias de HOJE: a probabilidade ganha +10 pontos quando o
 * proximo vencimento esta a 7 dias ou menos, e +10 a 3 dias ou menos
 * (PrevisaoInadimplencia.tsx:105-112). Com data fixa, o teste de 30% viraria 40%
 * ao chegar perto do vencimento -- falha sem regressao no produto (revisao da
 * PR #404, Devin).
 */
const VENCE_EM_20_DIAS = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);

/** Uma pendencia + um cliente, para a analise chegar na consulta do historico. */
const PENDENTE = {
  id: 't1',
  valor: 10000,
  valor_recebido: null,
  data_vencimento: VENCE_EM_20_DIAS,
  status: 'pendente',
  cliente_id: 'cli-1',
  cliente_nome: 'Cliente Um',
  clientes: {
    id: 'cli-1',
    razao_social: 'Cliente Um',
    nome_fantasia: null,
    score: null,
    limite_credito: 50000,
    ramo_atividade: null,
  },
};

describe('PrevisaoInadimplencia — escala do score e atraso no historico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filtros.length = 0;
  });

  it('score 250 (escala 0-1000) pontua risco, e nao passa por cliente bom', async () => {
    // Revisao da PR #404 (Devin): os limites eram 50/70/85, de uma escala 0-100,
    // enquanto useScoringClientes grava 0-1000 -- 250 recebia zero ponto.
    const respostas = [
      {
        data: [{ ...PENDENTE, clientes: { ...PENDENTE.clientes, score: 250 } }],
        error: null,
      },
      { data: [], error: null },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByText(/Score baixo \(250 de 1000\)/i)).toBeInTheDocument();
    // Revisao da PR #404 (Devin): so o fator textual nao protege a
    // classificacao -- os limites antigos deixariam este teste verde. Com score
    // 250 a probabilidade e 30% (nivel medio); com 50/70/85 seria 0% e baixo.
    expect(screen.getByText(/30% risco/i)).toBeInTheDocument();
  });

  it('score nulo e exibido como nao calculado, sem inventar 100', async () => {
    const respostas = [
      { data: [PENDENTE], error: null },
      { data: [], error: null },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByText(/Score não calculado para este cliente/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: não calculado/i)).toBeInTheDocument();
  });

  it('titulo sem cadastro de cliente NAO derruba a previsao dos demais', async () => {
    // Revisao da PR #404 (Codex P1 / Devin): a chave de agrupamento virava o
    // nome digitado e ia para `.eq('cliente_id', ...)`, coluna uuid. Com o
    // `throw` desta PR, um titulo assim abortava a analise de TODOS.
    const semCadastro = {
      ...PENDENTE,
      id: 't2',
      cliente_id: null,
      cliente_nome: 'Loja Azul',
      clientes: null,
    };
    // 1a chamada: pendencias (os dois titulos). 2a: historico do cliente COM
    // cadastro. Nao pode existir 3a consulta de historico pelo nome.
    const respostas = [
      { data: [PENDENTE, semCadastro], error: null },
      { data: [], error: null },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    // os dois aparecem, e o sem cadastro diz que o historico nao foi avaliado
    expect(await screen.findByText(/Cliente Um/i)).toBeInTheDocument();
    expect(screen.getByText(/Loja Azul/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Sem cadastro de cliente: histórico não avaliado/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // o filtro por cliente_id nunca recebe o nome digitado (a coluna e uuid).
    // `whatsapp_conversas`, do cartao do cliente, tambem filtra por cliente_id:
    // o que importa aqui e o VALOR, nunca 'Loja Azul'.
    expect(filtros.some((f) => f.valor === 'Loja Azul')).toBe(false);
    // o historico agora vai em LOTE: `.in('cliente_id', [ids reais])`, e o id
    // sem cadastro nao entra na lista
    const emLote = filtros.filter((f) => f.metodo === 'in' && f.coluna === 'cliente_id');
    expect(emLote.length).toBeGreaterThan(0);
    expect(emLote.some((f) => JSON.stringify(f.valor) === JSON.stringify(['cli-1']))).toBe(true);
  });

  it('paginacao: titulo depois da 1a pagina entra na analise', async () => {
    // Revisao da PR #404 (Codex P1): o PostgREST corta na sua janela de linhas
    // SEM erro, e clientes/contagens/valorTotalRisco sao somados no cliente --
    // a analise parcial era publicada como concluida. Aqui sao 1.001 titulos: o
    // cliente do titulo 1.001 so aparece se a 2a pagina for lida.
    const muitos = [
      ...Array.from({ length: 1000 }, (_, i) => ({ ...PENDENTE, id: `t${i}` })),
      {
        ...PENDENTE,
        id: 't1000',
        cliente_id: 'cli-2',
        cliente_nome: 'Cliente Dois',
        clientes: { ...PENDENTE.clientes, id: 'cli-2', razao_social: 'Cliente Dois' },
      },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() =>
      builder(chamada++ === 0 ? { data: muitos, error: null } : { data: [], error: null })
    );
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByText(/Cliente Dois/i)).toBeInTheDocument();
    // duas janelas pedidas: 0-999 e 1000-1999
    const janelas = filtros.filter((f) => f.metodo === 'range').map((f) => f.coluna);
    expect(janelas).toEqual(expect.arrayContaining(['0', '1000']));
  });

  it('setor de alto risco NAO conviva com "nenhum fator de risco"', async () => {
    // Revisao da PR #404 (Codex P2): `gerarFatoresRisco` aplicava o fallback
    // antes de quem chama acrescentar setor e cadastro, entao o cartao exibia
    // "Nenhum fator de risco identificado" ao lado de "Setor de alto risco".
    const respostas = [
      {
        data: [
          {
            ...PENDENTE,
            clientes: {
              ...PENDENTE.clientes,
              score: 900,
              limite_credito: 1_000_000,
              ramo_atividade: 'Construção',
            },
          },
        ],
        error: null,
      },
      { data: [], error: null },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByText(/Setor de alto risco: Construção/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum fator de risco identificado/i)).not.toBeInTheDocument();
  });

  it('cliente sem fator nenhum continua dizendo que nao ha fator', async () => {
    const respostas = [
      {
        data: [
          {
            ...PENDENTE,
            clientes: {
              ...PENDENTE.clientes,
              score: 900,
              limite_credito: 1_000_000,
              ramo_atividade: 'Serviços',
            },
          },
        ],
        error: null,
      },
      { data: [], error: null },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByText(/Nenhum fator de risco identificado/i)).toBeInTheDocument();
  });

  it('ordena por id nas DUAS consultas (paginacao por offset exige ordem unica)', async () => {
    // Revisao da PR #404 (Devin 🔴 / Codex P2): sem desempate unico, janelas
    // diferentes podiam devolver titulos de mesmo vencimento em ordens
    // diferentes -- um repetido numa pagina, outro omitido, e a contagem exata
    // nao percebe porque conta a repeticao.
    const respostas = [
      { data: [PENDENTE], error: null },
      { data: [], error: null },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    await screen.findByText(/Cliente Um/i);
    const ordens = filtros.filter((f) => f.metodo === 'order').map((f) => f.coluna);
    // pendencias: vencimento + id; historico: id
    expect(ordens.filter((c) => c === 'id').length).toBeGreaterThanOrEqual(2);
    expect(ordens).toEqual(expect.arrayContaining(['data_vencimento', 'id']));
  });

  it('servidor que devolve menos que a janela nao faz a leitura pular titulos', async () => {
    // Revisao da PR #404 (Devin): o deslocamento avancava 1.000 por volta. Com
    // db-max-rows de 500 e 1.200 titulos, a 2a janela comecaria em 1.000 e
    // deixaria 500 para tras -- e a 3a pediria offset fora do conjunto.
    const mil2 = Array.from({ length: 1200 }, (_, i) => ({
      ...PENDENTE,
      id: `t${i}`,
      // o ultimo titulo e de outro cliente: so aparece se nada for pulado
      ...(i === 1199
        ? {
            cliente_id: 'cli-ultimo',
            cliente_nome: 'Cliente Ultimo',
            clientes: { ...PENDENTE.clientes, id: 'cli-ultimo', razao_social: 'Cliente Ultimo' },
          }
        : {}),
    }));
    let chamada = 0;
    mockFrom.mockImplementation(() =>
      builder(
        chamada++ === 0 ? { data: mil2, error: null, tetoServidor: 500 } : { data: [], error: null }
      )
    );
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByText(/Cliente Ultimo/i)).toBeInTheDocument();
    // janelas pedidas comecam em 0, 500 e 1000 -- avanco pelo recebido
    const inicios = filtros.filter((f) => f.metodo === 'range').map((f) => f.coluna);
    expect(inicios).toEqual(expect.arrayContaining(['0', '500', '1000']));
  });

  it('titulo pago com atraso conta como atraso no historico', async () => {
    // Antes, so `status === 'vencido'` contava: receber o titulo apagava o
    // atraso da analise.
    const respostas = [
      { data: [PENDENTE], error: null },
      {
        data: [
          {
            cliente_id: 'cli-1',
            status: 'pago',
            data_vencimento: '2026-01-10',
            data_recebimento: '2026-01-30',
          },
          {
            cliente_id: 'cli-1',
            status: 'pago',
            data_vencimento: '2026-02-10',
            data_recebimento: '2026-02-05',
          },
          {
            cliente_id: 'cli-1',
            status: 'cancelado',
            data_vencimento: '2026-03-10',
            data_recebimento: null,
          },
        ],
        error: null,
      },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    // 1 atraso (pago 20 dias depois); pago antes do vencimento e cancelado nao contam
    expect(await screen.findByText(/1 atraso\(s\) no histórico/i)).toBeInTheDocument();
  });
});
