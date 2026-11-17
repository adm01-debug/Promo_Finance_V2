import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regressão: os relatórios do EXPERT montavam "contas a pagar em aberto" como
 * status = 'pendente' sozinho, enquanto o lado de contas_receber do MESMO
 * arquivo já usava ['pendente', 'vencido'] (report-actions.ts:19 e :85). A
 * assimetria era inofensiva só porque nada no sistema gravava 'vencido'.
 *
 * Com a rotina marcar_contas_vencidas() gravando 'pendente' -> 'vencido' no
 * vencimento, o relatório de fluxo de caixa passaria a mostrar as entradas
 * vencidas e NENHUMA saída vencida (saldo projetado inflado), e o relatório de
 * contas a pagar responderia "Não há contas a pagar pendentes" com a empresa
 * em atraso.
 */

/** Filtros de status capturados, por tabela: .eq('status', x) e .in('status', [...]). */
const statusPorTabela: Record<string, unknown[]> = {};
/** Linhas devolvidas, por tabela. */
const dados: Record<string, unknown[]> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (tabela: string) => {
      statusPorTabela[tabela] = statusPorTabela[tabela] ?? [];
      const alvo: Record<string, unknown> = {};
      const passa = () => alvo;
      Object.assign(alvo, {
        select: passa,
        gte: passa,
        lte: passa,
        order: passa,
        eq: (col: string, val: unknown) => {
          if (col === 'status') statusPorTabela[tabela].push(val);
          return alvo;
        },
        in: (col: string, vals: unknown[]) => {
          if (col === 'status') statusPorTabela[tabela].push(...vals);
          return alvo;
        },
        then: (r: (v: unknown) => unknown) => r({ data: dados[tabela] ?? [], error: null }),
      });
      return alvo;
    },
  },
}));

vi.mock('@/lib/pdf-generator', () => ({ generateFluxoCaixaPDF: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { gerarRelatorio } = await import('@/hooks/expert-actions/report-actions');

const ontem = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

describe('relatórios do EXPERT com contas vencidas', () => {
  beforeEach(() => {
    for (const k of Object.keys(statusPorTabela)) delete statusPorTabela[k];
    for (const k of Object.keys(dados)) delete dados[k];
  });

  it('o fluxo de caixa pede contas a pagar vencidas, não só pendentes', async () => {
    dados['contas_pagar'] = [{ data_vencimento: ontem(), valor: 900, status: 'vencido' }];
    dados['contas_receber'] = [];
    dados['contas_bancarias'] = [{ saldo_atual: 0 }];

    await gerarRelatorio('fluxo_caixa');

    expect(statusPorTabela['contas_pagar']).toContain('vencido');
    // simetria com o lado de contas_receber do mesmo relatório
    expect(statusPorTabela['contas_receber']).toContain('vencido');
  });

  it('o relatório de contas a pagar pede as vencidas e as soma no total', async () => {
    dados['contas_pagar'] = [
      { id: '1', valor: 400, data_vencimento: ontem(), status: 'vencido' },
      { id: '2', valor: 100, data_vencimento: ontem(), status: 'pendente' },
    ];

    const r = await gerarRelatorio('contas_pagar');

    expect(statusPorTabela['contas_pagar']).toContain('vencido');
    expect(r.success).toBe(true);
    expect(r.message).toContain('2 contas a pagar');
    expect(r.message).toContain('500');
  });
});
