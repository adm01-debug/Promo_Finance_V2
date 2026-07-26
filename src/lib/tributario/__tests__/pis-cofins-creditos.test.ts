import { describe, expect, it } from 'vitest';
import {
  ALIQUOTA_COFINS_NAO_CUMULATIVO,
  ALIQUOTA_PIS_NAO_CUMULATIVO,
  REGRAS_CREDITO,
  apurarPisCofins,
  baseCredito,
  baseReceita,
  type ItemCredito,
  type ItemReceita,
  type NaturezaCredito,
  type NaturezaReceita,
} from '@/lib/tributario/pis-cofins';

const NATUREZAS_RECEITA: NaturezaReceita[] = [
  'tributada',
  'monofasica',
  'substituicao_tributaria',
  'aliquota_zero',
  'isenta',
  'suspensa',
  'exportacao',
];

describe('base de cálculo da receita (Tema 69)', () => {
  it('exclui ICMS, IPI e descontos incondicionais', () => {
    const item: ItemReceita = {
      valor: 100_000,
      natureza: 'tributada',
      icmsDestacado: 18_000,
      ipiDestacado: 5_000,
      descontosIncondicionais: 2_000,
    };
    expect(baseReceita(item)).toBe(75_000);
  });

  it('nunca retorna base negativa', () => {
    expect(baseReceita({ valor: 100, natureza: 'tributada', icmsDestacado: 500 })).toBe(0);
  });

  it('ignora valores inválidos ou negativos', () => {
    expect(baseReceita({ valor: -10, natureza: 'tributada' })).toBe(0);
    expect(baseReceita({ valor: 1_000, natureza: 'tributada', icmsDestacado: -50 })).toBe(1_000);
  });
});

describe('base creditável', () => {
  it('veda crédito em aquisição de pessoa física', () => {
    const r = baseCredito({ natureza: 'insumos', valor: 10_000, fornecedorPessoaFisica: true });
    expect(r.base).toBe(0);
    expect(r.motivo).toMatch(/pessoa física/i);
  });

  it('veda crédito quando a entrada não é onerada', () => {
    const r = baseCredito({ natureza: 'bens_revenda', valor: 50_000, entradaSemIncidencia: true });
    expect(r.base).toBe(0);
  });

  it('exclui ICMS e IPI recuperável da base do crédito', () => {
    const r = baseCredito({
      natureza: 'insumos',
      valor: 10_000,
      icmsDestacado: 1_800,
      ipiRecuperavel: 500,
    });
    expect(r.base).toBe(7_700);
  });

  it('rateia edificações em parcelas mensais', () => {
    const r = baseCredito({ natureza: 'edificacoes_benfeitorias', valor: 240_000, parcelas: 24 });
    expect(r.base).toBe(10_000);
  });

  it('trata parcelas inválidas como parcela única', () => {
    expect(baseCredito({ natureza: 'insumos', valor: 1_000, parcelas: 0 }).base).toBe(1_000);
    expect(baseCredito({ natureza: 'insumos', valor: 1_000, parcelas: Number.NaN }).base).toBe(1_000);
  });
});

describe('apuração não cumulativa', () => {
  it('aplica alíquotas de 1,65% e 7,6% sobre a receita tributada líquida', () => {
    const r = apurarPisCofins({
      receitas: [{ valor: 100_000, natureza: 'tributada' }],
      creditos: [],
    });
    expect(r.pis.debito).toBe(1_650);
    expect(r.cofins.debito).toBe(7_600);
    expect(r.totalARecolher).toBe(9_250);
  });

  it('não gera débito para receitas monofásicas, isentas ou exportação', () => {
    for (const natureza of NATUREZAS_RECEITA.filter((n) => n !== 'tributada')) {
      const r = apurarPisCofins({
        receitas: [{ valor: 500_000, natureza }],
        creditos: [],
      });
      expect(r.pis.debito).toBe(0);
      expect(r.cofins.debito).toBe(0);
    }
  });

  it('abate créditos e apura saldo credor quando o crédito supera o débito', () => {
    const r = apurarPisCofins({
      receitas: [{ valor: 100_000, natureza: 'tributada' }],
      creditos: [{ natureza: 'bens_revenda', valor: 200_000 }],
    });
    expect(r.totalARecolher).toBe(0);
    expect(r.pis.saldoCredorFinal).toBeCloseTo(1_650, 2);
    expect(r.cofins.saldoCredorFinal).toBeCloseTo(7_600, 2);
  });

  it('rateia créditos pela proporção de receitas com direito', () => {
    const r = apurarPisCofins({
      receitas: [
        { valor: 100_000, natureza: 'tributada' },
        { valor: 100_000, natureza: 'monofasica' },
      ],
      creditos: [{ natureza: 'insumos', valor: 50_000 }],
    });
    expect(r.percentualRateio).toBeCloseTo(0.5, 6);
    expect(r.pis.baseCredito).toBe(25_000);
  });

  it('mantém crédito integral quando há exportação e receita tributada', () => {
    const r = apurarPisCofins({
      receitas: [
        { valor: 100_000, natureza: 'tributada' },
        { valor: 100_000, natureza: 'exportacao' },
      ],
      creditos: [{ natureza: 'insumos', valor: 40_000 }],
    });
    expect(r.percentualRateio).toBe(1);
    expect(r.pis.baseCredito).toBe(40_000);
  });

  it('consome saldo credor anterior e retenções na ordem correta', () => {
    const r = apurarPisCofins({
      receitas: [{ valor: 100_000, natureza: 'tributada' }],
      creditos: [],
      saldoCredorAnteriorPis: 1_000,
      retencoesPis: 200,
    });
    expect(r.pis.aRecolher).toBe(450);
  });

  it('não devolve valor negativo a recolher quando as retenções superam o débito', () => {
    const r = apurarPisCofins({
      receitas: [{ valor: 10_000, natureza: 'tributada' }],
      creditos: [],
      retencoesPis: 5_000,
      retencoesCofins: 5_000,
    });
    expect(r.totalARecolher).toBe(0);
  });

  it('tolera entradas vazias sem lançar exceção', () => {
    const r = apurarPisCofins({ receitas: [], creditos: [] });
    expect(r.receitaBruta).toBe(0);
    expect(r.cargaEfetiva).toBe(0);
    expect(r.totalARecolher).toBe(0);
  });
});

