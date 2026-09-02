/**
 * Guard conservador para SQL administrativo do MCP.
 *
 * Objetivos:
 * - permitir leituras `SELECT` e `WITH ... SELECT` somente leitura;
 * - permitir `INSERT`, `UPDATE` e `DELETE` legítimos;
 * - bloquear sempre comandos de DDL, privilégios, sessão e execução;
 * - bloquear funções SQL conhecidas por efeito colateral administrativo;
 * - exigir `WHERE` restritivo em `UPDATE`/`DELETE`, salvo quando o chamador
 *   usa `allow_all_rows:true` no nível superior do worker.
 *
 * O módulo falha fechado: qualquer padrão não compreendido é rejeitado.
 */

export type ComandoSqlMcp = 'select' | 'insert' | 'update' | 'delete';

export interface AnaliseSqlMcp {
  sqlNormalizado: string;
  comando: ComandoSqlMcp | null;
  somenteLeitura: boolean;
  escrita: boolean;
  usaCte: boolean;
  motivoBloqueio: string | null;
}

interface EstruturaComando {
  comando: string | null;
  usaCte: boolean;
  motivoBloqueio: string | null;
}

const COMANDOS_BLOQUEADOS_FIXOS: Record<string, string> = {
  alter: 'Comando ALTER não é permitido no MCP',
  analyze: 'Comando ANALYZE não é permitido no MCP',
  call: 'Comando CALL não é permitido no MCP',
  checkpoint: 'Comando CHECKPOINT não é permitido no MCP',
  cluster: 'Comando CLUSTER não é permitido no MCP',
  comment: 'Comando COMMENT não é permitido no MCP',
  commit: 'Controle transacional não é permitido no MCP',
  copy: 'Comando COPY não é permitido no MCP',
  create: 'Comando CREATE não é permitido no MCP',
  deallocate: 'Comando DEALLOCATE não é permitido no MCP',
  discard: 'Comando DISCARD não é permitido no MCP',
  do: 'Comando DO não é permitido no MCP',
  drop: 'Comando DROP não é permitido no MCP',
  execute: 'Comando EXECUTE não é permitido no MCP',
  explain: 'Comando EXPLAIN não é permitido no MCP',
  grant: 'Comando GRANT não é permitido no MCP',
  listen: 'Comando LISTEN não é permitido no MCP',
  lock: 'Comando LOCK não é permitido no MCP',
  merge: 'Comando MERGE não é permitido no MCP',
  notify: 'Comando NOTIFY não é permitido no MCP',
  prepare: 'Comando PREPARE não é permitido no MCP',
  refresh: 'Comando REFRESH não é permitido no MCP',
  reindex: 'Comando REINDEX não é permitido no MCP',
  release: 'Controle transacional não é permitido no MCP',
  reset: 'Comando RESET não é permitido no MCP',
  revoke: 'Comando REVOKE não é permitido no MCP',
  rollback: 'Controle transacional não é permitido no MCP',
  savepoint: 'Controle transacional não é permitido no MCP',
  security: 'Comando SECURITY LABEL não é permitido no MCP',
  set: 'Comando SET não é permitido no MCP',
  show: 'Comando SHOW não é permitido no MCP',
  start: 'Controle transacional não é permitido no MCP',
  truncate: 'Comando TRUNCATE não é permitido no MCP',
  unlisten: 'Comando UNLISTEN não é permitido no MCP',
  vacuum: 'Comando VACUUM não é permitido no MCP',
};

