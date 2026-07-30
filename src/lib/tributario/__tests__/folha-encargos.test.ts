import { describe, expect, it } from 'vitest';
import {
  ALIQUOTA_CPP, ALIQUOTA_FGTS, FAP_MAXIMO, FAP_MINIMO,
  RAT_AJUSTADO_MAXIMO, RAT_AJUSTADO_MINIMO, RAT_POR_GRAU,
  buscarFpas, calcularEncargosPatronais, calcularRatAjustado,
  compararDesoneracaoFolha, grauRiscoPorCnae, normalizarFap, resolverRatNominal,
  type GrauRisco,
} from '../folha';
import { calcularLucroPresumido } from '../calculadora/lucro-presumido';
import { calcularLucroReal } from '../calculadora/lucro-real';

describe('folha — FAP e RAT ajustado', () => {
  it('normaliza o FAP dentro do intervalo legal', () => {
    expect(normalizarFap(0.1)).toBe(FAP_MINIMO);
    expect(normalizarFap(3)).toBe(FAP_MAXIMO);
    expect(normalizarFap(1.2345)).toBeCloseTo(1.2345, 6);
    expect(normalizarFap(undefined)).toBe(1);
    expect(normalizarFap(Number.NaN)).toBe(1);
  });

  it('aplica RAT ajustado = RAT × FAP respeitando piso e teto', () => {
    expect(calcularRatAjustado(0.02, 1)).toBeCloseTo(0.02, 6);
    expect(calcularRatAjustado(0.03, 2)).toBeCloseTo(RAT_AJUSTADO_MAXIMO, 6);
    expect(calcularRatAjustado(0.01, 0.5)).toBeCloseTo(RAT_AJUSTADO_MINIMO, 6);
    expect(calcularRatAjustado(0.01, 0.1)).toBeCloseTo(RAT_AJUSTADO_MINIMO, 6);
  });

  it('resolve o RAT nominal por override, grau de risco e CNAE', () => {
    expect(resolverRatNominal({ aliquotaRat: 0.025 })).toBe(0.025);
    expect(resolverRatNominal({ grauRisco: 'grave' })).toBe(RAT_POR_GRAU.grave);
    expect(resolverRatNominal({}, '4711-3/02')).toBe(RAT_POR_GRAU.leve);
    expect(resolverRatNominal({}, '4120-4/00')).toBe(RAT_POR_GRAU.grave);
    expect(resolverRatNominal({})).toBe(RAT_POR_GRAU.medio);
  });

  it('mapeia CNAE para grau de risco em formatos variados', () => {
    expect(grauRiscoPorCnae('62.01-5-01')).toBe('leve');
    expect(grauRiscoPorCnae('4930202')).toBe('grave');
    expect(grauRiscoPorCnae('')).toBeUndefined();
    expect(grauRiscoPorCnae(null)).toBeUndefined();
    expect(grauRiscoPorCnae('9')).toBeUndefined();
  });
});

