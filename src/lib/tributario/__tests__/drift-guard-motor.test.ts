import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Guarda de deriva estrutural (drift guard) entre as duas cópias do motor tributário.
 *
 * O motor vive duplicado por uma restrição de runtime: o bundle das Edge Functions
 * (Deno) não pode importar de `src/`. Enquanto a duplicação existir, este teste
 * garante que qualquer alteração de LÓGICA feita em um lado seja replicada no outro.
 *
 * A comparação ignora comentários, espaçamento e o CONTEÚDO de literais de texto
 * (mensagens ao usuário podem divergir em acentuação/estilo sem impacto fiscal),
 * mas falha diante de qualquer divergência de fórmula, condicional ou constante.
 */

const FRONT = resolve(__dirname, '../shared-logic.ts');
const EDGE = resolve(__dirname, '../../../../supabase/functions/_shared/tributario-logic.ts');

/** Remove comentários de linha e de bloco preservando o restante do código. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Neutraliza o conteúdo de strings e templates, mantendo interpolações relevantes. */
function stripStringContents(src: string): string {
  return src
    .replace(/`(?:[^`\\]|\\.)*`/g, '`STR`')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "'STR'")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '"STR"');
}

function normalize(src: string): string {
  return stripStringContents(stripComments(src))
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:?])\s*/g, '$1')
    .trim();
}

/** Extrai o corpo de uma função exportada por balanceamento de chaves. */
function extractFunction(src: string, name: string): string {
  const idx = src.indexOf(`export function ${name}`);
  expect(idx, `função ${name} não encontrada`).toBeGreaterThanOrEqual(0);
  const start = src.indexOf('{', src.indexOf(')', idx));
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`Corpo da função ${name} não pôde ser delimitado.`);
}

const frontSrc = readFileSync(FRONT, 'utf8');
const edgeSrc = readFileSync(EDGE, 'utf8');

const FUNCOES = [
  'calcularRBT12',
  'calcularFolha12m',
  'determinarAnexoSimples',
  'simularSimples',
  'simularPresumido',
  'simularReal',
] as const;

describe('Drift guard: motor tributário front x Edge Function', () => {
  it.each(FUNCOES)('a função %s é logicamente idêntica nas duas cópias', (nome) => {
    const a = normalize(extractFunction(frontSrc, nome));
    const b = normalize(extractFunction(edgeSrc, nome));
    expect(
      b,
      `Deriva detectada em "${nome}". Replique a alteração em supabase/functions/_shared/tributario-logic.ts e src/lib/tributario/shared-logic.ts.`,
    ).toBe(a);
  });

  it('mantém as constantes fiscais e a tabela de anexos idênticas', () => {
    const trecho = (src: string, marcador: string) => {
      const i = src.indexOf(marcador);
      expect(i, marcador).toBeGreaterThanOrEqual(0);
      return normalize(src.slice(i, src.indexOf('\n', src.indexOf(';', i))));
    };
    for (const c of ['export const LIMITE_SIMPLES', 'export const LIMITE_PRESUMIDO']) {
      expect(trecho(edgeSrc, c)).toBe(trecho(frontSrc, c));
    }
    const anexos = (src: string) => {
      const i = src.indexOf('export const ANEXOS');
      return normalize(src.slice(i, src.indexOf('};', i)));
    };
    expect(anexos(edgeSrc)).toBe(anexos(frontSrc));
  });

  it('mantém as assinaturas de tipo públicas alinhadas', () => {
    const iface = (src: string, nome: string) => {
      const i = src.indexOf(`export interface ${nome}`);
      expect(i, nome).toBeGreaterThanOrEqual(0);
      const body = src.slice(i, src.indexOf('\n}', i));
      // Extrai apenas os nomes de campo e sua opcionalidade — ordem irrelevante.
      return [...body.matchAll(/^\s{2}(\w+)(\??):/gm)].map((m) => m[1] + m[2]).sort();
    };
    for (const nome of ['ParametrosSimulacao', 'ResultadoCenario', 'FaturamentoMes', 'FolhaMes']) {
      expect(iface(edgeSrc, nome), nome).toEqual(iface(frontSrc, nome));
    }
  });
});
