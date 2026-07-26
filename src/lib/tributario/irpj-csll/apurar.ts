import {
  ALIQUOTA_ADICIONAL_IRPJ,
  ALIQUOTA_CSLL,
  ALIQUOTA_IRPJ,
  LIMITE_ADICIONAL_MENSAL,
  TRAVA_COMPENSACAO,
} from './tabelas';
import type {
  AjusteLalur,
  LinhaMemoriaIrpj,
  ParametrosApuracao,
  PeriodoApuracao,
  ResultadoApuracao,
  ResultadoPeriodo,
  SaldosParteB,
} from './types';

/** Arredonda para centavos evitando erro de ponto flutuante acumulado. */
const round2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;
const positivo = (v: number): number => (Number.isFinite(v) && v > 0 ? v : 0);

function somaAjustes(
  ajustes: readonly AjusteLalur[],
  tipo: AjusteLalur['tipo'],
  tributo: 'irpj' | 'csll',
): number {
  return ajustes
    .filter((a) => a.tipo === tipo && (a.alvo === 'ambos' || a.alvo === tributo))
    .reduce((acc, a) => acc + positivo(a.valor), 0);
}

/**
 * Base de estimativa mensal (Lei 9.430/96 art. 2º): receita bruta x presunção
 * + demais receitas. Retorna 0 se não houver receita informada.
 */
function baseEstimativa(p: PeriodoApuracao, tributo: 'irpj' | 'csll'): number {
  const receita = positivo(p.receitaBruta ?? 0);
  if (receita === 0 && positivo(p.demaisReceitas ?? 0) === 0) return 0;
  const presuncao =
    tributo === 'irpj' ? (p.percentualPresuncaoIrpj ?? 0.08) : (p.percentualPresuncaoCsll ?? 0.12);
  return round2(receita * presuncao + positivo(p.demaisReceitas ?? 0));
}

function calcularAdicional(base: number, meses: number): number {
  const limite = LIMITE_ADICIONAL_MENSAL * Math.max(1, meses);
  return round2(positivo(base - limite) * ALIQUOTA_ADICIONAL_IRPJ);
}

/**
 * Apura IRPJ/CSLL no Lucro Real, período a período, mantendo o controle do
 * LALUR Parte B (prejuízo fiscal e base negativa) entre os períodos.
 */
