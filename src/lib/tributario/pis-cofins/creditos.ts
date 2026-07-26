/**
 * Motor de apuração de PIS/COFINS no regime não cumulativo.
 *
 * Regras implementadas:
 * 1. Receita bruta exclui IPI destacado, descontos incondicionais e o ICMS
 *    destacado no documento fiscal (STF, RE 574.706 — Tema 69).
 * 2. Receitas monofásicas, com alíquota zero, isentas, suspensas, sujeitas a ST
 *    e exportações não geram débito.
 * 3. Créditos seguem o rol taxativo do art. 3º das Leis 10.637/02 e 10.833/03,
 *    com base líquida de ICMS e IPI recuperável (IN RFB 2.121/2022).
 * 4. Aquisições de pessoa física e entradas sem incidência não geram crédito
 *    (Lei 10.637/02, art. 3º, §3º, I; Lei 10.833/03, art. 3º, §2º, II).
 * 5. Créditos são rateados pela proporção de receitas com direito a crédito
 *    (tributadas + exportação), conforme art. 3º, §§7º a 9º.
 */

import { RECEITAS_SEM_DEBITO, regraDe } from './tabelas';
import {
  ALIQUOTA_COFINS_NAO_CUMULATIVO,
  ALIQUOTA_PIS_NAO_CUMULATIVO,
  type InputPisCofins,
  type ItemCredito,
  type ItemReceita,
  type LinhaMemoria,
  type ResultadoPisCofins,
  type ResultadoTributo,
} from './types';

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const nonNeg = (v: number | undefined): number =>
  Number.isFinite(v) && (v as number) > 0 ? (v as number) : 0;

/** Receita líquida de um item: valor − descontos − IPI − ICMS (Tema 69). */
export function baseReceita(item: ItemReceita): number {
  const bruto = nonNeg(item.valor);
  const deducoes =
    nonNeg(item.descontosIncondicionais) + nonNeg(item.ipiDestacado) + nonNeg(item.icmsDestacado);
  return round2(Math.max(0, bruto - deducoes));
}

/** Base creditável de um item de entrada, já aplicadas as vedações legais. */
export function baseCredito(item: ItemCredito): { base: number; motivo?: string } {
  const regra = regraDe(item.natureza);
  if (!regra.permiteCredito) {
    return { base: 0, motivo: `${regra.descricao}: natureza sem direito a crédito.` };
  }
  if (item.fornecedorPessoaFisica) {
    return {
      base: 0,
      motivo: `${regra.descricao}: aquisição de pessoa física não gera crédito (art. 3º, §3º, I).`,
    };
  }
  if (item.entradaSemIncidencia) {
    return {
      base: 0,
      motivo: `${regra.descricao}: entrada não onerada por PIS/COFINS não gera crédito.`,
    };
  }
  const bruto = nonNeg(item.valor);
  const liquido = Math.max(0, bruto - nonNeg(item.icmsDestacado) - nonNeg(item.ipiRecuperavel));
  const parcelas = Number.isFinite(item.parcelas) && (item.parcelas as number) >= 1
    ? Math.floor(item.parcelas as number)
    : 1;
  return { base: round2(liquido / parcelas) };
}

function apurar(
  baseDebito: number,
  baseCreditoTotal: number,
  aliquota: number,
  saldoAnterior: number,
  retencoes: number,
): ResultadoTributo {
  const debito = round2(baseDebito * aliquota);
  const creditoPeriodo = round2(baseCreditoTotal * aliquota);
  const disponivel = round2(creditoPeriodo + saldoAnterior);
  const aposCredito = round2(debito - disponivel);
  const aposRetencao = round2(aposCredito - retencoes);
  return {
    baseDebito: round2(baseDebito),
    debito,
    baseCredito: round2(baseCreditoTotal),
    creditoPeriodo,
    saldoCredorAnterior: round2(saldoAnterior),
    retencoes: round2(retencoes),
    aRecolher: aposRetencao > 0 ? aposRetencao : 0,
    saldoCredorFinal: aposCredito < 0 ? round2(-aposCredito) : 0,
  };
}

