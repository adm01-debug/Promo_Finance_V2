import { describe, expect, it } from 'vitest';
import { simularComparativo } from '@/lib/reforma-tributaria/simulador';
import {
  PREMISSAS_PADRAO,
  calcularCargaSimples,
  calcularCenario,
  formatarMoeda,
  montarDadosSimulacao,
  nomeDoCenario,
  podeCalcular,
  type FontesContabeis,
  type PremissasCenario,
} from '../simulacao-regimes';

const fontes: FontesContabeis = {
  faturamento12m: 1_200_000,
  comprasServicos12m: 300_000,
  folha12m: 0,
  notasConsideradas: 120,
  titulosConsiderados: 0,
  fonteFaturamento: 'notas_fiscais',
  fonteFolha: 'sem_dados',
  janelaInicio: '2025-11-26',
  truncado: false,
};

const premissas = (over: Partial<PremissasCenario> = {}): PremissasCenario => ({
  ...PREMISSAS_PADRAO,
  nome: 'Cenário teste',
  anoReferencia: 2033,
  ...over,
});

describe('montarDadosSimulacao', () => {
  it('distribui vendas e serviços conforme o percentual informado', () => {
    const dados = montarDadosSimulacao(fontes, premissas({ percentualVendas: 70 }));
    expect(dados.faturamentoAnual).toBe(1_200_000);
    expect(dados.comprasAnual).toBe(300_000);
    expect(dados.percentualVendas).toBe(70);
    expect(dados.percentualServicos).toBe(30);
  });

  it('trava o percentual de vendas no intervalo 0..100', () => {
    expect(
      montarDadosSimulacao(fontes, premissas({ percentualVendas: 140 })).percentualVendas
    ).toBe(100);
    expect(
      montarDadosSimulacao(fontes, premissas({ percentualVendas: -10 })).percentualVendas
    ).toBe(0);
  });

  it('só envia alíquota CBS livre quando o cenário é livre', () => {
    const comOverride = montarDadosSimulacao(
      fontes,
      premissas({ cenarioCbs: 'cronograma', aliquotaCbsOverride: 9.5 })
    );
    expect(comOverride.aliquotaCBSOverride).toBeUndefined();
    expect(comOverride.cenarioCBS).toBeUndefined();

    const livre = montarDadosSimulacao(
      fontes,
      premissas({ cenarioCbs: 'livre', aliquotaCbsOverride: 9.5 })
    );
    expect(livre.aliquotaCBSOverride).toBe(9.5);
    expect(livre.cenarioCBS).toBe('livre');
  });

  it('não envia regime especial quando "nenhum"', () => {
    expect(montarDadosSimulacao(fontes, premissas()).regimeEspecial).toBeUndefined();
    expect(
      montarDadosSimulacao(fontes, premissas({ regimeEspecial: 'saude' })).regimeEspecial
    ).toBe('saude');
  });
});

