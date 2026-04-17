// ============================================
// TESTES — Lucro Real
// ============================================
import { describe, it, expect } from 'vitest';
import { simularReal } from '../simular-real';

const base = {
  faturamentoAnual: 5_000_000,
  margemLucro: 10,
  percentualServicos: 0,
  comprasComCredito: 1_000_000,
  despesasOperacionais: 500_000,
  folhaAnual: 600_000,
};

describe('simularReal', () => {
  it('sempre é elegível', () => {
    const r = simularReal(base);
    expect(r.elegivel).toBe(true);
  });

  it('IRPJ 15% sobre lucro + adicional 10% sobre excedente de R$ 240k', () => {
    const r = simularReal(base);
    // lucro = 5M * 10% = 500k
    const irpjEsperado = 500_000 * 0.15 + (500_000 - 240_000) * 0.10;
    expect(r.irpj).toBeCloseTo(irpjEsperado, 0);
  });

  it('CSLL 9% sobre lucro', () => {
    const r = simularReal(base);
    expect(r.csll).toBeCloseTo(500_000 * 0.09, 2);
  });

  it('PIS/COFINS não-cumulativo com créditos (Tema 779)', () => {
    const r = simularReal(base);
    const baseCred = 1_500_000;
    const pisEsperado = 5_000_000 * 0.0165 - baseCred * 0.0165;
    const cofinsEsperado = 5_000_000 * 0.076 - baseCred * 0.076;
    expect(r.pis).toBeCloseTo(pisEsperado, 0);
    expect(r.cofins).toBeCloseTo(cofinsEsperado, 0);
  });

  it('PIS/COFINS nunca negativo (créditos > débitos)', () => {
    const r = simularReal({ ...base, comprasComCredito: 10_000_000, despesasOperacionais: 10_000_000 });
    expect(r.pis).toBeGreaterThanOrEqual(0);
    expect(r.cofins).toBeGreaterThanOrEqual(0);
  });

  it('ICMS sobre comércio com crédito sobre compras', () => {
    const r = simularReal(base);
    // 5M * 18% - 1M * 18% = 900k - 180k = 720k
    expect(r.icms).toBeCloseTo(720_000, 0);
  });

  it('ISS sobre serviços (não ICMS)', () => {
    const r = simularReal({ ...base, percentualServicos: 100 });
    expect(r.iss).toBeCloseTo(5_000_000 * 0.05, 2);
    expect(r.icms).toBe(0);
  });

  it('sem adicional de IRPJ quando lucro ≤ R$ 240k', () => {
    const r = simularReal({ ...base, faturamentoAnual: 1_000_000, margemLucro: 10 });
    // lucro = 100k
    expect(r.irpj).toBeCloseTo(100_000 * 0.15, 2);
    expect(r.observacoes.some((o) => /Sem adicional/.test(o))).toBe(true);
  });

  it('lucro zero gera IRPJ/CSLL zero (lucro real ≤ 0)', () => {
    const r = simularReal({ ...base, margemLucro: 0 });
    expect(r.irpj).toBe(0);
    expect(r.csll).toBe(0);
  });

  it('alerta margem < 8%', () => {
    const r = simularReal({ ...base, margemLucro: 5 });
    expect(r.observacoes.some((o) => /Margem baixa/.test(o))).toBe(true);
  });

  it('CPP 20% sobre folha', () => {
    const r = simularReal(base);
    expect(r.cpp).toBeCloseTo(120_000, 2);
  });
});
