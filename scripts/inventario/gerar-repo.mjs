#!/usr/bin/env node
// Inventario gerado do lado do repositorio (sem acesso ao banco):
//  - edge functions: linhas, segredos lidos (Deno.env.get) e quem as invoca (src, migrations,
//    outras edges, e2e, CI/config)
//  - tabelas: para cada nome recebido em stdin (uma por linha), quantos `.from('tabela')` ha em
//    src/ e supabase/functions/
// Uso: node scripts/inventario/gerar-repo.mjs                 -> escreve inventario/estado/edges.json
//      node scripts/inventario/gerar-repo.mjs < tabelas.txt   -> tambem escreve inventario/estado/tabelas-uso.json
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync, renameSync, rmSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// fileURLToPath (e nao `.pathname`): caminho com espaco/acento vem percent-encoded em `.pathname`.
const RAIZ_PADRAO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Fim do nome da edge: `\b` trata `-` como borda e faria `gerar-alertas` casar com `gerar-alertas-dispatcher`.
const FIM = '($|[^A-Za-z0-9_-])';
const delimitado = (q) => `(^|[^A-Za-z0-9_-])${q}${FIM}`;

function executarRg(args) {
  try {
    // --no-config: o resultado nao pode depender do ~/.ripgreprc de quem roda.
    return execFileSync('rg', ['--no-config', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (erro) {
    // O ripgrep usa exit 1 para "nenhum resultado"; isso nao e falha da busca.
    if (erro?.status === 1) return '';
    if (erro?.code === 'ENOENT') {
      throw new Error('ripgrep (rg) nao encontrado; o inventario nao pode ser gerado com seguranca.', { cause: erro });
    }
    const status = Number.isInteger(erro?.status) ? erro.status : 'desconhecido';
    throw new Error(`ripgrep (rg) falhou com exit ${status}; o inventario nao foi gerado.`, { cause: erro });
  }
}
function rgCount(raiz, pattern, paths) {
  const out = executarRg(['-c', '--no-messages', pattern, ...paths.map((p) => join(raiz, p))]);
  return out.split('\n').filter(Boolean).reduce((n, l) => n + Number(l.slice(l.lastIndexOf(':') + 1)), 0);
}
function rgFiles(raiz, pattern, paths) {
  return executarRg(['-l', '--no-messages', pattern, ...paths.map((p) => join(raiz, p))])
    .split('\n').filter(Boolean).map((f) => relative(raiz, f).split(sep).join('/'));
}

/** Grava por arquivo temporario + rename: queda no meio nao deixa o JSON truncado. */
function gravarAtomico(destino, conteudo) {
  const tmp = `${destino}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, conteudo);
    renameSync(tmp, destino);
  } catch (erro) {
    rmSync(tmp, { force: true });
    throw erro;
  }
}

/** Edge functions do repo: pastas com index.ts, sem as que comecam com `_` (_shared). */
export function listarEdges(raiz) {
  const fdir = join(raiz, 'supabase/functions');
  return readdirSync(fdir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join(fdir, d.name, 'index.ts')))
    .map((d) => d.name).sort();
}

/** Inventario de cada edge: { nome: { linhas, segredos_lidos, chamada_em, sem_chamador } }. */
export function inventariarEdges(raiz, edges = listarEdges(raiz)) {
  const fdir = join(raiz, 'supabase/functions');
  const inventario = {};
  for (const f of edges) {
    const q = esc(f);
    const code = readFileSync(join(fdir, f, 'index.ts'), 'utf8');
    const envs = [...new Set([...code.matchAll(/Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g)].map((m) => m[1]))].sort();
    const src = rgFiles(raiz, `(functions\\.invoke\\(\\s*['"\`]${q}['"\`]|invokeEdge(<[^>()]*>)?\\(\\s*['"\`]${q}['"\`]|functions/v1/${q}${FIM})`, ['src']);
    const migrations = rgFiles(raiz, `functions/v1/${q}${FIM}`, ['supabase/migrations']);
    const outrasEdges = rgFiles(raiz, `functions/v1/${q}${FIM}|['"\`]${q}['"\`]`, ['supabase/functions']).filter((p) => !p.startsWith(`supabase/functions/${f}/`));
    const e2e = rgFiles(raiz, delimitado(q), ['e2e']);
    const ci = rgFiles(raiz, delimitado(q), ['.github/workflows', 'supabase/config.toml']);
    inventario[f] = {
      // 'a\nb\n'.split('\n') da 3; o arquivo tem 2 linhas.
      linhas: code.split('\n').length - (code.endsWith('\n') ? 1 : 0),
      segredos_lidos: envs,
      chamada_em: { src: src.length, migrations: migrations.length, outras_edges: outrasEdges.length, e2e: e2e.length, ci_config: ci.length },
      sem_chamador: src.length + migrations.length + outrasEdges.length === 0,
    };
  }
  return inventario;
}

function lerNomesDoStdin() {
  if (process.stdin.isTTY) return [];
  try {
    return readFileSync(0, 'utf8').split(/\s+/).filter(Boolean);
  } catch (erro) {
    // stdin fechado (`<&-`) ou sem leitor: sem lista de tabelas, so o edges.json.
    if (['EBADF', 'EAGAIN', 'EISDIR', 'ENXIO'].includes(erro?.code)) return [];
    throw erro;
  }
}

function main(argv, raiz = RAIZ_PADRAO) {
  if (argv.length) {
    console.error(`ERRO: argumento desconhecido: ${argv.join(' ')}\nuso: node scripts/inventario/gerar-repo.mjs [< tabelas.txt]`);
    process.exit(2);
  }
  const out = join(raiz, 'inventario/estado');
  const edges = listarEdges(raiz);
  if (edges.length === 0) throw new Error('nenhuma edge function em supabase/functions/*/index.ts: inventario vazio recusado.');
  mkdirSync(out, { recursive: true });
  const inventario = inventariarEdges(raiz, edges);
  const semChamador = Object.entries(inventario).filter(([, v]) => v.sem_chamador).map(([k]) => k);
  gravarAtomico(join(out, 'edges.json'), JSON.stringify({ gerado_em: new Date().toISOString(), total: edges.length, sem_chamador_no_repo: semChamador, edge_functions: inventario }) + '\n');
  console.log(`edges: ${edges.length} | sem chamador no repo (src/migrations/edges): ${semChamador.length}`);

  const nomes = lerNomesDoStdin();
  if (nomes.length > 0) {
    const uso = {};
    for (const t of nomes) {
      const q = esc(t);
      uso[t] = {
        from_src: rgCount(raiz, `\\.from\\(\\s*['"\`]${q}['"\`]`, ['src']),
        from_edges: rgCount(raiz, `\\.from\\(\\s*['"\`]${q}['"\`]`, ['supabase/functions']),
        em_types_ts: rgCount(raiz, `^\\s+${q}: \\{`, ['src/integrations/supabase/types.ts']) > 0,
      };
    }
    const semFrom = Object.entries(uso).filter(([, v]) => v.from_src + v.from_edges === 0).map(([k]) => k);
    gravarAtomico(join(out, 'tabelas-uso.json'), JSON.stringify({ gerado_em: new Date().toISOString(), total: nomes.length, sem_from_em_src_nem_edges: semFrom, tabelas: uso }) + '\n');
    console.log(`tabelas: ${nomes.length} | sem .from() em src nem edges: ${semFrom.length}`);
  }
}

// realpath: process.argv[1] pode vir por symlink; import.meta.url ja vem resolvido.
const executadoDireto = () => {
  try { return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; }
};
if (executadoDireto()) {
  try {
    main(process.argv.slice(2));
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    process.exit(2);
  }
}
