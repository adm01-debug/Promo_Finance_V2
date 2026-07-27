/**
 * Analisador estático do grafo REAL de imports do repositório.
 *
 * O manifesto (`modulos.ts`) declara a arquitetura pretendida. Este analisador
 * lê o código-fonte de fato e monta o grafo observado, permitindo comparar
 * intenção x realidade ("drift arquitetural").
 *
 * É um módulo puro em termos de domínio, porém depende de `node:fs`/`node:path`
 * porque roda apenas em ambiente de teste/CI — nunca é importado pelo bundle
 * do navegador.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize, relative, resolve, sep } from 'node:path';

import { MODULOS, type Modulo, type ModuloId } from './modulos';

const EXTENSOES = ['.ts', '.tsx'] as const;
const IGNORAR_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '__snapshots__']);

/** Regex que captura imports estáticos, `export ... from` e `import()` dinâmico. */
const RE_IMPORT = /(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

export interface ArestaObservada {
  readonly de: ModuloId;
  readonly para: ModuloId;
  /** Arquivo de origem (relativo à raiz) que gerou a aresta. */
  readonly arquivo: string;
  /** Especificador de import literal. */
  readonly especificador: string;
}

export interface RelatorioDrift {
  /** Arestas presentes no código mas ausentes no manifesto. */
  readonly naoDeclaradas: readonly ArestaObservada[];
  /** Dependências declaradas no manifesto sem nenhum import correspondente. */
  readonly declaradasSemUso: readonly { de: ModuloId; para: ModuloId }[];
  /** Arestas que invertem a direção das camadas (dependência para camada superior). */
  readonly inversoesDeCamada: readonly ArestaObservada[];
}

function normalizarPosix(caminho: string): string {
  return caminho.split(sep).join('/');
}

function listarArquivos(raiz: string, diretorio: string, acc: string[]): string[] {
  let entradas: string[];
  try {
    entradas = readdirSync(diretorio);
  } catch {
    return acc;
  }
  for (const entrada of entradas) {
    if (IGNORAR_DIRS.has(entrada)) continue;
    const completo = join(diretorio, entrada);
    let info;
    try {
      info = statSync(completo);
    } catch {
      continue;
    }
    if (info.isDirectory()) {
      listarArquivos(raiz, completo, acc);
    } else if (EXTENSOES.some((ext) => entrada.endsWith(ext))) {
      acc.push(normalizarPosix(relative(raiz, completo)));
    }
  }
  return acc;
}

/** Lista todos os arquivos-fonte pertencentes aos caminhos de um módulo. */
export function arquivosDoModulo(raiz: string, modulo: Modulo): string[] {
  const arquivos: string[] = [];
  for (const caminho of modulo.caminhos) {
    const absoluto = resolve(raiz, caminho);
    let info;
    try {
      info = statSync(absoluto);
    } catch {
      continue; // ausência é validada por outro teste do manifesto
    }
    if (info.isDirectory()) listarArquivos(raiz, absoluto, arquivos);
    else if (EXTENSOES.some((ext) => caminho.endsWith(ext))) arquivos.push(normalizarPosix(caminho));
  }
  return [...new Set(arquivos)].sort();
}

/** Mapeia um arquivo (relativo à raiz) para o módulo que o contém, se houver. */
export function moduloDoArquivo(arquivo: string, indice: ReadonlyMap<string, ModuloId>): ModuloId | null {
  const alvo = normalizarPosix(arquivo);
  let melhor: { prefixo: string; id: ModuloId } | null = null;
  for (const [prefixo, id] of indice) {
    const casa = alvo === prefixo || alvo.startsWith(`${prefixo}/`);
    if (!casa) continue;
    if (!melhor || prefixo.length > melhor.prefixo.length) melhor = { prefixo, id };
  }
  return melhor?.id ?? null;
}

function construirIndice(modulos: readonly Modulo[]): Map<string, ModuloId> {
  const indice = new Map<string, ModuloId>();
  for (const modulo of modulos) {
    for (const caminho of modulo.caminhos) indice.set(normalizarPosix(caminho), modulo.id);
  }
  return indice;
}

/** Extrai os especificadores de import de um arquivo-fonte. */
export function extrairImports(conteudo: string): string[] {
  const encontrados: string[] = [];
  RE_IMPORT.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE_IMPORT.exec(conteudo)) !== null) {
    const spec = m[1] ?? m[2];
    if (spec) encontrados.push(spec);
  }
  return encontrados;
}

/**
 * Resolve um especificador para um caminho relativo à raiz do projeto.
 * Suporta alias `@/` (→ `src/`) e caminhos relativos. Retorna `null` para
 * pacotes externos (bare specifiers) e URLs (Deno/esm.sh).
 */
export function resolverEspecificador(arquivoOrigem: string, especificador: string): string | null {
  if (especificador.startsWith('@/')) return `src/${especificador.slice(2)}`;
  if (especificador.startsWith('.')) {
    const dir = normalizarPosix(arquivoOrigem).split('/').slice(0, -1).join('/');
    return normalizarPosix(normalize(`${dir}/${especificador}`));
  }
  return null;
}

/** Constrói o grafo observado de arestas entre módulos a partir do código. */
export function construirGrafoObservado(raiz: string, modulos: readonly Modulo[] = MODULOS): ArestaObservada[] {
  const indice = construirIndice(modulos);
  const arestas: ArestaObservada[] = [];

  for (const modulo of modulos) {
    for (const arquivo of arquivosDoModulo(raiz, modulo)) {
      let conteudo: string;
      try {
        conteudo = readFileSync(resolve(raiz, arquivo), 'utf8');
      } catch {
        continue;
      }
      for (const especificador of extrairImports(conteudo)) {
        const alvo = resolverEspecificador(arquivo, especificador);
        if (!alvo) continue;
        const destino = moduloDoArquivo(alvo, indice);
        if (!destino || destino === modulo.id) continue;
        arestas.push({ de: modulo.id, para: destino, arquivo, especificador });
      }
    }
  }
  return arestas;
}

/** Compara o grafo observado com o manifesto e devolve o relatório de drift. */
export function analisarDrift(raiz: string, modulos: readonly Modulo[] = MODULOS): RelatorioDrift {
  const porId = new Map<ModuloId, Modulo>(modulos.map((m) => [m.id, m]));
  const observadas = construirGrafoObservado(raiz, modulos);

  const declarado = new Set<string>();
  for (const modulo of modulos) {
    for (const dep of modulo.dependencias) declarado.add(`${modulo.id}->${dep}`);
  }

  const vistas = new Set<string>();
  const naoDeclaradas: ArestaObservada[] = [];
  const inversoesDeCamada: ArestaObservada[] = [];

  for (const aresta of observadas) {
    const chave = `${aresta.de}->${aresta.para}`;
    vistas.add(chave);
    if (!declarado.has(chave)) naoDeclaradas.push(aresta);

    const origem = porId.get(aresta.de);
    const destino = porId.get(aresta.para);
    if (origem && destino && destino.camada < origem.camada) inversoesDeCamada.push(aresta);
  }

  const declaradasSemUso: { de: ModuloId; para: ModuloId }[] = [];
  for (const chave of declarado) {
    if (vistas.has(chave)) continue;
    const [de, para] = chave.split('->') as [ModuloId, ModuloId];
    declaradasSemUso.push({ de, para });
  }

  return { naoDeclaradas, declaradasSemUso, inversoesDeCamada };
}
