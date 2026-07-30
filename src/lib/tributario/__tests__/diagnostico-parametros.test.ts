import { describe, it, expect } from 'vitest';
import { diagnosticarParametros } from '../diagnostico-parametros';
import type { ParametrosSimulacao } from '../shared-logic';

const base: ParametrosSimulacao = {
  faturamentoAnual: 1_000_000,
  margemLucro: 15,
  percentualServicos: 40,
  percentualIndustria: 20,
  percentualRevenda: 40,
};

function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('diagnosticarParametros', () => {
  it('não reporta ajustes para parâmetros válidos', () => {
    expect(diagnosticarParametros(base)).toEqual([]);
  });

  it('não reporta campos omitidos (defaults do motor não são ajustes)', () => {
    const ajustes = diagnosticarParametros({
      faturamentoAnual: 500_000,
      margemLucro: 10,
      percentualServicos: 100,
    });
    expect(ajustes).toEqual([]);
  });

  it('reporta percentual de serviços acima de 100% como ajuste', () => {
    const ajustes = diagnosticarParametros({ ...base, percentualServicos: 130 });
    const servicos = ajustes.find((a) => a.campo === 'percentualServicos');
    expect(servicos).toBeDefined();
    expect(servicos?.aplicado).not.toBe(servicos?.informado);
  });

  it('classifica valores negativos e NaN como críticos', () => {
    const ajustes = diagnosticarParametros({ ...base, folhaAnual: -100, comprasComCredito: Number.NaN });
    expect(ajustes.find((a) => a.campo === 'folhaAnual')?.severidade).toBe('critico');
    expect(ajustes.find((a) => a.campo === 'comprasComCredito')?.severidade).toBe('critico');
  });

  it('reporta alíquotas fora de faixa com formatação percentual', () => {
    const ajustes = diagnosticarParametros({ ...base, aliquotaRAT: 0.5 });
    const rat = ajustes.find((a) => a.campo === 'aliquotaRAT');
    expect(rat?.informado).toBe('50.00%');
    expect(rat?.aplicado).toBe('6.00%');
  });

  it('reporta a renormalização do mix quando a soma excede 100%', () => {
    const ajustes = diagnosticarParametros({
      ...base,
      percentualServicos: 70,
      percentualIndustria: 50,
      percentualRevenda: 50,
    });
    expect(ajustes.map((a) => a.campo).sort()).toEqual(
      ['percentualIndustria', 'percentualRevenda', 'percentualServicos'],
    );
  });

  it('é determinístico e nunca lança em 500 cenários adversariais', () => {
    const r = prng(99);
    for (let i = 0; i < 500; i++) {
      const p = {
        faturamentoAnual: r() > 0.95 ? Number.NaN : Math.round(r() * 5_000_000) - 50_000,
        margemLucro: Math.round(r() * 200) - 60,
        percentualServicos: Math.round(r() * 140) - 20,
        percentualIndustria: Math.round(r() * 90) - 10,
        percentualRevenda: r() > 0.5 ? Math.round(r() * 120) : undefined,
        folhaAnual: Math.round(r() * 900_000) - 20_000,
        aliquotaICMS: r() * 2,
        aliquotaISS: r() * 0.3,
        aliquotaRAT: r() * 0.2,
        aliquotaTerceiros: r() * 0.3,
        issRetidoFonte: Math.round(r() * 50_000) - 5_000,
      } as ParametrosSimulacao;
      const a1 = diagnosticarParametros(p);
      const a2 = diagnosticarParametros(p);
      expect(a2).toEqual(a1);
      for (const ajuste of a1) {
        expect(ajuste.rotulo.length).toBeGreaterThan(0);
        expect(ajuste.motivo.length).toBeGreaterThan(0);
        expect(['aviso', 'critico']).toContain(ajuste.severidade);
      }
    }
  });
});
