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

  it('SEM empresa a consulta nao roda: pede para selecionar', async () => {
    // Revisao da PR #404 (Codex P1): no primeiro acesso `currentEmpresaId`
    // nasce null e o EmpresaScopeProvider só escolhe a empresa num efeito
    // posterior. Tratar a ausencia como escopo global fazia a consulta agregar
    // TODAS as empresas que o RLS permite e exibir previsao multiempresa.
    mockFrom.mockImplementation(() => builder({ data: [], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <PrevisaoInadimplencia />
      </Wrapper>
    );

    expect(await screen.findByText(/Selecione uma empresa/i)).toBeInTheDocument();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('historico vem em LOTE, uma consulta para todos os clientes', async () => {
    // Revisao da PR #404 (Codex P2): era uma consulta por cliente, serial
    // dentro do `for` -- 50 clientes = 51 idas ao banco antes de renderizar.
    const doisClientes = [
      PENDENTE,
      {
        ...PENDENTE,
        id: 't2',
        cliente_id: 'cli-2',
        cliente_nome: 'Cliente Dois',
        clientes: { ...PENDENTE.clientes, id: 'cli-2', razao_social: 'Cliente Dois' },
      },
    ];
    const respostas = [
      { data: doisClientes, error: null },
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

    await screen.findByText(/Cliente Dois/i);
    // 2 consultas a contas_receber no total: pendencias + historico em lote
    expect(mockFrom.mock.calls.filter((c) => c[0] === 'contas_receber')).toHaveLength(2);
    const emLote = filtros.filter((f) => f.metodo === 'in' && f.coluna === 'cliente_id');
    expect(emLote).toHaveLength(1);
    expect(JSON.stringify(emLote[0].valor)).toBe(JSON.stringify(['cli-1', 'cli-2']));
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
