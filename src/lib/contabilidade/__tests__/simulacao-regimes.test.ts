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
  remuneracao12m: 0,
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

  it('sobrepoe o anexo de servico escolhido pelo corte de 28% do Fator R', () => {
    // Folha 400k / RBT12 1,2M = 33,3% (>= 28%) => Anexo III mesmo se o usuario escolheu V
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

    expect(servicosV.cargaAtual).toBeCloseTo(servicosIII.cargaAtual, 2);
    expect(servicosV.avisos.join(' ')).toContain('Anexo V substituído pelo Anexo III');
    expect(derivadoDoFatorR.cargaAtual).toBeCloseTo(servicosIII.cargaAtual, 2);
  });

  it('mantem o Anexo V escolhido quando o Fator R fica abaixo de 28%', () => {
    const v = calcularCenario(
      { ...fontes, folha12m: 100_000 },
      premissas({ anexoSimples: 'V', percentualVendas: 0 })
    );
    const iii = calcularCenario(
      { ...fontes, folha12m: 100_000 },
      premissas({ anexoSimples: 'III', percentualVendas: 0 })
    );

    // Fator R = 8,3% => o Anexo III informado tambem e substituido pelo V
    expect(iii.cargaAtual).toBeCloseTo(v.cargaAtual, 2);
    expect(iii.avisos.join(' ')).toContain('Anexo III substituído pelo Anexo V');
  });

  it('respeita o Anexo III quando a atividade nao esta sujeita ao Fator R', () => {
    const sujeito = calcularCenario(
      { ...fontes, folha12m: 100_000 },
      premissas({ anexoSimples: 'III', percentualVendas: 0 })
    );
    const naoSujeito = calcularCenario(
      { ...fontes, folha12m: 100_000 },
      premissas({ anexoSimples: 'III', percentualVendas: 0, sujeitoFatorR: false })
    );

    // Fator R = 8,3%: sujeito ao corte vira Anexo V; nao sujeito (fora do rol do
    // art. 18 §5o-I) fica no III sem passar pelo teste.
    expect(naoSujeito.cargaAtual).toBeLessThan(sujeito.cargaAtual);
    expect(naoSujeito.avisos.join(' ')).not.toContain('substituído pelo Anexo V');
    expect(naoSujeito.avisos.join(' ')).not.toContain('Folha não apurada');
  });

  it('tributa servicos pelo Anexo III quando o anexo informado e de mercadorias e a atividade nao esta sujeita ao Fator R', () => {
    const fontesMistas: FontesContabeis = { ...fontes, folha12m: 100_000 };
    const sujeito = calcularCenario(
      fontesMistas,
      premissas({ anexoSimples: 'I', percentualVendas: 50 })
    );
    const naoSujeito = calcularCenario(
      fontesMistas,
      premissas({ anexoSimples: 'I', percentualVendas: 50, sujeitoFatorR: false })
    );

    // Fator R = 8,3%: com o teste ligado os servicos caem no Anexo V; desligado ficam
    // no Anexo III e o aviso diz que o anexo de mercadorias nao vale para eles.
    expect(naoSujeito.cargaAtual).toBeLessThan(sujeito.cargaAtual);
    expect(naoSujeito.avisos.join(' ')).toContain('Atividade fora do rol do art. 18 §5º-I');
    expect(naoSujeito.avisos.join(' ')).toContain('serviços tributados pelo Anexo III');
    expect(naoSujeito.avisos.join(' ')).not.toContain('substituído pelo Anexo V');
  });

  it('mantem o aviso do ano-teste ressalvado quando ha reducao de regime especial', () => {
    const comReducao = calcularCenario(
      fontes,
      premissas({
        anoReferencia: 2026,
        cenarioCbs: 'cronograma',
        regimeEspecial: 'alimentos',
      })
    );
    const avisos = comReducao.avisos.join(' ');

    expect(avisos).toContain('não as alíquotas legais do ano-teste');
    expect(avisos).not.toContain('alíquotas legais do ano-teste —');
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

  it('avisa que Presumido e Real compartilham o modelo nao-cumulativo', () => {
    const presumido = calcularCenario(fontes, premissas({ regimeAtual: 'Lucro Presumido' }));
    const simples = calcularCenario(fontes, premissas({ regimeAtual: 'Simples Nacional' }));

    expect(presumido.avisos.join(' ')).toContain('modelo não-cumulativo');
    expect(simples.avisos.join(' ')).not.toContain('modelo não-cumulativo');
  });

  it('nao afirma que IRPJ/CSLL entram na carga atual de Presumido/Real', () => {
    const presumido = calcularCenario(fontes, premissas({ regimeAtual: 'Lucro Presumido' }));

    expect(presumido.cargaAtual).toBeCloseTo(presumido.resultado.totalAntigo, 2);
    expect(presumido.avisos.join(' ')).toContain('IRPJ/CSLL não entram');
  });

  it('no cenário oficial o aviso do ano-teste cita as alíquotas legais sem negá-las', () => {
    const c2026 = calcularCenario(
      fontes,
      premissas({ anoReferencia: 2026, cenarioCbs: 'cronograma' })
    );
    const avisos = c2026.avisos.join(' ');

    expect(avisos).toContain('0,9%');
    expect(avisos).toContain('alíquotas legais do ano-teste');
    expect(avisos).not.toContain('não corresponde às alíquotas legais');
  });

  it('avisa que o valor do ano-teste nao corresponde as aliquotas legais quando o cenario nao e o oficial', () => {
    const c2026 = calcularCenario(fontes, premissas({ anoReferencia: 2026, cenarioCbs: 'livre' }));
    const avisos = c2026.avisos.join(' ');

    expect(avisos).toContain('0,9%');
    expect(avisos).toContain('não as alíquotas legais do ano-teste');
    expect(avisos).not.toContain('alíquotas legais do ano-teste —');
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
    // Sem detalhamento de salarios/pro-labore a base cai na folha total.
    expect(carga.cppForaDAS).toBeCloseTo(300_000 * 0.22, 2);
    expect(carga.total).toBeCloseTo(carga.das + carga.cppForaDAS, 2);
  });

  it('calcula a CPP do Anexo IV sobre a remuneracao, sem os encargos da folha', () => {
    const carga = calcularCargaSimples(
      { ...fontes, folha12m: 130_000, remuneracao12m: 100_000 },
      premissas({ anexoSimples: 'IV', percentualVendas: 0 })
    );

    // 20% + RAT 2% sobre 100k de salarios/pro-labore (nao sobre os 130k de folha + encargos)
    expect(carga.cppForaDAS).toBeCloseTo(100_000 * 0.22, 2);
    expect(carga.total).toBeCloseTo(carga.das + 22_000, 2);
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

  it('nao deduz do DAS da 6a faixa uma parcela de ICMS que a tabela nao contem', () => {
    const carga = calcularCargaSimples(
      { ...fontes, faturamento12m: 4_000_000 },
      premissas({ percentualVendas: 100 })
    );

    // Anexo I, 6a faixa: nominal 19%, PD 378k -> efetiva 9,55% sobre 4M = 382k de DAS
    expect(carga.das).toBeCloseTo(382_000, 2);
    expect(carga.icmsForaDAS).toBeCloseTo(720_000, 2);
    expect(carga.total).toBeCloseTo(1_102_000, 2);
  });

  it('recolhe ICMS e ISS nas duas atividades quando a receita mista passa do sublimite', () => {
    const carga = calcularCargaSimples(
      { ...fontes, faturamento12m: 4_000_000 },
      premissas({ percentualVendas: 50, anexoSimples: 'I' })
    );

    expect(carga.icmsForaDAS).toBeCloseTo(2_000_000 * 0.18, 2);
    expect(carga.issForaDAS).toBeCloseTo(2_000_000 * 0.05, 2);
    expect(carga.total).toBeCloseTo(
      carga.das + carga.icmsForaDAS + carga.issForaDAS + carga.cppForaDAS,
      2
    );
    expect(carga.avisos.join(' ')).toContain('ICMS');
  });

  it('move apenas o ISS da 6a faixa do Anexo IV para fora do DAS', () => {
    const carga = calcularCargaSimples(
      { ...fontes, faturamento12m: 4_000_000, folha12m: 1_000_000, remuneracao12m: 800_000 },
      premissas({ percentualVendas: 0, anexoSimples: 'IV' })
    );

    // 42,10% da 6a faixa do Anexo IV e ISS, que passa a ser apurado por fora
    expect(carga.issForaDAS).toBeCloseTo(4_000_000 * 0.05, 2);
    expect(carga.icmsForaDAS).toBe(0);
    expect(carga.cppForaDAS).toBeCloseTo(800_000 * 0.22, 2);
    // DAS = efetiva da 6a faixa do Anexo IV (4M x 33% - 828k = 492k) x 57,90% (sem os 42,10% de ISS)
    expect(carga.das).toBeCloseTo(492_000 * 0.579, 0);
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