describe('folha — encargos patronais', () => {
  it('calcula CPP, RAT, Terceiros e FGTS na configuração padrão', () => {
    const r = calcularEncargosPatronais({ folha: 100_000, grauRisco: 'medio' });
    expect(r.cpp).toBeCloseTo(20_000, 2);
    expect(r.rat).toBeCloseTo(2_000, 2);
    expect(r.terceiros).toBeCloseTo(5_800, 2);
    expect(r.fgts).toBeCloseTo(8_000, 2);
    expect(r.totalInss).toBeCloseTo(27_800, 2);
    expect(r.totalEncargos).toBeCloseTo(35_800, 2);
    expect(r.percentualSobreFolha).toBeCloseTo(0.358, 6);
  });

  it('exclui pró-labore da base de RAT, Terceiros e FGTS', () => {
    const r = calcularEncargosPatronais({ folha: 100_000, proLabore: 20_000, grauRisco: 'medio' });
    expect(r.baseCpp).toBe(100_000);
    expect(r.baseRatTerceiros).toBe(80_000);
    expect(r.cpp).toBeCloseTo(20_000, 2);
    expect(r.rat).toBeCloseTo(1_600, 2);
    expect(r.terceiros).toBeCloseTo(4_640, 2);
    expect(r.fgts).toBeCloseTo(6_400, 2);
  });

  it('alerta e zera base quando pró-labore excede a folha', () => {
    const r = calcularEncargosPatronais({ folha: 10_000, proLabore: 25_000 });
    expect(r.baseRatTerceiros).toBe(0);
    expect(r.rat).toBe(0);
    expect(r.alertas.some((a) => a.includes('Pró-labore'))).toBe(true);
  });

  it('zera contribuição patronal para optantes do Simples e imunes', () => {
    const simples = calcularEncargosPatronais({ folha: 50_000, simplesNacional: true });
    expect(simples.cpp + simples.rat + simples.terceiros).toBe(0);
    expect(simples.fgts).toBeCloseTo(4_000, 2);
    expect(simples.alertas.some((a) => a.includes('Simples'))).toBe(true);

    const imune = calcularEncargosPatronais({ folha: 50_000, imunePatronal: true });
    expect(imune.totalInss).toBe(0);
  });

  it('aplica o pacote de Terceiros conforme o FPAS informado', () => {
    const construcao = calcularEncargosPatronais({ folha: 100_000, fpas: '582' });
    expect(construcao.aliquotaTerceiros).toBeCloseTo(0.055, 6);
    const entidade = calcularEncargosPatronais({ folha: 100_000, fpas: '566' });
    expect(entidade.aliquotaTerceiros).toBeCloseTo(0.03, 6);
    // FPAS inexistente cai no padrão 515.
    const fallback = calcularEncargosPatronais({ folha: 100_000, fpas: '999' });
    expect(fallback.aliquotaTerceiros).toBeCloseTo(buscarFpas('515').aliquotaTerceiros, 6);
  });

  it('a composição de Terceiros soma exatamente a alíquota declarada', () => {
    for (const fpas of ['507', '515', '520', '523', '566', '582', '787']) {
      const item = buscarFpas(fpas);
      const soma = Object.values(item.composicao).reduce((s, v) => s + v, 0);
      expect(soma).toBeCloseTo(item.aliquotaTerceiros, 6);
    }
  });

  it('alerta quando o FAP informado está fora do intervalo legal', () => {
    const r = calcularEncargosPatronais({ folha: 100_000, fap: 5 });
    expect(r.fap).toBe(FAP_MAXIMO);
    expect(r.alertas.some((a) => a.includes('fora do intervalo legal'))).toBe(true);
  });

  it('trata entradas inválidas sem produzir NaN', () => {
    const casos = [
      { folha: 0 },
      { folha: -100 },
      { folha: Number.NaN },
      { folha: 1_000, fap: Number.NaN },
      { folha: 1_000, aliquotaRat: -1 },
      { folha: 1_000, aliquotaTerceiros: -0.5 },
    ];
    for (const caso of casos) {
      const r = calcularEncargosPatronais(caso);
      expect(Number.isFinite(r.totalEncargos)).toBe(true);
      expect(r.totalEncargos).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.percentualSobreFolha)).toBe(true);
    }
  });

  it('permite desligar o FGTS do total de encargos', () => {
    const r = calcularEncargosPatronais({ folha: 100_000, incluirFgts: false });
    expect(r.fgts).toBe(0);
    expect(r.totalEncargos).toBeCloseTo(r.totalInss, 2);
  });
});

describe('folha — simulação exaustiva de cenários', () => {
  const graus: GrauRisco[] = ['leve', 'medio', 'grave'];
  const faps = [0.5, 0.7, 1, 1.3, 1.7, 2];
  const fpasList = ['507', '515', '520', '523', '566', '582', '787'];
  const folhas = [0, 1_000, 87_500.37, 1_250_000, 9_999_999.99];

  it('mantém invariantes em todas as combinações (630 cenários)', () => {
    let cenarios = 0;
    for (const grauRisco of graus) {
      for (const fap of faps) {
        for (const fpas of fpasList) {
          for (const folha of folhas) {
            const r = calcularEncargosPatronais({ folha, grauRisco, fap, fpas });
            cenarios += 1;

            // 1. Nenhum valor pode ser negativo ou NaN.
            for (const v of [r.cpp, r.rat, r.terceiros, r.fgts, r.totalInss, r.totalEncargos]) {
              expect(Number.isFinite(v)).toBe(true);
              expect(v).toBeGreaterThanOrEqual(0);
            }
            // 2. RAT ajustado sempre dentro dos limites legais.
            expect(r.ratAjustado).toBeGreaterThanOrEqual(RAT_AJUSTADO_MINIMO);
            expect(r.ratAjustado).toBeLessThanOrEqual(RAT_AJUSTADO_MAXIMO);
            // 3. Composição do total.
            expect(r.totalInss).toBeCloseTo(r.cpp + r.rat + r.terceiros, 2);
            expect(r.totalEncargos).toBeCloseTo(r.totalInss + r.fgts, 2);
            // 4. Aderência às alíquotas.
            expect(r.cpp).toBeCloseTo(folha * ALIQUOTA_CPP, 1);
            expect(r.fgts).toBeCloseTo(folha * ALIQUOTA_FGTS, 1);
            // 5. Encargos totais nunca superam 100% da folha.
            expect(r.percentualSobreFolha).toBeLessThanOrEqual(1);
          }
        }
      }
    }
    expect(cenarios).toBe(graus.length * faps.length * fpasList.length * folhas.length);
  });

  it('é monotônico: FAP maior nunca reduz o encargo total', () => {
    for (const grauRisco of graus) {
      let anterior = -1;
      for (const fap of faps) {
        const r = calcularEncargosPatronais({ folha: 500_000, grauRisco, fap });
        expect(r.totalEncargos).toBeGreaterThanOrEqual(anterior);
        anterior = r.totalEncargos;
      }
    }
  });
});

