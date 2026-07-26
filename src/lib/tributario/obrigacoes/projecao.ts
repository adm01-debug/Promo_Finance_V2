/**
 * Etapa S — Projeção do Score de Conformidade Fiscal.
 *
 * Regressão linear simples (mínimos quadrados ordinários) sobre a série
 * histórica de score, com banda de previsão baseada no erro-padrão residual.
 *
 * Decisões de modelagem (explícitas, para auditoria):
 * - O eixo X é o índice cronológico das competências **presentes na série**,
 *   não o calendário absoluto. Séries com lacunas são tratadas como
 *   observações consecutivas; a lacuna é reportada em `lacunas` para que a UI
 *   possa sinalizar a menor confiabilidade em vez de inventar dados.
 * - Score é limitado a [0, 100]: qualquer projeção é truncada nesse intervalo
 *   (a reta pode extrapolar, o indicador não).
 * - Com n < 3 não há graus de liberdade suficientes para estimar dispersão;
 *   nesse caso a projeção é marcada como `confiavel: false` e a banda usa a
 *   amplitude observada como salvaguarda conservadora.
 * - Todas as funções são puras: nenhum I/O, nenhuma leitura de relógio.
 */
import type { PontoHistorico } from './historico';
import { classificarConformidade, type NivelConformidade } from './conformidade';

const round1 = (v: number) => Math.round(v * 10) / 10;
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Coeficientes e qualidade do ajuste da reta de tendência. */
export interface AjusteLinear {
  /** Intercepto da reta (score projetado no índice 0). */
  readonly intercepto: number;
  /** Inclinação em pontos de score por competência. */
  readonly inclinacao: number;
  /** Coeficiente de determinação R², em [0, 1]. */
  readonly r2: number;
  /** Erro-padrão residual (0 quando não estimável). */
  readonly erroPadrao: number;
  /** Quantidade de observações usadas. */
  readonly n: number;
}

/** Um ponto projetado para uma competência futura. */
export interface PontoProjetado {
  readonly competencia: string;
  /** Score estimado, truncado em [0, 100]. */
  readonly score: number;
  /** Limite inferior da banda de previsão, em [0, 100]. */
  readonly minimo: number;
  /** Limite superior da banda de previsão, em [0, 100]. */
  readonly maximo: number;
  readonly nivel: NivelConformidade;
}

/** Classificação do risco projetado no horizonte analisado. */
export type RiscoProjetado = 'critico' | 'atencao' | 'estavel' | 'melhora';

/** Resultado completo da projeção. */
export interface ResultadoProjecao {
  readonly ajuste: AjusteLinear;
  readonly pontos: readonly PontoProjetado[];
  /** Score da última competência observada (100 quando não há série). */
  readonly scoreAtual: number;
  /** Score projetado no fim do horizonte (igual ao atual quando sem projeção). */
  readonly scoreFinal: number;
  /** `scoreFinal - scoreAtual`, 1 casa decimal. */
  readonly variacao: number;
  readonly risco: RiscoProjetado;
  /** Competência em que a projeção cruza `limiarAlerta` para baixo, se houver. */
  readonly competenciaCritica: string | null;
  /** `false` quando n < MIN_OBSERVACOES ou a série não tem variação de X. */
  readonly confiavel: boolean;
  /** Nº de competências ausentes entre a primeira e a última observada. */
  readonly lacunas: number;
  /** Resumo textual determinístico, pronto para leitores de tela. */
  readonly resumo: string;
}

/** Mínimo de observações para considerar a projeção confiável. */
export const MIN_OBSERVACOES = 3;
/** Horizonte padrão de projeção, em competências. */
export const HORIZONTE_PADRAO = 3;
/** Score abaixo do qual a projeção é considerada crítica. */
export const LIMIAR_ALERTA = 70;
/** Variação (em pontos) a partir da qual a tendência deixa de ser estável. */
export const LIMIAR_VARIACAO = 2;
/** Multiplicador da banda de previsão (~95% sob normalidade). */
export const FATOR_BANDA = 1.96;

