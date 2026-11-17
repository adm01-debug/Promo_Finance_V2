/**
 * O back-end da fila de falhas estava completo em producao (tabela webhook_dlq
 * com RLS admin, `webhook_mark_failure` gravando nela e a RPC `reprocess_dlq`)
 * e NENHUM arquivo de src/ lia a tabela: webhook de cobranca que esgota as
 * tentativas saia de cena sem aviso.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Filtro = { metodo: string; coluna?: string; valor?: unknown };
const { mockFrom, filtros } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  filtros: [] as Filtro[],
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));

const { mockPapel } = vi.hoisted(() => ({
  mockPapel: { global: 'admin' as string | null, empresa: 'admin' as string | null },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    role: mockPapel.global,
    roleAtual: mockPapel.empresa,
    // isAdmin do provider prioriza o papel da EMPRESA -- o painel NAO deve usar
    isAdmin: (mockPapel.empresa ?? mockPapel.global) === 'admin',
  }),
}));

import { WebhookDlqPanel } from '../WebhookDlqPanel';

function builder(resultado: { data: unknown; error: unknown; count?: number }) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'is', 'order', 'limit', 'eq']) {
    b[m] = vi.fn((coluna?: unknown, valor?: unknown) => {
      filtros.push({ metodo: m, coluna: coluna as string, valor });
      return b;
    });
  }
  const linhas = Array.isArray(resultado.data) ? (resultado.data as unknown[]) : null;
  const total = resultado.count ?? (linhas ? linhas.length : null);
  // `range(de, ate)` como o PostgREST: devolve a fatia pedida, nunca mais de
  // 1.000 linhas por resposta, e a contagem exata do conjunto inteiro.
  b.range = vi.fn((de: number, ate: number) => {
    filtros.push({ metodo: 'range', coluna: String(de), valor: ate });
    if (resultado.error) return Promise.resolve({ data: null, error: resultado.error });
    const janela = linhas ? linhas.slice(de, ate + 1) : resultado.data;
    const cortada = Array.isArray(janela) ? janela.slice(0, 1000) : janela;
    return Promise.resolve({ data: cortada, error: null, count: total });
  });
  const resposta = { ...resultado, count: total };
  b.then = ((ok?: (v: typeof resposta) => unknown, err?: (r: unknown) => unknown) =>
    Promise.resolve(resposta).then(ok as never, err as never)) as never;
  return b;
}

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const FALHA = {
  id: 'd1',
  source: 'asaas',
  event_type: 'payment_failed',
  external_id: 'evt_123',
  error_message: 'Timeout exceeded',
  attempts: 3,
  first_failed_at: '2026-11-16T10:00:00Z',
  last_attempt_at: '2026-11-16T12:00:00Z',
  created_at: '2026-11-16T10:00:00Z',
};

describe('WebhookDlqPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filtros.length = 0;
    mockPapel.global = 'admin';
    mockPapel.empresa = 'admin';
  });

  it('lista so as falhas em aberto, da tabela webhook_dlq', async () => {
    mockFrom.mockImplementation(() => builder({ data: [FALHA], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    expect(await screen.findByText(/asaas · payment_failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Timeout exceeded/i)).toBeInTheDocument();
    expect(screen.getByText(/3 tentativas/i)).toBeInTheDocument();
    expect(screen.getByText(/1 em aberto/i)).toBeInTheDocument();
    expect(mockFrom).toHaveBeenCalledWith('webhook_dlq');
    // `resolved_at is null` e o que separa falha em aberto de falha resolvida
    expect(filtros).toEqual(
      expect.arrayContaining([{ metodo: 'is', coluna: 'resolved_at', valor: null }])
    );
  });

  it('erro de leitura NAO vira fila vazia', async () => {
    mockFrom.mockImplementation(() =>
      builder({ data: null, error: { message: 'permission denied for table webhook_dlq' } })
    );
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum webhook em falha/i)).not.toBeInTheDocument();
  });

  it('usuario sem papel admin NAO ve "nenhuma falha": ve acesso restrito', async () => {
    // Revisao da PR #406 (Codex P2): sem admin a politica de SELECT filtra as
    // linhas e devolve sucesso com `data: []` -- a tela diria "nenhum webhook em
    // falha" com a fila cheia. /contas-receber e ProtectedRoute sem papel.
    mockPapel.global = 'financeiro';
    mockPapel.empresa = 'financeiro';
    mockFrom.mockImplementation(() => builder({ data: [], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    expect(await screen.findByText(/acesso restrito/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum webhook em falha/i)).not.toBeInTheDocument();
    // e nem consulta a tabela
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('admin APENAS da empresa nao recebe "nenhuma falha": a RLS exige papel global', async () => {
    // Revisao da PR #406 (Devin 🔴): `isAdmin` do provider e `roleAtual ?? role`
    // -- o papel da empresa tem prioridade. A politica da fila usa
    // `has_role(auth.uid(),'admin')`, que le `user_roles` (papel GLOBAL). Com
    // admin so na empresa, a consulta rodava e a RLS devolvia [].
    mockPapel.global = 'financeiro';
    mockPapel.empresa = 'admin';
    mockFrom.mockImplementation(() => builder({ data: [], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    expect(await screen.findByText(/acesso restrito/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum webhook em falha/i)).not.toBeInTheDocument();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('admin GLOBAL com papel menor na empresa consulta normalmente', async () => {
    mockPapel.global = 'admin';
    mockPapel.empresa = 'financeiro';
    mockFrom.mockImplementation(() => builder({ data: [FALHA], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    expect(await screen.findByText(/asaas · payment_failed/i)).toBeInTheDocument();
    expect(screen.queryByText(/acesso restrito/i)).not.toBeInTheDocument();
  });

  it('contador mostra o TOTAL em aberto, nao o recorte da pagina', async () => {
    // Revisao da PR #406 (Codex P2): o badge usava `data.length` (20) como total.
    mockFrom.mockImplementation(() =>
      builder({
        data: Array.from({ length: 20 }, (_, i) => ({ ...FALHA, id: `d${i}` })),
        error: null,
        count: 57,
      })
    );
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    expect(await screen.findByText(/57 em aberto/i)).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 20 de 57/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Carregar mais/i })).toBeInTheDocument();
  });

  it('falha 1.001 aparece: paginacao por range, nao por limite crescente', async () => {
    // Revisao da PR #406 (Devin): `.limit(limite)` nunca passa do teto de 1.000
    // linhas do PostgREST, entao "Carregar mais" repetia as mesmas falhas para
    // sempre e a 1.001 nunca aparecia.
    const muitas = Array.from({ length: 1001 }, (_, i) => ({
      ...FALHA,
      id: `d${i}`,
      source: i === 1000 ? 'bling' : 'asaas',
      error_message: i === 1000 ? 'a milesima primeira' : 'Timeout exceeded',
    }));
    mockFrom.mockImplementation(() => builder({ data: muitas, error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    await screen.findByText(/1001 em aberto/i);
    // a primeira pagina pede a janela 0-19, nao 1.000 linhas de uma vez
    expect(filtros.filter((f) => f.metodo === 'range' && f.coluna === '0')).toHaveLength(1);
    expect(filtros.filter((f) => f.metodo === 'range' && f.valor === 19)).toHaveLength(1);
    expect(screen.getByText(/Mostrando 20 de 1001/i)).toBeInTheDocument();

    // "Carregar mais" avanca a JANELA, entao chega na falha 1.001
    const botao = screen.getByRole('button', { name: /Carregar mais/i });
    for (let i = 0; i < 50; i++) {
      if (!screen.queryByRole('button', { name: /Carregar mais/i })) break;
      await userEvent.click(screen.getByRole('button', { name: /Carregar mais/i }));
    }
    void botao;
    expect(await screen.findByText(/a milesima primeira/i)).toBeInTheDocument();
    expect(filtros.some((f) => f.metodo === 'range' && f.coluna === '1000')).toBe(true);
  }, 20000);

  it('fila realmente vazia diz que esta vazia', async () => {
    mockFrom.mockImplementation(() => builder({ data: [], error: null }));
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WebhookDlqPanel />
      </Wrapper>
    );

    expect(await screen.findByText(/Nenhum webhook em falha/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
