import { describe, it, expect } from 'vitest';
import {
  sanitizarParametros,
  simularSimples,
  simularPresumido,
  simularReal,
  type ParametrosSimulacao,
} from '../shared-logic';

const base: ParametrosSimulacao = {
  faturamentoAnual: 1_200_000,
  margemLucro: 20,
  percentualServicos: 50,
};

function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('sanitizarParametros — domínio legal dos parâmetros', () => {
  it('limita percentuais ao intervalo [0, 100]', () => {
    const s = sanitizarParametros({ ...base, percentualServicos: 140, percentualIndustria: -30 });
    expect(s.percentualServicos).toBeLessThanOrEqual(100);
    expect(s.percentualIndustria).toBe(0);
  });

  it('renormaliza o mix quando serviços + indústria + revenda excede 100%', () => {
    const s = sanitizarParametros({
      ...base,
      percentualServicos: 80,
      percentualIndustria: 60,
      percentualRevenda: 60,
    });
    const soma = (s.percentualServicos || 0) + (s.percentualIndustria || 0) + (s.percentualRevenda || 0);
    expect(soma).toBeCloseTo(100, 6);
  });

  it('neutraliza NaN, Infinity e valores negativos', () => {
    const s = sanitizarParametros({
      ...base,
      faturamentoAnual: Number.NaN,
      margemLucro: Number.POSITIVE_INFINITY,
      folhaAnual: -5000,
      comprasComCredito: Number.NaN,
      issRetidoFonte: -10,
    });
    expect(s.faturamentoAnual).toBe(0);
    expect(s.margemLucro).toBe(0);
    expect(s.folhaAnual).toBe(0);
    expect(s.comprasComCredito).toBe(0);
    expect(s.issRetidoFonte).toBe(0);
  });

  it('mantém alíquotas dentro de faixas plausíveis', () => {
    const s = sanitizarParametros({ ...base, aliquotaICMS: 3, aliquotaISS: -1, aliquotaRAT: 0.9, aliquotaTerceiros: 5 });
    expect(s.aliquotaICMS).toBe(1);
    expect(s.aliquotaISS).toBe(0);
    expect(s.aliquotaRAT).toBe(0.06);
    expect(s.aliquotaTerceiros).toBe(0.1);
  });

  it('preserva parâmetros já válidos sem alteração numérica', () => {
    const p: ParametrosSimulacao = { ...base, percentualServicos: 40, percentualIndustria: 30, percentualRevenda: 30, aliquotaICMS: 0.18 };
    const s = sanitizarParametros(p);
    expect(s.percentualServicos).toBe(40);
    expect(s.percentualIndustria).toBe(30);
    expect(s.percentualRevenda).toBe(30);
    expect(s.aliquotaICMS).toBe(0.18);
  });
});

describe('Fuzzing: 1500 cenários adversariais não produzem tributo inválido', () => {
  it('nenhum tributo negativo ou não-finito nos três regimes', () => {
    const r = prng(20260726);
    const problemas: string[] = [];
    for (let i = 0; i < 1500; i++) {
      const fat = Math.round(r() * 9_000_000);
      const p: ParametrosSimulacao = {
        faturamentoAnual: r() > 0.98 ? Number.NaN : fat,
        margemLucro: Math.round(r() * 160) - 40,
        percentualServicos: Math.round(r() * 130) - 10,
        percentualIndustria: Math.round(r() * 80) - 10,
        percentualRevenda: r() > 0.5 ? Math.round(r() * 90) : undefined,
        folhaAnual: Math.round(r() * fat * 0.8) - 1000,
        comprasComCredito: Math.round(r() * fat),
        despesasOperacionais: Math.round(r() * fat * 0.6),
        aliquotaICMS: r() * 1.4,
        aliquotaISS: r() * 0.2,
        aliquotaRAT: r() * 0.1,
        aliquotaTerceiros: r() * 0.2,
        issRetidoFonte: Math.round(r() * 80_000) - 5_000,
        sublimiteEstadual: r() > 0.7 ? 1_800_000 : 3_600_000,
      };
      const resultados = [
        ['simples', simularSimples(p, 2026, 7)] as const,
        ['presumido', simularPresumido(p)] as const,
        ['real', simularReal(p)] as const,
      ];
      for (const [nome, res] of resultados) {
        const campos: Array<[string, number]> = [
          ['irpj', res.irpj], ['csll', res.csll], ['pis', res.pis], ['cofins', res.cofins],
          ['cpp', res.cpp], ['icms', res.icms], ['iss', res.iss],
          ['total', res.totalTributos], ['carga', res.cargaEfetiva],
        ];
        for (const [campo, valor] of campos) {
          if (!Number.isFinite(valor)) problemas.push(`${nome}.${campo} não-finito (#${i})`);
          else if (valor < -1e-6) problemas.push(`${nome}.${campo}=${valor.toFixed(2)} negativo (#${i})`);
        }
        // Nota: com alíquotas e folha extremas (fora de qualquer realidade fiscal)
        // a carga pode ultrapassar 100%; o invariante exigido aqui é apenas que ela
        // seja finita e não negativa. O teto realista é verificado abaixo.
      }
    }
    expect(problemas.slice(0, 10)).toEqual([]);
  });
});


describe('Fuzzing realista: carga efetiva permanece plausível', () => {
  it('carga efetiva <= 60% em 800 cenários com parâmetros de mercado', () => {
    const r = prng(7);
    const excedentes: string[] = [];
    for (let i = 0; i < 800; i++) {
      const fat = 100_000 + Math.round(r() * 8_000_000);
      const p: ParametrosSimulacao = {
        faturamentoAnual: fat,
        margemLucro: Math.round(r() * 35),
        percentualServicos: Math.round(r() * 100),
        folhaAnual: Math.round(r() * fat * 0.35),
        comprasComCredito: Math.round(r() * fat * 0.5),
        despesasOperacionais: Math.round(r() * fat * 0.2),
        aliquotaICMS: 0.07 + r() * 0.11,
        aliquotaISS: 0.02 + r() * 0.03,
      };
      const resultados = [
        ['simples', simularSimples(p, 2026, 7)] as const,
        ['presumido', simularPresumido(p)] as const,
        ['real', simularReal(p)] as const,
      ];
      for (const [nome, res] of resultados) {
        if (res.elegivel && res.cargaEfetiva > 60) {
          excedentes.push(`${nome} carga ${res.cargaEfetiva.toFixed(2)}% (#${i})`);
        }
      }
    }
    expect(excedentes.slice(0, 10)).toEqual([]);
  });
});
