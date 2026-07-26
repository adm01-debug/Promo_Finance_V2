import { describe, expect, it } from 'vitest';
import {
  ALIQUOTAS_UF, ALIQUOTA_INTERESTADUAL_GERAL, ALIQUOTA_INTERESTADUAL_IMPORTADO,
  ALIQUOTA_INTERESTADUAL_REDUZIDA, UFS, aliquotaInternaDe, buscarUf, calcularDifal,
  calcularIcmsSt, calcularMvaAjustada, fcpDe, isImportada, isUF,
  resolverAliquotaInterestadual, round2, type UF,
} from '../icms';

describe('icms — tabelas e alíquotas interestaduais', () => {
  it('cobre as 27 unidades federativas com parâmetros consistentes', () => {
    expect(UFS).toHaveLength(27);
    for (const uf of UFS) {
      const item = buscarUf(uf);
      expect(item.interna).toBeGreaterThan(0);
      expect(item.interna).toBeLessThan(0.35);
      expect(item.fcp).toBeGreaterThanOrEqual(0);
      expect(item.fcp).toBeLessThanOrEqual(0.04);
      expect(item.nome.length).toBeGreaterThan(2);
    }
  });

  it('valida UFs e identifica mercadoria importada pela origem', () => {
    expect(isUF('SP')).toBe(true);
    expect(isUF('XX')).toBe(false);
    expect(isUF(null)).toBe(false);
    expect(() => buscarUf('XX' as UF)).toThrow(/UF desconhecida/);
    for (const o of [1, 2, 3, 6, 7, 8] as const) expect(isImportada(o)).toBe(true);
    for (const o of [0, 4, 5] as const) expect(isImportada(o)).toBe(false);
    expect(isImportada(undefined)).toBe(false);
  });

  it('aplica 7% de S/SE para N/NE/CO e ES', () => {
    expect(resolverAliquotaInterestadual('SP', 'BA')).toBe(ALIQUOTA_INTERESTADUAL_REDUZIDA);
    expect(resolverAliquotaInterestadual('RS', 'AM')).toBe(ALIQUOTA_INTERESTADUAL_REDUZIDA);
    expect(resolverAliquotaInterestadual('MG', 'ES')).toBe(ALIQUOTA_INTERESTADUAL_REDUZIDA);
    expect(resolverAliquotaInterestadual('PR', 'GO')).toBe(ALIQUOTA_INTERESTADUAL_REDUZIDA);
  });

  it('aplica 12% nas demais operações interestaduais, inclusive origem ES', () => {
    expect(resolverAliquotaInterestadual('ES', 'BA')).toBe(ALIQUOTA_INTERESTADUAL_GERAL);
    expect(resolverAliquotaInterestadual('BA', 'SP')).toBe(ALIQUOTA_INTERESTADUAL_GERAL);
    expect(resolverAliquotaInterestadual('SP', 'RJ')).toBe(ALIQUOTA_INTERESTADUAL_GERAL);
    expect(resolverAliquotaInterestadual('AM', 'PA')).toBe(ALIQUOTA_INTERESTADUAL_GERAL);
  });

  it('prevalece 4% para importados e alíquota interna em operação interna', () => {
    expect(resolverAliquotaInterestadual('SP', 'BA', 1)).toBe(ALIQUOTA_INTERESTADUAL_IMPORTADO);
    expect(resolverAliquotaInterestadual('BA', 'SP', 8)).toBe(ALIQUOTA_INTERESTADUAL_IMPORTADO);
    // Operação interna ignora a regra dos 4% e usa a alíquota interna.
    expect(resolverAliquotaInterestadual('SP', 'SP', 1)).toBe(aliquotaInternaDe('SP'));
  });

  it('percorre as 729 combinações origem × destino sem inconsistência', () => {
    let pares = 0;
    for (const origem of UFS) {
      for (const destino of UFS) {
        const nacional = resolverAliquotaInterestadual(origem, destino);
        const importado = resolverAliquotaInterestadual(origem, destino, 2);
        pares += 1;
        if (origem === destino) {
          expect(nacional).toBe(ALIQUOTAS_UF[origem].interna);
          expect(importado).toBe(ALIQUOTAS_UF[origem].interna);
        } else {
          expect([ALIQUOTA_INTERESTADUAL_REDUZIDA, ALIQUOTA_INTERESTADUAL_GERAL]).toContain(nacional);
          expect(importado).toBe(ALIQUOTA_INTERESTADUAL_IMPORTADO);
          // A interestadual nunca supera a interna de destino nas UFs modais.
          expect(nacional).toBeLessThanOrEqual(aliquotaInternaDe(destino));
        }
      }
    }
    expect(pares).toBe(27 * 27);
  });
});

