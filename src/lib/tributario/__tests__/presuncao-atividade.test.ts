import { describe, it, expect } from 'vitest';
import { simularPresumido, sanitizarParametros } from '../shared-logic';
import type { ParametrosSimulacao } from '../shared-logic';

/**
 * A presunção de 32% só vale para serviços em geral. Transporte de cargas
 * (8% IRPJ / 12% CSLL) e serviços hospitalares seguem percentuais próprios
 * (Lei 9.249/95, arts. 15 e 20). Antes desta correção o motor superestimava
 * IRPJ/CSLL de transportadoras — justamente o core do negócio.
 */
const base: ParametrosSimulacao = {
  faturamentoAnual: 3_000_000,
  margemLucro: 10,
  percentualServicos: 100,
  folhaAnual: 0,
  aliquotaISS: 0.05,
};

describe('presunção por atividade no Lucro Presumido', () => {
  it('mantém 32% como default quando nada é informado', () => {
    const r = simularPresumido(base);
    // base IRPJ = 960.000 -> 15% + 10% adicional sobre excedente de 240k
    expect(r.irpj).toBeCloseTo(960_000 * 0.15 + (960_000 - 240_000) * 0.1, 2);
    expect(r.csll).toBeCloseTo(960_000 * 0.09, 2);
  });

  it('aplica presunção reduzida de transporte de cargas (8% / 12%)', () => {
    const r = simularPresumido({
      ...base,
      presuncaoIrpjServicos: 0.08,
      presuncaoCsllServicos: 0.12,
    });
    expect(r.irpj).toBeCloseTo(240_000 * 0.15, 2);
    expect(r.csll).toBeCloseTo(360_000 * 0.09, 2);
  });

  it('reduz a carga total frente à presunção geral', () => {
    const geral = simularPresumido(base);
    const transporte = simularPresumido({
      ...base,
      presuncaoIrpjServicos: 0.08,
      presuncaoCsllServicos: 0.12,
    });
    expect(transporte.totalTributos).toBeLessThan(geral.totalTributos);
  });

  it('registra a presunção efetiva nas observações', () => {
    const r = simularPresumido({ ...base, presuncaoIrpjServicos: 0.16, presuncaoCsllServicos: 0.12 });
    expect(r.observacoes.join(' ')).toContain('IRPJ 16%');
    expect(r.observacoes.join(' ')).toContain('CSLL 12%');
  });

  it('sanitiza valores fora dos limites legais', () => {
    const s = sanitizarParametros({ ...base, presuncaoIrpjServicos: 0.9, presuncaoCsllServicos: 0.01 });
    expect(s.presuncaoIrpjServicos).toBe(0.32);
    expect(s.presuncaoCsllServicos).toBe(0.12);
  });

  it('ignora valores não numéricos sem propagar NaN', () => {
    const r = simularPresumido({
      ...base,
      presuncaoIrpjServicos: Number.NaN,
      presuncaoCsllServicos: Number.NaN,
    });
    expect(Number.isFinite(r.totalTributos)).toBe(true);
    expect(r.totalTributos).toBeGreaterThan(0);
  });
});