export function apurarIrpjCsll(params: ParametrosApuracao): ResultadoApuracao {
  const alertas: string[] = [];
  let saldo: SaldosParteB = {
    prejuizoFiscal: positivo(params.saldosIniciais?.prejuizoFiscal ?? 0),
    baseNegativaCsll: positivo(params.saldosIniciais?.baseNegativaCsll ?? 0),
  };

  const periodos: ResultadoPeriodo[] = [];
  let receitaTotal = 0;

  for (const p of params.periodos) {
    const meses = p.meses ?? (params.forma === 'trimestral' ? 3 : 1);
    const memoria: LinhaMemoriaIrpj[] = [];
    receitaTotal += positivo(p.receitaBruta ?? 0);

    const adIrpj = somaAjustes(p.ajustes, 'adicao', 'irpj');
    const exIrpj = somaAjustes(p.ajustes, 'exclusao', 'irpj');
    const adCsll = somaAjustes(p.ajustes, 'adicao', 'csll');
    const exCsll = somaAjustes(p.ajustes, 'exclusao', 'csll');

    const usaEstimativa = params.forma === 'anual_estimativa';

    const lucroRealBruto = usaEstimativa
      ? baseEstimativa(p, 'irpj')
      : round2(p.lucroLiquido + adIrpj - exIrpj);
    const baseCsllBruta = usaEstimativa
      ? baseEstimativa(p, 'csll')
      : round2(p.lucroLiquido + adCsll - exCsll);

    memoria.push({
      rubrica: 'Lucro líquido contábil',
      valor: round2(p.lucroLiquido),
      fundamento: 'RIR/2018 art. 258',
    });
    if (!usaEstimativa) {
      memoria.push({ rubrica: '(+) Adições (LALUR A)', valor: round2(adIrpj), fundamento: 'RIR/2018 art. 260' });
      memoria.push({ rubrica: '(−) Exclusões (LALUR A)', valor: round2(exIrpj), fundamento: 'RIR/2018 art. 261' });
    } else {
      memoria.push({
        rubrica: 'Base estimada (receita × presunção)',
        valor: lucroRealBruto,
        fundamento: 'Lei 9.430/96 art. 2º',
      });
    }

    // Compensação de prejuízo — vedada no regime de estimativa mensal
    // (a compensação ocorre apenas no ajuste anual / balanço de suspensão).
    let compIrpj = 0;
    let compCsll = 0;
    if (!usaEstimativa) {
      const tetoIrpj = params.dispensaTrava30 ? lucroRealBruto : lucroRealBruto * TRAVA_COMPENSACAO;
      const tetoCsll = params.dispensaTrava30 ? baseCsllBruta : baseCsllBruta * TRAVA_COMPENSACAO;
      compIrpj = round2(Math.min(saldo.prejuizoFiscal, positivo(tetoIrpj)));
      compCsll = round2(Math.min(saldo.baseNegativaCsll, positivo(tetoCsll)));
      if (compIrpj > 0) {
        memoria.push({
          rubrica: '(−) Compensação de prejuízo fiscal (trava 30%)',
          valor: compIrpj,
          fundamento: 'Lei 9.065/95 art. 15',
        });
      }
      if (compCsll > 0) {
        memoria.push({
          rubrica: '(−) Compensação de base negativa CSLL (trava 30%)',
          valor: compCsll,
          fundamento: 'Lei 9.065/95 art. 16',
        });
      }
    } else if (saldo.prejuizoFiscal > 0) {
      alertas.push(
        `${p.rotulo}: estimativa mensal não admite compensação de prejuízo — o saldo será utilizado no ajuste anual.`,
      );
    }

    const lucroReal = round2(positivo(lucroRealBruto - compIrpj));
    const baseCsll = round2(positivo(baseCsllBruta - compCsll));

    const irpjBase = round2(lucroReal * ALIQUOTA_IRPJ);
    const irpjAdicional = calcularAdicional(lucroReal, meses);
    const irpjDevido = round2(irpjBase + irpjAdicional);
    const csllDevida = round2(baseCsll * ALIQUOTA_CSLL);

    memoria.push({ rubrica: 'IRPJ 15%', valor: irpjBase, aliquota: ALIQUOTA_IRPJ, fundamento: 'RIR/2018 art. 623' });
    memoria.push({
      rubrica: `Adicional 10% (excedente a ${(LIMITE_ADICIONAL_MENSAL * meses).toLocaleString('pt-BR')})`,
      valor: irpjAdicional,
      aliquota: ALIQUOTA_ADICIONAL_IRPJ,
      fundamento: 'RIR/2018 art. 624',
    });
    memoria.push({ rubrica: 'CSLL 9%', valor: csllDevida, aliquota: ALIQUOTA_CSLL, fundamento: 'Lei 7.689/88 art. 3º' });

    const irpjCompensado = round2(Math.min(positivo(p.irrfCompensavel ?? 0), irpjDevido));
    const csllCompensada = round2(Math.min(positivo(p.csllRetidaCompensavel ?? 0), csllDevida));
    if (positivo(p.irrfCompensavel ?? 0) > irpjCompensado) {
      alertas.push(`${p.rotulo}: IRRF retido excede o IRPJ devido — saldo negativo passível de restituição/PER-DCOMP.`);
    }

    const prejuizoGerado = round2(positivo(-lucroRealBruto));
    const baseNegativaGerada = round2(positivo(-baseCsllBruta));

    saldo = {
      prejuizoFiscal: round2(positivo(saldo.prejuizoFiscal - compIrpj + prejuizoGerado)),
      baseNegativaCsll: round2(positivo(saldo.baseNegativaCsll - compCsll + baseNegativaGerada)),
    };

    periodos.push({
      rotulo: p.rotulo,
      lucroLiquido: round2(p.lucroLiquido),
      totalAdicoesIrpj: round2(adIrpj),
      totalExclusoesIrpj: round2(exIrpj),
      totalAdicoesCsll: round2(adCsll),
      totalExclusoesCsll: round2(exCsll),
      lucroRealAntesCompensacao: lucroRealBruto,
      baseCsllAntesCompensacao: baseCsllBruta,
      compensacaoPrejuizo: compIrpj,
      compensacaoBaseNegativa: compCsll,
      lucroReal,
      baseCsll,
      irpjBase,
      irpjAdicional,
      irpjDevido,
      csllDevida,
      irpjCompensado,
      csllCompensada,
      irpjARecolher: round2(positivo(irpjDevido - irpjCompensado)),
      csllARecolher: round2(positivo(csllDevida - csllCompensada)),
      prejuizoGerado,
      baseNegativaGerada,
      saldoFinal: saldo,
      memoria,
    });
  }

  const totalIrpj = round2(periodos.reduce((a, p) => a + p.irpjARecolher, 0));
  const totalCsll = round2(periodos.reduce((a, p) => a + p.csllARecolher, 0));

  return {
    forma: params.forma,
    periodos,
    totalIrpj,
    totalCsll,
    totalARecolher: round2(totalIrpj + totalCsll),
    cargaEfetiva: receitaTotal > 0 ? (totalIrpj + totalCsll) / receitaTotal : 0,
    saldoFinal: saldo,
    alertas,
  };
}
