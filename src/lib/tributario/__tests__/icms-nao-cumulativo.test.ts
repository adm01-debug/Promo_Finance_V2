import { describe, it, expect } from 'vitest';
import {
  apurarIcmsNaoCumulativo,
  simularPresumido,
  simularReal,
  type ParametrosSimulacao,
} from '../shared-logic';

/**
 * Não-cumulatividade do ICMS (CF/88, art. 155, §2º, I).
 *
 * A compensação do imposto cobrado nas operações anteriores é norma
 * constitucional e independe do regime de apuração do IRPJ. Antes desta
 * correção o Lucro Presumido tratava o ICMS como cumulativo, superestimando
 * a carga do regime em até ~10,8 p.p. e invertendo a recomendação de regime
 * em ~15% dos cenários simulados.
 */

const base: ParametrosSimulacao = {
  faturamentoAnual: 5_000_000,
  margemLucro: 15,
  percentualServicos: 0,
  percentualRevenda: 100,
  folhaAnual: 0,
  comprasComCredito: 3_000_000,
  despesasOperacionais: 0,
  aliquotaICMS: 0.18,
  aliquotaISS: 0.05,
};

describe('apurarIcmsNaoCumulativo', () => {
  it('compensa o crédito das aquisições contra o débito das saídas', () => {
    const r = apurarIcmsNaoCumulativo(base, 5_000_000, 0.18);
    expect(r.debito).toBeCloseTo(900_000, 6);
    expect(r.credito).toBeCloseTo(540_000, 6);
    expect(r.icms).toBeCloseTo(360_000, 6);
    expect(r.saldoCredor).toBe(0);
  });

  it('nunca devolve ICMS negativo: excedente vira saldo credor', () => {
    const p = { ...base, comprasComCredito: 8_000_000 };
    const r = apurarIcmsNaoCumulativo(p, 5_000_000, 0.18);
    expect(r.icms).toBe(0);
    expect(r.saldoCredor).toBeCloseTo(540_000, 6);
  });

  it('não credita compras de empresa exclusivamente prestadora de serviços', () => {
    const p: ParametrosSimulacao = { ...base, percentualServicos: 100, percentualRevenda: 0 };
    const r = apurarIcmsNaoCumulativo(p, 0, 0.18);
    expect(r.credito).toBe(0);
    expect(r.icms).toBe(0);
  });

  it('rateia o crédito pela participação da receita de mercadorias', () => {
    const p: ParametrosSimulacao = { ...base, percentualServicos: 60, percentualRevenda: 40 };
    // 40% de R$ 3 mi = R$ 1,2 mi de compras creditáveis * 18%
    const r = apurarIcmsNaoCumulativo(p, 2_000_000, 0.18);
    expect(r.credito).toBeCloseTo(1_200_000 * 0.18, 6);
  });

  it('respeita o valor explícito de comprasComCreditoICMS', () => {
    const p: ParametrosSimulacao = { ...base, comprasComCreditoICMS: 1_000_000 };
    const r = apurarIcmsNaoCumulativo(p, 5_000_000, 0.18);
    expect(r.credito).toBeCloseTo(180_000, 6);
  });
});

describe('Lucro Presumido com ICMS não-cumulativo', () => {
  it('abate o crédito de ICMS do imposto devido', () => {
    const r = simularPresumido(base);
    expect(r.icms).toBeCloseTo(360_000, 6);
    expect(r.icmsCredito).toBeCloseTo(540_000, 6);
    expect(r.observacoes.some((o) => o.includes('não-cumulativo'))).toBe(true);
  });

  it('carga efetiva do Presumido cai quando há aquisições creditáveis', () => {
    const semCredito = simularPresumido({ ...base, comprasComCredito: 0 });
    const comCredito = simularPresumido(base);
    expect(comCredito.cargaEfetiva).toBeLessThan(semCredito.cargaEfetiva);
    expect(semCredito.cargaEfetiva - comCredito.cargaEfetiva).toBeCloseTo(
      (540_000 / base.faturamentoAnual) * 100,
      6,
    );
  });
});

describe('Lucro Real com ICMS não-cumulativo', () => {
  it('não credita ICMS sobre compras de prestador de serviços puro', () => {
    const p: ParametrosSimulacao = {
      ...base,
      percentualServicos: 100,
      percentualRevenda: 0,
    };
    const r = simularReal(p);
    expect(r.icms).toBe(0);
    expect(r.icmsCredito).toBe(0);
  });

  it('mantém paridade de débito/crédito com o Presumido para o mesmo mix', () => {
    const pres = simularPresumido(base);
    const real = simularReal(base);
    expect(real.icms).toBeCloseTo(pres.icms, 6);
  });
});

describe('Fuzzing: invariantes do ICMS em 500 cenários', () => {
  it('ICMS nunca é negativo nem excede o débito bruto', () => {
    for (let i = 0; i < 500; i++) {
      const rnd = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
      const faturamentoAnual = Math.round(rnd(1) * 30_000_000) + 10_000;
      const percentualServicos = Math.round(rnd(2) * 100);
      const p: ParametrosSimulacao = {
        faturamentoAnual,
        margemLucro: Math.round(rnd(3) * 40),
        percentualServicos,
        percentualRevenda: 100 - percentualServicos,
        folhaAnual: Math.round(rnd(4) * faturamentoAnual * 0.3),
        comprasComCredito: Math.round(rnd(5) * faturamentoAnual * 1.5),
        despesasOperacionais: Math.round(rnd(6) * faturamentoAnual * 0.2),
        aliquotaICMS: 0.07 + rnd(7) * 0.13,
        aliquotaISS: 0.02 + rnd(8) * 0.03,
      };

      for (const r of [simularPresumido(p), simularReal(p)]) {
        if (!r.elegivel) continue;
        const debitoMax = faturamentoAnual * (1 - percentualServicos / 100) * (p.aliquotaICMS ?? 0.18);
        expect(r.icms).toBeGreaterThanOrEqual(0);
        expect(r.icms).toBeLessThanOrEqual(debitoMax + 1e-6);
        expect(Number.isFinite(r.totalTributos)).toBe(true);
        expect(r.totalTributos).toBeGreaterThanOrEqual(0);
        expect(r.icmsSaldoCredor ?? 0).toBeGreaterThanOrEqual(0);
        // Crédito e imposto devido não podem coexistir com saldo credor.
        if ((r.icmsSaldoCredor ?? 0) > 0) expect(r.icms).toBe(0);
      }
    }
  });
});
