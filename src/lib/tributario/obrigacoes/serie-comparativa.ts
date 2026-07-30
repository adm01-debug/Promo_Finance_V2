/**
 * Etapa Q — Série temporal comparativa (linhas sobrepostas) entre empresas.
 *
 * Motor 100% puro que converte N séries independentes de snapshots em um único
 * dataset "wide", alinhado por competência, no formato que o Recharts consome.
 *
 * Decisões de projeto:
 * - **Eixo unificado:** o eixo X é a união ordenada de todas as competências
 *   presentes. Isso evita o erro clássico de sobrepor linhas com eixos
 *   diferentes, que faria empresas com menos histórico parecerem deslocadas.
 * - **Lacunas são `null`, nunca `0`:** ausência de snapshot significa "não sei",
 *   não "zero de conformidade". O Recharts interrompe (ou interpola, conforme
 *   `connectNulls`) a linha sem inventar uma queda inexistente.
 * - **Chaves de série saneadas:** o `empresaId` vira uma chave estável
 *   (`e_<slug>`), pois `dataKey` do Recharts não aceita pontos/colchetes.
 *   Colisões são resolvidas com sufixo numérico determinístico.
 * - **Média do grupo:** calculada apenas sobre as empresas com dado naquela
 *   competência (média condicional), evitando distorção por lacunas.
 * - **Determinismo total:** sem relógio, sem aleatoriedade, sem I/O.
 */
import type { PontoHistorico } from './historico';
import type { SerieEmpresa } from './comparativo';

/** Metadados de uma linha do gráfico. */
export interface SerieGrafico {
  /** Chave usada em `dataKey` (saneada e única). */
  readonly chave: string;
  readonly empresaId: string;
  readonly nome: string;
  /** Cor via token HSL do design system (`hsl(var(--chart-N))`). */
  readonly cor: string;
  /** Quantidade de pontos efetivamente presentes na janela. */
  readonly pontos: number;
  /** Score mais recente disponível na janela (`null` se não houver). */
  readonly ultimoScore: number | null;
  /** Média dos scores presentes na janela (`null` se não houver). */
  readonly media: number | null;
}

/** Linha do dataset wide: uma competência + um valor por empresa. */
export interface LinhaGrafico {
  /** Competência `AAAA-MM`. */
  readonly competencia: string;
  /** Rótulo `MM/AAAA` para o eixo X. */
  readonly rotulo: string;
  /** Média do grupo naquela competência (`null` se ninguém tem dado). */
  readonly media: number | null;
  /** Score por chave de série; `null` representa lacuna. */
  readonly [chave: string]: string | number | null;
}

/** Resultado completo do comparativo temporal. */
export interface ComparativoTemporal {
  readonly dados: readonly LinhaGrafico[];
  readonly series: readonly SerieGrafico[];
  /** Competências do eixo, em ordem cronológica crescente. */
  readonly competencias: readonly string[];
  /** Menor score presente no dataset (para escala do eixo Y). */
  readonly minimo: number;
  /** Maior score presente no dataset. */
  readonly maximo: number;
  /** Domínio sugerido do eixo Y, com folga e limites em [0, 100]. */
  readonly dominioY: readonly [number, number];
  /** True quando não há nenhum ponto em nenhuma empresa. */
  readonly vazio: boolean;
}

/** Paleta baseada nos tokens de gráfico do design system (nunca hex fixo). */
const PALETA = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const;

const COMPETENCIA_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const round1 = (v: number) => Math.round(v * 10) / 10;

/** `AAAA-MM` → `MM/AAAA`. */
export function rotuloEixo(competencia: string): string {
  return COMPETENCIA_RE.test(competencia)
    ? `${competencia.slice(5)}/${competencia.slice(0, 4)}`
    : competencia;
}

/** Converte um id arbitrário em uma `dataKey` válida para o Recharts. */
export function chaveSerie(empresaId: string, usadas: Set<string>): string {
  const base = `e_${String(empresaId).replace(/[^a-zA-Z0-9_]/g, '_') || 'sem_id'}`;
  if (!usadas.has(base)) {
    usadas.add(base);
    return base;
  }
  let i = 2;
  while (usadas.has(`${base}_${i}`)) i += 1;
  const chave = `${base}_${i}`;
  usadas.add(chave);
  return chave;
}

/** Score válido (0–100 finito) ou `null`. */
function scoreValido(valor: unknown): number | null {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n)) return null;
  return round1(Math.min(100, Math.max(0, n)));
}

