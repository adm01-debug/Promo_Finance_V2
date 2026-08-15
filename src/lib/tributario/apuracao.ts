// APURACAO DE IRPJ/CSLL (PERIODICIDADE, PREJUIZOS) E ICMS NAO-CUMULATIVO
// Extraído de `shared-logic.ts` (modularização max-lines). Ciclo de tipo apenas.
import type { ParametrosSimulacao } from './shared-logic';

/**
 * IRPJ de um período de apuração TRIMESTRAL.
 *
 * Lei 9.430/96, art. 4º: o adicional de 10% incide sobre a parcela da base que
 * exceder R$ 20.000/mês do período — R$ 60.000 no trimestre. Não existe
 * "sobra" de limite entre trimestres, o que torna o adicional convexo em
 * relação à sazonalidade da receita/lucro.
 */
export function irpjPeriodoTrimestral(base: number): number {
  const b = Math.max(0, Number.isFinite(base) ? Number(base) : 0);
  return b * 0.15 + (b > 60000 ? (b - 60000) * 0.10 : 0);
}

/** IRPJ de um período ANUAL (adicional sobre o excedente a R$ 240.000). */
export function irpjPeriodoAnual(base: number): number {
  const b = Math.max(0, Number.isFinite(base) ? Number(base) : 0);
  return b * 0.15 + (b > 240000 ? (b - 240000) * 0.10 : 0);
}

/**
 * Distribui o faturamento anual em 4 trimestres.
 *
 * Usa o histórico mensal informado (sazonalidade real) quando disponível;
 * caso contrário assume distribuição uniforme (1/4 por trimestre), que é
 * neutra em relação ao adicional.
 */
export function distribuirTrimestres(p: ParametrosSimulacao): number[] {
  const total = Math.max(0, Number.isFinite(p.faturamentoAnual) ? Number(p.faturamentoAnual) : 0);
  const meses = p.faturamentoMensal;
  if (meses?.length) {
    const acc = [0, 0, 0, 0];
    let soma = 0;
    for (const m of meses) {
      const mes = Number(m?.mes);
      const receita = Math.max(0, Number.isFinite(Number(m?.receita_bruta)) ? Number(m.receita_bruta) : 0);
      if (!Number.isFinite(mes) || mes < 1 || mes > 12) continue;
      acc[Math.floor((mes - 1) / 3)] += receita;
      soma += receita;
    }
    if (soma > 0) return acc.map((v) => (v / soma) * total);
  }
  return [total / 4, total / 4, total / 4, total / 4];
}

/**
 * Compensação de prejuízos fiscais / base negativa com a trava dos 30%.
 *
 * Lei 9.065/95, arts. 15 e 16: o prejuízo fiscal de IRPJ e a base negativa de
 * CSLL de períodos anteriores podem ser compensados sem prazo, mas a redução
 * fica limitada a 30% do lucro real (ou da base positiva) do período corrente.
 * Quando o período apura prejuízo, nada é compensado e o prejuízo do exercício
 * se acumula ao estoque para períodos futuros.
 */
export function compensarPrejuizo(
  basePositiva: number,
  estoqueAcumulado: number,
): { baseAjustada: number; compensado: number; saldo: number } {
  const estoque = Math.max(0, Number.isFinite(estoqueAcumulado) ? estoqueAcumulado : 0);
  const base = Number.isFinite(basePositiva) ? basePositiva : 0;
  if (base <= 0) {
    // Prejuízo do período soma-se ao estoque; nada a compensar.
    return { baseAjustada: 0, compensado: 0, saldo: estoque + Math.abs(Math.min(0, base)) };
  }
  const limite = base * 0.30;
  const compensado = Math.min(estoque, limite);
  return { baseAjustada: base - compensado, compensado, saldo: estoque - compensado };
}

/**
 * Apura IRPJ/CSLL do Lucro Real em regime TRIMESTRAL.
 *
 * Cada trimestre é um período de apuração autônomo: o adicional usa o limite de
 * R$ 60 mil e um trimestre com prejuízo só reduz os seguintes pela trava dos
 * 30% (Lei 9.065/95). É por isso que o trimestral costuma ser mais caro que o
 * anual em empresas com resultado irregular.
 */
export function apurarRealTrimestral(
  lucrosTrimestrais: number[],
  estoqueIrpj: number,
  estoqueCsll: number,
): { irpj: number; csll: number; compensadoIrpj: number; compensadoCsll: number; saldoIrpj: number; saldoCsll: number } {
  let sIrpj = Math.max(0, estoqueIrpj);
  let sCsll = Math.max(0, estoqueCsll);
  let irpj = 0, csll = 0, cIrpj = 0, cCsll = 0;
  for (const bruto of lucrosTrimestrais) {
    const lucro = Number.isFinite(bruto) ? Number(bruto) : 0;
    const ci = compensarPrejuizo(lucro, sIrpj);
    const cc = compensarPrejuizo(lucro, sCsll);
    sIrpj = ci.saldo; sCsll = cc.saldo;
    cIrpj += ci.compensado; cCsll += cc.compensado;
    irpj += irpjPeriodoTrimestral(ci.baseAjustada);
    csll += Math.max(0, cc.baseAjustada) * 0.09;
  }
  return { irpj, csll, compensadoIrpj: cIrpj, compensadoCsll: cCsll, saldoIrpj: sIrpj, saldoCsll: sCsll };
}

/**
 * Apuração do ICMS pelo regime de compensação (não-cumulatividade).
 *
 * A não-cumulatividade do ICMS é norma constitucional (CF/88, art. 155, §2º, I)
 * e independe do regime de apuração do IRPJ: uma empresa de comércio no Lucro
 * Presumido credita-se do imposto das aquisições exatamente como no Lucro Real.
 * Tratar o ICMS como cumulativo no Presumido superestimava a carga do regime em
 * até ~10,8 p.p. e invertia a recomendação em ~15% dos cenários simulados.
 *
 * Somente aquisições vinculadas a saídas tributadas geram crédito, por isso, na
 * ausência de `comprasComCreditoICMS`, as compras são rateadas pela participação
 * da receita de mercadorias (serviços tributados por ISS não geram crédito).
 */
export function apurarIcmsNaoCumulativo(
  p: ParametrosSimulacao,
  receitaMercadorias: number,
  aliquota: number,
): { icms: number; credito: number; saldoCredor: number; debito: number } {
  const participacaoMercadorias = p.faturamentoAnual > 0
    ? Math.max(0, Math.min(1, receitaMercadorias / p.faturamentoAnual))
    : 0;
  const comprasICMS = p.comprasComCreditoICMS !== undefined
    ? Math.max(0, p.comprasComCreditoICMS)
    : Math.max(0, p.comprasComCredito || 0) * participacaoMercadorias;

  const debito = receitaMercadorias * aliquota;
  const credito = comprasICMS * aliquota;
  const saldo = debito - credito;
  return {
    icms: Math.max(0, saldo),
    credito,
    saldoCredor: saldo < 0 ? -saldo : 0,
    debito,
  };
}
