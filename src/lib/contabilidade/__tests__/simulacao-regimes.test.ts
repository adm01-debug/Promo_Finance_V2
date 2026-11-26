import { describe, expect, it } from 'vitest';
import { simularComparativo } from '@/lib/reforma-tributaria/simulador';
import {
  PREMISSAS_PADRAO,
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
  notasConsideradas: 120,
  titulosConsiderados: 0,
  fonteFaturamento: 'notas_fiscais',
  janelaInicio: '2025-11-26',
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
    expect(cenario.resultado.totalAntigo).toBeCloseTo(direto.totalAntigo, 2);
    expect(cenario.resultado.totalNovo).toBeCloseTo(direto.totalNovo, 2);
    expect(cenario.cargaAtual).toBeCloseTo(direto.totalAntigo, 2);
    expect(cenario.cargaSimulada).toBeCloseTo(direto.totalNovo, 2);
    expect(cenario.economiaEstimada).toBeCloseTo(cenario.cargaAtual - cenario.cargaSimulada, 2);
  });

  it('cobra mais no regime definitivo (2033) do que no ano-teste (2026)', () => {
    const c2026 = calcularCenario(fontes, premissas({ anoReferencia: 2026 }));
    const c2033 = calcularCenario(fontes, premissas({ anoReferencia: 2033 }));
    expect(c2026.cargaSimulada).toBeLessThan(c2033.cargaSimulada);
  });

  it('propaga a observação do cenário CBS do TCU', () => {
    const cenario = calcularCenario(fontes, premissas({ cenarioCbs: 'tcu' }));
    expect(cenario.resultado.observacoes.join(' ')).toContain('TCU');
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