const COMPETENCIA_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Soma `n` meses a uma competência `AAAA-MM` (aceita n negativo). */
export function somarCompetencia(competencia: string, n: number): string {
  if (!COMPETENCIA_RE.test(competencia)) return competencia;
  const ano = Number(competencia.slice(0, 4));
  const mes = Number(competencia.slice(5, 7));
  const total = ano * 12 + (mes - 1) + Math.trunc(n);
  const novoAno = Math.floor(total / 12);
  const novoMes = total - novoAno * 12 + 1;
  return `${String(novoAno).padStart(4, '0')}-${String(novoMes).padStart(2, '0')}`;
}

/** Distância em meses entre duas competências (`b - a`). */
export function distanciaCompetencias(a: string, b: string): number {
  if (!COMPETENCIA_RE.test(a) || !COMPETENCIA_RE.test(b)) return 0;
  const va = Number(a.slice(0, 4)) * 12 + Number(a.slice(5, 7));
  const vb = Number(b.slice(0, 4)) * 12 + Number(b.slice(5, 7));
  return vb - va;
}

/**
 * Ajusta uma reta por mínimos quadrados sobre os scores da série.
 * Índices são 0..n-1 na ordem cronológica recebida.
 */
export function ajustarTendencia(pontos: readonly PontoHistorico[]): AjusteLinear {
  const n = pontos.length;
  if (n === 0) {
    return { intercepto: 100, inclinacao: 0, r2: 0, erroPadrao: 0, n: 0 };
  }
  if (n === 1) {
    return { intercepto: pontos[0].score, inclinacao: 0, r2: 0, erroPadrao: 0, n: 1 };
  }

  const mediaX = (n - 1) / 2;
  let somaY = 0;
  for (const p of pontos) somaY += p.score;
  const mediaY = somaY / n;

  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - mediaX;
    sxx += dx * dx;
    sxy += dx * (pontos[i].score - mediaY);
  }

  const inclinacao = sxx === 0 ? 0 : sxy / sxx;
  const intercepto = mediaY - inclinacao * mediaX;

  let sqRes = 0;
  let sqTot = 0;
  for (let i = 0; i < n; i += 1) {
    const previsto = intercepto + inclinacao * i;
    const res = pontos[i].score - previsto;
    sqRes += res * res;
    const dy = pontos[i].score - mediaY;
    sqTot += dy * dy;
  }

  const r2 = sqTot === 0 ? (sqRes === 0 ? 1 : 0) : clamp(1 - sqRes / sqTot, 0, 1);
  const gl = n - 2;
  const erroPadrao = gl > 0 ? Math.sqrt(Math.max(0, sqRes) / gl) : 0;

  return {
    intercepto: round3(intercepto),
    inclinacao: round3(inclinacao),
    r2: round3(r2),
    erroPadrao: round3(erroPadrao),
    n,
  };
}

/** Conta competências ausentes entre a primeira e a última da série. */
export function contarLacunas(pontos: readonly PontoHistorico[]): number {
  if (pontos.length < 2) return 0;
  const span = distanciaCompetencias(pontos[0].competencia, pontos[pontos.length - 1].competencia);
  const esperado = span + 1;
  return Math.max(0, esperado - pontos.length);
}

function classificarRisco(scoreFinal: number, variacao: number): RiscoProjetado {
  if (scoreFinal < LIMIAR_ALERTA) return 'critico';
  if (variacao <= -LIMIAR_VARIACAO) return 'atencao';
  if (variacao >= LIMIAR_VARIACAO) return 'melhora';
  return 'estavel';
}

/**
 * Projeta o score para as próximas `horizonte` competências.
 *
 * @param pontos série histórica ordenada cronologicamente
 * @param horizonte nº de competências futuras (1..12); default 3
 */
