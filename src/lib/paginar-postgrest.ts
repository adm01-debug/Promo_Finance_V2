/**
 * Paginacao de leitura do PostgREST, com a contagem exata como criterio de
 * parada.
 *
 * Extraido de PrevisaoInadimplencia.tsx na revisao da PR #404 (o arquivo bateu
 * no limite de 400 linhas do eslint) e mantido aqui porque o problema nao e
 * daquele painel: qualquer soma feita no cliente sobre `.select()` sem
 * paginacao publica resultado parcial como completo.
 */
export const PAGINA = 1000;
/**
 * Teto de LINHAS, nao de requisicoes: com o servidor devolvendo menos que a
 * janela (db-max-rows menor que PAGINA), contar requisicoes acusava
 * "mais de 50 mil titulos" com 25 mil (achado do Devin na PR #404).
 */
export const MAX_LINHAS = 50_000;
/**
 * Teto de requisicoes, independente do de linhas: so existe para a leitura nao
 * girar sem fim se o servidor devolver paginas minusculas. A mensagem diz o que
 * aconteceu de verdade, nao um total inventado.
 */
const MAX_REQUISICOES = 500;

/**
 * Le TODAS as linhas de uma consulta, usando a CONTAGEM EXATA como criterio de
 * parada.
 *
 * O PostgREST corta a resposta no seu limite de linhas e nao sinaliza o corte,
 * entao `await` direto num conjunto maior entrega resultado parcial sem erro --
 * era o achado P1 do Codex nesta PR. Comparar `pagina.length` com um tamanho
 * assumido tambem nao serve: se o servidor cortar ABAIXO da janela pedida, a
 * leitura para calada do mesmo jeito. `count: 'exact'` vem do servidor, entao a
 * parada e sobre o total real.
 *
 * Se o teto de paginas for atingido, LANCA em vez de devolver parcial: a tela
 * tem estado de erro, e numero errado seria pior que erro visivel.
 */
export async function paginarTudo<T>(consulta: {
  range: (
    de: number,
    ate: number
  ) => PromiseLike<{ data: T[] | null; error: unknown; count?: number | null }>;
}): Promise<T[]> {
  const tudo: T[] = [];
  // O deslocamento avanca pelo que FOI RECEBIDO, nao pelo que foi pedido: se o
  // servidor limitar a resposta abaixo da janela (db-max-rows menor que
  // PAGINA), somar 1.000 a cada volta pularia linhas (achado do Devin).
  let de = 0;
  for (let p = 0; p < MAX_REQUISICOES; p++) {
    const { data, error, count } = await consulta.range(de, de + PAGINA - 1);
    if (error) throw error;
    const pagina = data ?? [];
    tudo.push(...pagina);
    const total = typeof count === 'number' ? count : null;

    // O teto e pelo TOTAL real, conhecido na primeira resposta.
    if (total != null && total > MAX_LINHAS) {
      throw new Error(
        `${total} títulos no período: a previsão não calcula somatório parcial acima de ` +
          `${MAX_LINHAS}. Reduza o intervalo ou peça a agregação no banco.`
      );
    }

    if (total != null) {
      if (tudo.length >= total) return tudo;
      // Pagina vazia antes de alcancar o total e leitura incompleta: devolver o
      // acumulado seria somatorio parcial com cara de completo.
      if (pagina.length === 0) {
        throw new Error(
          `Leitura incompleta dos títulos: ${tudo.length} de ${total}. A previsão não calcula ` +
            'somatório parcial. Tente de novo.'
        );
      }
    } else if (pagina.length < PAGINA) {
      return tudo;
    } else if (pagina.length === 0) {
      return tudo;
    }

    de += pagina.length;
  }
  throw new Error(
    `A leitura dos títulos não terminou em ${MAX_REQUISICOES} requisições (${tudo.length} linhas ` +
      'lidas). A previsão não calcula somatório parcial. Tente de novo.'
  );
}
