// ============================================
// MS LC 224/2025 — Reforma Tributária
// Discussão judicial sobre sublimite estadual
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import { SUBLIMITE_SIMPLES } from './types';

export function detectarMsLc224(ctx: ContextoEmpresa): OportunidadeDetectada {
  const proximidade = ctx.rbt12 / SUBLIMITE_SIMPLES;
  const aplicavel = ctx.regime_atual === 'simples' && proximidade >= 0.9 && proximidade <= 1.2;

  // Economia estimada: 5% a 15% da carga tributária anual em caso de êxito
  const cargaAnual = (ctx.carga_tributaria_atual ?? ctx.faturamento_anual * 0.10) * ctx.faturamento_anual;
  const economiaEstimada = aplicavel ? cargaAnual * 0.10 : 0;

  return {
    estrategia: 'MS_LC224',
    nome: 'Mandado de Segurança LC 224/2025',
    aplicavel,
    economia_estimada: economiaEstimada,
    economia_min: economiaEstimada * 0.5,
    economia_max: economiaEstimada * 1.5,
    base_legal: 'LC 224/2025; CF/88 art. 5º, LXIX',
    risco: 'medio',
    justificativa: aplicavel
      ? `RBT12 de R$ ${ctx.rbt12.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} representa ${(proximidade * 100).toFixed(1)}% do sublimite estadual. Cabível discussão judicial.`
      : 'Aplicável a empresas do Simples Nacional próximas ao sublimite estadual (R$ 3.600.000).',
    proximos_passos: [
      'Análise de viabilidade jurídica com tributarista',
      'Levantar documentação fiscal dos últimos 5 anos',
      'Impetrar MS preventivo ou corretivo',
      'Acompanhar precedentes do STF/STJ sobre LC 224/2025',
    ],
    observacoes: 'Estratégia depende de tese jurídica em construção. Avaliar precedentes regionais.',
  };
}