export function apurarPisCofins(input: InputPisCofins): ResultadoPisCofins {
  const alertas: string[] = [];
  const memoria: LinhaMemoria[] = [];

  const receitas = Array.isArray(input.receitas) ? input.receitas : [];
  const creditos = Array.isArray(input.creditos) ? input.creditos : [];

  let receitaBruta = 0;
  let receitaTributada = 0;
  let receitaExportacao = 0;
  let receitaNaoTributada = 0;

  for (const item of receitas) {
    const base = baseReceita(item);
    receitaBruta = round2(receitaBruta + base);

    if (item.natureza === 'tributada') {
      receitaTributada = round2(receitaTributada + base);
    } else {
      receitaNaoTributada = round2(receitaNaoTributada + base);
      if (item.natureza === 'exportacao') receitaExportacao = round2(receitaExportacao + base);
    }

    if (nonNeg(item.icmsDestacado) > 0) {
      memoria.push({
        rubrica: `Exclusão do ICMS — ${item.descricao ?? 'receita'}`,
        base: nonNeg(item.valor),
        valor: -nonNeg(item.icmsDestacado),
        fundamento: 'STF, RE 574.706 (Tema 69)',
      });
    }
    if (RECEITAS_SEM_DEBITO.includes(item.natureza) && base > 0) {
      memoria.push({
        rubrica: `Receita sem débito — ${item.descricao ?? item.natureza}`,
        base,
        valor: 0,
        fundamento: 'Lei 10.833/2003, art. 1º, §3º e art. 6º',
      });
    }
  }

  const receitaComDireito = round2(receitaTributada + receitaExportacao);
  const percentualRateio = receitaBruta > 0 ? receitaComDireito / receitaBruta : 0;
  if (percentualRateio > 0 && percentualRateio < 1) {
    alertas.push(
      `Receitas mistas no período: créditos rateados a ${(percentualRateio * 100).toFixed(2)}% ` +
        '(método da proporção da receita bruta — art. 3º, §8º, II).',
    );
  }

  let baseCreditoTotal = 0;
  for (const item of creditos) {
    const { base, motivo } = baseCredito(item);
    if (motivo) {
      alertas.push(motivo);
      continue;
    }
    const rateada = round2(base * (receitaBruta > 0 ? percentualRateio : 1));
    baseCreditoTotal = round2(baseCreditoTotal + rateada);
    const regra = regraDe(item.natureza);
    memoria.push({
      rubrica: `Crédito — ${item.descricao ?? regra.descricao}`,
      base: rateada,
      valor: round2(rateada * (ALIQUOTA_PIS_NAO_CUMULATIVO + ALIQUOTA_COFINS_NAO_CUMULATIVO)),
      fundamento: regra.fundamento,
    });
  }

  const pis = apurar(
    receitaTributada,
    baseCreditoTotal,
    ALIQUOTA_PIS_NAO_CUMULATIVO,
    nonNeg(input.saldoCredorAnteriorPis),
    nonNeg(input.retencoesPis),
  );
  const cofins = apurar(
    receitaTributada,
    baseCreditoTotal,
    ALIQUOTA_COFINS_NAO_CUMULATIVO,
    nonNeg(input.saldoCredorAnteriorCofins),
    nonNeg(input.retencoesCofins),
  );

  memoria.push(
    {
      rubrica: 'PIS não cumulativo — débito',
      base: pis.baseDebito,
      aliquota: ALIQUOTA_PIS_NAO_CUMULATIVO,
      valor: pis.debito,
      fundamento: 'Lei 10.637/2002, art. 2º',
    },
    {
      rubrica: 'COFINS não cumulativa — débito',
      base: cofins.baseDebito,
      aliquota: ALIQUOTA_COFINS_NAO_CUMULATIVO,
      valor: cofins.debito,
      fundamento: 'Lei 10.833/2003, art. 2º',
    },
  );

  if (pis.saldoCredorFinal > 0 || cofins.saldoCredorFinal > 0) {
    alertas.push(
      'Apuração encerrou com saldo credor: passível de transporte para o período seguinte ou ' +
        'de ressarcimento/compensação quando vinculado a exportação (Lei 10.637/02, art. 5º, §1º).',
    );
  }
  if (receitaExportacao > 0) {
    alertas.push(
      'Receita de exportação é imune, mas mantém o direito ao crédito vinculado (CF/88, art. 149, §2º, I).',
    );
  }

  const totalARecolher = round2(pis.aRecolher + cofins.aRecolher);

  return {
    competencia: input.competencia,
    receitaBruta,
    receitaTributada,
    receitaNaoTributada,
    percentualRateio,
    pis,
    cofins,
    totalARecolher,
    cargaEfetiva: receitaBruta > 0 ? totalARecolher / receitaBruta : 0,
    memoria,
    alertas,
  };
}
