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
export type CatalogoRfbId =
  | 'cclasstrib'
  | 'ncm'
  | 'nbs'
  | 'aliquota_cbs'
  | 'aliquota_ibs_uf'
  | 'aliquota_ibs_mun'
  | 'fundamentacao';

export const TITULOS_CATALOGO_RFB: Record<CatalogoRfbId, string> = {
  cclasstrib: 'cClassTrib (CBS/IBS)',
  ncm: 'NCM',
  nbs: 'NBS (serviços)',
  aliquota_cbs: 'Alíquota CBS',
  aliquota_ibs_uf: 'Alíquota IBS (UF)',
  aliquota_ibs_mun: 'Alíquota IBS (municipal)',
  fundamentacao: 'Fundamentações legais',
};

/** Dias sem sincronização a partir dos quais o catálogo vira alerta. */
export const DIAS_ALERTA_CATALOGO_RFB = 7;

/**
 * Prazo para catálogos de cadência semanal (o cron municipal de alíquotas roda
 * aos domingos): o próprio intervalo de 7 dias não dá margem para a rodada
 * terminar, então a carga da semana só vira atraso depois de 9 dias.
 */
export const DIAS_ALERTA_CATALOGO_RFB_SEMANAL = 9;

export type StatusFrescorRfb = 'ok' | 'atencao' | 'critico';

export interface EntradaFrescorCatalogoRfb {
  id: CatalogoRfbId;
  /** Carga mais recente da tabela. null = nunca sincronizado. */
  ultimaCarga: string | Date | null;
  /** Versão IT gravada na carga mais recente (catálogos versionados). */
  versaoIt?: string | null;
  /**
   * Explicação curta que substitui o detalhe calculado (ex.: escopo ainda sem
   * linha, mas com run recente do job).
   */
  nota?: string | null;
  /**
   * Prazo próprio do catálogo, em dias (padrão: `DIAS_ALERTA_CATALOGO_RFB`).
   * Use `DIAS_ALERTA_CATALOGO_RFB_SEMANAL` para cargas de cadência semanal.
   */
  limiteDias?: number;
  /**
   * A leitura do catálogo (ou do ledger de runs) falhou: o estado real é
   * desconhecido. Diferente de "nenhuma linha", que é um fato observado.
   */
  indisponivel?: boolean;
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
  /** A leitura falhou: o estado real é desconhecido. */
  indisponivel: boolean;
}

export interface SaudeCatalogosRfb {
  status: StatusFrescorRfb;
  catalogos: FrescorCatalogoRfb[];
  /** Catálogos com mais de `DIAS_ALERTA_CATALOGO_RFB` dias. */
  desatualizados: number;
  /** Catálogos sem nenhuma carga. */
  nuncaSincronizados: number;
  /** Catálogos cuja leitura falhou (estado desconhecido). */
  indisponiveis: number;
  resumo: string;
}

const MS_POR_DIA = 86_400_000;

/** Idade em ms da última carga; null quando não há data válida. */
function idadeMs(ultimaCarga: string | Date | null, hoje: Date): number | null {
  if (!ultimaCarga) return null;
  const data = ultimaCarga instanceof Date ? ultimaCarga : new Date(ultimaCarga);
  const ms = data.getTime();
  if (!Number.isFinite(ms)) return null;
  // Relógio adiantado não vira idade negativa.
  return Math.max(0, hoje.getTime() - ms);
}

function isoOuNulo(valor: string | Date | null): string | null {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isFinite(data.getTime()) ? data.toISOString() : null;
}

/**
 * Data de referência do frescor de um catálogo: a mais recente entre o carimbo
 * da linha mais nova do próprio catálogo e o último run bem-sucedido do job que
 * o alimenta.
 *
 * Nenhuma das duas basta sozinha: o carimbo do catálogo congela quando a carga
 * só reescreve chaves existentes (o `upsert` preserva `created_at` e
 * `carregado_em`), e um run pode ter terminado sem gravar linha nenhuma. Sem
 * evidência alguma devolve `null` (= nunca sincronizado).
 */