describe('folha — desoneração (CPRB)', () => {
  it('recomenda CPRB quando a receita gera contribuição menor que a folha', () => {
    const r = compararDesoneracaoFolha({
      receitaBruta: 1_000_000,
      aliquotaCprb: 0.045,
      encargos: { folha: 500_000, grauRisco: 'leve' },
    });
    expect(r.cprb).toBeCloseTo(45_000, 2);
    expect(r.cppFolha).toBeCloseTo(100_000, 2);
    expect(r.economia).toBeGreaterThan(0);
    expect(r.recomendacao).toBe('cprb');
  });

  it('recomenda folha quando a receita é alta em relação à folha', () => {
    const r = compararDesoneracaoFolha({
      receitaBruta: 20_000_000,
      aliquotaCprb: 0.045,
      encargos: { folha: 300_000 },
    });
    expect(r.recomendacao).toBe('folha');
    expect(r.economia).toBeLessThan(0);
  });

  it('mantém RAT, Terceiros e FGTS na desoneração', () => {
    const r = compararDesoneracaoFolha({
      receitaBruta: 1_000_000,
      aliquotaCprb: 0.03,
      encargos: { folha: 400_000, grauRisco: 'medio' },
    });
    expect(r.encargosRemanescentes).toBeCloseTo(400_000 * (0.02 + 0.058 + 0.08), 2);
    expect(r.totalDesonerado).toBeCloseTo(r.cprb + r.encargosRemanescentes, 2);
  });

  it('alerta quando não há CPP devida ou alíquota informada', () => {
    const semCpp = compararDesoneracaoFolha({
      receitaBruta: 100_000, aliquotaCprb: 0.03,
      encargos: { folha: 100_000, simplesNacional: true },
    });
    expect(semCpp.alertas.some((a) => a.includes('sem CPP'))).toBe(true);

    const semAliquota = compararDesoneracaoFolha({
      receitaBruta: 100_000, aliquotaCprb: 0, encargos: { folha: 100_000 },
    });
    expect(semAliquota.cprb).toBe(0);
    expect(semAliquota.alertas.some((a) => a.includes('CPRB não informada'))).toBe(true);
  });
});

describe('folha — integração com os motores de regime', () => {
  const receitas = { receitaBrutaAnual: 5_000_000, percentualServicos: 100 };

  it('lucro presumido reflete RAT ajustado pelo FAP na CPP', () => {
    const base = calcularLucroPresumido({
      receitas, atividade: 'servicos_geral',
      folha: { folhaAnual: 1_000_000, grauRisco: 'medio', fap: 1 },
      estadualMunicipal: {},
    });
    const bonificado = calcularLucroPresumido({
      receitas, atividade: 'servicos_geral',
      folha: { folhaAnual: 1_000_000, grauRisco: 'medio', fap: 0.5 },
      estadualMunicipal: {},
    });
    const cppBase = base.tributos.find((t) => t.nome === 'CPP')!;
    const cppBonif = bonificado.tributos.find((t) => t.nome === 'CPP')!;
    expect(cppBase.valor).toBeCloseTo(278_000, 2);
    expect(cppBonif.valor).toBeCloseTo(268_000, 2);
    expect(cppBonif.valor).toBeLessThan(cppBase.valor);
  });

  it('lucro real deriva o RAT a partir do CNAE quando não há override', () => {
    const construcao = calcularLucroReal({
      receitas, lucroContabil: 800_000, lalur: {}, creditosPisCofins: {},
      folha: { folhaAnual: 1_000_000, cnae: '4120-4/00' },
      estadualMunicipal: {}, modo: 'trimestral',
    });
    const ti = calcularLucroReal({
      receitas, lucroContabil: 800_000, lalur: {}, creditosPisCofins: {},
      folha: { folhaAnual: 1_000_000, cnae: '6201-5/01' },
      estadualMunicipal: {}, modo: 'trimestral',
    });
    const cppConstrucao = construcao.tributos.find((t) => t.nome === 'CPP')!;
    const cppTi = ti.tributos.find((t) => t.nome === 'CPP')!;
    // Grave (3%) vs leve (1%) → diferença de 2 p.p. sobre 1MM = 20.000.
    expect(cppConstrucao.valor - cppTi.valor).toBeCloseTo(20_000, 2);
  });

  it('mantém compatibilidade com overrides legados de RAT e Terceiros', () => {
    const r = calcularLucroPresumido({
      receitas, atividade: 'servicos_geral',
      folha: { folhaAnual: 1_000_000, aliquotaRat: 0.03, aliquotaTerceiros: 0.058 },
      estadualMunicipal: {},
    });
    const cpp = r.tributos.find((t) => t.nome === 'CPP')!;
    expect(cpp.valor).toBeCloseTo(288_000, 2);
  });
});