describe('icms — MVA ajustada', () => {
  it('aplica a fórmula do Convênio 52/2017', () => {
    // MVA 40% · inter 12% · interna 18% → [(1,40 × 0,88) / 0,82] − 1 = 0,502439…
    const mva = calcularMvaAjustada({ mvaOriginal: 0.40, aliquotaInterestadual: 0.12, aliquotaInterna: 0.18 });
    expect(mva).toBeCloseTo(0.5024390, 6);
  });

  it('converge para a MVA original quando as alíquotas se igualam', () => {
    const mva = calcularMvaAjustada({ mvaOriginal: 0.3512, aliquotaInterestadual: 0.18, aliquotaInterna: 0.18 });
    expect(mva).toBeCloseTo(0.3512, 8);
  });

  it('cresce quando a interestadual cai e nunca fica negativa', () => {
    const a = calcularMvaAjustada({ mvaOriginal: 0.40, aliquotaInterestadual: 0.12, aliquotaInterna: 0.18 });
    const b = calcularMvaAjustada({ mvaOriginal: 0.40, aliquotaInterestadual: 0.07, aliquotaInterna: 0.18 });
    const c = calcularMvaAjustada({ mvaOriginal: 0.40, aliquotaInterestadual: 0.04, aliquotaInterna: 0.18 });
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(calcularMvaAjustada({ mvaOriginal: 0, aliquotaInterestadual: 0.18, aliquotaInterna: 0.07 })).toBe(0);
  });

  it('degrada com segurança em entradas patológicas', () => {
    expect(calcularMvaAjustada({ mvaOriginal: Number.NaN, aliquotaInterestadual: 0.12, aliquotaInterna: 0.18 })).toBe(0);
    expect(calcularMvaAjustada({ mvaOriginal: -1, aliquotaInterestadual: 0.12, aliquotaInterna: 0.18 })).toBe(0);
    expect(calcularMvaAjustada({ mvaOriginal: 0.4, aliquotaInterestadual: 0.12, aliquotaInterna: 1 })).toBeCloseTo(0.4, 8);
    expect(calcularMvaAjustada({ mvaOriginal: 0.4, aliquotaInterestadual: 0.12, aliquotaInterna: 5 })).toBeCloseTo(0.4, 8);
  });

  it('arredonda de forma estável', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(Number.NaN)).toBe(0);
    expect(round2(-3.456)).toBe(-3.46);
  });
});

