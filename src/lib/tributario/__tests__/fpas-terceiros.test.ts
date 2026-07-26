import { describe, it, expect } from 'vitest';
import {
  TABELA_FPAS,
  FPAS_PADRAO,
  resolverFpasPorCnae,
  aliquotaTerceirosPorCnae,
  divisaoCnae,
  buscarFpas,
} from '../folha/fpas-terceiros';
import { simularPresumido, simularReal, type ParametrosSimulacao } from '../shared-logic';

const base = (over: Partial<ParametrosSimulacao> = {}): ParametrosSimulacao => ({
  faturamentoAnual: 5_000_000,
  folhaAnual: 1_000_000,
  custosAnuais: 1_500_000,
  despesasAnuais: 500_000,
  percentualServicos: 0.5,
  percentualIndustria: 0,
  percentualRevenda: 0.5,
  ...over,
});

describe('FPAS / Terceiros por CNAE', () => {
  it('tabela é internamente coerente (soma das parcelas = alíquota total)', () => {
    for (const f of TABELA_FPAS) {
      const soma =
        f.composicao.salarioEducacao +
        f.composicao.incra +
        f.composicao.senaiSenacSenatSenar +
        f.composicao.sesiSescSest +
        f.composicao.sebrae;
      expect(f.aliquotaTerceiros).toBeCloseTo(soma, 6);
      expect(f.aliquotaTerceiros).toBeGreaterThanOrEqual(0);
      expect(f.aliquotaTerceiros).toBeLessThanOrEqual(0.08);
    }
  });

  it('divisaoCnae normaliza formatações diversas', () => {
    expect(divisaoCnae('47.51-2/01')).toBe('47');
    expect(divisaoCnae('4751201')).toBe('47');
    expect(divisaoCnae('  62.01-5/01 ')).toBe('62');
    expect(divisaoCnae('')).toBeNull();
    expect(divisaoCnae(null)).toBeNull();
    expect(divisaoCnae('4')).toBeNull();
  });

  it('enquadra atividades conhecidas', () => {
    expect(resolverFpasPorCnae('10.11-2/01').codigo).toBe('507'); // indústria
    expect(resolverFpasPorCnae('47.11-3/02').codigo).toBe('515'); // comércio
    expect(resolverFpasPorCnae('49.30-2/02').codigo).toBe('612'); // transporte
    expect(resolverFpasPorCnae('41.20-4/00').codigo).toBe('507-CC'); // construção
    expect(resolverFpasPorCnae('64.22-1/00').codigo).toBe('558'); // banco
    expect(resolverFpasPorCnae('01.11-3/01').codigo).toBe('604'); // rural
    expect(resolverFpasPorCnae('85.13-9/00').codigo).toBe('574'); // ensino
    expect(resolverFpasPorCnae('84.11-6/00').codigo).toBe('582'); // adm pública
  });

  it('CNAE desconhecido ou inválido cai no padrão conservador de 5,8%', () => {
    expect(resolverFpasPorCnae('99.99-9/99')).toBe(FPAS_PADRAO);
    expect(resolverFpasPorCnae('abc')).toBe(FPAS_PADRAO);
    expect(aliquotaTerceirosPorCnae(undefined)).toBeCloseTo(0.058, 6);
  });

  it('Simples Nacional é isento de terceiros', () => {
    expect(aliquotaTerceirosPorCnae('47.11-3/02', { simplesNacional: true })).toBe(0);
  });

  it('buscarFpas retorna null para código inexistente', () => {
    expect(buscarFpas('000')).toBeNull();
    expect(buscarFpas('507')?.aliquotaTerceiros).toBeCloseTo(0.058, 6);
  });
});

describe('Motor: CPP com terceiros derivados do CNAE', () => {
  it('banco (FPAS 558) paga menos terceiros que comércio', () => {
    const banco = simularPresumido(base({ cnaePrincipal: '64.22-1/00' }));
    const comercio = simularPresumido(base({ cnaePrincipal: '47.11-3/02' }));
    expect(banco.cpp).toBeLessThan(comercio.cpp);
    expect(comercio.cpp).toBeCloseTo(1_000_000 * (0.2 + 0.02 + 0.058), 2);
    expect(banco.cpp).toBeCloseTo(1_000_000 * (0.2 + 0.02 + 0.052), 2);
  });

  it('alíquota explícita sobrepõe a derivação por CNAE', () => {
    const r = simularReal(base({ cnaePrincipal: '64.22-1/00', aliquotaTerceiros: 0 }));
    expect(r.cpp).toBeCloseTo(1_000_000 * 0.22, 2);
  });

  it('500 cenários: CPP sempre dentro dos limites legais', () => {
    const cnaes = ['0111301', '1011201', '4120400', '4711302', '4930202', '6422100', '8513900', '8411600', '9999999', 'xx'];
    for (let i = 0; i < 500; i++) {
      const folha = Math.round(Math.random() * 3_000_000);
      const cnae = cnaes[i % cnaes.length];
      const rat = [0, 0.01, 0.02, 0.03, 0.06][i % 5];
      const p = base({ folhaAnual: folha, cnaePrincipal: cnae, aliquotaRAT: rat, faturamentoAnual: 1_000_000 + i * 10_000 });
      for (const r of [simularPresumido(p), simularReal(p)]) {
        expect(r.cpp).toBeGreaterThanOrEqual(folha * (0.2 + rat));
        expect(r.cpp).toBeLessThanOrEqual(folha * (0.2 + rat + 0.08) + 0.01);
        expect(Number.isFinite(r.totalTributos)).toBe(true);
        expect(r.totalTributos).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
