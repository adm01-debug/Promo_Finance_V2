// JUROS SOBRE CAPITAL PRÓPRIO (JCP)
// Lei 9.249/95 art. 9º e §1º; Lei 14.789/2023 art. 14; RIR/2018 art. 355

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import { TJLP_ANUAL } from './types';

/** Percentual legal aplicado ao lucro/reservas na formação do limite (art. 9º §1º). */
export const PERCENTUAL_LIMITE_JCP = 0.5;
/** IRPJ 25% + CSLL 9% sobre a dedução no Lucro Real. */
export const ALIQUOTA_ECONOMIA_JCP = 0.34;
/** IRRF exclusivo na fonte sobre o JCP pago/creditado (Lei 9.249/95 art. 9º §2º). */
export const ALIQUOTA_IRRF_JCP = 0.15;
/** Economia líquida efetiva: 34% de dedução menos 15% de IRRF. */
export const TAXA_ECONOMIA_LIQUIDA_JCP = ALIQUOTA_ECONOMIA_JCP - ALIQUOTA_IRRF_JCP;
/** PL mínimo para que a estratégia seja materialmente relevante. */
export const PL_MINIMO_JCP = 100_000;

export interface MemoriaJcp {
  /** Base do PL efetivamente considerada (Lei 14.789/2023 quando informada). */
  base_patrimonio_liquido: number;
  tjlp_aplicado: number;
  /** Teto econômico: base do PL × TJLP. */
  limite_pl_tjlp: number;
  /** 50% do lucro do exercício antes da dedução do próprio JCP. */
  limite_lucro_exercicio: number;
  /** 50% dos lucros acumulados somados às reservas de lucros. */
  limite_lucros_acumulados: number;
  /** Maior entre os dois limites do art. 9º §1º. */
  limite_legal_aplicado: number;
  jcp_dedutivel: number;
  economia_irpj_csll: number;
  irrf_a_pagar: number;
  economia_liquida: number;
}

export interface OportunidadeJcp extends OportunidadeDetectada {
  memoria_calculo: MemoriaJcp;
}

function naoNegativo(valor: number | undefined): number {
  return Number.isFinite(valor) && (valor as number) > 0 ? (valor as number) : 0;
}

/**
 * Detecta a oportunidade de JCP aplicando o limite duplo do art. 9º §1º da Lei
 * 9.249/95: o JCP dedutível é o menor entre (a) base do PL × TJLP e (b) o MAIOR
 * entre 50% do lucro do exercício e 50% dos lucros acumulados + reservas de lucros.
 */
export function detectarJCP(ctx: ContextoEmpresa): OportunidadeJcp {
  const plContabil = naoNegativo(ctx.patrimonio_liquido);
  const basePl = naoNegativo(ctx.patrimonio_liquido_base_jcp) || plContabil;
  const lucro = Number.isFinite(ctx.lucro_liquido) ? (ctx.lucro_liquido as number) : 0;
  const acumulados = naoNegativo(ctx.lucros_acumulados) + naoNegativo(ctx.reservas_lucros);

  const limitePlTjlp = basePl * TJLP_ANUAL;
  const limiteLucroExercicio = Math.max(0, lucro) * PERCENTUAL_LIMITE_JCP;
  const limiteLucrosAcumulados = acumulados * PERCENTUAL_LIMITE_JCP;
  const limiteLegal = Math.max(limiteLucroExercicio, limiteLucrosAcumulados);

  // Só há dedução se houver lucro (do exercício ou acumulado) contra o qual deduzir.
  const aplicavel =
    ctx.regime_atual === 'real' && plContabil > PL_MINIMO_JCP && (lucro > 0 || acumulados > 0);

  const jcpDedutivel = aplicavel ? Math.max(0, Math.min(limitePlTjlp, limiteLegal)) : 0;
  const economiaIrpjCsll = jcpDedutivel * ALIQUOTA_ECONOMIA_JCP;
  const irrf = jcpDedutivel * ALIQUOTA_IRRF_JCP;
  const economiaLiquida = economiaIrpjCsll - irrf;

  const usouAcumulados = aplicavel && limiteLucrosAcumulados > limiteLucroExercicio;

  return {
    estrategia: 'JCP',
    nome: 'Juros sobre Capital Próprio',
    aplicavel,
    economia_estimada: economiaLiquida,
    economia_min: economiaLiquida * 0.8,
    economia_max: economiaLiquida * 1.1,
    base_legal: 'Lei 9.249/95 art. 9º e §1º; Lei 14.789/2023 art. 14; RIR/2018 art. 355',
    risco: 'baixo',
    justificativa: aplicavel
      ? `Empresa Lucro Real com PL de R$ ${plContabil.toLocaleString('pt-BR')} e base de dedução positiva. JCP dedutível estimado: R$ ${jcpDedutivel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}${usouAcumulados ? ' (limite formado por 50% dos lucros acumulados e reservas de lucros)' : ' (limite formado por 50% do lucro do exercício)'}.`
      : 'JCP requer regime Lucro Real, patrimônio líquido > R$ 100.000 e lucro do exercício ou lucros acumulados positivos.',
    proximos_passos: [
      'Validar PL contábil em balanço auditado',
      'Segregar a base do JCP conforme Lei 14.789/2023 art. 14',
      'Comparar 50% do lucro do exercício com 50% dos lucros acumulados e reservas',
      'Deliberar distribuição em ata de assembleia',
      'Reter 15% de IRRF na fonte',
    ],
    observacoes: usouAcumulados
      ? 'Limite legal formado pelos lucros acumulados e reservas de lucros, mais vantajoso que o lucro do exercício.'
      : undefined,
    memoria_calculo: {
      base_patrimonio_liquido: basePl,
      tjlp_aplicado: TJLP_ANUAL,
      limite_pl_tjlp: limitePlTjlp,
      limite_lucro_exercicio: limiteLucroExercicio,
      limite_lucros_acumulados: limiteLucrosAcumulados,
      limite_legal_aplicado: limiteLegal,
      jcp_dedutivel: jcpDedutivel,
      economia_irpj_csll: economiaIrpjCsll,
      irrf_a_pagar: irrf,
      economia_liquida: economiaLiquida,
    },
  };
}
