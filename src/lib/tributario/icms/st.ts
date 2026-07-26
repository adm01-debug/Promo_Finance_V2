import {
  aliquotaInternaDe, fcpDe, resolverAliquotaInterestadual,
} from './tabelas';
import type {
  InputDifal, InputIcmsSt, InputMvaAjustada, LinhaIcms,
  ResultadoDifal, ResultadoIcmsSt,
} from './types';

/** Arredonda para 2 casas evitando erro de ponto flutuante (half-up). */
export function round2(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Normaliza valores monetários: descarta NaN/Infinity e valores negativos. */
function money(valor: number | undefined): number {
  return Number.isFinite(valor) && (valor as number) > 0 ? (valor as number) : 0;
}

/** Normaliza alíquotas em decimal no intervalo [0, 1]. */
function rate(valor: number | undefined, padrao = 0): number {
  if (!Number.isFinite(valor)) return padrao;
  const v = valor as number;
  if (v < 0) return padrao;
  return Math.min(v, 1);
}

/**
 * MVA ajustada (Convênio ICMS 52/2017, cláusula décima primeira):
 *
 *   MVA_aj = [(1 + MVA_orig) × (1 − ALQ_inter) / (1 − ALQ_intra)] − 1
 *
 * O ajuste neutraliza a diferença entre a carga interestadual da operação
 * própria e a carga interna presumida na etapa seguinte. Em operação interna
 * (ALQ_inter = ALQ_intra) o resultado converge para a MVA original.
 */
export function calcularMvaAjustada(input: InputMvaAjustada): number {
  const mvaOriginal = Math.max(0, Number.isFinite(input.mvaOriginal) ? input.mvaOriginal : 0);
  const inter = rate(input.aliquotaInterestadual);
  const intra = rate(input.aliquotaInterna);

  // Alíquota interna de 100% tornaria o denominador nulo — degrada para a MVA original.
  if (intra >= 1) return mvaOriginal;
  // Interestadual maior que a interna produziria MVA menor que a original;
  // a fórmula continua válida, mas nunca deve gerar MVA negativa.
  const ajustada = ((1 + mvaOriginal) * (1 - inter)) / (1 - intra) - 1;
  return Math.max(0, ajustada);
}

/**
 * Apura o ICMS-ST de uma operação, com MVA ajustada, PMPF, reduções de base e FCP.
 *
 * Sequência de cálculo:
 * 1. Base própria = produtos + frete + seguro + outras despesas − descontos.
 * 2. ICMS próprio = base própria × alíquota da operação (interestadual ou interna).
 * 3. Base da ST = PMPF, quando houver pauta; senão (base própria + IPI) × (1 + MVA ajustada).
 * 4. ICMS-ST = (base ST × alíquota interna de destino) − ICMS próprio, piso zero.
 * 5. FCP-ST = base ST × alíquota FCP de destino, quando aplicável.
 */
export function calcularIcmsSt(input: InputIcmsSt): ResultadoIcmsSt {
  const alertas: string[] = [];
  const linhas: LinhaIcms[] = [];

  const valorProduto = money(input.valorProduto);
  const frete = money(input.frete);
  const seguro = money(input.seguro);
  const outras = money(input.outrasDespesas);
  const ipi = money(input.ipi);
  const descontos = money(input.descontos);

  const operacaoInterestadual = input.ufOrigem !== input.ufDestino;
  const bruto = valorProduto + frete + seguro + outras;

  if (descontos > bruto) {
    alertas.push('Desconto informado supera o valor da operação; base própria zerada.');
  }
  const baseBruta = Math.max(0, bruto - descontos);

  const reducaoPropria = rate(input.reducaoBasePropria);
  const reducaoSt = rate(input.reducaoBaseSt);
  const baseIcmsProprio = round2(baseBruta * (1 - reducaoPropria));

  const aliquotaInterestadual = input.aliquotaInterestadual !== undefined
    ? rate(input.aliquotaInterestadual)
    : resolverAliquotaInterestadual(input.ufOrigem, input.ufDestino, input.origem);

  const aliquotaInternaDestino = input.aliquotaInternaDestino !== undefined
    ? rate(input.aliquotaInternaDestino)
    : aliquotaInternaDe(input.ufDestino);

  if (aliquotaInterestadual > aliquotaInternaDestino) {
    alertas.push(
      'Alíquota da operação própria superior à interna de destino: a MVA ajustada foi limitada e não há ST a recolher.',
    );
  }

  const icmsProprio = round2(baseIcmsProprio * aliquotaInterestadual);
  linhas.push({
    rubrica: 'ICMS próprio',
    base: baseIcmsProprio,
    aliquota: aliquotaInterestadual,
    valor: icmsProprio,
    fundamento: operacaoInterestadual
      ? 'RSF 22/1989 e RSF 13/2012 — alíquota interestadual'
      : 'Alíquota interna da UF de origem',
  });

  const mvaOriginal = Math.max(0, Number.isFinite(input.mvaOriginal) ? input.mvaOriginal : 0);
  const mvaAjustada = operacaoInterestadual
    ? calcularMvaAjustada({ mvaOriginal, aliquotaInterestadual, aliquotaInterna: aliquotaInternaDestino })
    : mvaOriginal;

  const pmpf = money(input.pmpf);
  const usouPmpf = pmpf > 0;
  if (usouPmpf) {
    alertas.push('Base da ST definida por PMPF/pauta fiscal; a MVA foi desconsiderada.');
  }

  const baseStCheia = usouPmpf ? pmpf : (baseBruta + ipi) * (1 + mvaAjustada);
  const baseSt = round2(baseStCheia * (1 - reducaoSt));

  linhas.push({
    rubrica: usouPmpf ? 'Base ST (PMPF)' : 'Base ST (MVA ajustada)',
    base: baseSt,
    aliquota: usouPmpf ? 0 : mvaAjustada,
    valor: baseSt,
    fundamento: usouPmpf
      ? 'Convênio ICMS 142/2018 — preço médio ponderado a consumidor final'
      : 'Convênio ICMS 52/2017, cláusula décima primeira',
  });

  const icmsStBruto = round2(baseSt * aliquotaInternaDestino);
  const icmsSt = round2(Math.max(0, icmsStBruto - icmsProprio));

  linhas.push({
    rubrica: 'ICMS-ST',
    base: baseSt,
    aliquota: aliquotaInternaDestino,
    valor: icmsSt,
    fundamento: 'Convênio ICMS 142/2018 — ST bruto deduzido do ICMS próprio',
  });

  const aplicarFcp = input.aplicarFcp ?? false;
  const aliquotaFcp = aplicarFcp
    ? (input.aliquotaFcp !== undefined ? rate(input.aliquotaFcp) : fcpDe(input.ufDestino))
    : 0;
  const fcpSt = round2(baseSt * aliquotaFcp);
  if (fcpSt > 0) {
    linhas.push({
      rubrica: 'FCP-ST',
      base: baseSt,
      aliquota: aliquotaFcp,
      valor: fcpSt,
      fundamento: 'ADCT, art. 82 — Fundo de Combate à Pobreza da UF de destino',
    });
  }

  const totalRecolher = round2(icmsSt + fcpSt);

  return {
    baseIcmsProprio,
    aliquotaInterestadual,
    icmsProprio,
    mvaOriginal,
    mvaAjustada,
    usouPmpf,
    baseSt,
    aliquotaInternaDestino,
    icmsStBruto,
    icmsSt,
    aliquotaFcp,
    fcpSt,
    totalRecolher,
    valorTotalNota: round2(baseBruta + ipi + totalRecolher),
    operacaoInterestadual,
    linhas,
    alertas,
  };
}

/**
 * Apura o DIFAL de operação interestadual destinada a consumidor final
 * (EC 87/2015, LC 190/2022 e Convênio ICMS 236/2021).
 *
 * Para destinatário NÃO contribuinte a base é dupla ("por dentro"): exclui-se o
 * ICMS da origem e recompõe-se o valor pela alíquota interna de destino,
 *
 *   base_destino = (valor_operação − ICMS_origem) / (1 − ALQ_interna_destino)
 *
 * Para destinatário contribuinte a base é única (o próprio valor da operação).
 * O FCP, quando devido, incide sobre a base de destino e é recolhido à UF destino.
 */
export function calcularDifal(input: InputDifal): ResultadoDifal {
  const alertas: string[] = [];
  const linhas: LinhaIcms[] = [];

  const valorOperacao = money(input.valorOperacao);
  const operacaoInterestadual = input.ufOrigem !== input.ufDestino;
  const contribuinte = input.destinatarioContribuinte ?? false;

  const aliquotaInterestadual = input.aliquotaInterestadual !== undefined
    ? rate(input.aliquotaInterestadual)
    : resolverAliquotaInterestadual(input.ufOrigem, input.ufDestino, input.origem);
  const aliquotaInternaDestino = input.aliquotaInternaDestino !== undefined
    ? rate(input.aliquotaInternaDestino)
    : aliquotaInternaDe(input.ufDestino);

  if (!operacaoInterestadual) {
    alertas.push('Operação interna: não há diferencial de alíquotas a recolher.');
  }
  if (aliquotaInternaDestino < aliquotaInterestadual) {
    alertas.push('Alíquota interna de destino inferior à interestadual; DIFAL zerado.');
  }

  const baseDupla = input.baseDupla ?? !contribuinte;
  const baseOrigem = round2(valorOperacao);
  const icmsOrigem = round2(baseOrigem * aliquotaInterestadual);

  let baseDestino = baseOrigem;
  if (operacaoInterestadual && baseDupla && aliquotaInternaDestino < 1) {
    baseDestino = round2((valorOperacao - icmsOrigem) / (1 - aliquotaInternaDestino));
  }

  linhas.push({
    rubrica: 'ICMS da UF de origem',
    base: baseOrigem,
    aliquota: aliquotaInterestadual,
    valor: icmsOrigem,
    fundamento: 'EC 87/2015 — parcela devida à origem',
  });

  const icmsDestinoCheio = round2(baseDestino * aliquotaInternaDestino);
  const difal = operacaoInterestadual ? round2(Math.max(0, icmsDestinoCheio - icmsOrigem)) : 0;

  linhas.push({
    rubrica: baseDupla ? 'ICMS destino (base dupla)' : 'ICMS destino (base única)',
    base: baseDestino,
    aliquota: aliquotaInternaDestino,
    valor: icmsDestinoCheio,
    fundamento: baseDupla
      ? 'LC 190/2022, art. 13 — recomposição da base pela alíquota interna'
      : 'Base única — destinatário contribuinte do ICMS',
  });

  const aplicarFcp = input.aplicarFcp ?? false;
  const aliquotaFcp = aplicarFcp && operacaoInterestadual
    ? (input.aliquotaFcp !== undefined ? rate(input.aliquotaFcp) : fcpDe(input.ufDestino))
    : 0;
  const fcp = round2(baseDestino * aliquotaFcp);
  if (fcp > 0) {
    linhas.push({
      rubrica: 'FCP destino',
      base: baseDestino,
      aliquota: aliquotaFcp,
      valor: fcp,
      fundamento: 'ADCT, art. 82 — adicional devido à UF de destino',
    });
  }

  linhas.push({
    rubrica: 'DIFAL a recolher',
    base: baseDestino,
    aliquota: Math.max(0, aliquotaInternaDestino - aliquotaInterestadual),
    valor: difal,
    fundamento: 'Convênio ICMS 236/2021',
  });

  return {
    aliquotaInterestadual,
    aliquotaInternaDestino,
    baseOrigem,
    baseDestino,
    icmsOrigem,
    icmsDestino: icmsDestinoCheio,
    difal,
    aliquotaFcp,
    fcp,
    totalDestino: round2(difal + fcp),
    totalRecolher: round2(difal + fcp),
    operacaoInterestadual,
    linhas,
    alertas,
  };
}
