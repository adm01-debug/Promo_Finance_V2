// ============================================
// SUBVENÇÃO DE ICMS — Exclusão IRPJ/CSLL
// LC 160/17, Lei 12.973/14, Tema 1.182 STJ
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';

export function detectarSubvencaoIcms(ctx: ContextoEmpresa): OportunidadeDetectada {
  const beneficio = ctx.beneficio_icms_anual ?? 0;
  const aplicavel = ctx.regime_atual === 'real' && beneficio > 10_000;

  // Exclusão de 100% do benefício da base IRPJ/CSLL = economia de 34%
  const economiaEstimada = aplicavel ? beneficio * 0.34 : 0;

  return {
    estrategia: 'SUBVENCAO_ICMS',
    nome: 'Subvenção ICMS — Exclusão IRPJ/CSLL',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.85,
    economia_max: economiaEstimada,
    base_legal: 'LC 160/17; Lei 12.973/14 art. 30; Tema 1.182 STJ',
    risco: 'medio',
    justificativa: aplicavel
      ? `Benefício ICMS anual de R$ ${beneficio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Exclusão integral da base IRPJ/CSLL.`
      : 'Aplicável a empresas Lucro Real com benefícios fiscais de ICMS (créditos presumidos, isenções, reduções de base).',
    proximos_passos: [
      'Identificar e quantificar todos os benefícios ICMS recebidos',
      'Constituir reserva de incentivos fiscais (art. 30 Lei 12.973)',
      'Não distribuir o valor como dividendos (vedação)',
      'Apurar exclusão na ECF',
    ],
    observacoes: 'STJ Tema 1.182 reforça aplicabilidade independente da modalidade do benefício.',
  };
}
