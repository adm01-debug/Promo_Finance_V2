/**
 * O back-end da fila de falhas estava completo em producao (tabela webhook_dlq
 * com RLS admin, `webhook_mark_failure` gravando nela e a RPC `reprocess_dlq`)
 * e NENHUM arquivo de src/ lia a tabela: webhook de cobranca que esgota as
 * tentativas saia de cena sem aviso.
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

const { mockIsAdmin } = vi.hoisted(() => ({ mockIsAdmin: { valor: true } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isAdmin: mockIsAdmin.valor }) }));

import { WebhookDlqPanel } from '../WebhookDlqPanel';

function builder(resultado: { data: unknown; error: unknown; count?: number }) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'is', 'order', 'limit', 'eq']) {
    b[m] = vi.fn((coluna?: unknown, valor?: unknown) => {
      filtros.push({ metodo: m, coluna: coluna as string, valor });
      return b;
    });
  }
  const resposta = {
    ...resultado,
    count: resultado.count ?? (Array.isArray(resultado.data) ? resultado.data.length : null),
  };
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
    mockIsAdmin.valor = true;
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
    mockIsAdmin.valor = false;
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
