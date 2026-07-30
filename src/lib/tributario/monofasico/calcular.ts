// REGIME MONOFÁSICO — Cálculo de PIS/COFINS por item e consolidação do mix

import { classificarNcmMonofasico } from './classificar';
import { ALIQUOTAS_REGIME_NORMAL, MESES_RECUPERACAO_RETROATIVA } from './grupos';
import {
  POSICOES_INDUSTRIA,
  POSICOES_REVENDA,
  type AliquotasPisCofins,
  type ItemMonofasico,
  type PosicaoCadeia,
  type RecuperacaoRetroativa,
  type RegimeApuracaoPisCofins,
  type ResultadoItemMonofasico,
  type ResumoMonofasico,
} from './types';

const round2 = (v: number) => Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;

export function aliquotasRegimeNormal(regime: RegimeApuracaoPisCofins): AliquotasPisCofins {
  return ALIQUOTAS_REGIME_NORMAL[regime] ?? ALIQUOTAS_REGIME_NORMAL.presumido;
}

/**
 * Calcula PIS/COFINS de um item considerando o regime monofásico.
 * Itens não monofásicos voltam para as alíquotas do regime de apuração informado.
 */
export function calcularItemMonofasico(
  item: ItemMonofasico,
  posicaoPadrao: PosicaoCadeia,
  regime: RegimeApuracaoPisCofins,
): ResultadoItemMonofasico {
  const posicao = item.posicao ?? posicaoPadrao;
  const receita = Number.isFinite(item.receita) && item.receita > 0 ? item.receita : 0;
  const normal = aliquotasRegimeNormal(regime);
  const totalRegimeNormal = round2(receita * (normal.pis + normal.cofins));

  const classificacao = classificarNcmMonofasico(item.ncm);

  if (!classificacao) {
    const pis = round2(receita * normal.pis);
    const cofins = round2(receita * normal.cofins);
    return {
      ncm: item.ncm,
      descricao: item.descricao ?? 'NCM não monofásico',
      receita,
      posicao,
      monofasico: false,
      grupo: null,
      grupoNome: null,
      baseLegal: null,
      aliquotaPis: normal.pis,
      aliquotaCofins: normal.cofins,
      pis,
      cofins,
      total: round2(pis + cofins),
      totalRegimeNormal,
      economia: 0,
    };
  }

  const { grupo } = classificacao;
  let aliquotas: AliquotasPisCofins | undefined;
  let alerta: string | undefined;

  if (POSICOES_INDUSTRIA.includes(posicao)) {
    aliquotas = classificacao.item?.industria ?? grupo.industria;
    if (!aliquotas) {
      aliquotas = { pis: 0, cofins: 0 };
      alerta = `Grupo ${grupo.nome} sem alíquota de indústria cadastrada — informe manualmente.`;
    }
  } else if (POSICOES_REVENDA.includes(posicao)) {
    aliquotas = grupo.revenda;
  } else {
    aliquotas = { pis: 0, cofins: 0 };
    alerta = `Posição "${posicao}" inválida na cadeia monofásica.`;
  }

  const pis = round2(receita * aliquotas.pis);
  const cofins = round2(receita * aliquotas.cofins);
  const total = round2(pis + cofins);

  return {
    ncm: item.ncm,
    descricao: item.descricao ?? classificacao.item?.descricao ?? grupo.nome,
    receita,
    posicao,
    monofasico: true,
    grupo: grupo.chave,
    grupoNome: grupo.nome,
    baseLegal: grupo.baseLegal,
    aliquotaPis: aliquotas.pis,
    aliquotaCofins: aliquotas.cofins,
    pis,
    cofins,
    total,
    totalRegimeNormal,
    economia: round2(Math.max(0, totalRegimeNormal - total)),
    alerta,
  };
}

/** Consolida um mix de NCMs, separando receita monofásica da receita tributada normalmente. */
export function calcularMixMonofasico(
  itens: ItemMonofasico[],
  posicaoPadrao: PosicaoCadeia = 'revenda',
  regime: RegimeApuracaoPisCofins = 'presumido',
): ResumoMonofasico {
  const resultados = itens.map((i) => calcularItemMonofasico(i, posicaoPadrao, regime));
  const alertas: string[] = [];

  let receitaTotal = 0;
  let receitaMonofasica = 0;
  let pisMonofasico = 0;
  let cofinsMonofasico = 0;
  let totalSeRegimeNormal = 0;

  for (const r of resultados) {
    receitaTotal += r.receita;
    if (r.monofasico) {
      receitaMonofasica += r.receita;
      pisMonofasico += r.pis;
      cofinsMonofasico += r.cofins;
      totalSeRegimeNormal += r.totalRegimeNormal;
    }
    if (r.alerta) alertas.push(r.alerta);
  }

  const totalMonofasico = round2(pisMonofasico + cofinsMonofasico);
  const economiaAnual = round2(Math.max(0, round2(totalSeRegimeNormal) - totalMonofasico));

  if (regime === 'simples' && receitaMonofasica > 0) {
    alertas.push(
      'No Simples Nacional a receita monofásica deve ser segregada no PGDAS-D para excluir PIS/COFINS da alíquota efetiva.',
    );
  }
  if (economiaAnual > 0) {
    alertas.push(
      `Receita monofásica identificada: economia de R$ ${economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} frente ao tratamento como receita comum.`,
    );
  }

  return {
    itens: resultados,
    receitaTotal: round2(receitaTotal),
    receitaMonofasica: round2(receitaMonofasica),
    receitaNaoMonofasica: round2(Math.max(0, receitaTotal - receitaMonofasica)),
    pisMonofasico: round2(pisMonofasico),
    cofinsMonofasico: round2(cofinsMonofasico),
    totalMonofasico,
    totalSeRegimeNormal: round2(totalSeRegimeNormal),
    economiaAnual,
    alertas,
  };
}

/**
 * Estima o indébito recuperável de PIS/COFINS pagos indevidamente sobre receita monofásica.
 * Limitado ao prazo decadencial de 5 anos (art. 168 do CTN).
 */
export function calcularRecuperacaoRetroativa(
  receitaMonofasicaMensal: number,
  regime: RegimeApuracaoPisCofins = 'presumido',
  meses: number = MESES_RECUPERACAO_RETROATIVA,
  referencia: Date = new Date(),
): RecuperacaoRetroativa {
  const mesesValidos = Math.max(0, Math.min(Math.trunc(meses), MESES_RECUPERACAO_RETROATIVA));
  const receita = Number.isFinite(receitaMonofasicaMensal) && receitaMonofasicaMensal > 0
    ? receitaMonofasicaMensal
    : 0;
  const normal = aliquotasRegimeNormal(regime);
  const creditoMensalMedio = round2(receita * (normal.pis + normal.cofins));

  const prescricao = new Date(referencia);
  prescricao.setMonth(prescricao.getMonth() - mesesValidos);

  return {
    meses: mesesValidos,
    creditoMensalMedio,
    totalRecuperavel: round2(creditoMensalMedio * mesesValidos),
    prescreveEm: prescricao.toISOString().slice(0, 10),
    observacoes: [
      'Recuperação via PER/DCOMP exige retificação prévia da EFD-Contribuições do período.',
      'Valores atualizáveis pela Selic acumulada desde cada recolhimento indevido.',
    ],
  };
}
