/**
 * Etapa K — Histórico e tendência do Score de Conformidade Fiscal.
 *
 * Funções puras (sem I/O e sem leitura de relógio) que decompõem o calendário
 * de obrigações por competência e produzem uma série temporal auditável do
 * score, além de estatísticas de tendência usadas pela UI e pelos snapshots
 * persistidos em `public.conformidade_snapshots`.
 *
 * Premissas explícitas:
 * - A "situação" de cada item já incorpora o `hoje` usado na materialização do
 *   calendário; este módulo nunca reavalia datas, apenas agrega.
 * - Competências sem itens não entram na série (não existe score de um mês em
 *   que a empresa não tem obrigação alguma).
 * - A média móvel usa janela fechada à esquerda (inclui a competência atual).
 */
import type { ItemCalendario } from './types';
import {
  calcularConformidade,
  classificarConformidade,
  type NivelConformidade,
  type RegistroEntrega,
  type ResultadoConformidade,
} from './conformidade';

/** Ponto da série temporal de conformidade. */
export interface PontoHistorico {
  /** Competência no formato `AAAA-MM`. */
  readonly competencia: string;
  /** Score 0–100 com uma casa decimal. */
  readonly score: number;
  readonly nivel: NivelConformidade;
  readonly total: number;
  readonly entregues: number;
  readonly vencidasPendentes: number;
  readonly entreguesComAtraso: number;
  readonly pontualidade: number;
  readonly multaRegistrada: number;
}

/** Direção da tendência entre o início e o fim da série. */
export type DirecaoTendencia = 'alta' | 'estavel' | 'queda';

/** Estatísticas agregadas da série temporal. */
export interface AnaliseTendencia {
  readonly pontos: readonly PontoHistorico[];
  /** Score da competência mais recente (0 quando a série é vazia → 100). */
  readonly scoreAtual: number;
  /** Score da competência imediatamente anterior, quando existir. */
  readonly scoreAnterior: number | null;
  /** `scoreAtual - scoreAnterior`, 1 casa; `0` quando não há anterior. */
  readonly delta: number;
  readonly direcao: DirecaoTendencia;
  /** Média aritmética simples de todos os pontos, 1 casa. */
  readonly media: number;
  readonly melhor: PontoHistorico | null;
  readonly pior: PontoHistorico | null;
  /** Nº de competências consecutivas (a partir do fim) com score = 100. */
  readonly sequenciaPerfeita: number;
  /** Soma das multas registradas em toda a série. */
  readonly multaAcumulada: number;
}

/** Tolerância (em pontos) abaixo da qual a variação é considerada estável. */
export const LIMIAR_ESTAVEL = 1;

const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

const COMPETENCIA_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Valida o formato `AAAA-MM` de uma competência. */
export function competenciaValida(valor: string): boolean {
  return COMPETENCIA_RE.test(valor);
}

/**
 * Constrói a série histórica de conformidade agrupando os itens por competência.
 *
 * @param itens itens materializados por `gerarCalendario`
 * @param registros entregas persistidas (chave obrigação+competência)
 * @returns pontos ordenados cronologicamente (competência ascendente)
 */
export function construirHistorico(
  itens: readonly ItemCalendario[],
  registros: readonly RegistroEntrega[] = []
): readonly PontoHistorico[] {
  const grupos = new Map<string, ItemCalendario[]>();

  for (const item of itens) {
    if (!competenciaValida(item.competencia)) continue;
    const lista = grupos.get(item.competencia);
    if (lista) lista.push(item);
    else grupos.set(item.competencia, [item]);
  }

  return [...grupos.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([competencia, lista]) => {
      const r: ResultadoConformidade = calcularConformidade(lista, registros);
      return {
        competencia,
        score: r.score,
        nivel: r.nivel,
        total: r.total,
        entregues: r.entregues + r.dispensadas,
        vencidasPendentes: r.vencidasPendentes,
        entreguesComAtraso: r.entreguesComAtraso,
        pontualidade: r.pontualidade,
        multaRegistrada: r.multaRegistrada,
      } satisfies PontoHistorico;
    });
}

/**
 * Média móvel do score com janela `janela` (inclui o ponto corrente).
 * Pontos iniciais usam a janela parcial disponível.
 */
export function mediaMovel(
  pontos: readonly PontoHistorico[],
  janela = 3
): readonly { competencia: string; score: number; media: number }[] {
  const n = Math.max(1, Math.floor(janela));
  return pontos.map((p, i) => {
    const inicio = Math.max(0, i - n + 1);
    const fatia = pontos.slice(inicio, i + 1);
    const soma = fatia.reduce((acc, x) => acc + x.score, 0);
    return { competencia: p.competencia, score: p.score, media: round1(soma / fatia.length) };
  });
}

/** Classifica a variação entre dois scores respeitando `LIMIAR_ESTAVEL`. */
export function direcaoDe(delta: number): DirecaoTendencia {
  if (delta > LIMIAR_ESTAVEL) return 'alta';
  if (delta < -LIMIAR_ESTAVEL) return 'queda';
  return 'estavel';
}

/** Consolida a série em estatísticas de tendência prontas para exibição. */
export function analisarTendencia(pontos: readonly PontoHistorico[]): AnaliseTendencia {
  if (pontos.length === 0) {
    return {
      pontos: [],
      scoreAtual: 100,
      scoreAnterior: null,
      delta: 0,
      direcao: 'estavel',
      media: 100,
      melhor: null,
      pior: null,
      sequenciaPerfeita: 0,
      multaAcumulada: 0,
    };
  }

  const atual = pontos[pontos.length - 1];
  const anterior = pontos.length > 1 ? pontos[pontos.length - 2] : null;
  const delta = anterior ? round1(atual.score - anterior.score) : 0;

  let melhor = pontos[0];
  let pior = pontos[0];
  let soma = 0;
  let multaAcumulada = 0;

  for (const p of pontos) {
    soma += p.score;
    multaAcumulada += p.multaRegistrada;
    if (p.score > melhor.score) melhor = p;
    if (p.score < pior.score) pior = p;
  }

  let sequenciaPerfeita = 0;
  for (let i = pontos.length - 1; i >= 0; i -= 1) {
    if (pontos[i].score === 100) sequenciaPerfeita += 1;
    else break;
  }

  return {
    pontos,
    scoreAtual: atual.score,
    scoreAnterior: anterior ? anterior.score : null,
    delta,
    direcao: direcaoDe(delta),
    media: round1(soma / pontos.length),
    melhor,
    pior,
    sequenciaPerfeita,
    multaAcumulada: round2(multaAcumulada),
  };
}

/** Payload de snapshot persistível (espelha `conformidade_snapshots`). */
export interface SnapshotConformidade {
  readonly competencia: string;
  readonly score: number;
  readonly nivel: NivelConformidade;
  readonly total_obrigacoes: number;
  readonly entregues: number;
  readonly vencidas_pendentes: number;
  readonly entregues_com_atraso: number;
  readonly pontualidade: number;
  readonly multa_registrada: number;
}

/** Converte um ponto da série no payload persistido, com nível recalculado. */
export function paraSnapshot(ponto: PontoHistorico): SnapshotConformidade {
  return {
    competencia: ponto.competencia,
    score: ponto.score,
    nivel: classificarConformidade(ponto.score),
    total_obrigacoes: ponto.total,
    entregues: ponto.entregues,
    vencidas_pendentes: ponto.vencidasPendentes,
    entregues_com_atraso: ponto.entreguesComAtraso,
    pontualidade: ponto.pontualidade,
    multa_registrada: ponto.multaRegistrada,
  };
}
