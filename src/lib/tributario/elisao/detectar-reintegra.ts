// ============================================
// REINTEGRA — Crédito sobre Exportação
// Lei 13.043/14
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';

export function detectarReintegra(ctx: ContextoEmpresa): OportunidadeDetectada {
  const receitaExp = ctx.receita_exportacao ?? 0;
  const aplicavel = receitaExp > 0;

  // Alíquota atual: 0,1% (mínimo); pode chegar a 3% conforme decreto
  const aliquotaAtual = 0.001;
  const economiaEstimada = receitaExp * aliquotaAtual;
  const economiaMax = receitaExp * 0.03;

  return {
    estrategia: 'REINTEGRA',
    nome: 'Reintegra — Crédito sobre Exportação',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada,
    economia_max: economiaMax,
    base_legal: 'Lei 13.043/14; Decreto 8.415/15',
    risco: 'baixo',
    justificativa: aplicavel
      ? `Receita de exportação de R$ ${receitaExp.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Crédito de 0,1% a 3% aplicável.`
      : 'Reintegra requer receita de exportação no período.',
    proximos_passos: [
      'Identificar NCMs elegíveis na lista do Decreto',
      'Calcular crédito mensal sobre exportações',
      'Habilitar pedido de ressarcimento via PER/DCOMP',
      'Compensar com tributos federais',
    ],
  };
}