/**
 * Monta o dataset de linhas sobrepostas.
 *
 * @param series séries por empresa (ordem de entrada define a cor)
 * @param ultimasN limita o eixo às N competências mais recentes (default 12)
 */
export function montarComparativoTemporal(
  series: readonly SerieEmpresa[],
  ultimasN = 12,
): ComparativoTemporal {
  const janela = Math.max(1, Math.trunc(Number.isFinite(ultimasN) ? ultimasN : 12));

  // 1) Normaliza cada série: dedupe por competência (último vence) e valida.
  const usadas = new Set<string>();
  const normalizadas = (series ?? []).map((serie, indice) => {
    const porCompetencia = new Map<string, number>();
    for (const ponto of serie.pontos ?? []) {
      if (!COMPETENCIA_RE.test(ponto?.competencia ?? '')) continue;
      const score = scoreValido((ponto as PontoHistorico).score);
      if (score === null) continue;
      porCompetencia.set(ponto.competencia, score);
    }
    return {
      chave: chaveSerie(serie.empresaId, usadas),
      empresaId: serie.empresaId,
      nome: serie.nome?.trim() || 'Empresa sem nome',
      cor: PALETA[indice % PALETA.length],
      porCompetencia,
    };
  });

  // 2) Eixo X: união das competências, cronológica, limitada às N mais recentes.
  const todas = new Set<string>();
  for (const s of normalizadas) for (const c of s.porCompetencia.keys()) todas.add(c);
  const competencias = [...todas].sort().slice(-janela);

  // 3) Dataset wide + estatísticas por série.
  const dados: LinhaGrafico[] = competencias.map((competencia) => {
    const linha: Record<string, string | number | null> = {
      competencia,
      rotulo: rotuloEixo(competencia),
      media: null,
    };
    let soma = 0;
    let n = 0;
    for (const s of normalizadas) {
      const valor = s.porCompetencia.get(competencia);
      const presente = valor === undefined ? null : valor;
      linha[s.chave] = presente;
      if (presente !== null) {
        soma += presente;
        n += 1;
      }
    }
    linha.media = n > 0 ? round1(soma / n) : null;
    return linha as LinhaGrafico;
  });

  const seriesGrafico: SerieGrafico[] = normalizadas.map((s) => {
    const presentes = competencias
      .map((c) => s.porCompetencia.get(c))
      .filter((v): v is number => v !== undefined);
    const ultimoIndice = [...competencias].reverse().find((c) => s.porCompetencia.has(c));
    return {
      chave: s.chave,
      empresaId: s.empresaId,
      nome: s.nome,
      cor: s.cor,
      pontos: presentes.length,
      ultimoScore: ultimoIndice ? (s.porCompetencia.get(ultimoIndice) ?? null) : null,
      media:
        presentes.length > 0
          ? round1(presentes.reduce((a, b) => a + b, 0) / presentes.length)
          : null,
    };
  });

  const valores = seriesGrafico.flatMap((s) =>
    competencias
      .map((c) => normalizadas.find((n) => n.chave === s.chave)?.porCompetencia.get(c))
      .filter((v): v is number => v !== undefined),
  );

  const minimo = valores.length > 0 ? Math.min(...valores) : 0;
  const maximo = valores.length > 0 ? Math.max(...valores) : 100;
  // Folga de 5 pontos, sempre dentro de [0, 100] e com amplitude mínima visível.
  const piso = Math.max(0, Math.floor((minimo - 5) / 5) * 5);
  const teto = Math.min(100, Math.ceil((maximo + 5) / 5) * 5);

  return {
    dados,
    series: seriesGrafico,
    competencias,
    minimo,
    maximo,
    dominioY: [piso, teto > piso ? teto : Math.min(100, piso + 10)],
    vazio: valores.length === 0,
  };
}

/** Exporta o dataset wide em CSV (`;` + BOM, compatível com Excel pt-BR). */
export function exportarComparativoTemporalCsv(comparativo: ComparativoTemporal): string {
  const cabecalho = ['Competência', ...comparativo.series.map((s) => s.nome), 'Média do grupo'];
  const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const linhas = comparativo.dados.map((linha) => {
    const celulas = comparativo.series.map((s) => {
      const valor = linha[s.chave];
      return typeof valor === 'number' ? valor.toFixed(1).replace('.', ',') : '';
    });
    const media = typeof linha.media === 'number' ? linha.media.toFixed(1).replace('.', ',') : '';
    return [linha.rotulo, ...celulas, media].map(escapar).join(';');
  });
  return `\uFEFF${[cabecalho.map(escapar).join(';'), ...linhas].join('\n')}`;
}