export function projetarConformidade(
  pontos: readonly PontoHistorico[],
  horizonte: number = HORIZONTE_PADRAO
): ResultadoProjecao {
  const h = clamp(Math.trunc(Number.isFinite(horizonte) ? horizonte : HORIZONTE_PADRAO), 1, 12);
  const ajuste = ajustarTendencia(pontos);

  if (pontos.length === 0) {
    return {
      ajuste,
      pontos: [],
      scoreAtual: 100,
      scoreFinal: 100,
      variacao: 0,
      risco: 'estavel',
      competenciaCritica: null,
      confiavel: false,
      lacunas: 0,
      resumo: 'Sem histórico suficiente para projetar o score de conformidade.',
    };
  }

  const ultimo = pontos[pontos.length - 1];
  const scoreAtual = ultimo.score;
  const confiavel = pontos.length >= MIN_OBSERVACOES;

  // Salvaguarda: sem graus de liberdade, usa a amplitude observada como banda.
  let amplitude = 0;
  for (const p of pontos) amplitude = Math.max(amplitude, Math.abs(p.score - scoreAtual));
  const margemBase = ajuste.erroPadrao > 0 ? ajuste.erroPadrao * FATOR_BANDA : amplitude;

  const projetados: PontoProjetado[] = [];
  for (let k = 1; k <= h; k += 1) {
    const indice = pontos.length - 1 + k;
    const bruto = ajuste.intercepto + ajuste.inclinacao * indice;
    const score = round1(clamp(bruto, 0, 100));
    // A incerteza cresce com a distância do horizonte (√k, forma padrão).
    const margem = margemBase * Math.sqrt(k);
    projetados.push({
      competencia: somarCompetencia(ultimo.competencia, k),
      score,
      minimo: round1(clamp(bruto - margem, 0, 100)),
      maximo: round1(clamp(bruto + margem, 0, 100)),
      nivel: classificarConformidade(score),
    });
  }

  const scoreFinal = projetados.length > 0 ? projetados[projetados.length - 1].score : scoreAtual;
  const variacao = round1(scoreFinal - scoreAtual);
  const risco = classificarRisco(scoreFinal, variacao);
  const critico = projetados.find((p) => p.score < LIMIAR_ALERTA) ?? null;

  const resumo = confiavel
    ? `Projeção para ${h} ${h === 1 ? 'competência' : 'competências'}: score de ${scoreAtual.toFixed(1)} para ${scoreFinal.toFixed(1)} (${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)} pontos).`
    : `Projeção preliminar com ${pontos.length} ${pontos.length === 1 ? 'competência' : 'competências'} de histórico: confiabilidade limitada.`;

  return {
    ajuste,
    pontos: projetados,
    scoreAtual,
    scoreFinal,
    variacao,
    risco,
    competenciaCritica: critico ? critico.competencia : null,
    confiavel,
    lacunas: contarLacunas(pontos),
    resumo,
  };
}

/** Rótulos legíveis do risco projetado. */
export const RISCO_PROJETADO_LABEL: Record<RiscoProjetado, string> = {
  critico: 'Risco crítico',
  atencao: 'Atenção',
  estavel: 'Estável',
  melhora: 'Em melhora',
};

/**
 * Série unificada (observado + projetado) pronta para gráficos.
 * Chaves distintas evitam que a linha projetada seja lida como histórico real.
 */
export interface PontoSerieProjecao {
  readonly competencia: string;
  readonly observado: number | null;
  readonly projetado: number | null;
  readonly minimo: number | null;
  readonly banda: number | null;
}

/** Monta a série contínua, conectando o último observado ao primeiro projetado. */
export function montarSerieProjecao(
  historico: readonly PontoHistorico[],
  projecao: ResultadoProjecao
): readonly PontoSerieProjecao[] {
  const serie: PontoSerieProjecao[] = historico.map((p, i) => ({
    competencia: p.competencia,
    observado: p.score,
    // O último observado ancora a linha projetada, evitando um salto visual.
    projetado: i === historico.length - 1 ? p.score : null,
    minimo: i === historico.length - 1 ? p.score : null,
    banda: i === historico.length - 1 ? 0 : null,
  }));

  for (const p of projecao.pontos) {
    serie.push({
      competencia: p.competencia,
      observado: null,
      projetado: p.score,
      minimo: p.minimo,
      banda: round1(Math.max(0, p.maximo - p.minimo)),
    });
  }

  return serie;
}
