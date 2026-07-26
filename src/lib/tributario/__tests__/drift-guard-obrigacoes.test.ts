import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { normalizeSource, exportedNames } from '@/test/utils/source-drift';

/**
 * Drift guard do módulo de obrigações acessórias.
 *
 * O motor de obrigações vive duplicado (`src/lib/tributario/obrigacoes` ×
 * `supabase/functions/_shared/obrigacoes`) porque o runtime Deno das Edge
 * Functions não consegue importar de `src/`. Já existem testes de paridade
 * COMPORTAMENTAL (calendário, prazos, conformidade); este teste adiciona a
 * camada ESTRUTURAL: qualquer alteração de lógica feita em apenas um lado
 * quebra o CI, inclusive em módulos sem cobertura comportamental direta
 * (alertas, digest, preferências).
 */

const RAIZ_WEB = resolve(__dirname, '../obrigacoes');
const RAIZ_EDGE = resolve(__dirname, '../../../../supabase/functions/_shared/obrigacoes');

/** Módulos espelhados 1:1 entre os dois runtimes. */
const MODULOS = ['types', 'catalogo', 'calendario', 'conformidade', 'alertas', 'digest', 'preferencias-digest'] as const;

/**
 * Blocos que legitimamente existem apenas no espelho Deno (não há como importar
 * de `src/`). São removidos antes da comparação e validados separadamente.
 */
const EXPORTS_LOCAIS_EDGE: Partial<Record<(typeof MODULOS)[number], string[]>> = {
  alertas: ['PontoHistorico'],
};

function ler(raiz: string, modulo: string): string {
  const caminho = resolve(raiz, `${modulo}.ts`);
  expect(existsSync(caminho), `arquivo ausente: ${caminho}`).toBe(true);
  return readFileSync(caminho, 'utf8');
}

/** Remove do fonte as interfaces/tipos declarados apenas no espelho. */
function removerExportsLocais(src: string, nomes: string[]): string {
  let out = src;
  for (const nome of nomes) {
    out = out.replace(new RegExp(`export interface ${nome}\\s*\\{[\\s\\S]*?\\n\\}`, 'g'), '');
    out = out.replace(new RegExp(`export type ${nome}\\s*=[\\s\\S]*?;`, 'g'), '');
  }
  return out;
}

describe('Drift guard: obrigações acessórias (web × Edge Function)', () => {
  it.each(MODULOS)('o módulo "%s" é logicamente idêntico nas duas cópias', (modulo) => {
    const web = ler(RAIZ_WEB, modulo);
    const edgeBruto = ler(RAIZ_EDGE, modulo);
    const edge = removerExportsLocais(edgeBruto, EXPORTS_LOCAIS_EDGE[modulo] ?? []);

    expect(
      normalizeSource(edge),
      `Deriva detectada em obrigacoes/${modulo}.ts. Replique a alteração nas duas cópias ` +
        '(src/lib/tributario/obrigacoes e supabase/functions/_shared/obrigacoes).',
    ).toBe(normalizeSource(web));
  });

  it('expõe exatamente a mesma superfície pública por módulo', () => {
    for (const modulo of MODULOS) {
      const web = exportedNames(ler(RAIZ_WEB, modulo));
      const locais = EXPORTS_LOCAIS_EDGE[modulo] ?? [];
      const edge = exportedNames(ler(RAIZ_EDGE, modulo)).filter((n) => !locais.includes(n));
      expect(edge, `superfície divergente em ${modulo}`).toEqual(web);
    }
  });

  it('mantém as funções de dias úteis do espelho idênticas às do módulo DARF', () => {
    // No web, `anteciparDiaUtil`/`isDiaUtil` vivem em darf/tabelas e
    // `parsePeriodo`/`round2` em darf/vencimento; no espelho Deno tudo foi
    // consolidado em obrigacoes/dias-uteis.ts.
    const edge = readFileSync(resolve(RAIZ_EDGE, 'dias-uteis.ts'), 'utf8');
    const tabelas = readFileSync(resolve(__dirname, '../darf/tabelas.ts'), 'utf8');
    const vencimento = readFileSync(resolve(__dirname, '../darf/vencimento.ts'), 'utf8');

    const corpo = (src: string, nome: string) => {
      const i = src.indexOf(`export function ${nome}`);
      expect(i, `${nome} não encontrado`).toBeGreaterThanOrEqual(0);
      const inicio = src.indexOf('{', src.indexOf(')', i));
      let depth = 0;
      for (let j = inicio; j < src.length; j += 1) {
        if (src[j] === '{') depth += 1;
        else if (src[j] === '}') {
          depth -= 1;
          if (depth === 0) return normalizeSource(src.slice(inicio, j + 1));
        }
      }
      throw new Error(`bloco de ${nome} não delimitado`);
    };

    for (const [nome, fonte] of [
      ['isDiaUtil', tabelas],
      ['anteciparDiaUtil', tabelas],
      ['parsePeriodo', vencimento],
      ['round2', vencimento],
    ] as const) {
      expect(corpo(edge, nome), `deriva em dias-uteis.ts :: ${nome}`).toBe(corpo(fonte, nome));
    }
  });
});
