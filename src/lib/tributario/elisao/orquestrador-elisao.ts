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

/**
 * Orquestra as 9 estratégias de elisão fiscal lícita e ranqueia por economia estimada.
 *
 * **Estratégias avaliadas:** JCP (Lei 9.249/95 art. 9º), REINTEGRA (Lei 13.043/14),
 * Mandado de Segurança LC 224 (exclusão ICMS-ST da base PIS/COFINS), Holding Patrimonial,
 * PAT (Lei 6.321/76), Lei do Bem (Lei 11.196/05), DRAWBACK (DL 37/66),
 * Subvenção ICMS (LC 160/17) e Bonificação em mercadorias.
 *
 * @param ctx - Contexto da empresa (regime, faturamento, lucro, atividade, UF).
 * @returns Relatório consolidado com oportunidades aplicáveis e economia total.
 */
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
