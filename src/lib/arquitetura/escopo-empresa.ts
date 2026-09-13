/**
 * Detector de escopo multi-empresa em queryKeys do TanStack Query.
 *
 * Regra arquitetural: se o `queryFn` de uma query filtra por `empresa_id`,
 * a `queryKey` precisa conter o identificador da empresa. Caso contrário a
 * query nunca é invalidada na troca de empresa — o cache devolve os dados do
 * tenant anterior, que é exatamente a classe de bug descrita nas Etapas 23–25
 * do plano de melhorias.
 *
 * O módulo é puro (string -> violações) para que a varredura do repositório
 * e os testes unitários do próprio detector usem o mesmo código.
 */

export interface ViolacaoEscopo {
  arquivo: string;
  linha: number;
  /** Texto da queryKey como aparece no código. */
  queryKey: string;
  /** Trecho do corpo que evidencia o filtro por empresa. */
  evidencia: string;
}

export interface BlocoQuery {
  /** Índice do caractere onde o bloco começa. */
  inicio: number;
  /** Conteúdo integral do objeto de opções passado a useQuery. */
  texto: string;
  /** Literal da queryKey, ou null quando não há chave estática. */
  queryKey: string | null;
  /** True quando a chave veio como atalho (`queryKey,`) de uma const externa. */
  chavePorReferencia: boolean;
}

/** Identifica escopo de empresa em um segmento de chave (`empresaId`, `empresa_id`, …). */
const TOKEN_EMPRESA = /empresa/i;

/**
 * Filtros que amarram a query a uma empresa específica dentro do queryFn.
 * Cada padrão captura, quando possível, a expressão usada como valor — é ela
 * que precisa estar refletida na chave.
 */
const FILTROS_EMPRESA: RegExp[] = [
  /\.(?:eq|in)\(\s*['"`]empresa_id['"`]\s*,\s*([A-Za-z_$][\w$.?]*)/,
  /\.match\(\s*\{[^}]*\bempresa_id\s*:\s*([A-Za-z_$][\w$.?]*)/,
  /\bbody\s*:\s*\{[^}]*\bempresa_id\s*:\s*([A-Za-z_$][\w$.?]*)/,
];

/**
 * Extrai o texto entre delimitadores balanceados a partir de `inicio`,
 * ignorando strings e comentários. Retorna null se não fechar.
 */
export function fatiarBalanceado(
  codigo: string,
  inicio: number,
  abre: string,
  fecha: string
): string | null {
  if (codigo[inicio] !== abre) return null;
  let profundidade = 0;
  let i = inicio;
  let aspas: string | null = null;

  while (i < codigo.length) {
    const c = codigo[i];
    const anterior = codigo[i - 1];

    if (aspas) {
      if (c === aspas && anterior !== '\\') aspas = null;
      i += 1;
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      aspas = c;
      i += 1;
      continue;
    }

    if (c === '/' && codigo[i + 1] === '/') {
      const fim = codigo.indexOf('\n', i);
      i = fim === -1 ? codigo.length : fim;
      continue;
    }

    if (c === '/' && codigo[i + 1] === '*') {
      const fim = codigo.indexOf('*/', i);
      i = fim === -1 ? codigo.length : fim + 2;
      continue;
    }

    if (c === abre) profundidade += 1;
    else if (c === fecha) {
      profundidade -= 1;
      if (profundidade === 0) return codigo.slice(inicio, i + 1);
    }
    i += 1;
  }
  return null;
}

/** Lista os blocos de opções de cada chamada a useQuery no arquivo. */
export function extrairBlocosUseQuery(codigo: string): BlocoQuery[] {
  const blocos: BlocoQuery[] = [];
  const chamada = /\buseQuery\s*(?:<[^>]*>)?\s*\(\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = chamada.exec(codigo)) !== null) {
    const abertura = codigo.indexOf('{', m.index);
    const texto = fatiarBalanceado(codigo, abertura, '{', '}');
    if (!texto) continue;

    const posChave = texto.search(/\bqueryKey\s*:/);
    let chavePorReferencia = false;
    let queryKey: string | null = null;
    if (posChave === -1 && /\bqueryKey\s*[,\n}]/.test(texto)) {
      // Atalho de objeto: `queryKey,` referenciando uma const declarada antes.
      chavePorReferencia = true;
    }
    if (posChave !== -1) {
      const inicioArray = texto.indexOf('[', posChave);
      if (inicioArray !== -1) queryKey = fatiarBalanceado(texto, inicioArray, '[', ']');
      if (queryKey === null) {
        // Chave montada por helper: `queryKey: queryKeys.x.y(empresaId)`.
        const fim = texto.indexOf('\n', posChave);
        queryKey = texto.slice(posChave, fim === -1 ? texto.length : fim).trim();
      }
    }

    blocos.push({ inicio: m.index, texto, queryKey, chavePorReferencia });
    chamada.lastIndex = abertura + texto.length;
  }

  return blocos;
}

function linhaDe(codigo: string, indice: number): number {
  let linha = 1;
  for (let i = 0; i < indice && i < codigo.length; i += 1) {
    if (codigo[i] === '\n') linha += 1;
  }
  return linha;
}

/**
 * Retorna as queries que filtram por empresa sem declarar a empresa na chave.
 */
/** Recupera `const queryKey = [...]` quando a chave foi passada por atalho. */
export function resolverChavePorReferencia(codigo: string, ateIndice: number): string | null {
  const escopo = codigo.slice(0, ateIndice);
  const decl = /\b(?:const|let|var)\s+queryKey\s*(?::[^=]+)?=\s*/g;
  let ultimo: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = decl.exec(escopo)) !== null) ultimo = m;
  if (!ultimo) return null;

  const inicioValor = ultimo.index + ultimo[0].length;
  if (codigo[inicioValor] === '[') return fatiarBalanceado(codigo, inicioValor, '[', ']');
  const fim = codigo.indexOf('\n', inicioValor);
  return codigo.slice(inicioValor, fim === -1 ? codigo.length : fim).trim();
}

/** Raiz de uma expressão: `filters.empresa_id` -> `filters`. */
function raizDaExpressao(expressao: string): string {
  return expressao.split(/[.?[]/)[0];
}

export function analisarEscopoEmpresa(codigo: string, arquivo: string): ViolacaoEscopo[] {
  const violacoes: ViolacaoEscopo[] = [];

  for (const bloco of extrairBlocosUseQuery(codigo)) {
    const corpo = bloco.queryKey ? bloco.texto.replace(bloco.queryKey, '') : bloco.texto;

    const filtro = FILTROS_EMPRESA.map((re) => re.exec(corpo)).find((r) => r !== null);
    if (!filtro) continue;

    const chave = bloco.chavePorReferencia
      ? resolverChavePorReferencia(codigo, bloco.inicio)
      : bloco.queryKey;

    if (chave && TOKEN_EMPRESA.test(chave)) continue;

    // A chave pode carregar o objeto que origina o filtro (`['x', filters]`
    // com `filters.empresa_id`): trocar de empresa muda o hash da chave.
    const valorFiltro = filtro[1];
    if (chave && valorFiltro) {
      const raiz = raizDaExpressao(valorFiltro);
      if (raiz && new RegExp(`\\b${raiz}\\b`).test(chave)) continue;
    }

    violacoes.push({
      arquivo,
      linha: linhaDe(codigo, bloco.inicio),
      queryKey: (chave ?? '(sem queryKey)').replace(/\s+/g, ' ').slice(0, 120),
      evidencia: filtro[0],
    });
  }

  return violacoes;
}
