// ============================================
// HOLDING PATRIMONIAL / FAMILIAR
// Lei 15.270/2025 — IRPFM
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import { TETO_DIVIDENDOS_IRPFM } from './types';

export function detectarHolding(ctx: ContextoEmpresa): OportunidadeDetectada {
  const dividendos = ctx.dividendos_pf_anual ?? 0;
  const aplicavel = dividendos > TETO_DIVIDENDOS_IRPFM;

  // IRPFM (Lei 15.270/2025): alíquota progressiva sobre dividendos PF > R$ 50k/mês
  // Holding bem estruturada pode eliminar/diferir esse imposto
  const irpfmEstimado = aplicavel ? Math.max(0, dividendos - TETO_DIVIDENDOS_IRPFM) * 0.10 : 0;
  const economiaEstimada = irpfmEstimado * 0.7; // assume 70% de eficiência

  return {
    estrategia: 'HOLDING',
    nome: 'Holding Patrimonial / Familiar',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.6,
    economia_max: economiaEstimada * 1.2,
    base_legal: 'Lei 15.270/2025; CC/2002; Lei 6.404/76',
    risco: 'medio',
    justificativa: aplicavel
      ? `Dividendos anuais de R$ ${dividendos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} acima do teto IRPFM (R$ ${TETO_DIVIDENDOS_IRPFM.toLocaleString('pt-BR')}). Holding pode reduzir incidência.`
      : `Holding torna-se vantajosa quando dividendos PF anuais superam R$ ${TETO_DIVIDENDOS_IRPFM.toLocaleString('pt-BR')}.`,
    proximos_passos: [
      'Análise sucessória e tributária integrada',
      'Constituir holding pura ou mista',
      'Integralizar capital com bens (avaliar ITBI/ITCMD)',
      'Planejar distribuição via JCP + dividendos',
    ],
    observacoes: 'IRPFM entra em vigor em 2026 (Lei 15.270/2025). Reestruturação ideal antes do prazo.',
  };
}
