// Etapa 82 — montagem das linhas de `catalogo_fundamentacao` a partir de
// `/fundamentacoes-legais` (API publica de dados abertos da RFB).
//
// Puro de proposito: aqui mora a decisao do que aceitar. Payload fora do
// contrato vira lista vazia, nunca excecao — quem decide parar e o piso de
// contagem do `index.ts`. O inverso tambem vale: linha sem a tripla
// (cClassTrib, CST, conjunto) nao entra, porque essa tripla mais a vigencia e a
// chave primaria da tabela, e uma linha com chave inventada apareceria como
// fundamento de codigo que nao existe.

/** Linha pronta para o `upsert` em `catalogo_fundamentacao`. */
export interface FundamentoLinha {
  cclasstrib: string;
  cst: string;
  conjunto_tributo: string;
  descricao_cclasstrib: string | null;
  descricao_cst: string | null;
  texto: string | null;
  texto_curto: string | null;
  referencia_normativa: string | null;
  inicio_vigencia: string;
  versao_it: string;
}

/** Resultado do mapeamento, com o que foi descartado a vista. */
export interface MapeamentoFundamentos {
  linhas: FundamentoLinha[];
  /** Chaves `cclasstrib|cst|conjunto` publicadas (base do encerramento). */
  presentes: string[];
  ignoradas: string[];
  /** Linhas fundidas por repetirem a mesma chave. */
  agrupadas: number;
}

/**
 * Piso de aceite da resposta. Em 2026-06-01 a base publicou 170 linhas; abaixo
 * de 100 a resposta e tratada como parcial e o encerramento por ausencia fica
 * bloqueado no `index.ts`.
 */
export const MIN_FUNDAMENTACOES_API = 100;

/** Chave composta usada no encerramento por ausencia. */
export function chaveFundamento(cclasstrib: string, cst: string, conjuntoTributo: string): string {
  return `${cclasstrib}|${cst}|${conjuntoTributo}`;
}

/**
 * Valor literal para filtro do PostgREST.
 *
 * A chave do encerramento carrega texto livre (`conjunto_tributo`, hoje sempre
 * "CBS e IBS") e o PostgREST le `,` `(` `)` como sintaxe de filtro: uma virgula
 * no valor quebraria o `or` inteiro. Aspas sao a forma suportada de proteger
 * espaco, entao o resto e substituido em vez de escapado.
 */
export function literalPostgrest(valor: string): string {
  const limpo = String(valor)
    .replace(/["(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `"${limpo}"`;
}

/**
 * Filtro `or` com um `and` por chave ausente. O PostgREST nao aceita `in`
 * composto; sem isso, encerrar a vigencia de uma combinacao ausente exigiria um
 * `update` por chave.
 */
export function filtroAusentes(chaves: readonly string[]): string {
  return chaves
    .map((chave) => {
      const partes = String(chave).split('|');
      const cclasstrib = partes[0] ?? '';
      const cst = partes[1] ?? '';
      const conjunto = partes.slice(2).join('|');
      return `and(cclasstrib.eq.${literalPostgrest(cclasstrib)},cst.eq.${literalPostgrest(cst)},conjunto_tributo.eq.${literalPostgrest(conjunto)})`;
    })
    .join(',');
}

const soDigitos = (valor: unknown): string => String(valor ?? '').replace(/\D/g, '');

const textoOuNulo = (valor: unknown): string | null => {
  const limpo = String(valor ?? '').trim();
  return limpo ? limpo : null;
};

/**
 * Texto legal com quebras de linha reais.
 *
 * A API publica parte dos textos com `\n` literal (barra invertida + n) no meio
 * do artigo; sem normalizar, o PDF e o tooltip imprimem "operacao com:\nVIII" na
 * mesma linha. Quebra de linha de verdade vinda no payload fica como esta.
 */
const textoComQuebras = (valor: unknown): string | null => {
  const texto = textoOuNulo(valor);
  return texto === null ? null : texto.replace(/\\r\\n|\\n/g, '\n');
};

/** Junta textos distintos de linhas repetidas, sem repetir o mesmo trecho. */
const unir = (atual: string | null, novo: string | null, separador: string): string | null => {
  if (!novo) return atual;
  if (!atual) return novo;
  return atual.includes(novo) ? atual : `${atual}${separador}${novo}`;
};

/**
 * Mapeia o payload de `/fundamentacoes-legais` para linhas da tabela.
 *
 * Duas linhas com a mesma chave sao fundidas em vez de descartadas: o texto
 * legal e cumulativo por natureza (um artigo e seus paragrafos podem vir em
 * linhas separadas) e perder a segunda apagaria fundamento. Se o payload trouxer
 * o mesmo trecho repetido, ele nao e duplicado.
 */
export function montarFundamentos(
  payload: unknown,
  inicioVigencia: string,
  versaoIt: string
): MapeamentoFundamentos {
  const resultado: MapeamentoFundamentos = {
    linhas: [],
    presentes: [],
    ignoradas: [],
    agrupadas: 0,
  };
  if (!Array.isArray(payload)) return resultado;

  const porChave = new Map<string, FundamentoLinha>();

  for (const bruto of payload) {
    if (!bruto || typeof bruto !== 'object') {
      resultado.ignoradas.push('linha_nao_objeto');
      continue;
    }
    const item = bruto as Record<string, unknown>;
    const cclasstrib = soDigitos(item.codigoClassificacaoTributaria);
    const cst = soDigitos(item.codigoSituacaoTributaria);
    const conjunto = textoOuNulo(item.conjuntoTributo);

    if (cclasstrib.length !== 6 || cst.length !== 3 || !conjunto) {
      resultado.ignoradas.push(`${cclasstrib || '?'}/${cst || '?'}/${conjunto ?? '?'}`);
      continue;
    }

    const chave = chaveFundamento(cclasstrib, cst, conjunto);
    const linha: FundamentoLinha = {
      cclasstrib,
      cst,
      conjunto_tributo: conjunto,
      descricao_cclasstrib: textoOuNulo(item.descricaoClassificacaoTributaria),
      descricao_cst: textoOuNulo(item.descricaoSituacaoTributaria),
      texto: textoComQuebras(item.texto),
      texto_curto: textoComQuebras(item.textoCurto),
      referencia_normativa: textoComQuebras(item.referenciaNormativa),
      inicio_vigencia: inicioVigencia,
      versao_it: versaoIt,
    };

    const anterior = porChave.get(chave);
    if (!anterior) {
      porChave.set(chave, linha);
      continue;
    }
    resultado.agrupadas += 1;
    anterior.texto = unir(anterior.texto, linha.texto, '\n\n');
    anterior.texto_curto = unir(anterior.texto_curto, linha.texto_curto, ' / ');
    anterior.referencia_normativa = unir(
      anterior.referencia_normativa,
      linha.referencia_normativa,
      '\n'
    );
    anterior.descricao_cclasstrib = anterior.descricao_cclasstrib ?? linha.descricao_cclasstrib;
    anterior.descricao_cst = anterior.descricao_cst ?? linha.descricao_cst;
  }

  resultado.linhas = [...porChave.values()];
  resultado.presentes = [...porChave.keys()];
  return resultado;
}