describe('icms — ICMS-ST', () => {
  it('apura o caso de referência SP → BA com MVA 40%', () => {
    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'BA', valorProduto: 10_000, mvaOriginal: 0.40,
    });
    expect(r.aliquotaInterestadual).toBe(0.07);
    expect(r.icmsProprio).toBeCloseTo(700, 2);
    // MVA ajustada = (1,40 × 0,93 / 0,795) − 1 = 0,637735…
    expect(r.mvaAjustada).toBeCloseTo(0.6377358, 6);
    expect(r.baseSt).toBeCloseTo(16_377.36, 2);
    expect(r.icmsSt).toBeCloseTo(round2(16_377.36 * 0.205) - 700, 1);
    expect(r.operacaoInterestadual).toBe(true);
  });

  it('inclui frete, seguro, despesas e IPI corretamente nas bases', () => {
    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'MG', valorProduto: 10_000, frete: 500, seguro: 100,
      outrasDespesas: 400, ipi: 1_000, mvaOriginal: 0.35,
    });
    // Base própria não inclui IPI; base ST inclui.
    expect(r.baseIcmsProprio).toBeCloseTo(11_000, 2);
    expect(r.baseSt).toBeCloseTo(round2(12_000 * (1 + r.mvaAjustada)), 2);
    expect(r.valorTotalNota).toBeCloseTo(round2(11_000 + 1_000 + r.totalRecolher), 2);
  });

  it('subtrai descontos incondicionais e alerta em desconto abusivo', () => {
    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'MG', valorProduto: 1_000, descontos: 5_000, mvaOriginal: 0.4,
    });
    expect(r.baseIcmsProprio).toBe(0);
    expect(r.baseSt).toBe(0);
    expect(r.icmsSt).toBe(0);
    expect(r.alertas.some((a) => a.includes('Desconto'))).toBe(true);
  });

  it('usa PMPF quando informado, ignorando a MVA', () => {
    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'RJ', valorProduto: 10_000, mvaOriginal: 0.9, pmpf: 15_000,
    });
    expect(r.usouPmpf).toBe(true);
    expect(r.baseSt).toBeCloseTo(15_000, 2);
    expect(r.icmsSt).toBeCloseTo(round2(15_000 * 0.20) - r.icmsProprio, 2);
    expect(r.alertas.some((a) => a.includes('PMPF'))).toBe(true);
  });

  it('aplica reduções de base próprias e da ST', () => {
    const cheio = calcularIcmsSt({ ufOrigem: 'SP', ufDestino: 'MG', valorProduto: 10_000, mvaOriginal: 0.4 });
    const reduzido = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'MG', valorProduto: 10_000, mvaOriginal: 0.4,
      reducaoBasePropria: 0.2867, reducaoBaseSt: 0.2867,
    });
    expect(reduzido.baseIcmsProprio).toBeCloseTo(round2(10_000 * 0.7133), 2);
    expect(reduzido.baseSt).toBeLessThan(cheio.baseSt);
    expect(reduzido.icmsSt).toBeLessThan(cheio.icmsSt);
  });

  it('calcula o FCP-ST sobre a base da ST quando habilitado', () => {
    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'RJ', valorProduto: 10_000, mvaOriginal: 0.4, aplicarFcp: true,
    });
    expect(r.aliquotaFcp).toBe(fcpDe('RJ'));
    expect(r.fcpSt).toBeCloseTo(round2(r.baseSt * fcpDe('RJ')), 2);
    expect(r.totalRecolher).toBeCloseTo(round2(r.icmsSt + r.fcpSt), 2);
    expect(r.linhas.some((l) => l.rubrica === 'FCP-ST')).toBe(true);
  });

  it('zera a ST quando a operação própria já supera a carga interna', () => {
    const r = calcularIcmsSt({
      ufOrigem: 'SP', ufDestino: 'SC', valorProduto: 10_000, mvaOriginal: 0,
      aliquotaInterestadual: 0.25, aliquotaInternaDestino: 0.17,
    });
    expect(r.icmsSt).toBe(0);
    expect(r.alertas.some((a) => a.includes('superior à interna'))).toBe(true);
  });

  it('trata operação interna sem ajuste de MVA', () => {
    const r = calcularIcmsSt({ ufOrigem: 'SP', ufDestino: 'SP', valorProduto: 10_000, mvaOriginal: 0.40 });
    expect(r.operacaoInterestadual).toBe(false);
    expect(r.mvaAjustada).toBeCloseTo(0.40, 8);
    expect(r.aliquotaInterestadual).toBe(aliquotaInternaDe('SP'));
    expect(r.icmsSt).toBeCloseTo(round2(14_000 * 0.18) - 1_800, 2);
  });

  it('resiste a entradas inválidas sem gerar NaN', () => {
    const casos = [
      { valorProduto: Number.NaN, mvaOriginal: 0.4 },
      { valorProduto: -5_000, mvaOriginal: 0.4 },
      { valorProduto: 1_000, mvaOriginal: Number.NaN },
      { valorProduto: 1_000, mvaOriginal: -2 },
      { valorProduto: 1_000, mvaOriginal: 0.4, frete: Number.POSITIVE_INFINITY },
      { valorProduto: 1_000, mvaOriginal: 0.4, aliquotaInternaDestino: -1 },
      { valorProduto: 0, mvaOriginal: 0 },
    ];
    for (const caso of casos) {
      const r = calcularIcmsSt({ ufOrigem: 'SP', ufDestino: 'BA', ...caso });
      for (const v of [r.baseIcmsProprio, r.icmsProprio, r.baseSt, r.icmsSt, r.totalRecolher, r.valorTotalNota]) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('icms — DIFAL (EC 87/2015 e LC 190/2022)', () => {
  it('aplica base dupla para consumidor final não contribuinte', () => {
    const r = calcularDifal({ ufOrigem: 'SP', ufDestino: 'MG', valorOperacao: 1_000 });
    // ICMS origem = 120; base destino = 880 / 0,82 = 1.073,17
    expect(r.icmsOrigem).toBeCloseTo(120, 2);
    expect(r.baseDestino).toBeCloseTo(1_073.17, 2);
    expect(r.icmsDestino).toBeCloseTo(193.17, 1);
    expect(r.difal).toBeCloseTo(73.17, 1);
  });

  it('aplica base única para destinatário contribuinte', () => {
    const r = calcularDifal({
      ufOrigem: 'SP', ufDestino: 'MG', valorOperacao: 1_000, destinatarioContribuinte: true,
    });
    expect(r.baseDestino).toBeCloseTo(1_000, 2);
    expect(r.difal).toBeCloseTo(60, 2); // (18% − 12%) × 1.000
  });

  it('base dupla é sempre maior ou igual à base única', () => {
    for (const destino of UFS) {
      if (destino === 'SP') continue;
      const dupla = calcularDifal({ ufOrigem: 'SP', ufDestino: destino, valorOperacao: 5_000 });
      const unica = calcularDifal({
        ufOrigem: 'SP', ufDestino: destino, valorOperacao: 5_000, destinatarioContribuinte: true,
      });
      expect(dupla.baseDestino).toBeGreaterThanOrEqual(unica.baseDestino - 0.01);
      expect(dupla.difal).toBeGreaterThanOrEqual(unica.difal - 0.01);
    }
  });

  it('adiciona o FCP à parcela devida ao destino', () => {
    const r = calcularDifal({ ufOrigem: 'SP', ufDestino: 'RJ', valorOperacao: 10_000, aplicarFcp: true });
    expect(r.fcp).toBeCloseTo(round2(r.baseDestino * fcpDe('RJ')), 2);
    expect(r.totalRecolher).toBeCloseTo(round2(r.difal + r.fcp), 2);
  });

  it('zera e alerta em operação interna', () => {
    const r = calcularDifal({ ufOrigem: 'SP', ufDestino: 'SP', valorOperacao: 10_000 });
    expect(r.difal).toBe(0);
    expect(r.operacaoInterestadual).toBe(false);
    expect(r.alertas.some((a) => a.includes('Operação interna'))).toBe(true);
  });

  it('zera quando a interna de destino é menor que a interestadual', () => {
    const r = calcularDifal({
      ufOrigem: 'SP', ufDestino: 'SC', valorOperacao: 10_000,
      aliquotaInterestadual: 0.20, aliquotaInternaDestino: 0.17, destinatarioContribuinte: true,
    });
    expect(r.difal).toBe(0);
    expect(r.alertas.some((a) => a.includes('inferior à interestadual'))).toBe(true);
  });
});

describe('icms — simulação exaustiva de cenários', () => {
  const origens: UF[] = ['SP', 'RS', 'BA', 'ES', 'AM', 'GO'];
  const destinos: UF[] = ['SP', 'MG', 'RJ', 'BA', 'PA', 'SC', 'DF'];
  const mvas = [0, 0.2989, 0.4025, 0.7143, 1.5];
  const valores = [0, 1, 999.99, 250_000, 8_734_512.37];

  it('mantém invariantes de ST em 1.050 cenários', () => {
    let cenarios = 0;
    for (const ufOrigem of origens) {
      for (const ufDestino of destinos) {
        for (const mvaOriginal of mvas) {
          for (const valorProduto of valores) {
            const r = calcularIcmsSt({
              ufOrigem, ufDestino, valorProduto, mvaOriginal,
              frete: valorProduto * 0.02, ipi: valorProduto * 0.05, aplicarFcp: true,
            });
            cenarios += 1;

            // 1. Sem NaN e sem valores negativos.
            for (const v of [r.icmsProprio, r.baseSt, r.icmsSt, r.fcpSt, r.totalRecolher, r.valorTotalNota]) {
              expect(Number.isFinite(v)).toBe(true);
              expect(v).toBeGreaterThanOrEqual(0);
            }
            // 2. A base da ST nunca é inferior à base própria (MVA ≥ 0).
            expect(r.baseSt + 0.01).toBeGreaterThanOrEqual(r.baseIcmsProprio);
            // 3. ST a recolher = ST bruto − próprio, com piso zero.
            expect(r.icmsSt).toBeCloseTo(Math.max(0, round2(r.icmsStBruto - r.icmsProprio)), 2);
            // 4. Coerência das linhas da memória de cálculo.
            expect(r.linhas.length).toBeGreaterThanOrEqual(3);
            // 5. Total da nota cobre ao menos a mercadoria.
            expect(r.valorTotalNota).toBeGreaterThanOrEqual(round2(valorProduto));
          }
        }
      }
    }
    expect(cenarios).toBe(origens.length * destinos.length * mvas.length * valores.length);
  });

  it('é monotônico: MVA maior nunca reduz a ST', () => {
    for (const ufDestino of destinos) {
      let anterior = -1;
      for (const mvaOriginal of mvas) {
        const r = calcularIcmsSt({ ufOrigem: 'SP', ufDestino, valorProduto: 100_000, mvaOriginal });
        expect(r.icmsSt).toBeGreaterThanOrEqual(anterior - 0.01);
        anterior = r.icmsSt;
      }
    }
  });

  it('mantém invariantes de DIFAL em 378 cenários', () => {
    let cenarios = 0;
    for (const ufOrigem of UFS) {
      for (const ufDestino of destinos) {
        for (const contribuinte of [true, false]) {
          const r = calcularDifal({
            ufOrigem, ufDestino, valorOperacao: 12_345.67,
            destinatarioContribuinte: contribuinte, aplicarFcp: true,
          });
          cenarios += 1;
          for (const v of [r.icmsOrigem, r.icmsDestino, r.difal, r.fcp, r.totalRecolher]) {
            expect(Number.isFinite(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
          }
          // O DIFAL nunca supera o próprio ICMS de destino.
          expect(r.difal).toBeLessThanOrEqual(r.icmsDestino + 0.01);
          if (ufOrigem === ufDestino) expect(r.totalRecolher).toBe(0);
        }
      }
    }
    expect(cenarios).toBe(27 * destinos.length * 2);
  });
});
