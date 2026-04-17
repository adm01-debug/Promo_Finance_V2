// ============================================
// ORQUESTRADOR DE ELISÃO FISCAL
// Roda todas as 9 estratégias e ranqueia
// ============================================

import type { ContextoEmpresa, OportunidadeDetectada } from './types';
import { detectarJCP } from './detectar-jcp';
import { detectarReintegra } from './detectar-reintegra';
import { detectarMsLc224 } from './detectar-ms-lc224';
import { detectarHolding } from './detectar-holding';
import { detectarPAT } from './detectar-pat';
import { detectarLeiBem } from './detectar-lei-bem';
import { detectarDrawback } from './detectar-drawback';
import { detectarSubvencaoIcms } from './detectar-subvencao-icms';
import { detectarBonificacao } from './detectar-bonificacao';

export interface RelatorioElisao {
  total_oportunidades: number;
  total_aplicaveis: number;
  economia_total_estimada: number;
  oportunidades: OportunidadeDetectada[];
}

export function analisarOportunidadesElisao(ctx: ContextoEmpresa): RelatorioElisao {
  const oportunidades: OportunidadeDetectada[] = [
    detectarJCP(ctx),
    detectarReintegra(ctx),
    detectarMsLc224(ctx),
    detectarHolding(ctx),
    detectarPAT(ctx),
    detectarLeiBem(ctx),
    detectarDrawback(ctx),
    detectarSubvencaoIcms(ctx),
    detectarBonificacao(ctx),
  ];

  // Ranquear por economia estimada (decrescente)
  oportunidades.sort((a, b) => b.economia_estimada - a.economia_estimada);

  const aplicaveis = oportunidades.filter((o) => o.aplicavel);
  const economiaTotal = aplicaveis.reduce((acc, o) => acc + o.economia_estimada, 0);

  return {
    total_oportunidades: oportunidades.length,
    total_aplicaveis: aplicaveis.length,
    economia_total_estimada: economiaTotal,
    oportunidades,
  };
}

export * from './types';
