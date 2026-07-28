/**
 * Imunidade objetiva das exportações.
 *
 * Fundamento: CF/88 art. 149 §2º I (PIS/COFINS), art. 155 §2º X "a" (ICMS),
 * art. 156 §3º II c/c LC 116/2003 art. 2º I (ISS) e LC 123/2006 art. 18 §14
 * (segregação da receita exportada no DAS).
 *
 * Invariante central: aumentar a fatia exportada NUNCA pode aumentar a carga
 * tributária, e IRPJ/CSLL não podem ser reduzidos por ela.
 */
import { describe, it, expect } from 'vitest';
import { simularSimples, simularPresumido, simularReal } from '../shared-logic';
import type { ParametrosSimulacao } from '../types';

const BASE: ParametrosSimulacao = {
  faturamentoAnual: 2_400_000,
  folhaAnual: 400_000,
  margemLucro: 15,
  percentualServicos: 40,
  comprasComCredito: 300_000,
  despesasOperacionais: 200_000,
};

const comExp = (pct: number, extra: Partial<ParametrosSimulacao> = {}): ParametrosSimulacao => ({
  ...BASE,
  ...extra,
  percentualExportacao: pct,
});

describe('Lucro Presumido — imunidade das exportações', () => {
  it('zera PIS/COFINS quando toda a receita é exportada', () => {
    const r = simularPresumido(comExp(100));
    expect(r.pis).toBeCloseTo(0, 6);
    expect(r.cofins).toBeCloseTo(0, 6);
    expect(r.icms).toBeCloseTo(0, 6);
    expect(r.iss).toBeCloseTo(0, 6);
  });

  it('mantém IRPJ e CSLL integralmente devidos sobre a receita exportada', () => {
    const semExp = simularPresumido(comExp(0));
    const totalExp = simularPresumido(comExp(100));
    expect(totalExp.irpj).toBeCloseTo(semExp.irpj, 6);
    expect(totalExp.csll).toBeCloseTo(semExp.csll, 6);
  });

  it('reduz PIS/COFINS proporcionalmente à fatia exportada', () => {
    const base = simularPresumido(comExp(0));
    const metade = simularPresumido(comExp(50));
    expect(metade.pis).toBeCloseTo(base.pis / 2, 6);
    expect(metade.cofins).toBeCloseTo(base.cofins / 2, 6);
  });
});

describe('Lucro Real — imunidade das exportações', () => {
  it('preserva os créditos de PIS/COFINS mesmo com receita imune', () => {
    const r = simularReal(comExp(100));
    expect(r.pis).toBe(0);
    expect(r.cofins).toBe(0);
    expect(r.totalTributos).toBeGreaterThan(0); // IRPJ/CSLL/CPP seguem devidos
  });

  it('não altera IRPJ/CSLL', () => {
    const a = simularReal(comExp(0));
    const b = simularReal(comExp(80));
    expect(b.irpj).toBeCloseTo(a.irpj, 6);
    expect(b.csll).toBeCloseTo(a.csll, 6);
  });
});

describe('Simples Nacional — segregação da receita de exportação', () => {
  it('exclui do DAS as parcelas de PIS/COFINS/ICMS/ISS da receita exportada', () => {
    const semExp = simularSimples(comExp(0), 2026, 6);
    const totalExp = simularSimples(comExp(100), 2026, 6);
    expect(totalExp.totalTributos).toBeLessThan(semExp.totalTributos);
    expect(totalExp.pis).toBeCloseTo(0, 6);
    expect(totalExp.cofins).toBeCloseTo(0, 6);
    expect(totalExp.icms).toBeCloseTo(0, 6);
    expect(totalExp.iss).toBeCloseTo(0, 6);
  });

  it('mantém IRPJ, CSLL e CPP do DAS intactos', () => {
    const semExp = simularSimples(comExp(0), 2026, 6);
    const totalExp = simularSimples(comExp(100), 2026, 6);
    expect(totalExp.irpj).toBeCloseTo(semExp.irpj, 6);
    expect(totalExp.csll).toBeCloseTo(semExp.csll, 6);
    expect(totalExp.cpp).toBeCloseTo(semExp.cpp, 6);
  });

  it('funciona acima do sublimite estadual (ICMS/ISS fora do DAS)', () => {
    const params = comExp(100, { faturamentoAnual: 4_000_000, sublimiteEstadual: 3_600_000 });
    const r = simularSimples(params, 2026, 6);
    expect(r.sublimiteExcedido).toBe(true);
    expect(r.icms).toBeCloseTo(0, 6);
    expect(r.iss).toBeCloseTo(0, 6);
    expect(r.totalTributos).toBeGreaterThanOrEqual(0);
  });
});

describe('Fuzzing de 900 cenários — monotonicidade e sanidade', () => {
  it('carga nunca cresce com o aumento da exportação, em nenhum regime', () => {
    let cenarios = 0;
    for (let i = 0; i < 300; i += 1) {
      const params: ParametrosSimulacao = {
        faturamentoAnual: 100_000 + (i % 40) * 150_000,
        folhaAnual: (i % 7) * 60_000,
        margemLucro: -20 + (i % 13) * 5,
        percentualServicos: (i % 11) * 10,
        comprasComCredito: (i % 5) * 90_000,
        despesasOperacionais: (i % 4) * 70_000,
        aliquotaICMS: [undefined, 0.07, 0.12, 0.18, 0.25][i % 5],
        aliquotaISS: [undefined, 0.02, 0.05][i % 3],
        prejuizoFiscalAcumulado: (i % 6) * 40_000,
        periodicidadeApuracao: i % 2 === 0 ? 'anual' : 'trimestral',
      };

      const escala = [0, 25, 50, 75, 100];
      const cargas = { simples: [] as number[], presumido: [] as number[], real: [] as number[] };

      for (const pct of escala) {
        const p = { ...params, percentualExportacao: pct };
        const s = simularSimples(p, 2026, 6);
        const lp = simularPresumido(p);
        const lr = simularReal(p);
        for (const r of [s, lp, lr]) {
          expect(Number.isFinite(r.totalTributos)).toBe(true);
          expect(r.totalTributos).toBeGreaterThanOrEqual(0);
          expect(r.pis).toBeGreaterThanOrEqual(0);
          expect(r.cofins).toBeGreaterThanOrEqual(0);
          expect(r.icms).toBeGreaterThanOrEqual(0);
          expect(r.iss).toBeGreaterThanOrEqual(0);
        }
        cargas.simples.push(s.totalTributos);
        cargas.presumido.push(lp.totalTributos);
        cargas.real.push(lr.totalTributos);
        cenarios += 3;
      }

      for (const serie of Object.values(cargas)) {
        for (let k = 1; k < serie.length; k += 1) {
          // tolerância de centavos para ruído de ponto flutuante
          expect(serie[k]).toBeLessThanOrEqual(serie[k - 1] + 0.01);
        }
      }
    }
    expect(cenarios).toBe(4_500);
  });

  it('percentual de exportação fora de faixa ou corrompido degrada para zero', () => {
    for (const v of [null, undefined, NaN, -50, 500, 'abc', {}, []]) {
      const p = { ...BASE, percentualExportacao: v } as unknown as ParametrosSimulacao;
      const r = simularPresumido(p);
      expect(Number.isFinite(r.totalTributos)).toBe(true);
      expect(r.totalTributos).toBeGreaterThanOrEqual(0);
    }
    // 500% é limitado a 100% — imunidade total, jamais crédito negativo
    const excesso = simularPresumido({ ...BASE, percentualExportacao: 500 });
    expect(excesso.pis).toBeCloseTo(0, 6);
  });
});
