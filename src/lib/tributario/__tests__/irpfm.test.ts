import { describe, it, expect } from 'vitest';
import { calcularIRPFMMensal, calcularIRPFMAnual, IRPFM_LIMITE_ISENCAO_MENSAL } from '../irpfm';

describe('IRPFM — Lei 15.270/2025', () => {
  it('isenta valores até R$ 50k/mês', () => {
    const r = calcularIRPFMMensal({ dividendosMensais: IRPFM_LIMITE_ISENCAO_MENSAL });
    expect(r.impostoMinimo).toBe(0);
    expect(r.aliquotaEfetiva).toBe(0);
  });

  it('aplica 5% sobre excedente entre R$ 50k e R$ 100k', () => {
    const r = calcularIRPFMMensal({ dividendosMensais: 80_000 });
    expect(r.baseCalculo).toBe(30_000);
    expect(r.aliquotaEfetiva).toBe(5);
    expect(r.impostoMinimo).toBeCloseTo(1500, 2);
  });

  it('aplica 7,5% para excedente até R$ 200k', () => {
    const r = calcularIRPFMMensal({ dividendosMensais: 200_000 });
    // excedente = 150k → faixa 7,5%
    expect(r.aliquotaEfetiva).toBe(7.5);
    expect(r.impostoMinimo).toBeCloseTo(11_250, 2);
  });

  it('aplica teto de 10% para grandes valores', () => {
    const r = calcularIRPFMMensal({ dividendosMensais: 500_000 });
    expect(r.aliquotaEfetiva).toBe(10);
    expect(r.impostoMinimo).toBeCloseTo(45_000, 2);
  });

  it('abate IRRF retido', () => {
    const r = calcularIRPFMMensal({ dividendosMensais: 80_000, irrfRetido: 500 });
    expect(r.impostoMinimo).toBeCloseTo(1500, 2);
    expect(r.impostoLiquido).toBeCloseTo(1000, 2);
  });

  it('soma 12 meses corretamente', () => {
    const meses = Array.from({ length: 12 }, () => ({ dividendosMensais: 60_000 }));
    const r = calcularIRPFMAnual(meses);
    expect(r.totalDividendos).toBe(720_000);
    expect(r.totalImposto).toBeCloseTo(12 * 500, 2); // 5% sobre 10k cada mês
    expect(r.alertas.length).toBeGreaterThan(0);
  });
});