export function escolherUltimaCarga(
  carimboCatalogo: string | Date | null,
  ultimoRunOk: string | Date | null
): string | null {
  const doCatalogo = isoOuNulo(carimboCatalogo);
  const doRun = isoOuNulo(ultimoRunOk);
  if (!doCatalogo) return doRun;
  if (!doRun) return doCatalogo;
  // ISO em UTC tem largura fixa: a comparação lexicográfica é cronológica.
  return doCatalogo >= doRun ? doCatalogo : doRun;
}

/**
 * Entrada de um escopo que ainda não tem nenhuma linha.
 *
 * O run recente prova que o job passou por ali, mas não prova carga — então o
 * veredito vem da idade do run e a nota diz explicitamente que o catálogo está
 * vazio. Sem isso, "a RFB ainda não publicou" e "a carga parou de gravar"
 * ficavam idênticos no painel ("nunca sincronizado").
 */
export function entradaSemLinhas(
  id: CatalogoRfbId,
  ultimoRunOk: string | Date | null,
  versaoIt: string | null = null
): EntradaFrescorCatalogoRfb {
  return {
    id,
    ultimaCarga: ultimoRunOk,
    versaoIt,
    nota: ultimoRunOk ? 'Nenhuma linha carregada (RFB não publicou ou a carga não gravou)' : null,
  };
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
    const ms = idadeMs(entrada.ultimaCarga, base);
    const dias = ms === null ? null : Math.floor(ms / MS_POR_DIA);
    const limiteDias = entrada.limiteDias ?? DIAS_ALERTA_CATALOGO_RFB;
    // O limite é medido no relógio, não em dias cheios: 7 dias e 12 horas já é
    // atraso, mesmo que `diasSemSync` (truncado) ainda mostre 7.
    // Leitura indisponível não é "nunca sincronizado": a consulta falhou, o
    // dado pode estar em dia. Vira atenção, com o motivo no detalhe.
    const status: StatusFrescorRfb = entrada.indisponivel
      ? 'atencao'
      : ms === null
        ? 'critico'
        : ms > limiteDias * MS_POR_DIA
          ? 'atencao'
          : 'ok';
    const detalhe =
      entrada.nota ??
      (ms === null
        ? 'Nunca sincronizado'
        : status === 'atencao'
          ? `Sem sincronizar há mais de ${limiteDias} dias`
          : dias === 0
            ? 'Sincronizado hoje'
            : `Sem sincronizar há ${plural(dias ?? 0, 'dia', 'dias')}`);
    return {
      id: entrada.id,
      titulo: TITULOS_CATALOGO_RFB[entrada.id] ?? entrada.id,
      ultimaCarga: dias === null ? null : isoOuNulo(entrada.ultimaCarga),
      diasSemSync: dias,
      versaoIt: entrada.versaoIt ?? null,
      status,
      detalhe,
      indisponivel: entrada.indisponivel === true,
    };
  });

  const indisponiveis = catalogos.filter((c) => c.indisponivel).length;
  const desatualizados = catalogos.filter((c) => !c.indisponivel && c.status === 'atencao').length;
  const nuncaSincronizados = catalogos.filter((c) => c.status === 'critico').length;
  const status: StatusFrescorRfb =
    nuncaSincronizados > 0 ? 'critico' : desatualizados > 0 || indisponiveis > 0 ? 'atencao' : 'ok';

  const partes: string[] = [];
  if (indisponiveis > 0) {
    partes.push(plural(indisponiveis, 'catálogo sem leitura', 'catálogos sem leitura'));
  }
  if (nuncaSincronizados > 0) {
    partes.push(
      plural(nuncaSincronizados, 'catálogo nunca sincronizado', 'catálogos nunca sincronizados')
    );
  }
  if (desatualizados > 0) {
    partes.push(`${plural(desatualizados, 'catálogo', 'catálogos')} sem sincronizar além do prazo`);
  }
  const resumo =
    partes.length > 0 ? partes.join(' · ') : 'Catálogos RFB sincronizados dentro do prazo';

  return { status, catalogos, desatualizados, nuncaSincronizados, indisponiveis, resumo };
}

