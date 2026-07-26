import { describe, expect, it } from 'vitest';
import {
  ALIQUOTA_CSLL,
  ALIQUOTA_IRPJ,
  LIMITE_ADICIONAL_MENSAL,
  apurarIrpjCsll,
  type AjusteLalur,
  type PeriodoApuracao,
} from '../irpj-csll';

const ajuste = (id: string, tipo: AjusteLalur['tipo'], valor: number, alvo: AjusteLalur['alvo'] = 'ambos'): AjusteLalur => ({
  id,
  descricao: id,
  tipo,
  alvo,
  valor,
});

const periodo = (over: Partial<PeriodoApuracao> = {}): PeriodoApuracao => ({
  rotulo: '1T',
  lucroLiquido: 1_000_000,
  ajustes: [],
  ...over,
});

describe('IRPJ/CSLL — Lucro Real', () => {
  it('aplica 15% + adicional 10% sobre o excedente trimestral', () => {
    const r = apurarIrpjCsll({ forma: 'trimestral', periodos: [periodo()] });
    const p = r.periodos[0];
    expect(p.irpjBase).toBeCloseTo(150_000, 2);
    expect(p.irpjAdicional).toBeCloseTo((1_000_000 - 60_000) * 0.1, 2);
    expect(p.csllDevida).toBeCloseTo(90_000, 2);
  });

  it('não gera adicional quando a base fica no limite de R$ 20 mil/mês', () => {
    const r = apurarIrpjCsll({
      forma: 'trimestral',
      periodos: [periodo({ lucroLiquido: LIMITE_ADICIONAL_MENSAL * 3 })],
    });
    expect(r.periodos[0].irpjAdicional).toBe(0);
  });

  it('respeita a trava de 30% na compensação de prejuízo', () => {
    const r = apurarIrpjCsll({
      forma: 'trimestral',
      periodos: [periodo({ lucroLiquido: 500_000 })],
      saldosIniciais: { prejuizoFiscal: 400_000, baseNegativaCsll: 400_000 },
    });
    const p = r.periodos[0];
    expect(p.compensacaoPrejuizo).toBeCloseTo(150_000, 2);
    expect(p.lucroReal).toBeCloseTo(350_000, 2);
    expect(p.saldoFinal.prejuizoFiscal).toBeCloseTo(250_000, 2);
  });

  it('dispensa a trava quando sinalizado', () => {
    const r = apurarIrpjCsll({
      forma: 'trimestral',
      periodos: [periodo({ lucroLiquido: 500_000 })],
      saldosIniciais: { prejuizoFiscal: 400_000, baseNegativaCsll: 0 },
      dispensaTrava30: true,
    });
    expect(r.periodos[0].lucroReal).toBeCloseTo(100_000, 2);
  });

  it('acumula prejuízo fiscal em período negativo e compensa no seguinte', () => {
    const r = apurarIrpjCsll({
      forma: 'trimestral',
      periodos: [
        periodo({ rotulo: '1T', lucroLiquido: -200_000 }),
        periodo({ rotulo: '2T', lucroLiquido: 300_000 }),
      ],
    });
    expect(r.periodos[0].irpjDevido).toBe(0);
    expect(r.periodos[0].prejuizoGerado).toBeCloseTo(200_000, 2);
    expect(r.periodos[1].compensacaoPrejuizo).toBeCloseTo(90_000, 2);
    expect(r.periodos[1].lucroReal).toBeCloseTo(210_000, 2);
  });

  it('aplica ajustes segregados por tributo', () => {
    const r = apurarIrpjCsll({
      forma: 'trimestral',
      periodos: [periodo({ lucroLiquido: 100_000, ajustes: [ajuste('lei-do-bem', 'exclusao', 40_000, 'irpj')] })],
    });
    const p = r.periodos[0];
    expect(p.lucroReal).toBeCloseTo(60_000, 2);
    expect(p.baseCsll).toBeCloseTo(100_000, 2);
  });

  it('usa presunção sobre receita bruta no regime de estimativa mensal', () => {
    const r = apurarIrpjCsll({
      forma: 'anual_estimativa',
      periodos: [
        periodo({
          rotulo: 'Jan',
          lucroLiquido: 0,
          receitaBruta: 1_000_000,
          percentualPresuncaoIrpj: 0.08,
          percentualPresuncaoCsll: 0.12,
        }),
      ],
    });
    const p = r.periodos[0];
    expect(p.lucroRealAntesCompensacao).toBeCloseTo(80_000, 2);
    expect(p.baseCsllAntesCompensacao).toBeCloseTo(120_000, 2);
    expect(p.irpjAdicional).toBeCloseTo((80_000 - 20_000) * 0.1, 2);
    expect(p.compensacaoPrejuizo).toBe(0);
  });

  it('limita a compensação de IRRF ao imposto devido e alerta saldo negativo', () => {
    const r = apurarIrpjCsll({
      forma: 'trimestral',
      periodos: [periodo({ lucroLiquido: 10_000, irrfCompensavel: 999_999 })],
    });
    expect(r.periodos[0].irpjARecolher).toBe(0);
    expect(r.alertas.some((a) => a.includes('IRRF'))).toBe(true);
  });

  it('mantém carga efetiva zero sem receita informada', () => {
    const r = apurarIrpjCsll({ forma: 'trimestral', periodos: [periodo()] });
    expect(r.cargaEfetiva).toBe(0);
  });
});

