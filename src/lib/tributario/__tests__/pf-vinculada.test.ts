import { describe, it, expect } from 'vitest';
import {
  calcularAliquotaIrpfm,
  calcularIrpfMensal,
  otimizarProLabore,
  simularPessoaFisica,
} from '../pf-vinculada';

describe('Tributação PF vinculada — Lei 15.270/2025', () => {
  it('isenta IRPF até R$ 5.000/mês', () => {
    expect(calcularIrpfMensal(5_000)).toBe(0);
    expect(calcularIrpfMensal(0)).toBe(0);
  });

  it('aplica redutor linear entre R$ 5.000 e R$ 7.350', () => {
    const meio = calcularIrpfMensal(6_175);
    const cheio = 6_175 * 0.275 - 908.73;
    expect(meio).toBeGreaterThan(0);
    expect(meio).toBeLessThan(cheio);
  });

  it('não aplica IRPFM para renda total de R$ 480k', () => {
    const r = simularPessoaFisica({ proLaboreMensal: 15_000, dividendosMensais: 25_000 });
    expect(r.rendaTotalAnual).toBe(480_000);
    expect(r.irpfm.aplicavel).toBe(false);
    expect(r.irpfm.complementarDaa).toBe(0);
  });

  it('retém IRRF de 10% quando dividendos mensais superam R$ 50k', () => {
    const r = simularPessoaFisica({ proLaboreMensal: 20_000, dividendosMensais: 60_000 });
    expect(r.irrfDividendos).toBeCloseTo(60_000 * 0.1 * 12, 2);
    expect(r.alertas.some((a) => a.tipo === 'IRRF_10')).toBe(true);
  });

  it('não retém IRRF exatamente no limite de R$ 50k', () => {
    const r = simularPessoaFisica({ proLaboreMensal: 10_000, dividendosMensais: 50_000 });
    expect(r.irrfDividendos).toBe(0);
  });

  it('usa alíquota linear de 0% a 10% entre R$ 600k e R$ 1,2mi', () => {
    expect(calcularAliquotaIrpfm(600_000)).toBe(0);
    expect(calcularAliquotaIrpfm(900_000)).toBeCloseTo(0.05, 6);
    expect(calcularAliquotaIrpfm(1_200_000)).toBeCloseTo(0.1, 6);
    expect(calcularAliquotaIrpfm(1_500_000)).toBe(0.1);
  });

  it('calcula IRPFM de 10% (R$ 150k) para renda total de R$ 1,5mi', () => {
    const r = simularPessoaFisica({
      proLaboreMensal: 0,
      dividendosMensais: 125_000,
    });
    expect(r.rendaTotalAnual).toBe(1_500_000);
    expect(r.irpfm.impostoMinimo).toBeCloseTo(150_000, 2);
    // IRRF de 10% já cobre integralmente o mínimo → sem complemento na DAA.
    expect(r.irpfm.irJaPago).toBeCloseTo(150_000, 2);
    expect(r.irpfm.complementarDaa).toBeCloseTo(0, 2);
  });

  it('gera complemento na DAA quando o IR pago é menor que o mínimo', () => {
    const r = simularPessoaFisica({
      proLaboreMensal: 5_000,
      dividendosMensais: 45_000,
      outrasRendasAnuais: 800_000,
    });
    expect(r.irpfm.aplicavel).toBe(true);
    expect(r.irpfm.complementarDaa).toBeGreaterThan(0);
  });

  it('alerta pejotização com pró-labore baixo e empresa relevante', () => {
    const r = simularPessoaFisica({ proLaboreMensal: 2_000, dividendosMensais: 40_000 });
    expect(r.alertas.some((a) => a.tipo === 'PRO_LABORE_BAIXO')).toBe(true);
  });

  it('alerta ausência total de pró-labore', () => {
    const r = simularPessoaFisica({ proLaboreMensal: 0, dividendosMensais: 30_000 });
    expect(r.alertas.some((a) => a.tipo === 'SEM_PRO_LABORE')).toBe(true);
  });

  it('mantém percentual e renda líquida coerentes', () => {
    const r = simularPessoaFisica({ proLaboreMensal: 15_000, dividendosMensais: 25_000 });
    expect(r.rendaLiquidaAnual).toBeCloseTo(r.rendaTotalAnual - r.totalTributadoAnual, 2);
    expect(r.percentualDaRenda).toBeGreaterThan(0);
  });

  it('otimizador nunca piora a carga atual', () => {
    const params = { proLaboreMensal: 5_000, dividendosMensais: 70_000 };
    const o = otimizarProLabore(params);
    expect(o.melhorCarga).toBeLessThanOrEqual(o.cargaAtual + 0.01);
    expect(o.economia).toBeGreaterThanOrEqual(0);
  });

  it('trata entradas inválidas sem quebrar', () => {
    const r = simularPessoaFisica({ proLaboreMensal: Number.NaN, dividendosMensais: -100 });
    expect(r.rendaTotalAnual).toBe(0);
    expect(r.totalTributadoAnual).toBe(0);
    expect(r.percentualDaRenda).toBe(0);
  });
});
