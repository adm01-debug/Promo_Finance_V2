/**
 * Etapa O — Comparativo multiempresa do Score de Conformidade Fiscal.
 *
 * Funções puras (sem I/O, sem leitura de relógio) que consolidam as séries
 * históricas de várias empresas do grupo em um ranking auditável.
 *
 * Premissas explícitas (documentadas para evitar interpretações divergentes):
 * - Cada empresa tem sua própria série; competências podem não coincidir.
 * - A "competência de referência" é, por padrão, a MAIOR competência presente
 *   em qualquer série. Uma empresa sem ponto exatamente nessa competência é
 *   avaliada pelo último ponto <= referência (defasagem explicitada em
 *   `competenciaAvaliada` e `defasada`). Empresa sem nenhum ponto até a
 *   referência entra no ranking como "sem dados" e NÃO polui as médias.
 * - Ordenação: score desc → multa acumulada asc → nome (pt-BR, case-insensitive).
 *   Empates de score compartilham a mesma `posicao` (ranking padrão "1,1,3").
 * - Nenhuma regra de conformidade é reimplementada aqui: os pontos já vêm do
 *   motor determinístico (`construirHistorico` / snapshots persistidos).
 */
import { classificarConformidade, type NivelConformidade } from './conformidade';
import {
  analisarTendencia,
  competenciaValida,
  direcaoDe,
  type AnaliseTendencia,
  type DirecaoTendencia,
  type PontoHistorico,
} from './historico';

/** Série de uma empresa pronta para o comparativo. */
export interface SerieEmpresa {
  readonly empresaId: string;
  readonly nome: string;
  /** Pontos em qualquer ordem; o motor normaliza e ordena. */
  readonly pontos: readonly PontoHistorico[];
}

/** Linha do ranking comparativo. */
export interface LinhaComparativo {
  readonly empresaId: string;
  readonly nome: string;
  /** Posição no ranking (1-based). Empates compartilham a posição. */
  readonly posicao: number;
  /** `true` quando a empresa não possui nenhum ponto até a referência. */
  readonly semDados: boolean;
  /** Competência efetivamente usada para o score (pode ser anterior à referência). */
  readonly competenciaAvaliada: string | null;
  /** `true` quando `competenciaAvaliada` < competência de referência. */
  readonly defasada: boolean;
  /** Score da competência avaliada (0 quando sem dados). */
  readonly score: number;
  readonly nivel: NivelConformidade;
  /** Score da competência imediatamente anterior à avaliada, quando existir. */
  readonly scoreAnterior: number | null;
  /** `score - scoreAnterior` (0 quando não há anterior), 1 casa. */
  readonly delta: number;
  readonly direcao: DirecaoTendencia;
  /** Média simples de todos os pontos até a referência, 1 casa. */
  readonly media: number;
  /** Soma das multas registradas até a referência. */
  readonly multaAcumulada: number;
  readonly obrigacoesVencidas: number;
  readonly totalObrigacoes: number;
  /** Análise completa da série truncada na referência (para sparklines). */
  readonly tendencia: AnaliseTendencia;
}

/** Consolidação do grupo. */
export interface ResumoComparativo {
  /** Competência usada como corte. `null` quando nenhuma série tem pontos. */
  readonly competenciaReferencia: string | null;
  readonly empresas: number;
  /** Empresas com pelo menos um ponto até a referência. */
  readonly avaliadas: number;
  /** Média simples dos scores das empresas avaliadas, 1 casa. */
  readonly scoreMedio: number;
  /** Média ponderada pelo total de obrigações da competência avaliada, 1 casa. */
  readonly scorePonderado: number;
  readonly nivelMedio: NivelConformidade;
  readonly melhor: LinhaComparativo | null;
  readonly pior: LinhaComparativo | null;
  /** Diferença entre melhor e pior score entre as avaliadas, 1 casa. */
  readonly amplitude: number;
  readonly multaTotal: number;
  readonly vencidasTotal: number;
  /** Quantidade de empresas por nível (somente avaliadas). */
  readonly distribuicao: Readonly<Record<NivelConformidade, number>>;
  /** Empresas cujo último ponto é anterior à competência de referência. */
  readonly defasadas: number;
}