/**
 * Entrada de um catálogo que não pôde ser lido.
 *
 * A falta de carimbo sozinha não diz nada: a consulta pode ter falhado com o
 * catálogo em dia. Declarar "nunca sincronizado" nesse caso é um falso positivo
 * tão ruim quanto o silêncio, então o estado vira "sem leitura".
 */
export function entradaIndisponivel(id: CatalogoRfbId): EntradaFrescorCatalogoRfb {
  return {
    id,
    ultimaCarga: null,
    indisponivel: true,
    nota: 'Não foi possível consultar o catálogo',
  };
}

/** Linha do ledger de observabilidade (`edge_function_logs`). */
export interface LinhaLedgerRun {
  created_at: string;
  event: string | null;
  status_code: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Escopos que dividem o job de borda com outro escopo.
 *
 * Nesses casos o 2xx do job não prova nada sobre o escopo: o job de NCM/NBS
 * responde 200 gravando só o NCM, e a rotina diária de alíquotas responde 200
 * sem consultar município nenhum.
 */
const ESCOPOS_COM_JOB_COMPARTILHADO: ReadonlySet<CatalogoRfbId> = new Set<CatalogoRfbId>([
  'ncm',
  'nbs',
  'aliquota_ibs_mun',
]);

/** O frescor deste catálogo exige prova de que o próprio escopo foi consultado. */
export function exigeProvaDeEscopo(id: CatalogoRfbId): boolean {
  return ESCOPOS_COM_JOB_COMPARTILHADO.has(id);
}

function contagem(metadata: Record<string, unknown> | null | undefined, campo: string): number {
  const valor = metadata?.[campo];
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string') {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

/**
 * O `sync concluido` de um run prova que este escopo foi consultado?
 *
 * É o que separa "escopo ainda não publicado pela RFB" (consulta concluída, nada
 * gravado) de "escopo não executado" (o job nem passou por ali).
 */
export function runComprovaEscopo(
  id: CatalogoRfbId,
  metadata: Record<string, unknown> | null | undefined
): boolean {
  switch (id) {
    case 'ncm':
      return contagem(metadata, 'recebidos_ncm') > 0;
    case 'nbs':
      return contagem(metadata, 'recebidos_nbs') > 0;
    case 'aliquota_ibs_mun':
      return contagem(metadata, 'municipio_consultados') > 0;
    default:
      // Job de escopo único: o 2xx do próprio run já é a prova.
      return true;
  }
}

/**
 * Data do run mais recente que consultou o escopo pedido.
 *
 * `linhas` vem do ledger em ordem decrescente de `created_at`. Cada requisição
 * grava um `request_end` (com o status HTTP real) e o job grava um
 * `sync concluido` com o que consultou; os dois se encontram pelo `request_id`
 * do `metadata`. Assim o run só conta quando terminou bem **e** passou pelo
 * escopo.
 */
export function escolherRunComEscopo(
  id: CatalogoRfbId,
  linhas: readonly LinhaLedgerRun[]
): string | null {
  const porRequisicao = new Map<string, { ok: boolean; falhou: boolean }>();
  for (const linha of linhas) {
    if (linha.event !== 'request_end') continue;
    const req = String(linha.metadata?.request_id ?? '');
    if (!req) continue;
    const atual = porRequisicao.get(req) ?? { ok: false, falhou: false };
    if (
      typeof linha.status_code === 'number' &&
      linha.status_code >= 200 &&
      linha.status_code < 300
    ) {
      atual.ok = true;
    } else {
      atual.falhou = true;
    }
    porRequisicao.set(req, atual);
  }

  for (const linha of linhas) {
    if (linha.event !== 'sync concluido') continue;
    const req = String(linha.metadata?.request_id ?? '');
    if (!req) continue;
    const estado = porRequisicao.get(req);
    // Sem `request_end` a requisição ainda não terminou; com erro, o job falhou.
    if (!estado?.ok || estado.falhou) continue;
    if (!runComprovaEscopo(id, linha.metadata)) continue;
    return linha.created_at;
  }
  return null;
}
