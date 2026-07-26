// RECUPERAÇÃO DE CRÉDITOS DE PIS/COFINS — STJ Tema 779
// Revisão dos últimos 5 anos de insumos não creditados no regime não-cumulativo

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import {
  ANOS_PRESCRICAO_CREDITO,
  TAXA_CREDITO_NAO_APROVEITADO_ESTIMADA,
} from './types';

/**
 * Detecta potencial de recuperação de créditos de PIS/COFINS não aproveitados,
 * apoiada no conceito amplo de insumo firmado pelo STJ no Tema 779
 * (essencialidade e relevância para a atividade).
 *
 * Só se aplica ao regime não-cumulativo (Lucro Real). O valor é uma estimativa
 * conservadora: usa o valor informado pelo usuário quando existir e, na sua
 * ausência, uma fração pequena da receita anual como proxy do crédito anual,
 * projetada sobre a janela prescricional de 5 anos.
 */
export function detectarRecuperacaoPisCofins(ctx: ContextoEmpresa): OportunidadeDetectada {
  const aplicavel = ctx.regime_atual === 'real' && ctx.faturamento_anual > 0;

  const receita = Math.max(0, ctx.faturamento_anual);
  const creditoAnualInformado = ctx.creditos_pis_cofins_nao_aproveitados;
  const creditoAnual =
    creditoAnualInformado !== undefined && creditoAnualInformado > 0
      ? creditoAnualInformado
      : receita * TAXA_CREDITO_NAO_APROVEITADO_ESTIMADA;

  // Recuperação retroativa: até 5 anos, sem correção monetária (conservador).
  const economiaEstimada = aplicavel ? creditoAnual * ANOS_PRESCRICAO_CREDITO : 0;

  return {
    estrategia: 'RECUPERACAO_PIS_COFINS',
    nome: 'Recuperação de créditos PIS/COFINS (Tema 779)',
    aplicavel,
    economia_estimada: economiaEstimada,
    // Faixa larga: depende integralmente da qualidade da revisão documental.
    economia_min: economiaEstimada * 0.4,
    economia_max: economiaEstimada * 1.6,
    base_legal: 'STJ REsp 1.221.170/PR (Tema 779); Leis 10.637/02 e 10.833/03; CTN art. 168 I',
    risco: 'baixo',
    justificativa: aplicavel
      ? `Empresa no regime não-cumulativo. Revisão dos últimos ${ANOS_PRESCRICAO_CREDITO} anos pode recuperar cerca de R$ ${economiaEstimada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em insumos essenciais não creditados (frete, embalagem, energia, serviços aplicados na atividade).`
      : 'A recuperação depende do regime não-cumulativo de PIS/COFINS, exclusivo do Lucro Real. No Simples e no Presumido cumulativo não há crédito a revisar.',
    proximos_passos: [
      'Levantar EFD-Contribuições dos últimos 60 meses',
      'Classificar insumos pelos critérios de essencialidade e relevância (Tema 779)',
      'Quantificar o crédito extemporâneo por competência',
      'Retificar a EFD-Contribuições e transmitir PER/DCOMP',
    ],
    observacoes: aplicavel && creditoAnualInformado === undefined
      ? 'Estimativa baseada em proxy de receita — informe o crédito anual apurado para refinar o valor.'
      : undefined,
  };
}