describe('IRPJ/CSLL — simulação massiva de cenários', () => {
  const lucros = [-500_000, -1, 0, 1, 25_000, 60_000, 60_001, 250_000, 1_000_000, 12_500_000];
  const adicoes = [0, 15_000, 320_000];
  const exclusoes = [0, 40_000, 900_000];
  const prejuizos = [0, 100_000, 5_000_000];

  it('preserva invariantes em todas as combinações trimestrais', () => {
    let casos = 0;
    for (const lucroLiquido of lucros) {
      for (const ad of adicoes) {
        for (const ex of exclusoes) {
          for (const prejuizoFiscal of prejuizos) {
            const r = apurarIrpjCsll({
              forma: 'trimestral',
              periodos: [
                periodo({
                  lucroLiquido,
                  ajustes: [ajuste('ad', 'adicao', ad), ajuste('ex', 'exclusao', ex)],
                }),
              ],
              saldosIniciais: { prejuizoFiscal, baseNegativaCsll: prejuizoFiscal },
            });
            const p = r.periodos[0];
            casos += 1;

            // Não negatividade
            expect(p.lucroReal).toBeGreaterThanOrEqual(0);
            expect(p.baseCsll).toBeGreaterThanOrEqual(0);
            expect(p.irpjARecolher).toBeGreaterThanOrEqual(0);
            expect(p.csllARecolher).toBeGreaterThanOrEqual(0);
            expect(p.saldoFinal.prejuizoFiscal).toBeGreaterThanOrEqual(0);

            // Trava de 30%
            const bruto = Math.max(0, p.lucroRealAntesCompensacao);
            expect(p.compensacaoPrejuizo).toBeLessThanOrEqual(bruto * 0.3 + 0.01);
            expect(p.compensacaoPrejuizo).toBeLessThanOrEqual(prejuizoFiscal + 0.01);

            // Coerência das alíquotas
            expect(p.irpjBase).toBeCloseTo(p.lucroReal * ALIQUOTA_IRPJ, 1);
            expect(p.csllDevida).toBeCloseTo(p.baseCsll * ALIQUOTA_CSLL, 1);

            // Adicional só sobre excedente
            const excedente = Math.max(0, p.lucroReal - LIMITE_ADICIONAL_MENSAL * 3);
            expect(p.irpjAdicional).toBeCloseTo(excedente * 0.1, 2);
          }
        }
      }
    }
    expect(casos).toBe(lucros.length * adicoes.length * exclusoes.length * prejuizos.length);
  });

  it('é monotônico: mais lucro nunca reduz o imposto devido', () => {
    let anterior = -1;
    for (const lucroLiquido of [...lucros].sort((a, b) => a - b)) {
      const r = apurarIrpjCsll({ forma: 'trimestral', periodos: [periodo({ lucroLiquido })] });
      const total = r.periodos[0].irpjDevido + r.periodos[0].csllDevida;
      expect(total).toBeGreaterThanOrEqual(anterior);
      anterior = total;
    }
  });

  it('mantém consistência do LALUR Parte B ao longo de 12 meses de estimativa', () => {
    const periodos = Array.from({ length: 12 }, (_, i) =>
      periodo({
        rotulo: `M${i + 1}`,
        lucroLiquido: 0,
        receitaBruta: 500_000 + i * 10_000,
        percentualPresuncaoIrpj: 0.32,
        percentualPresuncaoCsll: 0.32,
      }),
    );
    const r = apurarIrpjCsll({ forma: 'anual_estimativa', periodos });
    expect(r.periodos).toHaveLength(12);
    expect(r.totalARecolher).toBeGreaterThan(0);
    expect(r.saldoFinal.prejuizoFiscal).toBe(0);
    expect(r.cargaEfetiva).toBeGreaterThan(0);
  });

  it('ignora valores inválidos de ajustes (negativos/NaN) sem quebrar', () => {
    const r = apurarIrpjCsll({
      forma: 'trimestral',
      periodos: [
        periodo({
          lucroLiquido: 100_000,
          ajustes: [ajuste('neg', 'adicao', -50_000), ajuste('nan', 'exclusao', Number.NaN)],
        }),
      ],
    });
    expect(Number.isFinite(r.periodos[0].irpjDevido)).toBe(true);
    expect(r.periodos[0].lucroReal).toBeCloseTo(100_000, 2);
  });
});
