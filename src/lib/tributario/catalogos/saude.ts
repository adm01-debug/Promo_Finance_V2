// CATÁLOGOS FISCAIS — Saúde consolidada (módulo puro, sem I/O e sem React).
//
// Consolida DUAS fontes de risco distintas em um único indicador:
//
//  1. DIVERGÊNCIAS  — o banco (fonte de verdade) diverge das tabelas
//     canônicas embarcadas no motor. Vêm de `gerarAlertasCatalogos`.
//  2. REJEIÇÕES     — registros do banco que o overlay recusou aplicar
//     (código inválido, duplicado, alíquota fora da faixa legal...). Nesses
//     casos o motor segue com o valor canônico, ou seja: o dado cadastrado
//     no banco simplesmente NÃO está em produção — é uma falha silenciosa.
//
// O score é intencionalmente pessimista: qualquer crítico já derruba a
// classificação para "critico", porque um crítico significa cálculo com base
// potencialmente errada — e em matéria tributária errar para menos é autuação.

import type { CatalogoId, ResumoAlertasCatalogos } from './alertas';
import { TITULOS_CATALOGO } from './alertas';

/** Overlays que podem recusar registros do banco. */
export type OverlayId = 'icms' | 'iss' | 'ncm' | 'monofasico';

export const TITULOS_OVERLAY: Record<OverlayId, string> = {
  icms: 'Overlay ICMS (UFs/FCP)',
  iss: 'Overlay ISS municipal',
  ncm: 'Overlay NCM (TIPI)',
  monofasico: 'Overlay monofásico PIS/COFINS',
};

/** Classificação legível da saúde dos catálogos. */
export type StatusSaudeCatalogos = 'saudavel' | 'atencao' | 'critico';

export interface RejeicaoOverlayResumo {
  overlay: OverlayId;
  overlayTitulo: string;
  /** Quantidade de registros recusados pelo overlay. */
  quantidade: number;
  /** Amostra de mensagens legíveis (limitada para caber na UI). */
  exemplos: string[];
}

export interface SaudeCatalogos {
  status: StatusSaudeCatalogos;
  /** 0-100. 100 = nenhum problema detectado. */
  score: number;
  /** Divergências entre banco e motor. */
  divergencias: number;
  divergenciasCriticas: number;
  /** Registros recusados pelos overlays (não chegaram ao motor). */
  rejeicoes: number;
  /** Total de problemas (divergências + rejeições). */
  totalProblemas: number;
  /** Catálogos com divergência. */
  catalogosAfetados: CatalogoId[];
  /** Rótulos dos catálogos afetados, prontos para exibição. */
  catalogosAfetadosTitulos: string[];
  /** Detalhe por overlay que recusou registros (apenas os com quantidade > 0). */
  rejeicoesPorOverlay: RejeicaoOverlayResumo[];
  /** Frase curta para o badge. */
  resumo: string;
}

/** Entrada de rejeições: mensagens já traduzidas por overlay. */
export type EntradaRejeicoes = Partial<Record<OverlayId, readonly string[]>>;

export interface EntradaSaudeCatalogos {
  alertas: ResumoAlertasCatalogos;
  rejeicoes?: EntradaRejeicoes;
  /** Máximo de exemplos guardados por overlay (default 3). */
  maxExemplos?: number;
}

/** Peso de cada tipo de problema no score. Crítico pesa mais. */
const PESO_CRITICO = 12;
const PESO_ATENCAO = 4;
const PESO_REJEICAO = 6;

function limitar(valor: number, min: number, max: number): number {
  if (!Number.isFinite(valor)) return min;
  return Math.min(max, Math.max(min, valor));
}

/**
 * Consolida divergências e rejeições em um indicador único de saúde.
 *
 * Função pura e defensiva: entradas ausentes ou malformadas degradam para
 * "sem problemas conhecidos" em vez de lançar — o dashboard nunca deve quebrar
 * por causa de um catálogo mal cadastrado.
 */
export function calcularSaudeCatalogos(entrada: EntradaSaudeCatalogos): SaudeCatalogos {
  const maxExemplos = entrada.maxExemplos ?? 3;

  const criticos = Math.max(0, entrada.alertas?.criticos ?? 0);
  const atencoes = Math.max(0, entrada.alertas?.atencoes ?? 0);
  const divergencias = Math.max(0, entrada.alertas?.total ?? criticos + atencoes);
  const catalogosAfetados = entrada.alertas?.catalogosAfetados ?? [];

  const rejeicoesPorOverlay: RejeicaoOverlayResumo[] = (
    Object.keys(TITULOS_OVERLAY) as OverlayId[]
  )
    .map((overlay) => {
      const mensagens = entrada.rejeicoes?.[overlay] ?? [];
      return {
        overlay,
        overlayTitulo: TITULOS_OVERLAY[overlay],
        quantidade: mensagens.length,
        exemplos: mensagens.slice(0, maxExemplos).map((m) => String(m)),
      };
    })
    .filter((r) => r.quantidade > 0);

  const rejeicoes = rejeicoesPorOverlay.reduce((acc, r) => acc + r.quantidade, 0);
  const totalProblemas = divergencias + rejeicoes;

  const penalidade =
    criticos * PESO_CRITICO + atencoes * PESO_ATENCAO + rejeicoes * PESO_REJEICAO;
  const score = Math.round(limitar(100 - penalidade, 0, 100));

  const status: StatusSaudeCatalogos =
    criticos > 0 ? 'critico' : totalProblemas > 0 ? 'atencao' : 'saudavel';

  return {
    status,
    score,
    divergencias,
    divergenciasCriticas: criticos,
    rejeicoes,
    totalProblemas,
    catalogosAfetados: [...catalogosAfetados],
    catalogosAfetadosTitulos: catalogosAfetados.map((c) => TITULOS_CATALOGO[c] ?? c),
    rejeicoesPorOverlay,
    resumo: montarResumo(status, divergencias, criticos, rejeicoes),
  };
}

function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}

function montarResumo(
  status: StatusSaudeCatalogos,
  divergencias: number,
  criticos: number,
  rejeicoes: number,
): string {
  if (status === 'saudavel') return 'Catálogos sincronizados com o motor';

  const partes: string[] = [];
  if (divergencias > 0) {
    partes.push(
      criticos > 0
        ? `${plural(divergencias, 'divergência', 'divergências')} (${criticos} crítica${criticos === 1 ? '' : 's'})`
        : plural(divergencias, 'divergência', 'divergências'),
    );
  }
  if (rejeicoes > 0) {
    partes.push(`${plural(rejeicoes, 'registro rejeitado', 'registros rejeitados')} no overlay`);
  }
  return partes.join(' · ');
}
