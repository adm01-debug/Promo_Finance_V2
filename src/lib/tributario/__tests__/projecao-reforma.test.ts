import { describe, it, expect } from 'vitest';
import { projetarReforma, CRONOGRAMA_REFORMA } from '../projecao-reforma';

describe('Projeção Reforma Tributária 2026-2033', () => {
  it('cobre todos os anos 2026-2033', () => {
    const { projecoes } = projetarReforma({
      faturamentoAnual: 1_000_000,
      percentualServicos: 100,
      pisCofinsAtual: 9.25,
      issAtual: 5,
    });
    expect(projecoes.map((p) => p.ano)).toEqual(CRONOGRAMA_REFORMA.map((c) => c.ano));
  });

  it('calcula carga atual com PIS/COFINS + ISS', () => {
    const { cargaAtual } = projetarReforma({
      faturamentoAnual: 1_000_000,
      percentualServicos: 100,
      pisCofinsAtual: 9.25,
      issAtual: 5,
    });
    expect(cargaAtual).toBeCloseTo(14.25, 2);
  });

  it('2026 mantém PIS/COFINS/ISS integrais + CBS/IBS simbólicos', () => {
    const { projecoes } = projetarReforma({
      faturamentoAnual: 1_000_000,
      percentualServicos: 100,
      pisCofinsAtual: 9.25,
      issAtual: 5,
    });
    const p = projecoes.find((x) => x.ano === 2026)!;
    expect(p.pisCofins).toBeCloseTo(92_500, 2);
    expect(p.iss).toBeCloseTo(50_000, 2);
    expect(p.cbs).toBeCloseTo(9_000, 2);
  });

  it('2033 zera tributos antigos', () => {
    const { projecoes } = projetarReforma({
      faturamentoAnual: 1_000_000,
      percentualServicos: 100,
      pisCofinsAtual: 9.25,
      issAtual: 5,
    });
    const p = projecoes.find((x) => x.ano === 2033)!;
    expect(p.pisCofins).toBe(0);
    expect(p.iss).toBe(0);
    expect(p.icms).toBe(0);
    expect(p.cbs + p.ibs).toBeGreaterThan(0);
  });

  it('aplica redutor de 60% para setor de saúde', () => {
    const { projecoes: comum } = projetarReforma({ faturamentoAnual: 1_000_000, percentualServicos: 100, pisCofinsAtual: 0, issAtual: 0 });
    const { projecoes: saude } = projetarReforma({ faturamentoAnual: 1_000_000, percentualServicos: 100, pisCofinsAtual: 0, issAtual: 0, setor: 'saude' });
    const c2033 = comum.find((p) => p.ano === 2033)!;
    const s2033 = saude.find((p) => p.ano === 2033)!;
    expect(s2033.totalTributos).toBeCloseTo(c2033.totalTributos * 0.4, 2);
  });
});
