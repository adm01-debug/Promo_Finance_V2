/**
 * Regressao: 589 linhas em 4 arquivos (PrevisaoInadimplencia + previsao/*)
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

/** Builder thenable que registra cada filtro aplicado. */
function builder(resultado: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'in', 'gte', 'lte', 'lt', 'eq', 'order']) {
    b[m] = vi.fn((coluna?: unknown, valor?: unknown) => {
      filtros.push({ metodo: m, coluna: coluna as string, valor });
      return b;
    });
  }
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

/** Uma pendencia + um cliente, para a analise chegar na consulta do historico. */
const PENDENTE = {
  id: 't1',
  valor: 10000,
  valor_recebido: null,
  data_vencimento: '2026-12-01',
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

describe('PrevisaoInadimplencia — escopo por empresa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filtros.length = 0;
  });

  it('filtra contas_receber pela empresa informada', async () => {
    mockFrom.mockImplementation(() => builder({ data: [], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    // o componente renderiza (deixou de ser inalcançável)
    expect(await screen.findByText(/Previsão de Inadimplência/i)).toBeInTheDocument();
    expect(mockFrom).toHaveBeenCalledWith('contas_receber');
    expect(filtros).toEqual(
      expect.arrayContaining([{ metodo: 'eq', coluna: 'empresa_id', valor: 'e1' }])
    );
  });

  it('sem empresa informada NAO aplica eq empresa_id (fica só com o RLS)', async () => {
    mockFrom.mockImplementation(() => builder({ data: [], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia />
      </Wrapper>
    );

    expect(await screen.findByText(/Previsão de Inadimplência/i)).toBeInTheDocument();
    expect(filtros.filter((f) => f.coluna === 'empresa_id')).toHaveLength(0);
  });

  it('filtra TAMBEM o historico pela empresa (com pendencia, a 2a consulta roda)', async () => {
    // Revisao da PR #404 (Devin): os dois testes acima devolvem pendencia vazia,
    // entao a analise retorna antes da consulta do historico -- remover o filtro
    // de empresa DELE mantinha os dois verdes. Aqui ha pendencia e cliente.
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
    // duas consultas a contas_receber (pendencias + historico), ambas com o
    // filtro de empresa. A 3a chamada de `from` e de whatsapp_conversas, do
    // cartao do cliente, fora do escopo desta analise.
    expect(mockFrom.mock.calls.filter((c) => c[0] === 'contas_receber')).toHaveLength(2);
    expect(filtros.filter((f) => f.coluna === 'empresa_id' && f.valor === 'e1')).toHaveLength(2);
    // e o historico pede as datas, nao so o status
    expect(
      filtros.some(
        (f) =>
          f.metodo === 'select' &&
          typeof f.coluna === 'string' &&
          f.coluna.includes('data_recebimento')
      )
    ).toBe(true);
  });

  it('erro na consulta NAO vira "nenhum cliente em risco"', async () => {
    // Antes: o erro era descartado, `data: null` virava analise vazia e a tela
    // exibia KPI zerado como sucesso.
    mockFrom.mockImplementation(() => builder({ data: null, error: { message: 'falha de rede' } }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Não foi possível calcular a previsão/i)).toBeInTheDocument();
    expect(screen.queryByText(/Clientes em Risco/i)).not.toBeInTheDocument();
  });

  it('erro no HISTORICO tambem reprova a analise', async () => {
    const respostas = [
      { data: [PENDENTE], error: null },
      { data: null, error: { message: 'falha no historico' } },
    ];
    let chamada = 0;
    mockFrom.mockImplementation(() => builder(respostas[chamada++] ?? respostas[1]));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia empresaId="e1" />
      </Wrapper>
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

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
    expect(
      filtros.filter((f) => f.coluna === 'cliente_id' && f.valor === 'cli-1').length
    ).toBeGreaterThan(0);
  });

  it('titulo pago com atraso conta como atraso no historico', async () => {
    // Antes, so `status === 'vencido'` contava: receber o titulo apagava o
    // atraso da analise.
    const respostas = [
      { data: [PENDENTE], error: null },
      {
        data: [
          { status: 'pago', data_vencimento: '2026-01-10', data_recebimento: '2026-01-30' },
          { status: 'pago', data_vencimento: '2026-02-10', data_recebimento: '2026-02-05' },
          { status: 'cancelado', data_vencimento: '2026-03-10', data_recebimento: null },
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
