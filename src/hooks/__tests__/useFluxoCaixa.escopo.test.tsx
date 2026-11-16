import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Regressão: useFluxoCaixaKPIs ignorava a barra de empresa do topo
 * (Header.tsx:138 → EmpresaScopeBar). Os três cartões de /fluxo-caixa somavam
 * TODAS as empresas acessíveis, a queryKey não tinha a empresa (o cache servia
 * o número da empresa anterior) e o cartão "30 dias" somava todo o pendente,
 * inclusive vencimento de anos à frente.
 *
 * src/contexts/useEmpresaScope.ts:11-15 declara a regra do próprio projeto:
 * "Exibir ids como se os números somassem N empresas é o bug que a Etapa 27
 * corrigiu."
 */

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

/** Filtros .eq() aplicados, por tabela. */
const filtros: Record<string, [string, unknown][]> = {};
/** Linhas devolvidas, por tabela. */
const dados: Record<string, unknown[]> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (tabela: string) => {
      filtros[tabela] = filtros[tabela] ?? [];
      const alvo: Record<string, unknown> = {};
      const passa = () => alvo;
      Object.assign(alvo, {
        select: passa,
        in: passa,
        gte: passa,
        lte: passa,
        order: passa,
        eq: (col: string, val: unknown) => {
          filtros[tabela].push([col, val]);
          return alvo;
        },
        then: (r: (v: unknown) => unknown) => r({ data: dados[tabela] ?? [], error: null }),
      });
      return alvo;
    },
  },
}));

const { useFluxoCaixaKPIs } = await import('@/hooks/useFluxoCaixa');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const emDias = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

describe('useFluxoCaixaKPIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(filtros)) delete filtros[k];
    for (const k of Object.keys(dados)) delete dados[k];
    mockUseAuth.mockReturnValue({ currentEmpresaId: 'empresa-1' });
  });

  it('filtra as três consultas pela empresa selecionada', async () => {
    const { result } = renderHook(() => useFluxoCaixaKPIs(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(filtros['contas_bancarias']).toContainEqual(['empresa_id', 'empresa-1']);
    expect(filtros['contas_receber']).toContainEqual(['empresa_id', 'empresa-1']);
    expect(filtros['contas_pagar']).toContainEqual(['empresa_id', 'empresa-1']);
  });

  it('a previsão de 30 dias ignora vencimento fora da janela', async () => {
    dados['contas_bancarias'] = [{ saldo_atual: 1000 }];
    dados['contas_receber'] = [
      { valor: 100, valor_recebido: 0, data_vencimento: emDias(10) },
      { valor: 9000, valor_recebido: 0, data_vencimento: emDias(400) },
    ];
    dados['contas_pagar'] = [
      { valor: 40, valor_pago: 0, data_vencimento: emDias(5) },
      { valor: 7000, valor_pago: 0, data_vencimento: emDias(500) },
    ];

    const { result } = renderHook(() => useFluxoCaixaKPIs(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Os cartões de total continuam somando todo o pendente...
    expect(result.current.data?.totalReceber).toBe(9100);
    expect(result.current.data?.totalPagar).toBe(7040);
    // ...mas a previsão só conta o que vence em 30 dias: 1000 + 100 - 40.
    expect(result.current.data?.previsaoSaldo30d).toBe(1060);
  });

  it('título vencido fora da janela não entra na previsão de 30 dias', async () => {
    // A projeção diária começa HOJE (useFluxoCaixaProjetado usa .gte).
    // Sem o limite inferior, o KPI contaria um recebível vencido em 2026-09 e
    // os dois números da mesma tela divergiriam.
    dados['contas_bancarias'] = [{ saldo_atual: 1000 }];
    dados['contas_receber'] = [
      { valor: 500, valor_recebido: 0, data_vencimento: emDias(-70), status: 'vencido' },
    ];
    dados['contas_pagar'] = [];

    const { result } = renderHook(() => useFluxoCaixaKPIs(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // O cartão de total continua mostrando o vencido...
    expect(result.current.data?.totalReceber).toBe(500);
    // ...mas a previsão de 30 dias não o soma.
    expect(result.current.data?.previsaoSaldo30d).toBe(1000);
  });

  it('sem empresa selecionada não aplica filtro de empresa', async () => {
    mockUseAuth.mockReturnValue({ currentEmpresaId: null });

    const { result } = renderHook(() => useFluxoCaixaKPIs(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(filtros['contas_receber'].some(([c]) => c === 'empresa_id')).toBe(false);
  });
});
