import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format, startOfDay } from 'date-fns';
import type { ContasPagarPainelRow, ContasReceberPainelRow } from '@/hooks/financial/views.types';

/**
 * Regressão (achado F18, resgatado de fix/codex-auditoria-financeira-20260910):
 * a projeção da Tesouraria somava o valor NOMINAL e excluía título 'parcial'.
 * Tesouraria e Fluxo de Caixa mostravam projeções diferentes para o mesmo dia —
 * a Tesouraria contava pelo valor cheio o que já tinha sido parcialmente pago,
 * e sumia com o título parcial da curva.
 *
 * A convenção líquida (valor - valor_pago) é a regra do projeto; este arquivo
 * era o único fora dela, e os campos residuais já vinham na linha da view
 * (views.types.ts:70 valor_pago e :25 valor_recebido).
 */

let dadosCapturados: { receber: number; pagar: number; saldo: number }[] = [];

vi.mock('recharts', () => {
  const Nada = () => null;
  return {
    AreaChart: ({ data }: { data: { receber: number; pagar: number; saldo: number }[] }) => {
      dadosCapturados = data;
      return <div data-testid="chart" />;
    },
    Area: Nada,
    XAxis: Nada,
    YAxis: Nada,
    CartesianGrid: Nada,
    Tooltip: Nada,
    Legend: Nada,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const { ProjectedCashFlowChart } = await import('@/components/tesouraria/ProjectedCashFlowChart');

/**
 * A MESMA representação local do componente: ProjectedCashFlowChart.tsx:30-36
 * monta o dia com `startOfDay(new Date())` e `format(date, 'yyyy-MM-dd')`, que
 * são locais. Com toISOString, que é UTC, o teste quebrava em America/Sao_Paulo
 * entre 21h e meia-noite (a fixture caía no segundo ponto do gráfico e
 * dadosCapturados[0] vinha zerado) e em qualquer fuso de offset positivo na
 * primeira hora do dia.
 */
const hoje = format(startOfDay(new Date()), 'yyyy-MM-dd');

const pagar = [
  { data_vencimento: hoje, status: 'parcial', valor: 1000, valor_pago: 700 },
  { data_vencimento: hoje, status: 'pendente', valor: 200, valor_pago: 0 },
] as unknown as ContasPagarPainelRow[];

const receber = [
  { data_vencimento: hoje, status: 'parcial', valor: 500, valor_recebido: 400 },
] as unknown as ContasReceberPainelRow[];

describe('ProjectedCashFlowChart', () => {
  it('usa o valor residual e inclui título parcial', () => {
    render(<ProjectedCashFlowChart pagar={pagar} receber={receber} saldoAtual={1000} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();

    const dia0 = dadosCapturados[0];
    // 1000-700 + 200-0 = 500 (nominal daria 1200; sem 'parcial' daria 200)
    expect(dia0.pagar).toBe(500);
    // 500-400 = 100 (nominal daria 500; sem 'parcial' daria 0)
    expect(dia0.receber).toBe(100);
    // 1000 + 100 - 500
    expect(dia0.saldo).toBe(600);
  });
});
