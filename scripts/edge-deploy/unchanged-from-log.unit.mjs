// Porto de Zapp_Web_V2/scripts/edge-deploy/unchanged-from-log.unit.mjs.
// Fixtures derivadas byte a byte dos logs reais dos runs do Zapp (F-03).
// O run 36583351162 é o caso F-03: o extrator com âncoras ^...$ não casava a
// linha do CLI (ANSI). O teste 3 trava isso; o teste 4 trava o eco do script.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractUnchangedSlugs, stripAnsi } from './unchanged-from-log.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fixture = (nome) => readFileSync(join(FIXTURES, nome), 'utf8');

test('1. log real do deploy de uma função pulada: exatamente a função do run', () => {
  const slugs = extractUnchangedSlugs(fixture('deploy-log-single-36852598923.txt'));
  assert.deepEqual(slugs, ['ai-conversation-analysis']);
});

test('2. log real do deploy completo: só os slugs das linhas de saída, em ordem', () => {
  const slugs = extractUnchangedSlugs(fixture('deploy-log-all-36583351162.txt'));
  assert.equal(slugs.length, 15);
  assert.ok(slugs.every((s) => /^[a-z0-9][a-z0-9-]*$/.test(s)), `slug inválido em ${JSON.stringify(slugs)}`);
  assert.deepEqual(slugs.slice(0, 3), ['ai-auto-tag', 'ai-churn-analysis', 'ai-classify-tickets']);
  assert.equal(slugs.at(-1), 'chatbot-l1');
  assert.ok(slugs.includes('bitrix-api'));
});

test('3. F-03: a linha embrulhada em ANSI continua sendo capturada', () => {
  const bruto = fixture('deploy-log-ansi-f03.txt');
  assert.ok(bruto.includes('\x1b'), 'a fixture precisa ter byte ESC de verdade');
  assert.deepEqual(extractUnchangedSlugs(bruto), ['ai-conversation-analysis']);
  // prova de mutação: sem o strip de ANSI a linha NÃO casa (era o bug F-03)
  const semStrip = bruto.split('\n').find((l) => l.includes('\x1b'));
  assert.equal(/^No change found in Function:/.test(semStrip), false);
  assert.equal(/^No change found in Function:/.test(stripAnsi(semStrip)), true);
});

test('4. o eco do próprio script nunca vira função sem mudança', () => {
  const bruto = fixture('deploy-log-echo-only.txt');
  assert.deepEqual(extractUnchangedSlugs(bruto), []);
  // prova de mutação: o padrão antigo (sem âncora, com \S+) casava o eco
  const eco = stripAnsi(bruto);
  const antigo = [...eco.matchAll(/No change found in Function: (\S+)/g)].map((m) => m[1]);
  assert.equal(antigo.length, 1, 'o padrão antigo de fato captura o eco');
  assert.equal(antigo[0], String.raw`(\S+)/g)].map((m)`);
});

test('5. slug fora da forma de nome de função é descartado', () => {
  const log = 'No change found in Function: (\S+)/g)].map((m)\nNo change found in Function: ai-ok\n';
  assert.deepEqual(extractUnchangedSlugs(log), ['ai-ok']);
});

test('6. linhas repetidas não duplicam e \r de barra de progresso é tolerado', () => {
  const log = 'No change found in Function: talkx-send\r\nNo change found in Function: talkx-send\n';
  assert.deepEqual(extractUnchangedSlugs(log), ['talkx-send']);
});

// ---------------------------------------------------------------------------
// Bordas do extrator e CLI ponta a ponta.
// ---------------------------------------------------------------------------
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const AQUI_UL = dirname(fileURLToPath(import.meta.url));
const SCRIPT_UL = join(AQUI_UL, 'unchanged-from-log.mjs');

test('extrator: CRLF, espaço no fim, duplicata, ordem e formas que NÃO são slug', () => {
  const log = [
    'No change found in Function: b-func\r',
    'No change found in Function: a-func   ',
    'No change found in Function: b-func',
    '\x1b[36;1mNo change found in Function: c-1\x1b[0m\r',
    '  No change found in Function: recuado',
    'No change found in Function: Maiuscula',
    'No change found in Function: com_sublinhado',
    'No change found in Function: dois nomes',
    'No change found in Function:',
    'No change found in Function: ../../etc',
    'prefixo No change found in Function: eco',
    'No change found in Function: -hifen-na-frente',
  ].join('\n');
  assert.deepEqual(extractUnchangedSlugs(log), ['b-func', 'a-func', 'c-1']);
  assert.deepEqual(extractUnchangedSlugs(''), []);
  assert.deepEqual(extractUnchangedSlugs(undefined), []);
});

test('stripAnsi remove só a sequência de cor', () => {
  assert.equal(stripAnsi('\x1b[1;31merro\x1b[0m [texto] \x1b[2K'), 'erro [texto] ');
});

test('CLI: grava JSON com os slugs e imprime o resumo', () => {
  const dir = mkdtempSync(join(tmpdir(), 'unchanged cli-'));
  try {
    const saida = join(dir, 'unchanged.json');
    const r = spawnSync(process.execPath, [SCRIPT_UL, join(FIXTURES, 'deploy-log-ansi-f03.txt'), saida], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'Funções sem mudança de bundle: ai-conversation-analysis\n');
    assert.deepEqual(JSON.parse(readFileSync(saida, 'utf8')), ['ai-conversation-analysis']);
    const vazio = spawnSync(process.execPath, [SCRIPT_UL, join(FIXTURES, 'deploy-log-echo-only.txt'), saida], { encoding: 'utf8' });
    assert.equal(vazio.stdout, 'Funções sem mudança de bundle: nenhuma\n');
    assert.equal(readFileSync(saida, 'utf8'), '[]\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: sem argumentos mostra o uso e sai 1; log inexistente sai 1 com ::error:: e sem gravar saída', () => {
  const dir = mkdtempSync(join(tmpdir(), 'unchanged-err-'));
  try {
    const uso = spawnSync(process.execPath, [SCRIPT_UL], { encoding: 'utf8' });
    assert.equal(uso.status, 1);
    assert.match(uso.stderr, /^Uso: node unchanged-from-log\.mjs <log-do-deploy> <saida\.json>/);
    assert.equal(spawnSync(process.execPath, [SCRIPT_UL, 'so-um'], { encoding: 'utf8' }).status, 1);
    const saida = join(dir, 'unchanged.json');
    const r = spawnSync(process.execPath, [SCRIPT_UL, join(dir, 'nao-existe.log'), saida], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /^::error::unchanged-from-log: ENOENT/);
    assert.doesNotMatch(r.stderr, /\n\s+at /, 'sem stack trace no log do CI');
    assert.equal(existsSync(saida), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI: invocado por symlink executa de verdade (antes: saía 0 sem gravar a saída)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'unchanged-link-'));
  try {
    symlinkSync(AQUI_UL, join(dir, 'atalho'));
    const saida = join(dir, 'unchanged.json');
    writeFileSync(join(dir, 'd.log'), 'No change found in Function: asaas-proxy\n');
    const r = spawnSync(process.execPath, [join(dir, 'atalho', 'unchanged-from-log.mjs'), join(dir, 'd.log'), saida], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(readFileSync(saida, 'utf8')), ['asaas-proxy']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
