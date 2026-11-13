import { describe, expect, it } from 'vitest';
import { UFS, calcularDifal, calcularIcmsSt, fcpDe, round2, type UF } from '../icms';

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
      ufOrigem: 'SP',
      ufDestino: 'MG',
      valorOperacao: 1_000,
      destinatarioContribuinte: true,
    });
    expect(r.baseDestino).toBeCloseTo(1_000, 2);
    expect(r.difal).toBeCloseTo(60, 2); // (18% − 12%) × 1.000
  });

  it('base dupla é sempre maior ou igual à base única', () => {
    for (const destino of UFS) {
      if (destino === 'SP') continue;
      const dupla = calcularDifal({ ufOrigem: 'SP', ufDestino: destino, valorOperacao: 5_000 });
      const unica = calcularDifal({
        ufOrigem: 'SP',
        ufDestino: destino,
        valorOperacao: 5_000,
        destinatarioContribuinte: true,
      });
      expect(dupla.baseDestino).toBeGreaterThanOrEqual(unica.baseDestino - 0.01);
      expect(dupla.difal).toBeGreaterThanOrEqual(unica.difal - 0.01);
    }
  });

  it('adiciona o FCP à parcela devida ao destino', () => {
    const r = calcularDifal({
      ufOrigem: 'SP',
      ufDestino: 'RJ',
      valorOperacao: 10_000,
      aplicarFcp: true,
    });
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
      ufOrigem: 'SP',
      ufDestino: 'SC',
      valorOperacao: 10_000,
      aliquotaInterestadual: 0.2,
      aliquotaInternaDestino: 0.17,
      destinatarioContribuinte: true,
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
              ufOrigem,
              ufDestino,
              valorProduto,
              mvaOriginal,
              frete: valorProduto * 0.02,
              ipi: valorProduto * 0.05,
              aplicarFcp: true,
            });
            cenarios += 1;

            // 1. Sem NaN e sem valores negativos.
            for (const v of [
              r.icmsProprio,
              r.baseSt,
              r.icmsSt,
              r.fcpSt,
              r.totalRecolher,
              r.valorTotalNota,
            ]) {
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
            ufOrigem,
            ufDestino,
            valorOperacao: 12_345.67,
            destinatarioContribuinte: contribuinte,
            aplicarFcp: true,
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
