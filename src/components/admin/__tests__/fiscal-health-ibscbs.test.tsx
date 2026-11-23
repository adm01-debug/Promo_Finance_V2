/**
 * Etapa 57 — FiscalHealthBadge reflete % real de NF-e com IBS/CBS.
 *
 * Padrao anti-fabricacao: sem verificacao previa, badge nao exibe "0%".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: Record<string, unknown> & { children?: ReactNode; to: string }) => (
    <a href={to as string} {...rest}>{children}</a>
  ),
}));

vi.mock('@/lib/supabase-dynamic', () => ({
  supabaseDyn: {
    rpc: vi.fn().mockResolvedValue({
      data: { gerado_em: new Date().toISOString(), ultima_verificacao: new Date().toISOString(), criticos: 0, avisos: 0, saudavel: true },
      error: null,
    }),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));

import { FiscalHealthBadge } from '../FiscalHealthBadge';
import { useAuth } from '@/hooks/useAuth';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function mockVerificacao(semIbscbs: number, total: number) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { itens: [{ id: 'nfe_ibscbs_cobertura', status: semIbscbs === 0 ? 'aprovado' : 'reprovado', detalhes: `${semIbscbs} de ${total} notas apos FG sem IBS/CBS` }] },
        error: null,
      }),
    }) }) }) }),
  });
}

function mockSemVerificacao() {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }) }) }) }),
  });
}

beforeEach(() => { vi.clearAllMocks(); });

describe('FiscalHealthBadge -- metrica IBS/CBS nao fabricada (etapa 57)', () => {
  it('sem empresaId -> badge IBS/CBS nao aparece', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentEmpresaId: null } as never);
    mockSemVerificacao();
    render(<FiscalHealthBadge />, { wrapper });
    await waitFor(() => expect(screen.getByRole('link')).toBeInTheDocument());
    expect(screen.queryByText(/IBS\/CBS/)).not.toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('com empresaId mas sem verificacao previa -> badge IBS/CBS nao aparece', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentEmpresaId: 'emp-1' } as never);
    mockSemVerificacao();
    render(<FiscalHealthBadge />, { wrapper });
    await waitFor(() => expect(screen.getByRole('link')).toBeInTheDocument());
    expect(screen.queryByText(/IBS\/CBS/)).not.toBeInTheDocument();
  });

  it('20 de 100 sem IBS/CBS -> exibe IBS/CBS 80%', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentEmpresaId: 'emp-1' } as never);
    mockVerificacao(20, 100);
    render(<FiscalHealthBadge />, { wrapper });
    await waitFor(() => screen.getByText('IBS/CBS 80%'));
  });

  it('aprovado (0 de 50) -> exibe IBS/CBS 100%', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentEmpresaId: 'emp-1' } as never);
    mockVerificacao(0, 50);
    render(<FiscalHealthBadge />, { wrapper });
    await waitFor(() => screen.getByText('IBS/CBS 100%'));
  });

  it('total=0 apos FG -> badge nao aparece (sem divisao por zero)', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentEmpresaId: 'emp-1' } as never);
    mockVerificacao(0, 0);
    render(<FiscalHealthBadge />, { wrapper });
    await waitFor(() => expect(screen.getByRole('link')).toBeInTheDocument());
    expect(screen.queryByText(/IBS\/CBS/)).not.toBeInTheDocument();
  });
});