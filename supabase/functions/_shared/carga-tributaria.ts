/**
 * Helpers de carga tributária compartilhados entre o benchmark setorial e o
 * detector de anomalias. Estão aqui, e não dentro de cada `index.ts`, porque
 * os dois arquivos chamam `serve` no topo e não podem ser importados por teste.
 */

/** Linha de faturamento_mensal usada no cálculo da carga dos últimos meses. */
export interface LinhaFaturamento {
  receita_bruta?: number | string | null;
  valor_impostos?: number | string | null;
}

/**
 * Carga tributária efetiva (em %) de uma janela de faturamento.
 *
 * Devolve `null` — e não zero — quando não há tributo somado. Com receita
 * positiva e tributo zero não há como distinguir "nenhum imposto apurado" de
 * "empresa isenta": `faturamento_mensal.valor_impostos` tem default 0 e a tela
 * de cadastro (src/components/tributario/historico/FaturamentoTab.tsx) não
 * envia imposto nenhum. Publicar 0% faria o benchmark classificar a empresa
 * abaixo do P25 do setor e recomendar "operação eficiente" sem ter medido um
 * único imposto. Ausência de dado continua ausência.
 *
 * Para um dia aceitar carga zero legítima, faturamento_mensal precisa de uma
 * marca explícita de completude dos impostos; hoje ela não existe.
 */
export function cargaEfetivaDeFaturamento(linhas: LinhaFaturamento[]): number | null {
  if (!linhas || linhas.length === 0) return null;
  let receita = 0;
  let tributo = 0;
  for (const l of linhas) {
    receita += Number(l.receita_bruta ?? 0);
    tributo += Number(l.valor_impostos ?? 0);
  }
  if (!(receita > 0) || !(tributo > 0)) return null;
  return Math.round((tributo / receita) * 1000) / 10;
}

/** Competência (ano/mês) de uma linha de regime_decision_cache. */
export interface Competencia {
  ano?: number | null;
  mes?: number | null;
}

/**
 * `true` só quando `atual` é exatamente o mês seguinte a `anterior`.
 *
 * regime_decision_cache guarda a decisão da competência pedida, sem garantir
 * série mensal completa (decidir-regime/index.ts:352-356). Comparar os dois
 * registros mais recentes como se fossem meses consecutivos transforma uma
 * variação acumulada de dez meses em "anomalia MoM". Usa ano*12+mes, então a
 * virada dezembro/janeiro é consecutiva.
 */
export function competenciasConsecutivas(atual: Competencia, anterior: Competencia): boolean {
  const a = indiceCompetencia(atual);
  const b = indiceCompetencia(anterior);
  if (a === null || b === null) return false;
  return a - b === 1;
}

function indiceCompetencia(c: Competencia): number | null {
  const ano = Number(c?.ano);
  const mes = Number(c?.mes);
  if (!Number.isInteger(ano) || !Number.isInteger(mes)) return null;
  if (mes < 1 || mes > 12) return null;
  return ano * 12 + mes;
}