/** Resultado completo do comparativo. */
export interface ResultadoComparativo {
  readonly linhas: readonly LinhaComparativo[];
  readonly resumo: ResumoComparativo;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

const NIVEL_ZERO: Readonly<Record<NivelConformidade, number>> = Object.freeze({
  critico: 0,
  atencao: 0,
  bom: 0,
  excelente: 0,
});

/** Ordena e remove competências inválidas/duplicadas (mantém a última ocorrência). */
function normalizarPontos(pontos: readonly PontoHistorico[]): readonly PontoHistorico[] {
  const porCompetencia = new Map<string, PontoHistorico>();
  for (const ponto of pontos) {
    if (!competenciaValida(ponto.competencia)) continue;
    porCompetencia.set(ponto.competencia, ponto);
  }
  return [...porCompetencia.values()].sort((a, b) =>
    a.competencia < b.competencia ? -1 : a.competencia > b.competencia ? 1 : 0
  );
}

/**
 * Determina a competência de referência: a maior competência válida presente
 * em qualquer série. Retorna `null` quando não há nenhum ponto válido.
 */
export function competenciaReferenciaDe(series: readonly SerieEmpresa[]): string | null {
  let maior: string | null = null;
  for (const serie of series) {
    for (const ponto of serie.pontos) {
      if (!competenciaValida(ponto.competencia)) continue;
      if (maior === null || ponto.competencia > maior) maior = ponto.competencia;
    }
  }
  return maior;
}

const comparaNome = (a: string, b: string) =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/**
 * Compara as séries de conformidade de várias empresas.
 *
 * @param series uma entrada por empresa (duplicatas de `empresaId` são ignoradas)
 * @param competenciaReferencia corte opcional (`AAAA-MM`); inválida ⇒ ignorada
 */
export function compararConformidade(
  series: readonly SerieEmpresa[],
  competenciaReferencia?: string
): ResultadoComparativo {
  // Deduplica empresas preservando a primeira ocorrência (fonte única de verdade).
  const unicas: SerieEmpresa[] = [];
  const vistas = new Set<string>();
  for (const serie of series) {
    if (!serie || typeof serie.empresaId !== 'string' || serie.empresaId === '') continue;
    if (vistas.has(serie.empresaId)) continue;
    vistas.add(serie.empresaId);
    unicas.push(serie);
  }

  const refInformada =
    competenciaReferencia && competenciaValida(competenciaReferencia)
      ? competenciaReferencia
      : null;
  const referencia = refInformada ?? competenciaReferenciaDe(unicas);

  const parciais = unicas.map((serie) => {
    const pontos = normalizarPontos(serie.pontos);
    const ateReferencia = referencia
      ? pontos.filter((p) => p.competencia <= referencia)
      : [];
    const atual = ateReferencia.at(-1) ?? null;
    const anterior = ateReferencia.length > 1 ? ateReferencia[ateReferencia.length - 2] : null;
    const tendencia = analisarTendencia(ateReferencia);
    const score = atual ? atual.score : 0;
    const scoreAnterior = anterior ? anterior.score : null;
    const delta = scoreAnterior === null ? 0 : round1(score - scoreAnterior);

    return {
      empresaId: serie.empresaId,
      nome: serie.nome?.trim() || 'Empresa sem nome',
      semDados: atual === null,
      competenciaAvaliada: atual?.competencia ?? null,
      defasada: atual !== null && referencia !== null && atual.competencia < referencia,
      score,
      nivel: atual ? atual.nivel : classificarConformidade(0),
      scoreAnterior,
      delta,
      direcao: scoreAnterior === null ? ('estavel' as DirecaoTendencia) : direcaoDe(delta),
      media: tendencia.media,
      multaAcumulada: tendencia.multaAcumulada,
      obrigacoesVencidas: atual?.vencidasPendentes ?? 0,
      totalObrigacoes: atual?.total ?? 0,
      tendencia,
    };
  });

  // Ordenação determinística: com dados primeiro, score desc, multa asc, nome.
  const ordenadas = [...parciais].sort((a, b) => {
    if (a.semDados !== b.semDados) return a.semDados ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    if (a.multaAcumulada !== b.multaAcumulada) return a.multaAcumulada - b.multaAcumulada;
    return comparaNome(a.nome, b.nome);
  });

  // Ranking padrão de competição: empates (mesmo score, ambos com dados)
  // compartilham a posição; a próxima posição salta.
  const linhas: LinhaComparativo[] = [];
  let posicaoAtual = 0;
  ordenadas.forEach((linha, indice) => {
    const anterior = indice > 0 ? ordenadas[indice - 1] : null;
    const empatou =
      anterior !== null &&
      anterior.semDados === linha.semDados &&
      anterior.score === linha.score;
    posicaoAtual = empatou ? posicaoAtual : indice + 1;
    linhas.push({ ...linha, posicao: posicaoAtual });
  });

  const avaliadas = linhas.filter((l) => !l.semDados);
  const somaScores = avaliadas.reduce((acc, l) => acc + l.score, 0);
  const pesoTotal = avaliadas.reduce((acc, l) => acc + l.totalObrigacoes, 0);
  const somaPonderada = avaliadas.reduce((acc, l) => acc + l.score * l.totalObrigacoes, 0);
  const scoreMedio = avaliadas.length > 0 ? round1(somaScores / avaliadas.length) : 0;
  const scorePonderado = pesoTotal > 0 ? round1(somaPonderada / pesoTotal) : scoreMedio;

  const distribuicao = { ...NIVEL_ZERO } as Record<NivelConformidade, number>;
  for (const linha of avaliadas) distribuicao[linha.nivel] += 1;

  const melhor = avaliadas[0] ?? null;
  const pior = avaliadas.length > 0 ? avaliadas[avaliadas.length - 1] : null;

  return {
    linhas,
    resumo: {
      competenciaReferencia: referencia,
      empresas: linhas.length,
      avaliadas: avaliadas.length,
      scoreMedio,
      scorePonderado,
      nivelMedio: classificarConformidade(scoreMedio),
      melhor,
      pior,
      amplitude: melhor && pior ? round1(melhor.score - pior.score) : 0,
      multaTotal: Math.round(avaliadas.reduce((acc, l) => acc + l.multaAcumulada, 0) * 100) / 100,
      vencidasTotal: avaliadas.reduce((acc, l) => acc + l.obrigacoesVencidas, 0),
      distribuicao,
      defasadas: linhas.filter((l) => l.defasada).length,
    },
  };
}

/** Exporta o comparativo como CSV (separador `;`, decimal pt-BR). */
export function exportarComparativoCsv(resultado: ResultadoComparativo): string {
  const cabecalho = [
    'Posicao',
    'Empresa',
    'Competencia',
    'Score',
    'Nivel',
    'Variacao',
    'Media',
    'Vencidas',
    'Total obrigacoes',
    'Multa acumulada',
    'Situacao',
  ].join(';');

  const dec = (v: number) => v.toFixed(2).replace('.', ',');

  const linhas = resultado.linhas.map((l) =>
    [
      l.posicao,
      l.nome.replace(/;/g, ','),
      l.competenciaAvaliada ?? '-',
      dec(l.score),
      l.nivel,
      dec(l.delta),
      dec(l.media),
      l.obrigacoesVencidas,
      l.totalObrigacoes,
      dec(l.multaAcumulada),
      l.semDados ? 'sem dados' : l.defasada ? 'defasada' : 'atualizada',
    ].join(';')
  );

  return [cabecalho, ...linhas].join('\n');
}
