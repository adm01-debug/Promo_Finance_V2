/**
 * Guarda de drift arquitetural: compara o grafo REAL de imports do repositório
 * com o manifesto declarado em `modulos.ts`.
 *
 * Falha o build quando alguém cria um acoplamento entre módulos sem antes
 * declará-lo — o manifesto deixa de ser documentação e vira contrato executável.
 */

import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';

import {
  analisarDrift,
  arquivosDoModulo,
  construirGrafoObservado,
  extrairImports,
  moduloDoArquivo,
  resolverEspecificador,
} from '../analisador-imports';
import { MODULOS, detectarCiclos, obterModulo, violacoesDeCamada } from '../modulos';

const RAIZ = resolve(__dirname, '../../../..');

describe('analisador de imports — primitivas', () => {
  it('extrai imports estáticos, re-exports e imports dinâmicos', () => {
    const fonte = [
      "import { a } from './a';",
      "import type { B } from '../b';",
      "export { c } from '@/c';",
      "export type { D } from '@/d';",
      "const e = await import('./e');",
      "// import { f } from './f';",
    ].join('\n');

    const imports = extrairImports(fonte);
    const specs = imports.map((i) => i.especificador);
    expect(specs).toContain('./a');
    expect(specs).toContain('../b');
    expect(specs).toContain('@/c');
    expect(specs).toContain('./e');
  });

  it('marca corretamente imports somente de tipo', () => {
    const imports = extrairImports("import type { B } from '../b';\nimport { a } from './a';");
    expect(imports.find((i) => i.especificador === '../b')?.tipoApenas).toBe(true);
    expect(imports.find((i) => i.especificador === './a')?.tipoApenas).toBe(false);
  });

  it('resolve alias @/ e caminhos relativos, ignorando pacotes externos', () => {
    expect(resolverEspecificador('src/pages/X.tsx', '@/lib/y')).toBe('src/lib/y');
    expect(resolverEspecificador('src/lib/tributario/a/b.ts', '../c/d')).toBe('src/lib/tributario/c/d');
    expect(resolverEspecificador('src/lib/a.ts', 'react')).toBeNull();
    expect(resolverEspecificador('src/lib/a.ts', 'https://esm.sh/zod')).toBeNull();
  });

  it('atribui cada arquivo ao módulo com o caminho mais específico', () => {
    const indice = new Map([
      ['src/lib/tributario/catalogos', 'M11' as const],
      ['src/lib/tributario/catalogos/coerencia-iss.ts', 'M10' as const],
    ]);
    expect(moduloDoArquivo('src/lib/tributario/catalogos/tabelas.ts', indice)).toBe('M11');
    expect(moduloDoArquivo('src/lib/tributario/catalogos/coerencia-iss.ts', indice)).toBe('M10');
    expect(moduloDoArquivo('src/pages/Outro.tsx', indice)).toBeNull();
  });
});

describe('conformidade do grafo real com o manifesto', () => {
  const drift = analisarDrift(RAIZ);

  it('não possui dependências entre módulos fora do manifesto', () => {
    const resumo = drift.naoDeclaradas.map(
      (a) => `${a.de} -> ${a.para} (${a.arquivo} importa "${a.especificador}")`,
    );
    expect(resumo).toEqual([]);
  });

  it('não possui inversão de camadas no código real', () => {
    const resumo = drift.inversoesDeCamada.map((a) => `${a.de} -> ${a.para} em ${a.arquivo}`);
    expect(resumo).toEqual([]);
  });

  it('mantém o grafo declarado acíclico após os ajustes', () => {
    expect(detectarCiclos()).toEqual([]);
    expect(violacoesDeCamada()).toEqual([]);
  });

  it('nenhum módulo do núcleo puro importa infraestrutura em runtime', () => {
    const puros = MODULOS.filter((m) => m.puro).map((m) => m.id);
    const violacoes = construirGrafoObservado(RAIZ)
      .filter((a) => !a.tipoApenas && puros.includes(a.de))
      .filter((a) => !obterModulo(a.para).puro)
      .filter((a) => a.arquivo !== 'src/lib/tributario/catalogos/repositorio.ts')
      .map((a) => `${a.arquivo} -> ${a.para}`);
    expect(violacoes).toEqual([]);
  });

  it('todo módulo do manifesto resolve para ao menos um arquivo real', () => {
    const vazios = MODULOS.filter((m) => arquivosDoModulo(RAIZ, m).length === 0).map((m) => m.id);
    // Módulos cujos caminhos são apenas Edge Functions Deno ainda devem existir em disco.
    expect(vazios).toEqual([]);
  });
});
