// ============================================
// LEI DO BEM — Incentivo a P&D
// Lei 11.196/05
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';

export function detectarLeiBem(ctx: ContextoEmpresa): OportunidadeDetectada {
  const pd = ctx.despesas_pd ?? 0;
  const aplicavel = ctx.regime_atual === 'real' && pd > 50_000;

  // Exclusão de 60% (até 100%) das despesas de P&D da base IRPJ/CSLL
  const exclusao = pd * 0.60;
  const economiaEstimada = aplicavel ? exclusao * 0.34 : 0; // 25% IRPJ + 9% CSLL

  return {
    estrategia: 'LEI_BEM',
    nome: 'Lei do Bem — Incentivo P&D',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.8,
    economia_max: economiaEstimada * 1.66, // até 100% de exclusão
    base_legal: 'Lei 11.196/05 cap. III; Decreto 5.798/06',
    risco: 'medio',
    justificativa: aplicavel
      ? `Despesas P&D de R$ ${pd.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Exclusão de 60-100% da base IRPJ/CSLL.`
      : 'Lei do Bem requer regime Lucro Real e despesas em P&D devidamente comprovadas.',
    proximos_passos: [
      'Mapear projetos qualificados como P&D (norma ABNT NBR 16500)',
      'Documentar cronogramas, equipes e resultados',
      'Apresentar relatório anual ao MCTI',
      'Apurar exclusão na ECF',
    ],
  };
}
