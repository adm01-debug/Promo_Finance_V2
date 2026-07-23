import { describe, it, expect } from 'vitest';
import { calcularLucroPresumido } from '../lucro-presumido';
import { calcularSimplesNacional } from '../simples-nacional';
import { calcularReformaTributaria } from '../reforma-tributaria';

describe('calcularLucroPresumido', () => {
  const base = {
    receitas: { receitaBrutaAnual: 3_000_000, percentualServicos: 0 },
    atividade: 'comercio' as const,
    folha: { folhaAnual: 400_000 },
    estadualMunicipal: { aliquotaIcms: 0.18 },
  };

  it('comércio presume 8% IRPJ / 12% CSLL', () => {
    const r = calcularLucroPresumido(base);
    // IRPJ base = 3mi * 8% = 240k → 15% = 36k
    // Adicional trim: (240k/4 - 60k) = 0 → sem adicional
    expect(r.tributos.find((t) => t.nome === 'IRPJ')!.valor).toBeCloseTo(36_000, 0);
    // CSLL: 3mi*12%*9% = 32.4k
    expect(r.tributos.find((t) => t.nome === 'CSLL')!.valor).toBeCloseTo(32_400, 0);
  });

  it('rejeita receita > R$ 78 mi', () => {
    const r = calcularLucroPresumido({ ...base, receitas: { receitaBrutaAnual: 80_000_000, percentualServicos: 0 } });
    expect(r.elegivel).toBe(false);
  });

  it('PIS/COFINS cumulativo (0,65% + 3%)', () => {
    const r = calcularLucroPresumido(base);
    expect(r.tributos.find((t) => t.nome === 'PIS')!.valor).toBeCloseTo(19_500, 0);
    expect(r.tributos.find((t) => t.nome === 'COFINS')!.valor).toBeCloseTo(90_000, 0);
  });

  it('serviços presume 32%', () => {
    const r = calcularLucroPresumido({ ...base, atividade: 'servicos_geral', receitas: { receitaBrutaAnual: 1_000_000, percentualServicos: 100 }, estadualMunicipal: { aliquotaIss: 0.05 } });
    // 1mi * 32% = 320k → 15% = 48k + adic (320k/4 - 60k)*4*10% = 8k
    expect(r.tributos.find((t) => t.nome === 'IRPJ')!.valor).toBeCloseTo(56_000, 0);
  });
});

describe('calcularSimplesNacional', () => {
  const base = {
    receitas: { receitaBrutaAnual: 500_000, percentualServicos: 0 },
    anexo: 'I' as const,
    rbt12: 500_000,
    folha12m: 100_000,
  };

  it('calcula DAS pelo Anexo I faixa 3', () => {
    const r = calcularSimplesNacional(base);
    // aliq efetiva = (500k*9.5% - 13860)/500k = 6.728%
    expect(r.cargaEfetiva).toBeCloseTo(6.728, 2);
  });

  it('rejeita RBT12 > 4,8 mi', () => {
    const r = calcularSimplesNacional({ ...base, rbt12: 5_000_000 });
    expect(r.elegivel).toBe(false);
  });

  it('Fator R ≥ 28% muda Anexo V para III', () => {
    const r = calcularSimplesNacional({ ...base, anexo: 'V', folha12m: 200_000 });
    // 200k/500k = 40% ≥ 28% → III
    expect(r.alertas.some((a) => a.includes('Anexo III'))).toBe(true);
  });

  it('sublimite alerta', () => {
    const r = calcularSimplesNacional({ ...base, receitas: { receitaBrutaAnual: 4_000_000, percentualServicos: 0 }, rbt12: 4_000_000 });
    expect(r.alertas.some((a) => a.includes('sublimite'))).toBe(true);
  });
});

describe('calcularReformaTributaria', () => {
  const base = {
    receitas: { receitaBrutaAnual: 1_000_000, percentualServicos: 50 },
    anoReferencia: 2033,
  };

  it('2033: apenas CBS+IBS, sem resíduos', () => {
    const r = calcularReformaTributaria(base);
    expect(r.tributos.find((t) => t.nome === 'ICMS residual')!.valor).toBe(0);
    expect(r.tributos.find((t) => t.nome === 'ISS residual')!.valor).toBe(0);
    // CBS 8.8% + IBS 17.7% = 26.5%
    expect(r.cargaEfetiva).toBeCloseTo(26.5, 1);
  });

  it('2026: alíquotas teste 0,9% + 0,1%', () => {
    const r = calcularReformaTributaria({ ...base, anoReferencia: 2026 });
    // CBS 0.9% + IBS 0.1% + PIS+COFINS+ICMS+ISS integrais
    expect(r.tributos.find((t) => t.nome === 'CBS')!.aliquotaEfetiva).toBeCloseTo(0.009, 4);
  });

  it('regime reduzido aplica desconto', () => {
    const r = calcularReformaTributaria({ ...base, regimeEspecialReducao: 0.6 });
    expect(r.tributos.find((t) => t.nome === 'CBS')!.aliquotaEfetiva).toBeCloseTo(0.088 * 0.4, 4);
  });

  it('imposto seletivo aplica sobre categorias', () => {
    const r = calcularReformaTributaria({ ...base, categoriaImpostoSeletivo: 'fumo' });
    expect(r.tributos.find((t) => t.nome === 'Imposto Seletivo')!.valor).toBeCloseTo(250_000, 0);
  });
});
