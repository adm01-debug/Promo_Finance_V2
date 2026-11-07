// Porto de Zapp_Web_V2/scripts/edge-deploy/secrets-scope.unit.mjs, adaptado ao
// Promo_Finance_V2: escopo = nomes required do env.manifest.json (mesma fonte
// do gate do migrate-functions.sh), SEM escrita em secrets real — a decisão é
// pura (decidirReescrita) e roda com dry-run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { decidirReescrita, extrairNomesDeSecrets, nomesDeSecretsParaEscopo } from './secrets-scope.mjs';

const RAZA0 = dirname(fileURLToPath(import.meta.url));
const MANIFEST = resolve(RAZA0, '../../env.manifest.json');

test('1. dry-run nunca reescreve (mesmo com divergência)', () => {
  const d = decidirReescrita({ emEnsaio: true, rotateSecrets: true, nomesRemotos: ['A'], nomesEsperados: ['A', 'B'] });
  assert.equal(d.reescrever, false);
  assert.match(d.motivo, /ensaio/);
});

test('2. rollback nunca reescreve', () => {
  const d = decidirReescrita({ emRollback: true, nomesRemotos: ['A'], nomesEsperados: ['A'] });
  assert.equal(d.reescrever, false);
});

test('3. divergência detectada => reescreve e aponta o ausente', () => {
  const d = decidirReescrita({ nomesRemotos: ['A', 'C'], nomesEsperados: ['A', 'B', 'C'] });
  assert.equal(d.reescrever, true);
  assert.match(d.motivo, /B/);
});

test('4. escopo íntegro => não reescreve', () => {
  const d = decidirReescrita({ nomesRemotos: ['A', 'B'], nomesEsperados: ['A', 'B'] });
  assert.equal(d.reescrever, false);
});

test('5. leitura remota falhou (null) => fail-closed: não lê, não reescreve, marca erro fatal', () => {
  const d = decidirReescrita({ nomesRemotos: null, nomesEsperados: ['A'] });
  assert.equal(d.reescrever, false);
  assert.equal(d.erroFatal, true);
});

test('6. extrairNomesDeSecrets aceita array com name e tabela texto NAME/DIGEST', () => {
  assert.deepEqual(extrairNomesDeSecrets('{"secrets": [{"name": "A_API_KEY"}, {"name": "B_TOKEN"}]}'), ['A_API_KEY', 'B_TOKEN']);
  assert.deepEqual(extrairNomesDeSecrets('NAME DIGEST\nA_API_KEY sha256:..\nB_TOKEN sha256:..\n'), ['A_API_KEY', 'B_TOKEN']);
  assert.equal(extrairNomesDeSecrets(''), null);
  assert.equal(extrairNomesDeSecrets('nao é json nem tabela'), null);
});

test('7. manifest real do PF: nomes required lidos, SUPABASE_* excluído, sem vazios', () => {
  const nomes = nomesDeSecretsParaEscopo('x', MANIFEST);
  assert.ok(nomes.length >= 30, `esperado >=30 secrets required, veio ${nomes.length}`);
  assert.ok(nomes.every((n) => n.trim().length > 0 && !n.startsWith('SUPABASE_')));
  assert.ok(nomes.includes('OPENAI_API_KEY'));
  assert.ok(!nomes.includes('SUPABASE_JWT_SECRET'));
});
