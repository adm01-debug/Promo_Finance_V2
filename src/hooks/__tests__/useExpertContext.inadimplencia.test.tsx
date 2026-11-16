import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Regressão: os indicadores do contexto do EXPERT eram calculados a partir dos
 * totais 'pendente', que significavam "em aberto" só porque nada no sistema
 * gravava 'vencido'. Com a rotina marcar_contas_vencidas() gravando, uma
 * carteira inteiramente vencida zerava totalReceberPendente e:
 *
 *   taxaInadimplencia = totalReceberVencido > 0 && totalReceberPendente > 0 ? ... : '0'
 *
 * devolvia '0' — o contexto informava ao EXPERT "Taxa de Inadimplência: 0%"
 * com 100% da carteira em atraso. O índice de liquidez e a cobertura de caixa
 * tinham a mesma raiz e caíam para 'N/A' e 100%.
 */

const dados: Record<string, unknown[]> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (tabela: string) => {
      const alvo: Record<string, unknown> = {};
      const passa = () => alvo;
      Object.assign(alvo, {
        select: passa,
        eq: passa,
        gte: passa,
        lte: passa,
        in: passa,
        order: passa,
        then: (r: (v: unknown) => unknown) => r({ data: dados[tabela] ?? [], error: null }),
      });
      return alvo;
    },
  },
}));

const { useExpertContext } = await import('@/hooks/useExpertContext');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const hojeISO = new Date().toISOString().slice(0, 10);

describe('indicadores do EXPERT com a carteira vencida', () => {
  beforeEach(() => {
    for (const k of Object.keys(dados)) delete dados[k];
    dados['contas_bancarias'] = [{ banco: 'X', saldo_atual: 200, saldo_disponivel: 200 }];
  });

  it('carteira 100% vencida reporta 100%, não 0%', async () => {
    dados['contas_receber'] = [
      { id: '1', valor: 600, data_vencimento: hojeISO, status: 'vencido', cliente_nome: 'A' },
      { id: '2', valor: 400, data_vencimento: hojeISO, status: 'vencido', cliente_nome: 'B' },
    ];
    dados['contas_pagar'] = [];

    const { result } = renderHook(() => useExpertContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.resumoFinanceiro).toContain('Taxa de Inadimplência: 100.0%');
    expect(result.current.resumoFinanceiro).not.toContain('Taxa de Inadimplência: 0%');
  });

  it('carteira mista continua proporcional', async () => {
    dados['contas_receber'] = [
      { id: '1', valor: 250, data_vencimento: hojeISO, status: 'vencido', cliente_nome: 'A' },
      { id: '2', valor: 750, data_vencimento: hojeISO, status: 'pendente', cliente_nome: 'B' },
    ];
    dados['contas_pagar'] = [];

    const { result } = renderHook(() => useExpertContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.resumoFinanceiro).toContain('Taxa de Inadimplência: 25.0%');
  });

  it('liquidez e cobertura contam a dívida a pagar vencida', async () => {
    dados['contas_receber'] = [];
    // 100 de saida, toda vencida: liquidez = (200 + 0) / 100 = 2.00
    dados['contas_pagar'] = [
      { id: '1', valor: 100, data_vencimento: hojeISO, status: 'vencido', fornecedor_nome: 'F' },
    ];

    const { result } = renderHook(() => useExpertContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.resumoFinanceiro).toContain('Índice de Liquidez: 2.00');
    expect(result.current.resumoFinanceiro).toContain('Cobertura de Caixa: 200%');
  });

  it('carteira vazia continua em zero', async () => {
    dados['contas_receber'] = [];
    dados['contas_pagar'] = [];

    const { result } = renderHook(() => useExpertContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.resumoFinanceiro).toContain('Taxa de Inadimplência: 0%');
  });
});
