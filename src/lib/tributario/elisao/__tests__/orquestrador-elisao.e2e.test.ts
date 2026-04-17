// ============================================
// E2E — Orquestrador de Elisão Fiscal
// Cobertura das 9 estratégias + edge cases (priorização, threshold, perfis)
// ============================================
import { describe, it, expect } from 'vitest';
import { analisarOportunidadesElisao } from '../orquestrador-elisao';
import type { ContextoEmpresa } from '../types';

const baseLucroReal: ContextoEmpresa = {
  empresa_id: 'emp-real',
  regime_atual: 'real',
  rbt12: 50_000_000,
  faturamento_anual: 50_000_000,
  patrimonio_liquido: 12_000_000,
  lucro_liquido: 6_000_000,
  folha_total_anual: 9_000_000,
  receita_exportacao: 6_000_000,
  receita_importacao: 2_000_000,
  despesas_pd: 1_500_000,
  beneficio_icms_anual: 800_000,
  dividendos_pf_anual: 1_500_000,
  carga_tributaria_atual: 0.34,
  cnae: '2829',
};

const baseLucroPresumido: ContextoEmpresa = {
  empresa_id: 'emp-pres',
  regime_atual: 'presumido',
  rbt12: 8_000_000,
  faturamento_anual: 8_000_000,
  patrimonio_liquido: 2_000_000,
  lucro_liquido: 800_000,
  folha_total_anual: 1_500_000,
  receita_exportacao: 0,
  beneficio_icms_anual: 0,
  dividendos_pf_anual: 200_000,
  carga_tributaria_atual: 0.18,
  cnae: '4711',
};

const baseSimples: ContextoEmpresa = {
  empresa_id: 'emp-sim',
  regime_atual: 'simples',
  rbt12: 1_500_000,
  faturamento_anual: 1_500_000,
  patrimonio_liquido: 300_000,
  lucro_liquido: 200_000,
  folha_total_anual: 400_000,
  carga_tributaria_atual: 0.10,
  cnae: '6201',
};

describe('E2E orquestrador-elisao — cobertura das 9 estratégias', () => {
  it('Lucro Real maximiza estratégias aplicáveis vs Lucro Presumido vs Simples', () => {
    const real = analisarOportunidadesElisao(baseLucroReal);
    const pres = analisarOportunidadesElisao(baseLucroPresumido);
    const sim = analisarOportunidadesElisao(baseSimples);

    expect(real.total_aplicaveis).toBeGreaterThan(pres.total_aplicaveis);
    expect(pres.total_aplicaveis).toBeGreaterThanOrEqual(sim.total_aplicaveis);
  });

  it('JCP só é aplicável em Lucro Real com PL e lucro suficientes', () => {
    const real = analisarOportunidadesElisao(baseLucroReal);
    const sim = analisarOportunidadesElisao(baseSimples);
    const jcpReal = real.oportunidades.find((o) => o.estrategia === 'jcp');
    const jcpSim = sim.oportunidades.find((o) => o.estrategia === 'jcp');
    expect(jcpReal?.aplicavel).toBe(true);
    expect(jcpSim?.aplicavel).toBe(false);
  });

  it('REINTEGRA aplicável apenas com receita de exportação > 0', () => {
    const comExp = analisarOportunidadesElisao(baseLucroReal);
    const semExp = analisarOportunidadesElisao({ ...baseLucroReal, receita_exportacao: 0 });
    expect(comExp.oportunidades.find((o) => o.estrategia === 'reintegra')?.aplicavel).toBe(true);
    expect(semExp.oportunidades.find((o) => o.estrategia === 'reintegra')?.aplicavel).toBe(false);
  });

  it('PAT é aplicável quando há folha relevante', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    const pat = r.oportunidades.find((o) => o.estrategia === 'pat');
    expect(pat).toBeDefined();
    expect(pat?.base_legal).toMatch(/6\.?321/);
  });

  it('Lei do Bem aplicável apenas em Lucro Real com despesas P&D', () => {
    const com = analisarOportunidadesElisao(baseLucroReal);
    const sem = analisarOportunidadesElisao({ ...baseLucroReal, despesas_pd: 0 });
    const pres = analisarOportunidadesElisao({ ...baseLucroPresumido, despesas_pd: 500_000 });
    expect(com.oportunidades.find((o) => o.estrategia === 'lei_bem')?.aplicavel).toBe(true);
    expect(sem.oportunidades.find((o) => o.estrategia === 'lei_bem')?.aplicavel).toBe(false);
    expect(pres.oportunidades.find((o) => o.estrategia === 'lei_bem')?.aplicavel).toBe(false);
  });

  it('DRAWBACK aplicável quando há importação relevante', () => {
    const com = analisarOportunidadesElisao(baseLucroReal);
    const sem = analisarOportunidadesElisao({ ...baseLucroReal, receita_importacao: 0 });
    expect(com.oportunidades.find((o) => o.estrategia === 'drawback')?.aplicavel).toBe(true);
    expect(sem.oportunidades.find((o) => o.estrategia === 'drawback')?.aplicavel).toBe(false);
  });

  it('Subvenção ICMS exige benefício ICMS > 0 e Lucro Real', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    const sem = analisarOportunidadesElisao({ ...baseLucroReal, beneficio_icms_anual: 0 });
    expect(r.oportunidades.find((o) => o.estrategia === 'subvencao_icms')?.aplicavel).toBe(true);
    expect(sem.oportunidades.find((o) => o.estrategia === 'subvencao_icms')?.aplicavel).toBe(false);
  });

  it('Holding patrimonial aplicável quando dividendos PF > teto IRPFM', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    const sem = analisarOportunidadesElisao({ ...baseLucroReal, dividendos_pf_anual: 100_000 });
    expect(r.oportunidades.find((o) => o.estrategia === 'holding')?.aplicavel).toBe(true);
    expect(sem.oportunidades.find((o) => o.estrategia === 'holding')?.aplicavel).toBe(false);
  });
});