describe('simulação exaustiva de cenários', () => {
  it('mantém invariantes em centenas de combinações de receita e crédito', () => {
    const naturezasCredito = Object.keys(REGRAS_CREDITO) as NaturezaCredito[];
    const valores = [0, 1_000, 25_000, 480_000, 1_250_000];
    let cenarios = 0;

    for (const natRec of NATUREZAS_RECEITA) {
      for (const natCred of naturezasCredito) {
        for (const receita of valores) {
          for (const credito of valores) {
            const item: ItemCredito = { natureza: natCred, valor: credito };
            const r = apurarPisCofins({
              receitas: [{ valor: receita, natureza: natRec, icmsDestacado: receita * 0.18 }],
              creditos: [item],
            });
            cenarios += 1;

            // Invariantes estruturais
            expect(r.totalARecolher).toBeGreaterThanOrEqual(0);
            expect(r.pis.saldoCredorFinal).toBeGreaterThanOrEqual(0);
            expect(r.cofins.saldoCredorFinal).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(r.cargaEfetiva)).toBe(true);
            expect(r.percentualRateio).toBeGreaterThanOrEqual(0);
            expect(r.percentualRateio).toBeLessThanOrEqual(1);

            // Nunca há simultaneamente valor a recolher e saldo credor
            expect(r.pis.aRecolher === 0 || r.pis.saldoCredorFinal === 0).toBe(true);

            // Relação fixa entre alíquotas: COFINS/PIS sobre a mesma base
            if (r.pis.debito > 0) {
              expect(r.cofins.debito / r.pis.debito).toBeCloseTo(
                ALIQUOTA_COFINS_NAO_CUMULATIVO / ALIQUOTA_PIS_NAO_CUMULATIVO,
                4,
              );
            }

            // Carga efetiva jamais supera a soma das alíquotas nominais
            expect(r.cargaEfetiva).toBeLessThanOrEqual(
              ALIQUOTA_PIS_NAO_CUMULATIVO + ALIQUOTA_COFINS_NAO_CUMULATIVO + 1e-9,
            );
          }
        }
      }
    }

    expect(cenarios).toBeGreaterThan(1_000);
  });

  it('monotonicidade: mais crédito nunca aumenta o valor a recolher', () => {
    let anterior = Number.POSITIVE_INFINITY;
    for (let credito = 0; credito <= 200_000; credito += 5_000) {
      const r = apurarPisCofins({
        receitas: [{ valor: 300_000, natureza: 'tributada' }],
        creditos: [{ natureza: 'insumos', valor: credito }],
      });
      expect(r.totalARecolher).toBeLessThanOrEqual(anterior + 1e-6);
      anterior = r.totalARecolher;
    }
  });

  it('monotonicidade: mais receita tributada nunca reduz o débito', () => {
    let anterior = -1;
    for (let receita = 0; receita <= 1_000_000; receita += 25_000) {
      const r = apurarPisCofins({
        receitas: [{ valor: receita, natureza: 'tributada' }],
        creditos: [],
      });
      expect(r.pis.debito).toBeGreaterThanOrEqual(anterior);
      anterior = r.pis.debito;
    }
  });
});
