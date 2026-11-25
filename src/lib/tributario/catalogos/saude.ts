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
export type OverlayId = 'icms' | 'iss' | 'ncm' | 'monofasico' | 'mva_st';

export const TITULOS_OVERLAY: Record<OverlayId, string> = {
  icms: 'Overlay ICMS (UFs/FCP)',
  iss: 'Overlay ISS municipal',
  ncm: 'Overlay NCM (TIPI)',
  monofasico: 'Overlay monofásico PIS/COFINS',
  mva_st: 'Overlay MVA/ST por protocolo',
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

  const rejeicoesPorOverlay: RejeicaoOverlayResumo[] = (Object.keys(TITULOS_OVERLAY) as OverlayId[])
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

  const penalidade = criticos * PESO_CRITICO + atencoes * PESO_ATENCAO + rejeicoes * PESO_REJEICAO;
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
  rejeicoes: number
): string {
  if (status === 'saudavel') return 'Catálogos sincronizados com o motor';

  const partes: string[] = [];
  if (divergencias > 0) {
    partes.push(
      criticos > 0
        ? `${plural(divergencias, 'divergência', 'divergências')} (${criticos} crítica${criticos === 1 ? '' : 's'})`
        : plural(divergencias, 'divergência', 'divergências')
    );
  }
  if (rejeicoes > 0) {
    partes.push(`${plural(rejeicoes, 'registro rejeitado', 'registros rejeitados')} no overlay`);
  }
  return partes.join(' · ');
}

// ---------------------------------------------------------------------------
// Etapa 83: frescor dos catálogos espelhados da Receita Federal (etapas 79-82)
// ---------------------------------------------------------------------------
//
// Os catálogos RFB entram por job diário e não havia nada que avisasse quando o
// job parava: um catálogo congelado em janeiro seguia "saudável", porque as
// invariantes de integridade continuam passando — o dado só envelhece.

/** Catálogos espelhados da API de dados abertos da RFB. */
export type CatalogoRfbId = 'cclasstrib' | 'ncm' | 'aliquota' | 'fundamentacao';

export const TITULOS_CATALOGO_RFB: Record<CatalogoRfbId, string> = {
  cclasstrib: 'cClassTrib (CBS/IBS)',
  ncm: 'NCM/NBS',
  aliquota: 'Alíquotas de referência',
  fundamentacao: 'Fundamentações legais',
};

/** Dias sem sincronização a partir dos quais o catálogo vira alerta. */
export const DIAS_ALERTA_CATALOGO_RFB = 7;

export type StatusFrescorRfb = 'ok' | 'atencao' | 'critico';

export interface EntradaFrescorCatalogoRfb {
  id: CatalogoRfbId;
  /** Carga mais recente da tabela. null = nunca sincronizado. */
  ultimaCarga: string | Date | null;
  /** Versão IT gravada na carga mais recente (catálogos versionados). */
  versaoIt?: string | null;
}

export interface FrescorCatalogoRfb {
  id: CatalogoRfbId;
  titulo: string;
  /** ISO da carga mais recente; null quando nunca sincronizou. */
  ultimaCarga: string | null;
  /** Dias inteiros desde a última carga; null quando nunca sincronizou. */
  diasSemSync: number | null;
  versaoIt: string | null;
  status: StatusFrescorRfb;
  /** Frase curta para a linha do painel. */
  detalhe: string;
}

export interface SaudeCatalogosRfb {
  status: StatusFrescorRfb;
  catalogos: FrescorCatalogoRfb[];
  /** Catálogos com mais de `DIAS_ALERTA_CATALOGO_RFB` dias. */
  desatualizados: number;
  /** Catálogos sem nenhuma carga. */
  nuncaSincronizados: number;
  resumo: string;
}

const MS_POR_DIA = 86_400_000;

function diasDesde(ultimaCarga: string | Date | null, hoje: Date): number | null {
  if (!ultimaCarga) return null;
  const data = ultimaCarga instanceof Date ? ultimaCarga : new Date(ultimaCarga);
  const ms = data.getTime();
  if (!Number.isFinite(ms)) return null;
  // Relógio adiantado não vira "-1 dia".
  return Math.max(0, Math.floor((hoje.getTime() - ms) / MS_POR_DIA));
}

function isoOuNulo(valor: string | Date | null): string | null {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isFinite(data.getTime()) ? data.toISOString() : null;
}

/**
 * Avalia o frescor de cada catálogo RFB contra a data de referência.
 *
 * Critério: nunca sincronizado é crítico (o catálogo inteiro está ausente);
 * acima de `DIAS_ALERTA_CATALOGO_RFB` dias é atenção (o job parou e o dado
 * envelheceu); dentro da janela é ok. Função pura: a data de referência entra
 * por parâmetro para o teste não depender do relógio.
 */
export function avaliarFrescorCatalogosRfb(
  entradas: readonly EntradaFrescorCatalogoRfb[],
  hoje: Date | string = new Date()
): SaudeCatalogosRfb {
  const referencia = hoje instanceof Date ? hoje : new Date(hoje);
  const base = Number.isFinite(referencia.getTime()) ? referencia : new Date();

  const catalogos: FrescorCatalogoRfb[] = (entradas ?? []).map((entrada) => {
    const dias = diasDesde(entrada.ultimaCarga, base);
    const status: StatusFrescorRfb =
      dias === null ? 'critico' : dias > DIAS_ALERTA_CATALOGO_RFB ? 'atencao' : 'ok';
    const detalhe =
      dias === null
        ? 'Nunca sincronizado'
        : dias === 0
          ? 'Sincronizado hoje'
          : `Sem sincronizar há ${plural(dias, 'dia', 'dias')}`;
    return {
      id: entrada.id,
      titulo: TITULOS_CATALOGO_RFB[entrada.id] ?? entrada.id,
      ultimaCarga: dias === null ? null : isoOuNulo(entrada.ultimaCarga),
      diasSemSync: dias,
      versaoIt: entrada.versaoIt ?? null,
      status,
      detalhe,
    };
  });

  const desatualizados = catalogos.filter((c) => c.status === 'atencao').length;
  const nuncaSincronizados = catalogos.filter((c) => c.status === 'critico').length;
  const status: StatusFrescorRfb =
    nuncaSincronizados > 0 ? 'critico' : desatualizados > 0 ? 'atencao' : 'ok';

  const partes: string[] = [];
  if (nuncaSincronizados > 0) {
    partes.push(
      plural(nuncaSincronizados, 'catálogo nunca sincronizado', 'catálogos nunca sincronizados')
    );
  }
  if (desatualizados > 0) {
    partes.push(
      `${plural(desatualizados, 'catálogo', 'catálogos')} sem sincronizar há mais de ${DIAS_ALERTA_CATALOGO_RFB} dias`
    );
  }
  const resumo =
    partes.length > 0
      ? partes.join(' · ')
      : `Catálogos RFB sincronizados nos últimos ${DIAS_ALERTA_CATALOGO_RFB} dias`;

  return { status, catalogos, desatualizados, nuncaSincronizados, resumo };
}
