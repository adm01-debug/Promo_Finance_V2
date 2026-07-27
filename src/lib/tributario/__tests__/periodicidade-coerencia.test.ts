import { describe, it, expect } from 'vitest';
import { simularReal } from '../shared-logic';
import type { ParametrosSimulacao } from '../types';

/**
 * Simulação massiva do comparativo de periodicidade no Lucro Real.
 *
 * Objetivo: garantir que a apuração ANUAL e a TRIMESTRAL partam sempre do mesmo
 * resultado econômico. Antes desta correção, informar `lucroTrimestral` fazia o
 * cenário anual continuar usando `faturamentoAnual * margemLucro`, produzindo
 * uma `economiaPeriodicidade` fictícia.
 */

const base: ParametrosSimulacao = {
  faturamentoAnual: 6_000_000,
  folhaAnual: 900_000,
  margemLucro: 15,
  percentualServicos: 50,
  comprasComCredito: 1_000_000,
  despesasOperacionais: 500_000,
};

/** PRNG determinístico para reprodutibilidade da simulação. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe('coerência de base entre periodicidade anual e trimestral', () => {
  it('usa a soma dos trimestres como lucro anual quando informados', () => {
    const trimestres = [200_000, 200_000, 200_000, 200_000];
    const r = simularReal({ ...base, lucroTrimestral: trimestres, periodicidadeApuracao: 'anual' });
    // Base anual = 800.000 → 15% + 10% sobre o excedente a 240.000.
    const esperado = 800_000 * 0.15 + (800_000 - 240_000) * 0.1;
    expect(r.irpj).toBeCloseTo(esperado, 2);
    expect(r.csll).toBeCloseTo(800_000 * 0.09, 2);
  });

  it('lucro trimestral uniforme e sem prejuízo acumulado é neutro em CSLL', () => {
    const trimestres = [150_000, 150_000, 150_000, 150_000];
    const anual = simularReal({ ...base, lucroTrimestral: trimestres, periodicidadeApuracao: 'anual' });
    const trim = simularReal({ ...base, lucroTrimestral: trimestres, periodicidadeApuracao: 'trimestral' });
    expect(anual.csll).toBeCloseTo(trim.csll, 2);
  });

  it('o trimestral nunca é mais barato que o anual sem prejuízos acumulados', () => {
    const random = rng(20260727);
    for (let i = 0; i < 400; i += 1) {
      const trimestres = Array.from({ length: 4 }, () => Math.round((random() - 0.15) * 1_500_000));
      const anual = simularReal({ ...base, lucroTrimestral: trimestres, periodicidadeApuracao: 'anual' });
      const trim = simularReal({ ...base, lucroTrimestral: trimestres, periodicidadeApuracao: 'trimestral' });
      const totalAnual = anual.irpj + anual.csll;
      const totalTrim = trim.irpj + trim.csll;
      // Tolerância de centavos para arredondamento de ponto flutuante.
      expect(totalTrim).toBeGreaterThanOrEqual(totalAnual - 0.01);
      expect(Number.isFinite(totalAnual)).toBe(true);
      expect(Number.isFinite(totalTrim)).toBe(true);
    }
  });

  it('economiaPeriodicidade é simétrica entre as duas opções', () => {
    const random = rng(987654321);
    for (let i = 0; i < 300; i += 1) {
      const trimestres = Array.from({ length: 4 }, () => Math.round((random() - 0.2) * 900_000));
      const prejuizo = Math.round(random() * 2_000_000);
      const params = {
        ...base,
        lucroTrimestral: trimestres,
        prejuizoFiscalAcumulado: prejuizo,
        baseNegativaCsllAcumulada: prejuizo,
      } satisfies ParametrosSimulacao;
      const anual = simularReal({ ...params, periodicidadeApuracao: 'anual' });
      const trim = simularReal({ ...params, periodicidadeApuracao: 'trimestral' });
      expect(anual.economiaPeriodicidade ?? 0).toBeCloseTo(-(trim.economiaPeriodicidade ?? 0), 2);
    }
  });

  it('mantém o comportamento anterior quando lucroTrimestral não é informado', () => {
    const r = simularReal({ ...base, periodicidadeApuracao: 'anual' });
    const lucro = base.faturamentoAnual * (base.margemLucro / 100);
    expect(r.irpj).toBeCloseTo(lucro * 0.15 + (lucro - 240_000) * 0.1, 2);
  });
});
