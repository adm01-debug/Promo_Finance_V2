#!/usr/bin/env node
/**
 * check-view-replay-order.mjs
 *
 * Gate de CI: garante que nenhum CREATE VIEW referencia coluna de outra tabela
 * que só é criada em uma migration posterior (ordem de replay).
 *
 * Falha se encontrar ao menos uma ocorrência — igual ao comportamento do
 * Supabase Preview, mas sem depender de banco remoto.
 *
 * Uso:
 *   node scripts/security/check-view-replay-order.mjs [dir-migrations]
 *
 * Algoritmo:
 *   1. Indexa ADD COLUMN / CREATE TABLE → "tabela.coluna" → índice da migration
 *   2. Para cada CREATE VIEW fora de bloco DO $$ (guardados), resolve aliases e
 *      detecta referência a "tabela.coluna" criada depois.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2]
  ?? path.resolve(__dirname, '../../supabase/migrations');

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();

if (files.length === 0) {
  console.error(`Nenhuma migration encontrada em: ${DIR}`);
  process.exit(1);
}

/* ── 1. Indexa quando cada coluna aparece pela primeira vez ─────────────── */
const firstSeen = new Map();               // "tabela.coluna" → índice de replay

const strip = s =>
  s.replace(/^public\./i, '').replace(/"/g, '').trim().toLowerCase();

const note = (t, c, i) => {
  const k = `${strip(t)}.${strip(c)}`;
  if (!firstSeen.has(k) || firstSeen.get(k) > i) firstSeen.set(k, i);
};

const KEYWORDS_COL = new Set([
  'constraint','primary','foreign','unique','check','like','exclude',
]);

files.forEach((f, i) => {
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');

  // ALTER TABLE ... ADD COLUMN [IF NOT EXISTS] <col>
  for (const m of s.matchAll(
    /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([\w."]+)([\s\S]*?);/gi
  )) {
    const t = strip(m[1]);
    for (const mc of m[2].matchAll(
      /ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w"]+)/gi
    )) note(t, mc[1], i);
  }

  // CREATE TABLE [IF NOT EXISTS] <t> (...)  — captura colunas
  for (const m of s.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(([\s\S]*?)\n\s*\);/gi
  )) {
    const t = strip(m[1]);
    for (const line of m[2].split('\n')) {
      const mc = line.match(/^\s*([a-z_]\w*)\s+[a-z]/i);
      if (mc && !KEYWORDS_COL.has(mc[1].toLowerCase())) note(t, mc[1], i);
    }
  }
});

/* ── 2. Detecta CREATE VIEW nus com coluna criada depois ───────────────── */
const SKIP_ALIAS = new Set([
  'on','where','group','order','left','right','inner','join','union',
  'select','as','using','with','full','cross','limit','having','and','or',
  'not','null','true','false','distinct','set','values','from',
]);

const findings = [];

files.forEach((f, i) => {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  // Remove blocos DO $$ ... $$; para ignorar guards já corretos
  const s = raw.replace(/DO\s*\$\$[\s\S]*?\$\$\s*;/gi,
    '\n-- [GUARDED BLOCK REMOVIDO]\n');

  for (const m of s.matchAll(
    /CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+([\w."]+)([\s\S]*?);\s*(?:\r?\n|$)/gi
  )) {
    const view = strip(m[1]);
    const body = m[2];

    // Mapeia alias → nome de tabela real
    const alias = new Map();
    for (const ma of body.matchAll(
      /(?:FROM|JOIN)\s+([\w."]+)(?:\s+AS)?\s+([a-z_]\w*)/gi
    )) {
      const t = strip(ma[1]);
      const a = ma[2].toLowerCase();
      if (!SKIP_ALIAS.has(a)) alias.set(a, t);
    }

    // Resolve "alias.coluna" → "tabela.coluna" e verifica ordem
    const seen = new Set();
    for (const mr of body.matchAll(/\b([a-z_]\w*)\.([a-z_]\w*)\b/gi)) {
      const a = mr[1].toLowerCase();
      const c = mr[2].toLowerCase();
      if (!alias.has(a)) continue;
      const k = `${alias.get(a)}.${c}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const createdAt = firstSeen.get(k);
      if (createdAt !== undefined && createdAt > i) {
        findings.push({
          migration: f,
          view,
          ref: k,
          criadaEm: files[createdAt],
        });
      }
    }
  }
});

/* ── 3. Resultado ───────────────────────────────────────────────────────── */
if (findings.length === 0) {
  console.log('OK: nenhum CREATE VIEW nu referencia coluna criada depois no replay.');
  process.exit(0);
}

const byKey = new Map();
for (const x of findings) {
  const k = `${x.migration} :: ${x.view}`;
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push(`${x.ref}  →  criada em ${x.criadaEm}`);
}

console.error('\nERRO: CREATE VIEW(s) com referência a coluna criada após esta migration:\n');
for (const [k, refs] of [...byKey.entries()].sort()) {
  console.error(`  ${k}`);
  for (const r of [...new Set(refs)]) console.error(`    - ${r}`);
}
console.error('\nCorrija com um guard DO $$ / IF EXISTS (information_schema.columns) / EXECUTE $view$.');
process.exit(1);
