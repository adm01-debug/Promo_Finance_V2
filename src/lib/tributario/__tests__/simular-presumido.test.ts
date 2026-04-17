// ============================================
// TESTES — Lucro Presumido
// ============================================
import { describe, it, expect } from 'vitest';
import { simularPresumido } from '../simular-presumido';

const base = {
  faturamentoAnual: 2_000_000,
  margemLucro: 15,
  percentualServicos: 0,
  folhaAnual: 200_000,
};

describe('simularPresumido', () => {
  it('retorna inelegível quando faturamento > R$ 78mi', () => {
    const r = simularPresumido({ ...base, faturamentoAnual: 100_000_000 });
    expect(r.elegivel).toBe(false);
    expect(r.motivoInelegibilidade).toMatch(/78/);
    expect(r.totalTributos).toBe(0);
  });

  it('aplica presunção 8% comércio para empresa puramente comercial', () => {
    const r = simularPresumido({ ...base, percentualServicos: 0 });
    // base IRPJ = 2.000.000 * 0,08 = 160.000 → IRPJ 15% = 24.000 (sem adicional, ≤ 240k)
    expect(r.elegivel).toBe(true);
    expect(r.irpj).toBeCloseTo(24_000, 0);
  });

  it('aplica presunção 32% serviços', () => {
    const r = simularPresumido({ ...base, percentualServicos: 100 });
    // base = 2.000.000 * 0,32 = 640.000 → IRPJ 15% = 96.000 + adicional 10% sobre (640k - 240k) = 40.000 → total 136.000
    expect(r.irpj).toBeCloseTo(136_000, 0);
  });

  it('aplica adicional de IRPJ quando base > R$ 240k/ano', () => {
    const r = simularPresumido({ ...base, faturamentoAnual: 5_000_000, percentualServicos: 100 });
    // base = 5M * 0,32 = 1,6M; adicional = (1,6M - 240k) * 10% = 136.000
    const irpjBase = 1_600_000 * 0.15;
    const adicional = (1_600_000 - 240_000) * 0.10;
    expect(r.irpj).toBeCloseTo(irpjBase + adicional, 0);
  });

  it('PIS/COFINS cumulativo sem créditos (3,65%)', () => {
    const r = simularPresumido(base);
    expect(r.pis).toBeCloseTo(2_000_000 * 0.0065, 2);
    expect(r.cofins).toBeCloseTo(2_000_000 * 0.03, 2);
  });

  it('CPP de 20% sobre folha', () => {
    const r = simularPresumido(base);
    expect(r.cpp).toBeCloseTo(40_000, 2);
  });

  it('mistura serviços + comércio proporcionalmente', () => {
    const r = simularPresumido({ ...base, percentualServicos: 50 });
    // 1M serviços (32%) + 1M comércio (8%)
    const baseIrpj = 1_000_000 * 0.32 + 1_000_000 * 0.08;
    expect(baseIrpj).toBe(400_000);
    expect(r.elegivel).toBe(true);
    expect(r.irpj).toBeGreaterThan(0);
  });

  it('carga efetiva > 0 e total consistente', () => {
    const r = simularPresumido(base);
    expect(r.totalTributos).toBeGreaterThan(0);
    expect(r.cargaEfetiva).toBeGreaterThan(0);
    expect(r.cargaEfetiva).toBeLessThan(50);
    const soma = r.irpj + r.csll + r.pis + r.cofins + r.icms + r.iss + r.cpp;
    expect(r.totalTributos).toBeCloseTo(soma, 2);
  });
});
