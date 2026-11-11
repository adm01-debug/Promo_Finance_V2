// Testes de scripts/generate-design-audit.js — roda em subprocesso com cwd numa
// árvore de fixtures (o script lê ./src e grava ./design-audit-report.json).
//
// Rodar: node --test scripts/generate-design-audit.unit.mjs

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(RAIZ, 'scripts', 'generate-design-audit.js');

function arvore(arquivos) {
  const dir = mkdtempSync(join(tmpdir(), 'pf-design-audit-'));
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo);
  }
  return dir;
}

const rodar = (dir) => spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8', timeout: 30_000 });
const relatorio = (dir) => JSON.parse(readFileSync(join(dir, 'design-audit-report.json'), 'utf8'));

const FIXTURE = {
  'src/z/Botao.tsx': '<div className="p-4 text-sm bg-primary">\n<span className=\'font-bold gap-2\' />',
  'src/a/Card.tsx': 'const x = <div className={`m-2 border-border ${ativo} ${ok ? "a" : "b"}`} />;\nconst v = cva("text-lg hover:bg-muted");',
  'src/lib/util.ts': 'export const c = cn("p-4 flex", extra);',
  'src/estilo.css': '.x { @apply p-9 text-xs; }',
  'src/notas.md': 'className="m-9"',
};

test('extrai classes de className (aspas e template), cva e cn — só de .ts/.tsx', () => {
  const dir = arvore(FIXTURE);
  const r = rodar(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Design audit report generated at: \.\/design-audit-report\.json/);
  const rep = relatorio(dir);
  // Regressão: `${ativo}` e os pedaços de `${ok ? "a" : "b"}` eram contados como classes.
  assert.equal(rep.totalClassesFound, 10);
  assert.deepEqual(rep.typographyClasses, ['font-bold', 'text-lg', 'text-sm']);
  assert.deepEqual(rep.spacingClasses, ['gap-2', 'm-2', 'p-4']);
  assert.deepEqual(rep.colorClasses, ['bg-primary', 'border-border', 'hover:bg-muted', 'text-lg', 'text-sm']);
  assert.match(rep.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  rmSync(dir, { recursive: true, force: true });
});

test('saída é ordenada e idêntica entre execuções (exceto timestamp)', () => {
  // Regressão: a ordem seguia o readdir do filesystem.
  const dir = arvore(FIXTURE);
  assert.equal(rodar(dir).status, 0);
  const { timestamp: _t1, ...primeiro } = relatorio(dir);
  assert.equal(rodar(dir).status, 0);
  const { timestamp: _t2, ...segundo } = relatorio(dir);
  assert.deepEqual(segundo, primeiro);
  for (const lista of [primeiro.typographyClasses, primeiro.spacingClasses, primeiro.colorClasses]) {
    assert.deepEqual(lista, [...lista].sort());
  }
  rmSync(dir, { recursive: true, force: true });
});

test('grava somente ./design-audit-report.json no diretório atual', () => {
  const dir = arvore(FIXTURE);
  assert.equal(rodar(dir).status, 0);
  assert.deepEqual(readdirSync(dir).sort(), ['design-audit-report.json', 'src']);
  rmSync(dir, { recursive: true, force: true });
});

test('src sem nenhuma classe gera relatório vazio válido', () => {
  const dir = arvore({ 'src/vazio.ts': 'export const x = 1;' });
  assert.equal(rodar(dir).status, 0);
  const rep = relatorio(dir);
  assert.equal(rep.totalClassesFound, 0);
  assert.deepEqual([rep.typographyClasses, rep.spacingClasses, rep.colorClasses], [[], [], []]);
  rmSync(dir, { recursive: true, force: true });
});

test('sem ./src sai 1 com mensagem acionável e não grava relatório', () => {
  // Regressão: estourava stack trace de ENOENT.
  const dir = arvore({ 'outro/x.ts': '' });
  const r = rodar(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /\.\/src não encontrado — execute a partir da raiz do repositório/);
  assert.doesNotMatch(r.stderr, /\n\s+at /);
  assert.deepEqual(readdirSync(dir), ['outro']);
  rmSync(dir, { recursive: true, force: true });
});