const FUNCOES_COM_EFEITO_COLATERAL: Array<{ regex: RegExp; motivo: string }> = [
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?exec_sql\s*\(/i,
    motivo: 'Função exec_sql não é permitida no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?set_config\s*\(/i,
    motivo: 'Função set_config não é permitida no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?pg_(terminate_backend|cancel_backend|reload_conf)\s*\(/i,
    motivo: 'Função administrativa de backend não é permitida no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?dblink_exec\s*\(/i,
    motivo: 'Função dblink_exec não é permitida no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?lo_(import|export)\s*\(/i,
    motivo: 'Função large object administrativa não é permitida no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?(nextval|setval)\s*\(/i,
    motivo: 'Funções nextval/setval não são permitidas no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?pg_(?:try_)?advisory_(?:xact_)?lock(?:_shared)?\s*\(/i,
    motivo: 'Locks advisory não são permitidos no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?pg_advisory_unlock(?:_all|_shared)?\s*\(/i,
    motivo: 'Unlock advisory não é permitido no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?pg_notify\s*\(/i,
    motivo: 'Função pg_notify não é permitida no MCP',
  },
  {
    regex:
      /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?pg_(read_file|read_binary_file|ls_dir|stat_file|log_backend_memory_contexts|rotate_logfile)\s*\(/i,
    motivo: 'Função de arquivo/servidor não é permitida no MCP',
  },
  {
    regex: /\b(?:[a-z_][a-z0-9_]*\s*\.\s*)?lo_get\s*\(/i,
    motivo: 'Função large object não é permitida no MCP',
  },
];

const FUNCOES_SELECT_ALLOWLIST = new Set([
  'abs',
  'array_agg',
  'array_length',
  'avg',
  'btrim',
  'ceil',
  'ceiling',
  'char_length',
  'coalesce',
  'concat',
  'concat_ws',
  'count',
  'date_part',
  'date_trunc',
  'extract',
  'format_type',
  'floor',
  'greatest',
  'has_function_privilege',
  'json_agg',
  'json_array_length',
  'json_build_object',
  'json_object_agg',
  'jsonb_agg',
  'jsonb_array_length',
  'jsonb_build_object',
  'jsonb_object_agg',
  'least',
  'left',
  'length',
  'lower',
  'ltrim',
  'max',
  'min',
  'obj_description',
  'pg_database_size',
  'pg_relation_size',
  'pg_size_pretty',
  'pg_total_relation_size',
  'now',
  'nullif',
  'octet_length',
  'random',
  'replace',
  'round',
  'row_to_json',
  'rtrim',
  'split_part',
  'string_agg',
  'strpos',
  'substring',
  'sum',
  'to_char',
  'to_json',
  'to_jsonb',
  'trim',
  'trunc',
  'unnest',
  'upper',
  'current_database',
  'current_setting',
]);

const PREFIXOS_FUNCAO_SELECT_ALLOWLIST = ['pg_get_'];

const TOKENS_NAO_FUNCAO = new Set([
  'and',
  'array',
  'as',
  'case',
  'cast',
  'distinct',
  'else',
  'end',
  'exists',
  'from',
  'group',
  'in',
  'limit',
  'materialized',
  'not',
  'on',
  'or',
  'order',
  'over',
  'partition',
  'recursive',
  'select',
  'then',
  'values',
  'when',
  'where',
]);

const COLUNAS_IDENTIDADE_OU_TENANT = new Set([
  'empresa_id',
  'id',
  'org_id',
  'organization_id',
  'organizacao_id',
  'profile_id',
  'tenant_id',
  'user_id',
]);

function temIdentificadorQuoted(sql: string): boolean {
  let i = 0;
  let aspasSimples = false;
  let comentarioLinha = false;
  let comentarioBloco = false;
  let literalDollar: string | null = null;

  const encontrarDelimitadorDollar = (inicio: number): string | null => {
    if (sql[inicio] !== '$') return null;
    let cursor = inicio + 1;
    while (cursor < sql.length && /[a-zA-Z0-9_]/.test(sql[cursor])) cursor++;
    if (sql[cursor] !== '$') return null;
    return sql.slice(inicio, cursor + 1);
  };

  while (i < sql.length) {
    const atual = sql[i];
    const proximo = sql[i + 1];

    if (comentarioLinha) {
      if (atual === '\n') comentarioLinha = false;
      i++;
      continue;
    }

    if (comentarioBloco) {
      if (atual === '*' && proximo === '/') {
        comentarioBloco = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (literalDollar) {
      if (sql.startsWith(literalDollar, i)) {
        i += literalDollar.length;
        literalDollar = null;
      } else {
        i++;
      }
      continue;
    }

    if (aspasSimples) {
      if (atual === "'" && proximo === "'") {
        i += 2;
      } else if (atual === "'") {
        aspasSimples = false;
        i++;
      } else {
        i++;
      }
      continue;
    }

    if (atual === '-' && proximo === '-') {
      comentarioLinha = true;
      i += 2;
      continue;
    }

    if (atual === '/' && proximo === '*') {
      comentarioBloco = true;
      i += 2;
      continue;
    }

    if (atual === '$') {
      const delimitador = encontrarDelimitadorDollar(i);
      if (delimitador) {
        literalDollar = delimitador;
        i += delimitador.length;
        continue;
      }
    }

    if (atual === "'") {
      aspasSimples = true;
      i++;
      continue;
    }

    if (atual === '"') return true;
    i++;
  }

  return false;
}

export function removerComentariosELiterais(sql: string): { sql: string; invalido: boolean } {
  let saida = '';
  let i = 0;
  let aspas: "'" | '"' | null = null;
  let comentarioLinha = false;
  let comentarioBloco = false;
  let literalDollar: string | null = null;

  const encontrarDelimitadorDollar = (inicio: number): string | null => {
    if (sql[inicio] !== '$') return null;
    let cursor = inicio + 1;
    while (cursor < sql.length && /[a-zA-Z0-9_]/.test(sql[cursor])) cursor++;
    if (sql[cursor] !== '$') return null;
    return sql.slice(inicio, cursor + 1);
  };

  while (i < sql.length) {
    const atual = sql[i];
    const proximo = sql[i + 1];

    if (comentarioLinha) {
      if (atual === '\n') {
        comentarioLinha = false;
        saida += '\n';
      } else {
        saida += ' ';
      }
      i++;
      continue;
    }

    if (comentarioBloco) {
      if (atual === '*' && proximo === '/') {
        comentarioBloco = false;
        saida += '  ';
        i += 2;
      } else {
        saida += atual === '\n' ? '\n' : ' ';
        i++;
      }
      continue;
    }

    if (literalDollar) {
      if (sql.startsWith(literalDollar, i)) {
        saida += ' '.repeat(literalDollar.length);
        i += literalDollar.length;
        literalDollar = null;
      } else {
        saida += atual === '\n' ? '\n' : ' ';
        i++;
      }
      continue;
    }

    if (aspas) {
      if (atual === aspas && proximo === aspas && aspas === "'") {
        saida += '  ';
        i += 2;
      } else if (atual === aspas) {
        aspas = null;
        saida += ' ';
        i++;
      } else {
        saida += atual === '\n' ? '\n' : ' ';
        i++;
      }
      continue;
    }

    if (atual === '-' && proximo === '-') {
      comentarioLinha = true;
      saida += '  ';
      i += 2;
      continue;
    }

    if (atual === '/' && proximo === '*') {
      comentarioBloco = true;
      saida += '  ';
      i += 2;
      continue;
    }

    if (atual === '$') {
      const delimitador = encontrarDelimitadorDollar(i);
      if (delimitador) {
        literalDollar = delimitador;
        saida += ' '.repeat(delimitador.length);
        i += delimitador.length;
        continue;
      }
    }

    if (atual === "'" || atual === '"') {
      aspas = atual;
      saida += ' ';
      i++;
      continue;
    }

    saida += atual;
    i++;
  }

  return {
    sql: saida,
    invalido: Boolean(aspas || comentarioBloco || literalDollar),
  };
}

function removerParentesesExternos(valor: string): string {
  let texto = valor.trim();
  while (texto.startsWith('(') && texto.endsWith(')')) {
    let profundidade = 0;
    let fechaAntesDoFim = false;
    for (let i = 0; i < texto.length; i++) {
      if (texto[i] === '(') profundidade++;
      if (texto[i] === ')') profundidade--;
      if (profundidade === 0 && i < texto.length - 1) fechaAntesDoFim = true;
    }
    if (fechaAntesDoFim || profundidade !== 0) break;
    texto = texto.slice(1, -1).trim();
  }
  return texto;
}

function separarNoNivelSuperior(expressao: string, operador: 'and' | 'or'): string[] {
  const partes: string[] = [];
  let inicio = 0;
  let profundidade = 0;
  const padrao = new RegExp(`\\s+${operador}\\s+`, 'iy');

  for (let i = 0; i < expressao.length; i++) {
    if (expressao[i] === '(') profundidade++;
    if (expressao[i] === ')') profundidade--;
    if (profundidade !== 0) continue;
    padrao.lastIndex = i;
    const encontrado = padrao.exec(expressao);
    if (encontrado) {
      partes.push(expressao.slice(inicio, i).trim());
      i = padrao.lastIndex - 1;
      inicio = padrao.lastIndex;
    }
  }

  partes.push(expressao.slice(inicio).trim());
  return partes.filter(Boolean);
}

function separarNoNivelSuperiorComFaixas(
  expressao: string,
  operador: 'and' | 'or'
): Array<{ trecho: string; inicio: number; fim: number }> {
  const partes: Array<{ trecho: string; inicio: number; fim: number }> = [];
  let inicio = 0;
  let profundidade = 0;
  const padrao = new RegExp(`\\s+${operador}\\s+`, 'iy');

  for (let i = 0; i < expressao.length; i++) {
    if (expressao[i] === '(') profundidade++;
    if (expressao[i] === ')') profundidade--;
    if (profundidade !== 0) continue;
    padrao.lastIndex = i;
    const encontrado = padrao.exec(expressao);
    if (encontrado) {
      partes.push({
        trecho: expressao.slice(inicio, i).trim(),
        inicio,
        fim: i,
      });
      i = padrao.lastIndex - 1;
      inicio = padrao.lastIndex;
    }
  }

  partes.push({
    trecho: expressao.slice(inicio).trim(),
    inicio,
    fim: expressao.length,
  });
  return partes.filter((parte) => parte.trecho.length > 0);
}

function consumirParentesesBalanceados(texto: string, inicio: number): number {
  if (texto[inicio] !== '(') return -1;
  let profundidade = 0;
  for (let i = inicio; i < texto.length; i++) {
    if (texto[i] === '(') profundidade++;
    if (texto[i] === ')') profundidade--;
    if (profundidade === 0) return i + 1;
  }
  return -1;
}

function avancarEspacos(texto: string, cursor: number): number {
  let i = cursor;
  while (i < texto.length && /\s/.test(texto[i])) i++;
  return i;
}

function lerPalavra(texto: string, cursor: number): { palavra: string | null; fim: number } {
  const inicio = avancarEspacos(texto, cursor);
  const match = texto.slice(inicio).match(/^[a-z_][a-z0-9_]*/i);
  if (!match) return { palavra: null, fim: inicio };
  return { palavra: match[0].toLowerCase(), fim: inicio + match[0].length };
}

function extrairEstruturaComando(statement: string): EstruturaComando {
  const texto = statement.trim();
  if (!texto) {
    return { comando: null, usaCte: false, motivoBloqueio: 'SQL vazio' };
  }

  const primeiraPalavra = lerPalavra(texto, 0);
  if (primeiraPalavra.palavra !== 'with') {
    return {
      comando: primeiraPalavra.palavra,
      usaCte: false,
      motivoBloqueio: null,
    };
  }

  let cursor = primeiraPalavra.fim;
  const recursivo = lerPalavra(texto, cursor);
  if (recursivo.palavra === 'recursive') cursor = recursivo.fim;

  while (cursor < texto.length) {
    const nomeCte = lerPalavra(texto, cursor);
    if (!nomeCte.palavra) {
      return {
        comando: null,
        usaCte: true,
        motivoBloqueio: 'CTE inválida: nome não reconhecido',
      };
    }
    cursor = avancarEspacos(texto, nomeCte.fim);

    if (texto[cursor] === '(') {
      cursor = consumirParentesesBalanceados(texto, cursor);
      if (cursor < 0) {
        return {
          comando: null,
          usaCte: true,
          motivoBloqueio: 'CTE inválida: lista de colunas não terminou',
        };
      }
    }

    const asToken = lerPalavra(texto, cursor);
    if (asToken.palavra !== 'as') {
      return {
        comando: null,
        usaCte: true,
        motivoBloqueio: 'CTE inválida: cláusula AS ausente',
      };
    }
    cursor = avancarEspacos(texto, asToken.fim);

    const materializacao = lerPalavra(texto, cursor);
    if (materializacao.palavra === 'materialized') {
      cursor = avancarEspacos(texto, materializacao.fim);
    } else if (materializacao.palavra === 'not') {
      const materialized = lerPalavra(texto, materializacao.fim);
      if (materialized.palavra !== 'materialized') {
        return {
          comando: null,
          usaCte: true,
          motivoBloqueio: 'CTE inválida: esperado MATERIALIZED após NOT',
        };
      }
      cursor = avancarEspacos(texto, materialized.fim);
    }

    if (texto[cursor] !== '(') {
      return {
        comando: null,
        usaCte: true,
        motivoBloqueio: 'CTE inválida: corpo deve abrir com parênteses',
      };
    }

    const fimCorpo = consumirParentesesBalanceados(texto, cursor);
    if (fimCorpo < 0) {
      return {
        comando: null,
        usaCte: true,
        motivoBloqueio: 'CTE inválida: corpo não terminou',
      };
    }

    const corpo = texto.slice(cursor + 1, fimCorpo - 1);
    const estruturaInterna = extrairEstruturaComando(corpo);
    if (estruturaInterna.motivoBloqueio) {
      return {
        comando: null,
        usaCte: true,
        motivoBloqueio: `CTE inválida: ${estruturaInterna.motivoBloqueio}`,
      };
    }

    if (estruturaInterna.comando !== 'select') {
      return {
        comando: null,
        usaCte: true,
        motivoBloqueio: 'CTE com escrita ou comando não permitido',
      };
    }

    cursor = avancarEspacos(texto, fimCorpo);
    if (texto[cursor] === ',') {
      cursor++;
      continue;
    }

    const comandoPrincipal = lerPalavra(texto, cursor);
    return {
      comando: comandoPrincipal.palavra,
      usaCte: true,
      motivoBloqueio: comandoPrincipal.palavra
        ? null
        : 'Comando principal após WITH não reconhecido',
    };
  }

  return { comando: null, usaCte: true, motivoBloqueio: 'CTE incompleta' };
}

function encontrarKeywordNoNivelSuperior(texto: string, keyword: string, inicio = 0): number {
  let profundidade = 0;
  const lower = texto.toLowerCase();
  const alvo = keyword.toLowerCase();

  for (let i = inicio; i <= lower.length - alvo.length; i++) {
    const atual = lower[i];
    if (atual === '(') {
      profundidade++;
      continue;
    }
    if (atual === ')') {
      profundidade = Math.max(0, profundidade - 1);
      continue;
    }
    if (profundidade !== 0) continue;
    if (lower.slice(i, i + alvo.length) !== alvo) continue;
    const anterior = i === 0 ? ' ' : lower[i - 1];
    const proximo = lower[i + alvo.length] ?? ' ';
    if (/[a-z0-9_]/.test(anterior) || /[a-z0-9_]/.test(proximo)) continue;
    return i;
  }

  return -1;
}

function extrairFaixaWhere(
  original: string,
  normalizado: string
): { original: string; normalizado: string } | null {
  const idxWhere = encontrarKeywordNoNivelSuperior(normalizado, 'where');
  if (idxWhere < 0) return null;

  const palavrasFim = ['returning', 'order', 'limit', 'offset', 'for'];
  let fim = normalizado.length;
  for (const palavra of palavrasFim) {
    const idx = encontrarKeywordNoNivelSuperior(normalizado, palavra, idxWhere + 'where'.length);
    if (idx >= 0) fim = Math.min(fim, idx);
  }

  const inicioConteudo = idxWhere + 'where'.length;
  return {
    original: original.slice(inicioConteudo, fim).trim(),
    normalizado: normalizado.slice(inicioConteudo, fim).trim(),
  };
}

function comparacaoNumericaConstanteVerdadeira(expressao: string): boolean {
  const match = expressao.match(/^(-?\d+(?:\.\d+)?)\s*(=|!=|<>|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return false;
  const [, esquerda, operador, direita] = match;
  const a = Number(esquerda);
  const b = Number(direita);
  return Boolean(
    {
      '=': a === b,
      '!=': a !== b,
      '<>': a !== b,
      '>': a > b,
      '<': a < b,
      '>=': a >= b,
      '<=': a <= b,
    }[operador]
  );
}

function comparacaoIdenticaVerdadeira(expressao: string): boolean {
  const semEspacos = expressao.replace(/\s+/g, ' ').trim();
  const comparacao = semEspacos.match(
    /^([a-z_][a-z0-9_.]*)\s*(=|>=|<=|is\s+not\s+distinct\s+from)\s*([a-z_][a-z0-9_.]*)$/i
  );
  if (!comparacao) return false;
  const esquerda = comparacao[1].toLowerCase();
  const direita = comparacao[3].toLowerCase();
  return esquerda === direita;
}

function ehTautologia(expressao: string): boolean {
  const texto = removerParentesesExternos(expressao.toLowerCase().replace(/\s+/g, ' ').trim());
  const disjuntos = separarNoNivelSuperior(texto, 'or');
  if (disjuntos.length > 1) return disjuntos.some(ehTautologia);

  const conjuntos = separarNoNivelSuperior(texto, 'and');
  if (conjuntos.length > 1) return conjuntos.every(ehTautologia);

  return (
    texto === 'true' ||
    texto === 'not false' ||
    texto === 'not (false)' ||
    texto === 'null is null' ||
    texto === 'current_date = current_date' ||
    /^current_timestamp\s*(=|>=|<=)\s*current_timestamp$/.test(texto) ||
    /^now\(\)\s*=\s*now\(\)$/.test(texto) ||
    comparacaoIdenticaVerdadeira(texto) ||
    comparacaoNumericaConstanteVerdadeira(texto)
  );
}

function possuiPredicadoRestritivo(where: string): boolean {
  if (separarNoNivelSuperior(where, 'or').length > 1) return false;

  return separarNoNivelSuperior(where, 'and').some((termo) => {
    const texto = removerParentesesExternos(termo).trim();
    if (/^[a-z_][a-z0-9_.]*\s+is\s+(?:not\s+)?null$/i.test(texto)) return false;
    if (comparacaoIdenticaVerdadeira(texto)) return false;

    return /\b[a-z_][a-z0-9_.]*\s*(=|!=|<>|>=|<=|>|<|\bin\b)/i.test(texto);
  });
}

function detectarFuncaoPerigosa(statement: string): string | null {
  for (const entrada of FUNCOES_COM_EFEITO_COLATERAL) {
    if (entrada.regex.test(statement)) return entrada.motivo;
  }
  return null;
}

function extrairChamadasDeFuncao(
  statement: string
): Array<{ schema: string | null; nome: string }> {
  const chamadas: Array<{ schema: string | null; nome: string }> = [];
  const regex = /\b(?:(?<schema>[a-z_][a-z0-9_]*)\s*\.\s*)?(?<nome>[a-z_][a-z0-9_]*)\s*\(/gi;

  for (const match of statement.matchAll(regex)) {
    const schema = match.groups?.schema?.toLowerCase() ?? null;
    const nome = match.groups?.nome?.toLowerCase() ?? null;
    if (!nome || TOKENS_NAO_FUNCAO.has(nome)) continue;
    chamadas.push({ schema, nome });
  }

  return chamadas;
}

function validarChamadasSelect(statement: string): string | null {
  let alvo = statement;
  const idxSelect = encontrarKeywordNoNivelSuperior(statement, 'select');
  if (idxSelect >= 0) {
    alvo = statement.slice(idxSelect);
  }

  for (const chamada of extrairChamadasDeFuncao(alvo)) {
    if (chamada.nome === 'pg_sleep') {
      return 'Função pg_sleep não é permitida no MCP';
    }

    if (chamada.schema && chamada.schema !== 'pg_catalog') {
      return `Função ${chamada.schema}.${chamada.nome} não está allowlisted para SELECT no MCP`;
    }

    const allowlisted =
      FUNCOES_SELECT_ALLOWLIST.has(chamada.nome) ||
      PREFIXOS_FUNCAO_SELECT_ALLOWLIST.some((prefixo) => chamada.nome.startsWith(prefixo));
    if (!allowlisted) {
      return `Função ${chamada.nome} não está allowlisted para SELECT no MCP`;
    }
  }

  return null;
}

function ehColunaIdentidadeOuTenant(identificador: string): boolean {
  const ultimaParte = identificador.split('.').pop()?.toLowerCase() ?? '';
  return COLUNAS_IDENTIDADE_OU_TENANT.has(ultimaParte);
}

function ehLiteralSimples(expressao: string): boolean {
  const texto = expressao.trim();
  return (
    /^-?\d+(?:\.\d+)?(?:\s*::\s*[a-z_][a-z0-9_.]*(?:\[\])?)?$/i.test(texto) ||
    /^(?:true|false)(?:\s*::\s*[a-z_][a-z0-9_.]*(?:\[\])?)?$/i.test(texto) ||
    /^'(?:''|[^'])*'(?:\s*::\s*[a-z_][a-z0-9_.]*(?:\[\])?)?$/i.test(texto)
  );
}

function termoTemIdentidadeIgualLiteral(termoOriginal: string, termoNormalizado: string): boolean {
  const original = removerParentesesExternos(termoOriginal).trim();
  const normalizado = removerParentesesExternos(termoNormalizado).trim();

  const match = normalizado.match(/^([a-z_][a-z0-9_.]*)\s*=\s*(.+)$/i);
  if (!match) return false;

  const esquerdaNormalizada = match[1];
  const idxIgual = normalizado.indexOf('=');
  if (idxIgual < 0) return false;

  const esquerdaOriginal = removerParentesesExternos(original.slice(0, idxIgual)).trim();
  const direitaOriginal = removerParentesesExternos(original.slice(idxIgual + 1)).trim();

  if (esquerdaOriginal.toLowerCase() !== esquerdaNormalizada.toLowerCase()) {
    return false;
  }

  return ehColunaIdentidadeOuTenant(esquerdaOriginal) && ehLiteralSimples(direitaOriginal);
}

function validarWhereEstrito(
  statementOriginal: string,
  statementNormalizado: string
): string | null {
  const where = extrairFaixaWhere(statementOriginal, statementNormalizado);
  if (!where) return 'Escrita sem WHERE';
  if (!where.normalizado) return 'Escrita sem WHERE';
  if (/\bor\b/i.test(where.normalizado)) {
    return 'WHERE com OR exige allow_all_rows:true';
  }
  if (/\b(select|exists)\b/i.test(where.normalizado)) {
    return 'Subconsulta em escrita exige allow_all_rows:true';
  }
  if (ehTautologia(where.normalizado)) return 'WHERE tautológico';

  const termos = separarNoNivelSuperiorComFaixas(where.normalizado, 'and');
  const encontrouIdentidade = termos.some((termo) =>
    termoTemIdentidadeIgualLiteral(where.original.slice(termo.inicio, termo.fim), termo.trecho)
  );

  if (!encontrouIdentidade) {
    return 'WHERE padrão exige igualdade por identidade/tenant a literal';
  }

  return null;
}

export function analisarSqlMcp(sql: string): AnaliseSqlMcp {
  if (temIdentificadorQuoted(sql)) {
    return {
      sqlNormalizado: sql,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: false,
      motivoBloqueio: 'Identificadores quoted não são suportados pelo MCP',
    };
  }

  const normalizado = removerComentariosELiterais(sql);
  if (normalizado.invalido) {
    return {
      sqlNormalizado: normalizado.sql,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: false,
      motivoBloqueio: 'SQL com literal ou comentário não terminado',
    };
  }

  const statement = normalizado.sql.trim().replace(/;\s*$/, '');
  if (!statement) {
    return {
      sqlNormalizado: statement,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: false,
      motivoBloqueio: 'SQL vazio',
    };
  }

  if (statement.includes(';')) {
    return {
      sqlNormalizado: statement,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: false,
      motivoBloqueio: 'Apenas um statement é permitido por operação',
    };
  }

  const funcaoPerigosa = detectarFuncaoPerigosa(statement);
  if (funcaoPerigosa) {
    return {
      sqlNormalizado: statement,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: false,
      motivoBloqueio: funcaoPerigosa,
    };
  }

  const estrutura = extrairEstruturaComando(statement);
  if (estrutura.motivoBloqueio) {
    return {
      sqlNormalizado: statement,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: estrutura.usaCte,
      motivoBloqueio: estrutura.motivoBloqueio,
    };
  }

  const comando = estrutura.comando?.toLowerCase() ?? null;
  const motivoComandoBloqueado = comando ? (COMANDOS_BLOQUEADOS_FIXOS[comando] ?? null) : null;
  if (motivoComandoBloqueado) {
    return {
      sqlNormalizado: statement,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: estrutura.usaCte,
      motivoBloqueio: motivoComandoBloqueado,
    };
  }

  if (estrutura.usaCte && ['insert', 'update', 'delete'].includes(comando ?? '')) {
    return {
      sqlNormalizado: statement,
      comando: null,
      somenteLeitura: false,
      escrita: false,
      usaCte: true,
      motivoBloqueio: 'Escritas com CTE não são permitidas no MCP',
    };
  }

  if (
    comando === 'select' &&
    /\bfor\s+(update|share|no\s+key\s+update|key\s+share)\b/i.test(statement)
  ) {
    return {
      sqlNormalizado: statement,
      comando: 'select',
      somenteLeitura: false,
      escrita: false,
      usaCte: estrutura.usaCte,
      motivoBloqueio: 'SELECT com lock não é permitido no MCP',
    };
  }

  if (comando === 'select' && /\bselect\b[\s\S]*\binto\b/i.test(statement)) {
    return {
      sqlNormalizado: statement,
      comando: 'select',
      somenteLeitura: false,
      escrita: false,
      usaCte: estrutura.usaCte,
      motivoBloqueio: 'SELECT INTO não é permitido no MCP',
    };
  }

  if (
    comando === 'select' ||
    (comando === 'insert' && encontrarKeywordNoNivelSuperior(statement, 'select') >= 0)
  ) {
    const motivoFuncaoNaoAllowlisted = validarChamadasSelect(statement);
    if (motivoFuncaoNaoAllowlisted) {
      return {
        sqlNormalizado: statement,
        comando: comando as ComandoSqlMcp,
        somenteLeitura: false,
        escrita: comando === 'insert',
        usaCte: estrutura.usaCte,
        motivoBloqueio: motivoFuncaoNaoAllowlisted,
      };
    }
  }

  if (comando === 'select') {
    return {
      sqlNormalizado: statement,
      comando: 'select',
      somenteLeitura: true,
      escrita: false,
      usaCte: estrutura.usaCte,
      motivoBloqueio: null,
    };
  }

  if (comando === 'insert' || comando === 'update' || comando === 'delete') {
    return {
      sqlNormalizado: statement,
      comando,
      somenteLeitura: false,
      escrita: true,
      usaCte: estrutura.usaCte,
      motivoBloqueio: null,
    };
  }

  return {
    sqlNormalizado: statement,
    comando: null,
    somenteLeitura: false,
    escrita: false,
    usaCte: estrutura.usaCte,
    motivoBloqueio: 'Comando SQL não suportado no MCP',
  };
}

/** Retorna o motivo do bloqueio; `null` significa escrita segura no modo padrão. */
export function validarEscritaEscopada(sql: string): string | null {
  const analise = analisarSqlMcp(sql);
  if (analise.motivoBloqueio) return analise.motivoBloqueio;
  if (!analise.escrita) return null;

  const statement = sql.trim().replace(/;\s*$/, '');
  if (analise.comando === 'insert') {
    if (encontrarKeywordNoNivelSuperior(analise.sqlNormalizado, 'select') < 0) {
      return null;
    }
    const motivoWhere = validarWhereEstrito(statement, analise.sqlNormalizado);
    if (motivoWhere) {
      return 'INSERT ... SELECT amplo exige allow_all_rows:true';
    }
    return null;
  }

  const motivoWhere = validarWhereEstrito(statement, analise.sqlNormalizado);
  if (motivoWhere) {
    return motivoWhere
      .replace(/^Escrita sem WHERE$/, 'DELETE/UPDATE sem WHERE')
      .replace(
        /^WHERE padrão exige igualdade por identidade\/tenant a literal$/,
        'DELETE/UPDATE padrão exige igualdade por identidade/tenant a literal'
      );
  }

  return null;
}
