// ============================================
// BONIFICAÇÃO EM MERCADORIAS
// LC 87/96; Tema 144 STJ
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';

export function detectarBonificacao(ctx: ContextoEmpresa): OportunidadeDetectada {
  const faturamento = ctx.faturamento_anual ?? 0;
  const aplicavel = faturamento > 500_000 && ctx.regime_atual !== 'simples';

  // Bonificação reduz base ICMS/PIS/COFINS — economia estimada de 2-9% sobre volume
  const volumeEstimado = faturamento * 0.05; // assume 5% potencial de bonificação
  const economiaEstimada = aplicavel ? volumeEstimado * 0.18 : 0;

  return {
    estrategia: 'BONIFICACAO',
    nome: 'Bonificação em Mercadorias',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.5,
    economia_max: economiaEstimada * 1.8,
    base_legal: 'LC 87/96 art. 13; Tema 144 STJ; Lei 10.637/02',
    risco: 'medio',
    justificativa: aplicavel
      ? `Faturamento de R$ ${faturamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Bonificações comerciais podem reduzir base ICMS/PIS/COFINS.`
      : 'Bonificações são vantajosas para operações com volume comercial relevante (Presumido/Real).',
    proximos_passos: [
      'Estruturar bonificações em contratos comerciais (não como descontos condicionais)',
      'Documentar entrega gratuita das mercadorias bonificadas',
      'Excluir da base ICMS, PIS e COFINS conforme jurisprudência',
      'Manter compliance com fisco estadual',
    ],
    observacoes: 'STJ pacificou Tema 144: bonificações em mercadorias não compõem base ICMS.',
  };
}
