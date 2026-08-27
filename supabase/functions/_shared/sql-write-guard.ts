/**
 * Guard conservador para escritas administrativas do MCP.
 *
 * Este módulo não tenta interpretar SQL inteiro. Em vez disso, permite apenas
 * UPDATE/DELETE de um único statement com predicado simples e verificável. SQL
 * complexo continua possível, mas requer `allow_all_rows: true`, uma decisão
 * explícita e auditável do operador autenticado.
 */

function removerComentariosELiterais(sql: string): { sql: string; invalido: boolean } {
  let saida = '';
  let i = 0;
  let aspas: "'" | '"' | null = null;
  let comentarioLinha = false;
  let comentarioBloco = false;

  while (i < sql.length) {
    const atual = sql[i];
    const proximo = sql[i + 1];

    if (comentarioLinha) {
      if (atual === '\n') {
        comentarioLinha = false;
        saida += '\n';
      } else saida += ' ';
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
    } else if (atual === '/' && proximo === '*') {
      comentarioBloco = true;
      saida += '  ';
      i += 2;
    } else if (atual === "'" || atual === '"') {
      aspas = atual;
      saida += ' ';
      i++;
    } else {
      saida += atual;
      i++;
    }
  }

  return { sql: saida, invalido: Boolean(aspas || comentarioBloco) };
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
  const limite = expressao.length;
  const padrao = new RegExp(`\\s+${operador}\\s+`, 'iy');

  for (let i = 0; i < limite; i++) {
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

function comparacaoNumericaConstanteVerdadeira(expressao: string): boolean {
  const match = expressao.match(/^(-?\d+(?:\.\d+)?)\s*(=|!=|<>|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return false;
  const [, esquerda, operador, direita] = match;
  const a = Number(esquerda);
  const b = Number(direita);
  return Boolean(({ '=': a === b, '!=': a !== b, '<>': a !== b, '>': a > b, '<': a < b, '>=': a >= b, '<=': a <= b })[operador]);
}

function ehTautologia(expressao: string): boolean {
  const texto = removerParentesesExternos(expressao.toLowerCase().replace(/\s+/g, ' ').trim());
  const disjuntos = separarNoNivelSuperior(texto, 'or');
  if (disjuntos.length > 1) return disjuntos.some(ehTautologia);
  const conjuntos = separarNoNivelSuperior(texto, 'and');
  if (conjuntos.length > 1) return conjuntos.every(ehTautologia);

  return texto === 'true'
    || texto === 'not false'
    || texto === 'not (false)'
    || texto === 'null is null'
    || texto === 'current_date = current_date'
    || /^current_timestamp\s*(=|>=|<=)\s*current_timestamp$/.test(texto)
    || /^now\(\)\s*=\s*now\(\)$/.test(texto)
    || comparacaoNumericaConstanteVerdadeira(texto);
}

/** Retorna o motivo do bloqueio; `null` significa escrita segura no modo padrão. */
export function validarEscritaEscopada(sql: string): string | null {
  const normalizado = removerComentariosELiterais(sql);
  if (normalizado.invalido) return 'SQL com literal ou comentário não terminado';

  const statement = normalizado.sql.trim().replace(/;\s*$/, '');
  if (!statement || statement.includes(';')) return 'Apenas um statement é permitido por operação';
  if (!/^(update\s+[^\s]+\s+set\b|delete\s+from\s+[^\s]+)/i.test(statement)) return null;
  if (/^with\b/i.test(statement)) return 'Escritas com CTE exigem allow_all_rows:true';

  const where = statement.match(/\bwhere\b([\s\S]+)$/i)?.[1]?.trim();
  if (!where) return 'DELETE/UPDATE sem WHERE';
  if (/\b(select|exists)\b/i.test(where)) return 'Subconsulta em escrita exige allow_all_rows:true';
  if (ehTautologia(where)) return 'WHERE tautológico';

  // Exige ao menos uma comparação cujo lado esquerdo seja um identificador.
  // `IS NULL` é permitido porque é um predicado restritivo comum.
  if (!/\b[a-z_][a-z0-9_.]*\s*(=|!=|<>|>=|<=|>|<|\bin\b|\bis\s+(?:not\s+)?null\b)/i.test(where)) {
    return 'WHERE sem predicado restritivo verificável';
  }
  return null;
}
