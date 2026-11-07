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
  const log = 'No change found in Function: (\u005cS+)/g)].map((m)\nNo change found in Function: ai-ok\n';
  assert.deepEqual(extractUnchangedSlugs(log), ['ai-ok']);
});

test('6. linhas repetidas não duplicam e \r de barra de progresso é tolerado', () => {
  const log = 'No change found in Function: talkx-send\r\nNo change found in Function: talkx-send\n';
  assert.deepEqual(extractUnchangedSlugs(log), ['talkx-send']);
});
