// ============================================
// PAT — Programa de Alimentação ao Trabalhador
// Lei 6.321/76
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';

export function detectarPAT(ctx: ContextoEmpresa): OportunidadeDetectada {
  const folha = ctx.folha_total_anual ?? 0;
  const lucro = ctx.lucro_liquido ?? 0;
  const aplicavel = ctx.regime_atual === 'real' && folha > 50_000 && lucro > 0;

  // PAT: dedução de até 4% do IRPJ devido (não da base, do imposto!)
  const irpjBase = lucro * 0.15; // IRPJ 15%
  const irpjAdicional = Math.max(0, (lucro - 240_000) * 0.10);
  const irpjTotal = irpjBase + irpjAdicional;
  const economiaEstimada = aplicavel ? irpjTotal * 0.04 : 0;

  return {
    estrategia: 'PAT',
    nome: 'Programa de Alimentação ao Trabalhador',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.7,
    economia_max: economiaEstimada,
    base_legal: 'Lei 6.321/76; Decreto 10.854/21',
    risco: 'baixo',
    justificativa: aplicavel
      ? `Folha anual de R$ ${folha.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Dedução de até 4% do IRPJ via PAT.`
      : 'PAT requer regime Lucro Real, folha relevante e lucro positivo.',
    proximos_passos: [
      'Cadastrar empresa no PAT (Ministério do Trabalho)',
      'Implementar benefício-refeição/alimentação',
      'Manter notas fiscais e folha de pagamento dos beneficiados',
      'Calcular dedução respeitando teto de 4% do IRPJ',
    ],
  };
}
