// Porto de Zapp_Web_V2/scripts/edge-deploy/verify-remote.unit.mjs, adaptado ao
// Promo_Finance_V2: verificação de que cada função esperada existe no inventário
// remoto (supabase functions list --output json tolera array ou {functions}).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { runVerifyRemote, extrairNomesRemotos } from './verify-remote.mjs';

function setup(esperado, remoto) {
  const dir = mkdtempSync(resolve(tmpdir(), 'verify-remote-'));
  const expectedPath = resolve(dir, 'expected.json');
  const remotePath = resolve(dir, 'remote.json');
  const outPath = resolve(dir, 'atestacao.json');
  writeFileSync(expectedPath, JSON.stringify(esperado));
  writeFileSync(remotePath, JSON.stringify(remoto));
  return { dir, expectedPath, remotePath, outPath };
}

test('1. todas esperadas ativas => verified', async () => {
  const f = setup(
    { functions: [{ name: 'asaas-proxy' }, { name: 'secrets-scope' }] },
    [
      { slug: 'asaas-proxy', status: 'ACTIVE' },
      { slug: 'secrets-scope', status: 'ACTIVE' },
    ],
  );
  try {
    const atest = await runVerifyRemote({ expectedPath: f.expectedPath, remotePath: f.remotePath, gitSha: 'a'.repeat(40), runId: '7', outputPath: f.outPath });
    assert.equal(atest.verified, true);
    assert.deepEqual(atest.missing, []);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test('2. função ausente ou sem status ACTIVE => verified false com lista de ausentes', async () => {
  const f = setup(
    { functions: [{ name: 'asaas-proxy' }, { name: 'sumiu' }, { name: 'dormente' }] },
    [
      { slug: 'asaas-proxy', status: 'ACTIVE' },
      { slug: 'sumiu', status: 'DELETED' },
      { slug: 'dormente', status: 'INACTIVE' },
    ],
  );
  try {
    const atest = await runVerifyRemote({ expectedPath: f.expectedPath, remotePath: f.remotePath, gitSha: 'a'.repeat(40), runId: '7', outputPath: f.outPath });
    assert.equal(atest.verified, false);
    assert.deepEqual(atest.missing.sort(), ['dormente', 'sumiu']);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test('3. inventário remoto como objeto { functions: [...] } é aceito', () => {
  assert.deepEqual(extrairNomesRemotos('{"functions": [{"name": "a"}, {"Name": "b"}], "total": 2}'), ['a', 'b']);
});

test('4. nomes de array de strings também são aceitos', () => {
  assert.deepEqual(extrairNomesRemotos('["a", {"slug": "b"}]'), ['a', 'b']);
});
