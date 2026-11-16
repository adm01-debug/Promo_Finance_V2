import { describe, it, expect } from 'vitest';
import { calcularKpisContasReceber } from '@/hooks/useContasReceberLogic.calculos';
import { calcularKpisContasPagar } from '@/hooks/useContasPagarLogic.calculos';

/**
 * Regressão: os KPIs de Contas a Receber e Contas a Pagar fabricavam o
 * "período anterior" a partir do número ATUAL — `soma * 0.9` com o comentário
 * "Simulação de dados anteriores", `totalVencido * 1.1` e
 * `|| totalRecebidoMes * 0.95` / `|| totalPagoMes * 0.95`. O selo de variação
 * exibia uma melhora de ~11% (a receber), ~9% (vencidos) e ~5% (pago/recebido)
 * que nunca aconteceu, em telas de decisão de cobrança e de pagamento.
 *
 * O contrato já estava escrito no componente e era violado pelo cálculo —
 * ContasReceberKPIs.tsx:53: "a variação só é exibida quando há dados reais do
 * período anterior — não sintetizamos um comparativo fictício". calcVariation
 * (:35) devolve null quando o anterior é undefined ou 0, escondendo o selo.
 */

const hoje = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('KPIs não fabricam o período anterior', () => {
  it('a receber: os "anteriores" sem fonte real ficam undefined, não soma * 0.9 / * 1.1', () => {
    const k = calcularKpisContasReceber([
      { valor: 1000, status: 'pendente', data_vencimento: iso(hoje) },
      { valor: 500, status: 'recebido', data_recebimento: iso(hoje), valor_recebido: 500 },
    ]);

    expect(k.totalReceber).toBe(1000);
    expect(k.totalReceberAnterior).toBeUndefined();
    expect(k.totalVencidoAnterior).toBeUndefined();
    expect(k.totalReceberAnterior).not.toBe(k.totalReceber * 0.9);
    expect(k.totalVencidoAnterior).not.toBe(k.totalVencido * 1.1);
  });

  it('a receber: mês anterior sem recebimento vale 0, não 95% do mês atual', () => {
    const k = calcularKpisContasReceber([
      { valor: 800, status: 'recebido', data_recebimento: iso(hoje), valor_recebido: 800 },
    ]);

    expect(k.totalRecebidoMes).toBe(800);
    expect(k.totalRecebidoMesAnterior).toBe(0);
    expect(k.totalRecebidoMesAnterior).not.toBe(800 * 0.95);
  });

  it('a pagar: mês anterior sem pagamento vale 0, não 95% do mês atual', () => {
    const k = calcularKpisContasPagar(
      [
        {
          id: 'cp-1',
          valor: 600,
          valor_pago: 600,
          status: 'pago',
          data_pagamento: iso(hoje),
          data_vencimento: iso(hoje),
        },
      ],
      new Map<string | null, string | null>(),
      () => false
    );

    expect(k.totalPagoMes).toBe(600);
    expect(k.totalPagoMesAnterior).toBe(0);
    expect(k.totalPagoMesAnterior).not.toBe(600 * 0.95);
  });
});
