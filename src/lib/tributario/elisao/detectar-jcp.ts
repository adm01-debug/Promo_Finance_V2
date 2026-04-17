// ============================================
// JUROS SOBRE CAPITAL PRÓPRIO (JCP)
// Lei 9.249/95 art. 9º
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import { TJLP_ANUAL } from './types';

export function detectarJCP(ctx: ContextoEmpresa): OportunidadeDetectada {
  const aplicavel =
    ctx.regime_atual === 'real' &&
    (ctx.patrimonio_liquido ?? 0) > 100_000 &&
    (ctx.lucro_liquido ?? 0) > 0;

  const pl = ctx.patrimonio_liquido ?? 0;
  const lucro = ctx.lucro_liquido ?? 0;

  // JCP máximo dedutível: TJLP × PL, limitado a 50% do lucro do exercício
  const limitePL = pl * TJLP_ANUAL;
  const limiteLucro = lucro * 0.5;
  const jcpDedutivel = Math.min(limitePL, limiteLucro);

  // Economia: 25% IRPJ + 9% CSLL = 34% sobre o JCP dedutível
  // Menos 15% IRRF na distribuição = economia líquida ≈ 19%
  const economiaEstimada = aplicavel ? jcpDedutivel * 0.19 : 0;

  return {
    estrategia: 'JCP',
    nome: 'Juros sobre Capital Próprio',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.8,
    economia_max: economiaEstimada * 1.1,
    base_legal: 'Lei 9.249/95 art. 9º; RIR/2018 art. 355',
    risco: 'baixo',
    justificativa: aplicavel
      ? `Empresa Lucro Real com PL de R$ ${pl.toLocaleString('pt-BR')} e lucro positivo. JCP dedutível estimado: R$ ${jcpDedutivel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`
      : 'JCP requer regime Lucro Real, patrimônio líquido > R$ 100.000 e lucro líquido positivo.',
    proximos_passos: [
      'Validar PL contábil em balanço auditado',
      'Calcular TJLP × PL no exercício',
      'Deliberar distribuição em ata de assembleia',
      'Reter 15% de IRRF na fonte',
    ],
  };
}
