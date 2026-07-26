/**
 * Utilitários de comparação de código-fonte para "drift guards".
 *
 * Vários módulos do domínio fiscal existem em duas cópias: uma em `src/` (usada
 * pela UI) e outra em `supabase/functions/_shared/` (executada no runtime Deno,
 * que não pode importar de `src/`). Estes helpers permitem comparar as cópias
 * ignorando diferenças irrelevantes (comentários, espaçamento, extensão `.ts`
 * nos imports) mas expondo qualquer divergência de lógica.
 */

/** Remove comentários de linha e de bloco preservando o restante do código. */
export function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Neutraliza o conteúdo de strings/templates: mensagens podem divergir em estilo. */
export function stripStringContents(src: string): string {
  return src
    .replace(/`(?:[^`\\]|\\.)*`/g, '`STR`')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "'STR'")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '"STR"');
}

/** Remove todas as declarações de import (os caminhos divergem por runtime). */
export function stripImports(src: string): string {
  return src
    .replace(/^\s*import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '');
}

/** Normalização canônica usada nas comparações de lógica. */
export function normalizeSource(src: string, opts: { keepStrings?: boolean } = {}): string {
  const semComentarios = stripComments(stripImports(src));
  const base = opts.keepStrings ? semComentarios : stripStringContents(semComentarios);
  return base
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:?])\s*/g, '$1')
    .trim();
}

/** Extrai o corpo de uma função/declaração exportada por balanceamento de chaves. */
export function extractBlock(src: string, marcador: string): string {
  const idx = src.indexOf(marcador);
  if (idx < 0) throw new Error(`Marcador não encontrado: ${marcador}`);
  const start = src.indexOf('{', idx);
  if (start < 0) throw new Error(`Bloco não encontrado para: ${marcador}`);
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`Bloco não delimitado para: ${marcador}`);
}

/** Lista os nomes exportados (funções, consts, tipos e interfaces) de um módulo. */
export function exportedNames(src: string): string[] {
  const nomes = [
    ...src.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g),
    ...src.matchAll(/export\s+const\s+(\w+)/g),
    ...src.matchAll(/export\s+(?:interface|type|enum)\s+(\w+)/g),
  ].map((m) => m[1]);
  return [...new Set(nomes)].sort();
}
