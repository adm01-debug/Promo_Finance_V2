import { describe, it, expect } from 'vitest';
import * as front from '../shared-logic';
// @ts-expect-error - módulo Deno compartilhado, tipado de forma equivalente ao front
import * as edge from '../../../../supabase/functions/_shared/tributario-logic.ts';

/**
 * Paridade numérica entre o motor do frontend (`src/lib/tributario/shared-logic.ts`)
 * e o motor das Edge Functions (`supabase/functions/_shared/tributario-logic.ts`).
 *
 * Qualquer divergência de alíquota, distribuição de anexo, sublimite ou retenção
 * produziria valores diferentes entre a simulação exibida ao usuário e a
 * simulação persistida/processada no backend — um bug fiscal silencioso.
 */

type Params = front.ParametrosSimulacao;

const TOL = 1e-6;

function mkParams(seed: number): Params {
  const rnd = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const faturamento = Math.round(rnd(1) * 6_000_000) + 50_000;
  const servicos = Math.round(rnd(2) * 100);
  const industria = Math.round(rnd(3) * (100 - servicos));
  const revenda = 100 - servicos - industria;
  return {
    faturamentoAnual: faturamento,
    folhaAnual: Math.round(rnd(4) * faturamento * 0.4),
    margemLucro: Math.round(rnd(5) * 40),
    percentualServicos: servicos,
    percentualIndustria: industria,
    percentualRevenda: revenda,
    comprasComCredito: Math.round(rnd(6) * faturamento * 0.5),
    despesasOperacionais: Math.round(rnd(7) * faturamento * 0.3),
    aliquotaICMS: 0.07 + rnd(8) * 0.13,
    aliquotaISS: 0.02 + rnd(9) * 0.03,
    sublimiteEstadual: rnd(10) > 0.5 ? 3_600_000 : 1_800_000,
    issRetidoFonte: Math.round(rnd(11) * 40_000),
  } as Params;
}

function compare(a: front.ResultadoCenario, b: front.ResultadoCenario, ctx: string) {
  const campos: Array<keyof front.ResultadoCenario> = [
    'irpj', 'csll', 'pis', 'cofins', 'cpp', 'icms', 'iss', 'totalTributos', 'cargaEfetiva',
  ];
  for (const campo of campos) {
    const va = Number(a[campo] ?? 0);
    const vb = Number(b[campo] ?? 0);
    expect(Math.abs(va - vb), `${ctx} :: ${String(campo)} (${va} vs ${vb})`).toBeLessThan(
      Math.max(TOL, Math.abs(va) * 1e-9),
    );
  }
  expect(a.elegivel, `${ctx} :: elegivel`).toBe(b.elegivel);
  expect(a.anexoAplicavel, `${ctx} :: anexo`).toBe(b.anexoAplicavel);
  expect(a.sublimiteExcedido, `${ctx} :: sublimite`).toBe(b.sublimiteExcedido);
}

describe('Paridade motor frontend x Edge Function', () => {
  it('expõe a mesma superfície pública', () => {
    for (const fn of ['calcularRBT12', 'calcularFolha12m', 'determinarAnexoSimples', 'simularSimples', 'simularPresumido', 'simularReal']) {
      expect(typeof (edge as Record<string, unknown>)[fn], fn).toBe('function');
    }
    expect(edge.LIMITE_SIMPLES).toBe(front.LIMITE_SIMPLES);
    expect(edge.LIMITE_PRESUMIDO).toBe(front.LIMITE_PRESUMIDO);
    expect(edge.ANEXOS).toEqual(front.ANEXOS);
  });

  it('mantém paridade em 300 cenários aleatórios (Simples, Presumido e Real)', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const p = mkParams(seed);
      compare(
        front.simularSimples(p, 2026, 7),
        edge.simularSimples(p, 2026, 7),
        `seed ${seed} / Simples`,
      );
      compare(front.simularPresumido(p), edge.simularPresumido(p), `seed ${seed} / Presumido`);
      compare(front.simularReal(p), edge.simularReal(p), `seed ${seed} / Real`);
    }
  });

  it('mantém paridade nos casos-limite (0, limites legais e retenção extrema)', () => {
    const base = mkParams(42);
    const casos: Params[] = [
      { ...base, faturamentoAnual: 0, folhaAnual: 0 },
      { ...base, faturamentoAnual: front.LIMITE_SIMPLES },
      { ...base, faturamentoAnual: front.LIMITE_SIMPLES + 1 },
      { ...base, faturamentoAnual: 3_600_001, percentualServicos: 100, percentualIndustria: 0, percentualRevenda: 0 },
      { ...base, issRetidoFonte: 10_000_000 },
      { ...base, percentualServicos: 0, percentualIndustria: 100, percentualRevenda: 0 },
      { ...base, margemLucro: 0 },
    ];
    casos.forEach((p, i) => {
      compare(front.simularSimples(p, 2026, 7), edge.simularSimples(p, 2026, 7), `caso ${i} / Simples`);
      compare(front.simularPresumido(p), edge.simularPresumido(p), `caso ${i} / Presumido`);
      compare(front.simularReal(p), edge.simularReal(p), `caso ${i} / Real`);
    });
  });

  it('respeita o anexo forçado em ambos os motores', () => {
    const p = mkParams(7);
    (['I', 'II', 'III', 'IV', 'V'] as const).forEach((anexo) => {
      const a = front.simularSimples(p, 2026, 7, anexo);
      const b = edge.simularSimples(p, 2026, 7, anexo);
      expect(a.anexoAplicavel).toBe(anexo);
      compare(a, b, `anexo forçado ${anexo}`);
    });
  });
});
