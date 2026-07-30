// INCENTIVOS REGIONAIS SUDENE / SUDAM
// Redução de 75% do IRPJ sobre o lucro da exploração por 10 anos

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import {
  ALIQUOTA_IRPJ_BASICA,
  REDUCAO_IRPJ_REGIONAL,
  UFS_SUDENE,
  UFS_SUDAM,
} from './types';

/**
 * Detecta elegibilidade aos incentivos regionais de redução do IRPJ
 * (SUDENE — Nordeste e norte de MG/ES; SUDAM — Amazônia Legal).
 *
 * O benefício alcança apenas o **lucro da exploração** do empreendimento
 * instalado na área incentivada e exige atividade em setor prioritário
 * (Decretos 4.212/2002 e 4.213/2002), além de laudo constitutivo emitido
 * pela superintendência.
 */
export function detectarSudeneSudam(ctx: ContextoEmpresa): OportunidadeDetectada {
  const uf = (ctx.uf ?? '').toUpperCase();
  const orgao = UFS_SUDENE.includes(uf)
    ? 'SUDENE'
    : UFS_SUDAM.includes(uf)
      ? 'SUDAM'
      : null;

  const lucro = Math.max(0, ctx.lucro_liquido ?? 0);
  const aplicavel = ctx.regime_atual === 'real' && orgao !== null && lucro > 0;

  // Economia = 75% do IRPJ básico (15%) incidente sobre o lucro da exploração.
  // O adicional de 10% não é alcançado pelo benefício.
  const economiaEstimada = aplicavel
    ? lucro * ALIQUOTA_IRPJ_BASICA * REDUCAO_IRPJ_REGIONAL
    : 0;

  const motivoNaoAplicavel = (() => {
    if (ctx.regime_atual !== 'real') return 'O incentivo alcança apenas empresas tributadas pelo Lucro Real.';
    if (!orgao) return 'A empresa não possui unidade informada em área de atuação da SUDENE ou da SUDAM.';
    return 'Sem lucro da exploração positivo não há IRPJ a reduzir no período.';
  })();

  return {
    estrategia: 'SUDENE_SUDAM',
    nome: 'Incentivos regionais SUDENE/SUDAM',
    aplicavel,
    economia_estimada: economiaEstimada,
    // Faixa ampla: o lucro da exploração costuma ser menor que o lucro contábil.
    economia_min: economiaEstimada * 0.5,
    economia_max: economiaEstimada,
    base_legal: 'MP 2.199-14/2001 art. 1º; Decretos 4.212/2002 e 4.213/2002; IN RFB 1.751/2017',
    risco: 'medio',
    justificativa: aplicavel
      ? `Unidade em ${uf}, área de atuação da ${orgao}. A redução de 75% do IRPJ sobre o lucro da exploração pode alcançar R$ ${economiaEstimada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} por ano, por até 10 anos.`
      : motivoNaoAplicavel,
    proximos_passos: [
      'Confirmar que a atividade consta nos setores prioritários (Decretos 4.212/2002 e 4.213/2002)',
      'Requerer o laudo constitutivo junto à SUDENE/SUDAM',
      'Segregar contabilmente o lucro da exploração do empreendimento incentivado',
      'Constituir reserva de incentivos fiscais e vedar sua distribuição aos sócios',
    ],
    observacoes:
      'A base do benefício é o lucro da exploração, não o lucro contábil total — a estimativa tende a ser otimista até a segregação contábil ser feita. Em MG e ES a área da SUDENE alcança apenas parte dos municípios: confirme o enquadramento pelo código IBGE da unidade.',
  };
}
