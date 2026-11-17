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
});