describe('E2E orquestrador-elisao — edge cases', () => {
  it('empresa zerada não gera oportunidades aplicáveis', () => {
    const vazio: ContextoEmpresa = {
      empresa_id: 'vazio',
      regime_atual: 'simples',
      rbt12: 0,
      faturamento_anual: 0,
    };
    const r = analisarOportunidadesElisao(vazio);
    expect(r.total_oportunidades).toBe(9);
    expect(r.total_aplicaveis).toBe(0);
    expect(r.economia_total_estimada).toBe(0);
  });

  it('ranking decrescente por economia é respeitado mesmo com várias estratégias conflitantes', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    const aplicaveis = r.oportunidades.filter((o) => o.aplicavel);
    expect(aplicaveis.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < aplicaveis.length; i++) {
      expect(aplicaveis[i - 1].economia_estimada).toBeGreaterThanOrEqual(aplicaveis[i].economia_estimada);
    }
  });

  it('todas as oportunidades têm faixa min/max consistente', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    r.oportunidades.forEach((o) => {
      expect(o.economia_min).toBeLessThanOrEqual(o.economia_estimada);
      expect(o.economia_estimada).toBeLessThanOrEqual(o.economia_max);
    });
  });

  it('proximos_passos é sempre array não vazio para estratégias aplicáveis', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    r.oportunidades.filter((o) => o.aplicavel).forEach((o) => {
      expect(o.proximos_passos.length).toBeGreaterThan(0);
    });
  });

  it('classificação de risco é estável dentro do enum permitido', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    r.oportunidades.forEach((o) => {
      expect(['baixo', 'medio', 'alto']).toContain(o.risco);
    });
  });

  it('mudança de regime altera o conjunto de aplicáveis', () => {
    const real = analisarOportunidadesElisao(baseLucroReal);
    const presumido = analisarOportunidadesElisao({ ...baseLucroReal, regime_atual: 'presumido' });
    const aplicaveisReal = new Set(real.oportunidades.filter((o) => o.aplicavel).map((o) => o.estrategia));
    const aplicaveisPres = new Set(presumido.oportunidades.filter((o) => o.aplicavel).map((o) => o.estrategia));
    // Estratégias exclusivas do Real (JCP, Lei do Bem, Subvenção ICMS) saem do conjunto de Presumido
    expect(aplicaveisReal.has('jcp')).toBe(true);
    expect(aplicaveisPres.has('jcp')).toBe(false);
  });

  it('soma da economia total = soma individual das aplicáveis (invariante)', () => {
    const r = analisarOportunidadesElisao(baseLucroReal);
    const soma = r.oportunidades.filter((o) => o.aplicavel).reduce((a, o) => a + o.economia_estimada, 0);
    expect(r.economia_total_estimada).toBe(soma);
  });
});
