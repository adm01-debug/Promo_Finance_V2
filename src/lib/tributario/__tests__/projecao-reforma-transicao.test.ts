// ============================================
// TESTES — Transição CBS/IBS ano a ano (EC 132/2023)
// ============================================
import { describe, it, expect } from 'vitest';
import { projetarReforma, CRONOGRAMA_REFORMA } from '../projecao-reforma';
import { REF_CBS_2027, REF_IBS } from '@/config/reforma-tributaria';

const CBS_2027 = REF_CBS_2027 - 0.1; // fonte única: cronograma-oficial.ts

const params = {
  faturamentoAnual: 1_000_000,
  percentualServicos: 0,
  percentualComercio: 100,
  pisCofinsAtual: 9.25,
  icmsAtual: 18,
  issAtual: 5,
};

describe('Cronograma transição CBS/IBS', () => {
  it('2026: CBS 0,9% + IBS 0,1% (fase teste)', () => {
    const c = CRONOGRAMA_REFORMA.find((c) => c.ano === 2026)!;
    expect(c.cbs).toBe(0.9);
    expect(c.ibs).toBe(0.1);
    expect(c.fase).toMatch(/Teste/);
  });

  it('2027: CBS = REF_CBS_2027 − 0,1, PIS/COFINS extintos', () => {
    const c = CRONOGRAMA_REFORMA.find((c) => c.ano === 2027)!;
    expect(c.cbs).toBe(CBS_2027);
    expect(c.pisCofinsResidual).toBe(0);
  });

  it('2029: ICMS/ISS começam a reduzir (90% residual)', () => {
    const c = CRONOGRAMA_REFORMA.find((c) => c.ano === 2029)!;
    expect(c.icmsResidual).toBe(90);
    expect(c.issResidual).toBe(90);
    expect(c.ibs).toBe(1.77);
  });

  it('2033: sistema novo pleno — IBS = REF_IBS, CBS = REF_CBS_2027, sem residuais', () => {
    const c = CRONOGRAMA_REFORMA.find((c) => c.ano === 2033)!;
    expect(c.ibs).toBe(REF_IBS);
    expect(c.cbs).toBe(REF_CBS_2027);
    expect(c.icmsResidual).toBe(0);
    expect(c.issResidual).toBe(0);
  });

  it('total CBS+IBS em 2033 = REF_CBS_2027 + REF_IBS', () => {
    const c = CRONOGRAMA_REFORMA.find((c) => c.ano === 2033)!;
    expect(c.cbs + c.ibs).toBeCloseTo(REF_CBS_2027 + REF_IBS, 1);
  });
});

describe('projetarReforma — cálculos por ano', () => {
  it('2026 mantém ICMS integral + CBS/IBS simbólicos', () => {
    const { projecoes } = projetarReforma(params);
    const p = projecoes.find((p) => p.ano === 2026)!;
    expect(p.cbs).toBeCloseTo(9_000, 0);
    expect(p.ibs).toBeCloseTo(1_000, 0);
    expect(p.icms).toBeCloseTo(180_000, 0);
    expect(p.pisCofins).toBeCloseTo(92_500, 0);
  });

  it('2027 zera PIS/COFINS, CBS pleno', () => {
    const { projecoes } = projetarReforma(params);
    const p = projecoes.find((p) => p.ano === 2027)!;
    expect(p.pisCofins).toBe(0);
    expect(p.cbs).toBeCloseTo(1_000_000 * (CBS_2027 / 100), 0);
  });

  it('2030 — ICMS reduzido a 80%, IBS em 3,54%', () => {
    const { projecoes } = projetarReforma(params);
    const p = projecoes.find((p) => p.ano === 2030)!;
    expect(p.icms).toBeCloseTo(180_000 * 0.8, 0);
    expect(p.ibs).toBeCloseTo(35_400, 0);
  });

  it('2033 — só CBS+IBS, ICMS/ISS/PIS-COFINS = 0', () => {
    const { projecoes } = projetarReforma(params);
    const p = projecoes.find((p) => p.ano === 2033)!;
    expect(p.icms).toBe(0);
    expect(p.iss).toBe(0);
    expect(p.pisCofins).toBe(0);
    expect(p.totalTributos).toBeCloseTo(p.cbs + p.ibs, 2);
  });

  it('pico tributário identificado corretamente', () => {
    const r = projetarReforma(params);
    expect(r.picoTributario).toBeDefined();
    expect(r.picoTributario.totalTributos).toBeGreaterThanOrEqual(
      Math.max(...r.projecoes.map((p) => p.totalTributos)) - 0.01
    );
  });

  it('faturamento zero retorna projeções com tributos zero', () => {
    const r = projetarReforma({ ...params, faturamentoAnual: 0 });
    expect(r.cargaAtual).toBe(0);
    r.projecoes.forEach((p) => expect(p.totalTributos).toBe(0));
  });
});
