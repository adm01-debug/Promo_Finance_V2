import { describe, it, expect } from 'vitest';
import { compensarPrejuizo, simularReal } from '../shared-logic';
import type { ParametrosSimulacao } from '../types';

const base = (over: Partial<ParametrosSimulacao> = {}): ParametrosSimulacao => ({
  faturamentoAnual: 10_000_000,
  margemLucro: 10,
  percentualServicos: 0,
  comprasComCredito: 3_000_000,
  despesasOperacionais: 1_000_000,
  folhaAnual: 800_000,
  ...over,
});

describe('Trava dos 30% na compensação de prejuízos (Lei 9.065/95, arts. 15 e 16)', () => {
  it('limita a compensação a 30% do lucro do período', () => {
    const r = compensarPrejuizo(1_000_000, 900_000);
    expect(r.compensado).toBe(300_000);
    expect(r.baseAjustada).toBe(700_000);
    expect(r.saldo).toBe(600_000);
  });

  it('compensa integralmente quando o estoque é menor que a trava', () => {
    const r = compensarPrejuizo(1_000_000, 200_000);
    expect(r.compensado).toBe(200_000);
    expect(r.saldo).toBe(0);
  });

  it('não compensa em período com prejuízo e acumula ao estoque', () => {
    const r = compensarPrejuizo(-500_000, 100_000);
    expect(r.compensado).toBe(0);
    expect(r.baseAjustada).toBe(0);
    expect(r.saldo).toBe(600_000);
  });

  it('reduz IRPJ/CSLL do Lucro Real ao informar prejuízo acumulado', () => {
    const sem = simularReal(base());
    const com = simularReal(base({
      prejuizoFiscalAcumulado: 5_000_000,
      baseNegativaCsllAcumulada: 5_000_000,
    }));
    expect(com.irpj).toBeLessThan(sem.irpj);
    expect(com.csll).toBeCloseTo(sem.csll * 0.7, 2);
    expect(com.prejuizoFiscalCompensado).toBeCloseTo(300_000, 2);
    expect(com.prejuizoFiscalSaldo).toBeCloseTo(4_700_000, 2);
  });

  it('mantém resultado idêntico quando não há estoque de prejuízo', () => {
    expect(simularReal(base({ prejuizoFiscalAcumulado: 0 })).totalTributos)
      .toBeCloseTo(simularReal(base()).totalTributos, 6);
  });

  it('é robusto a valores inválidos (NaN/negativos)', () => {
    const r = simularReal(base({ prejuizoFiscalAcumulado: Number.NaN, baseNegativaCsllAcumulada: -1000 }));
    expect(Number.isFinite(r.totalTributos)).toBe(true);
    expect(r.prejuizoFiscalCompensado).toBe(0);
  });

  it('fuzzing: nunca compensa mais que 30% e o total permanece finito', () => {
    for (let i = 0; i < 500; i += 1) {
      const fat = 300_000 + Math.random() * 60_000_000;
      const margem = Math.random() * 30;
      const r = simularReal(base({
        faturamentoAnual: fat,
        margemLucro: margem,
        percentualServicos: Math.random() * 100,
        prejuizoFiscalAcumulado: Math.random() * fat,
        baseNegativaCsllAcumulada: Math.random() * fat,
      }));
      const lucro = fat * (margem / 100);
      expect(r.prejuizoFiscalCompensado ?? 0).toBeLessThanOrEqual(lucro * 0.3 + 0.01);
      expect(Number.isFinite(r.totalTributos)).toBe(true);
      expect(r.totalTributos).toBeGreaterThanOrEqual(0);
    }
  });
});
