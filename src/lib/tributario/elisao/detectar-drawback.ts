// ============================================
// DRAWBACK — Suspensão de Tributos na Importação
// Lei 11.945/09
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';

export function detectarDrawback(ctx: ContextoEmpresa): OportunidadeDetectada {
  const importacao = ctx.receita_importacao ?? 0;
  const exportacao = ctx.receita_exportacao ?? 0;
  const aplicavel = importacao > 100_000 && exportacao > 100_000 && ctx.regime_atual !== 'simples';

  // Economia estimada: ~18% sobre o valor importado vinculado à exportação
  // (II + IPI + PIS + COFINS + ICMS suspensos)
  const valorVinculado = Math.min(importacao, exportacao * 0.4);
  const economiaEstimada = aplicavel ? valorVinculado * 0.18 : 0;

  return {
    estrategia: 'DRAWBACK',
    nome: 'Drawback — Suspensão de Tributos',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.7,
    economia_max: economiaEstimada * 1.3,
    base_legal: 'Lei 11.945/09; Portaria SECEX 23/2011',
    risco: 'baixo',
    justificativa: aplicavel
      ? `Importação de R$ ${importacao.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} e exportação de R$ ${exportacao.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Drawback aplicável a insumos vinculados.`
      : 'Drawback requer operações de importação E exportação relevantes.',
    proximos_passos: [
      'Habilitar regime no SISCOMEX (modalidade Suspensão/Isenção/Restituição)',
      'Mapear NCMs de insumos importados destinados ao produto exportado',
      'Manter controle de estoques vinculados',
      'Comprovar exportação no prazo de 1 ano',
    ],
  };
}