describe('calcularCenario', () => {
  it('usa o motor oficial e devolve economia = carga atual - carga simulada', () => {
    const cenario = calcularCenario(fontes, premissas());
    const direto = simularComparativo(montarDadosSimulacao(fontes, premissas()), 2033);
    expect(cenario.resultado.totalNovo).toBeCloseTo(direto.totalNovo, 2);
    expect(cenario.cargaSimuladaBase).toBeCloseTo(direto.totalNovo, 2);
    expect(cenario.residuais.total).toBe(0);
    expect(cenario.cargaSimulada).toBeCloseTo(direto.totalNovo, 2);
    expect(cenario.economiaEstimada).toBeCloseTo(cenario.cargaAtual - cenario.cargaSimulada, 2);
  });

  it('muda a carga atual conforme o regime: Simples usa o DAS, Presumido/Real o modelo nao-cumulativo', () => {
    const simples = calcularCenario(fontes, premissas({ regimeAtual: 'Simples Nacional' }));
    const presumido = calcularCenario(fontes, premissas({ regimeAtual: 'Lucro Presumido' }));
    const das = calcularCargaSimples(fontes, premissas({ regimeAtual: 'Simples Nacional' }));

    expect(das.elegivel).toBe(true);
    expect(simples.cargaAtual).toBeCloseTo(das.total, 2);
    expect(presumido.cargaAtual).toBeCloseTo(presumido.resultado.totalAntigo, 2);
    expect(simples.cargaAtual).not.toBeCloseTo(presumido.cargaAtual, 2);
  });

  it('usa o anexo escolhido nos servicos e deriva do Fator R quando o anexo nao e de servico', () => {
    const servicosIII = calcularCenario(
      { ...fontes, folha12m: 400_000 },
      premissas({ anexoSimples: 'III', percentualVendas: 0 })
    );
    const servicosV = calcularCenario(
      { ...fontes, folha12m: 400_000 },
      premissas({ anexoSimples: 'V', percentualVendas: 0 })
    );
    const derivadoDoFatorR = calcularCenario(
      { ...fontes, folha12m: 400_000 },
      premissas({ anexoSimples: 'I', percentualVendas: 0 })
    );

    expect(servicosIII.cargaAtual).toBeLessThan(servicosV.cargaAtual);
    // Fator R = 400k / 1,2M = 33% (>= 28%) => Anexo III
    expect(derivadoDoFatorR.cargaAtual).toBeCloseTo(servicosIII.cargaAtual, 2);
  });

  it('cai no modelo nao-cumulativo quando a receita passa do limite do Simples', () => {
    const cenario = calcularCenario(
      { ...fontes, faturamento12m: 5_000_000 },
      premissas({ regimeAtual: 'Simples Nacional' })
    );
    expect(cenario.cargaAtual).toBeCloseTo(cenario.resultado.totalAntigo, 2);
    expect(cenario.avisos.join(' ')).toContain('limite do Simples');
  });

  it('soma ICMS/ISS/PIS/COFINS residuais nos anos de transicao', () => {
    const c2027 = calcularCenario(fontes, premissas({ anoReferencia: 2027 }));
    expect(c2027.residuais.total).toBeGreaterThan(0);
    expect(c2027.cargaSimulada).toBeCloseTo(c2027.cargaSimuladaBase + c2027.residuais.total, 2);
    expect(c2027.avisos.join(' ')).toContain('ICMS/ISS');

    const c2033 = calcularCenario(fontes, premissas({ anoReferencia: 2033 }));
    expect(c2033.residuais.total).toBe(0);
    expect(c2033.cargaSimulada).toBeCloseTo(c2033.cargaSimuladaBase, 2);
  });

  it('propaga a observacao do cenario CBS do TCU', () => {
    const cenario = calcularCenario(fontes, premissas({ cenarioCbs: 'tcu' }));
    expect(cenario.resultado.observacoes.join(' ')).toContain('TCU');
  });

  it('nao soma a CBS/IBS experimental na carga de 2026 (ano-teste)', () => {
    const c2026 = calcularCenario(fontes, premissas({ anoReferencia: 2026 }));

    expect(c2026.cargaSimuladaBase).toBeGreaterThan(0);
    expect(c2026.cargaSimulada).toBeCloseTo(c2026.residuais.total, 2);
    expect(c2026.cargaSimulada).toBeLessThan(c2026.cargaSimuladaBase + c2026.residuais.total);
    expect(c2026.avisos.join(' ')).toContain('Ano-teste');
  });

  it('recolhe a CPP patronal fora do DAS no Anexo IV', () => {
    const comFolha: FontesContabeis = {
      ...fontes,
      folha12m: 300_000,
      fonteFolha: 'folha_pagamento',
    };
    const carga = calcularCargaSimples(
      comFolha,
      premissas({ anexoSimples: 'IV', percentualVendas: 0 })
    );

    expect(carga.elegivel).toBe(true);
    expect(carga.cppForaDAS).toBeCloseTo(300_000 * 0.22, 2);
    expect(carga.total).toBeCloseTo(carga.das + carga.cppForaDAS, 2);
  });

  it('segrega receita mista por anexo (servicos x mercadorias)', () => {
    const soServicos = calcularCargaSimples(
      { ...fontes, folha12m: 100_000 },
      premissas({ percentualVendas: 0, anexoSimples: 'V' })
    );
    const soMercadorias = calcularCargaSimples(
      { ...fontes, folha12m: 100_000 },
      premissas({ percentualVendas: 100, anexoSimples: 'I' })
    );
    const misto = calcularCargaSimples(
      { ...fontes, folha12m: 100_000 },
      premissas({ percentualVendas: 50, anexoSimples: 'V' })
    );

    expect(misto.total).toBeGreaterThan(soMercadorias.total);
    expect(misto.total).toBeLessThan(soServicos.total);
    expect(misto.avisos.join(' ')).toContain('segregada');
  });

  it('recolhe ICMS fora do DAS acima do sublimite estadual', () => {
    const carga = calcularCargaSimples(
      { ...fontes, faturamento12m: 4_000_000 },
      premissas({ percentualVendas: 100 })
    );

    expect(carga.elegivel).toBe(true);
    expect(carga.icmsForaDAS).toBeGreaterThan(0);
    expect(carga.total).toBeCloseTo(carga.das + carga.icmsForaDAS, 2);
  });

  it('avisa quando a leitura contabil foi truncada', () => {
    const cenario = calcularCenario({ ...fontes, truncado: true }, premissas());
    expect(cenario.avisos.join(' ')).toContain('100 mil');
  });

  it('nunca devolve NaN com base zerada', () => {
    const cenario = calcularCenario(
      { ...fontes, faturamento12m: 1, comprasServicos12m: 0 },
      premissas()
    );
    expect(Number.isFinite(cenario.cargaAtual)).toBe(true);
    expect(Number.isFinite(cenario.cargaSimulada)).toBe(true);
    expect(Number.isFinite(cenario.economiaEstimada)).toBe(true);
  });
});

describe('podeCalcular', () => {
  it('exige faturamento apurado', () => {
    expect(podeCalcular(null)).toBe(false);
    expect(podeCalcular({ ...fontes, faturamento12m: 0 })).toBe(false);
    expect(podeCalcular(fontes)).toBe(true);
  });
});

describe('nomeDoCenario', () => {
  it('lê premissas.nome e cai em rótulo padrão quando ausente', () => {
    expect(nomeDoCenario({ nome: '  Planejamento 2027 ' })).toBe('Planejamento 2027');
    expect(nomeDoCenario({ nome: '   ' })).toBe('Cenário sem nome');
    expect(nomeDoCenario(null)).toBe('Cenário sem nome');
    expect(nomeDoCenario('texto')).toBe('Cenário sem nome');
  });
});

describe('formatarMoeda', () => {
  it('formata em BRL e trata nulo', () => {
    expect(formatarMoeda(1234.5)).toContain('1.234,50');
    expect(formatarMoeda(null)).toContain('0,00');
  });
});
