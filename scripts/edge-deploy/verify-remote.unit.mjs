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

// ---------------------------------------------------------------------------
// Endurecimento: entrada malformada não pode virar atestado verde; CLI ponta a ponta.
// ---------------------------------------------------------------------------
import { spawnSync } from 'node:child_process';
import { readFileSync, symlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SCRIPT_VR = resolve(AQUI, 'verify-remote.mjs');

function cli(esperado, remoto, { extras = [], script = SCRIPT_VR, bruto = false } = {}) {
  const s = setup(bruto ? {} : esperado, bruto ? {} : remoto);
  if (bruto) {
    writeFileSync(s.expectedPath, esperado);
    writeFileSync(s.remotePath, remoto);
  }
  try {
    const r = spawnSync(process.execPath, [script, '--expected', s.expectedPath, '--remote', s.remotePath, '--git-sha', 'e'.repeat(40), '--output', s.outPath, ...extras], { encoding: 'utf8' });
    let atestacao = null;
    try {
      atestacao = JSON.parse(readFileSync(s.outPath, 'utf8'));
    } catch {
      /* não gravou */
    }
    return { ...r, atestacao };
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
}

const ATIVA = (slug) => ({ slug, status: 'ACTIVE' });

test('5. CLI: tudo presente → "Remote OK", exit 0 e atestação gravada', () => {
  const r = cli({ functions: [{ name: 'a' }, { name: 'b' }] }, [ATIVA('a'), ATIVA('b'), ATIVA('extra')], { extras: ['--run-id', '7', '--scope', 'a'] });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Remote OK: 2 esperadas, 3 ativas no remoto, faltando 0\n$/);
  assert.equal(r.atestacao.verified, true);
  assert.equal(r.atestacao.github_run_id, '7');
  assert.equal(r.atestacao.escopo, 'a');
});

test('6. CLI: função ausente ou inativa → exit 1 e a linha não diz "OK"', () => {
  const r = cli({ functions: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }, [ATIVA('a'), { slug: 'b', status: 'REMOVED' }]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^Remote FALHOU: 3 esperadas, 1 ativas no remoto, faltando 2: b, c\n$/, 'antes: "Remote OK: … faltando 2" com exit 1');
  assert.deepEqual(r.atestacao.missing, ['b', 'c']);
  assert.equal(r.atestacao.verified, false);
});

test('7. lista esperada malformada é erro, não "0 esperadas → verified" (antes: atestado verde vazio)', async () => {
  const remoto = [ATIVA('a')];
  const malformadas = [{}, [], { functions: 'a' }, { funcoes: [{ name: 'a' }] }, null, { functions: [{ slug: 'a' }] }, { functions: [{ name: '' }] }, { functions: [null] }, { functions: [{ name: 7 }] }];
  for (const esperado of malformadas) {
    const s = setup(esperado, remoto);
    try {
      await assert.rejects(
        runVerifyRemote({ expectedPath: s.expectedPath, remotePath: s.remotePath, gitSha: 'f'.repeat(40), outputPath: s.outPath, scope: 'all' }),
        /--expected/,
        JSON.stringify(esperado),
      );
    } finally {
      rmSync(s.dir, { recursive: true, force: true });
    }
    const r = cli(esperado, remoto);
    assert.equal(r.status, 1, JSON.stringify(esperado));
    assert.equal(r.atestacao, null, 'nenhuma atestação é gravada para entrada inválida');
  }
});

test('8. inventário remoto malformado nunca aprova', () => {
  const esperado = { functions: [{ name: 'a' }] };
  for (const remoto of [null, 'ACTIVE', 7, {}, { functions: [] }, [null], [{ slug: 'a' }], [{ slug: 'a', status: 'THROTTLED' }], [{ name: 'outra', status: 'ACTIVE' }]]) {
    const r = cli(esperado, remoto);
    assert.equal(r.status, 1, JSON.stringify(remoto));
    assert.doesNotMatch(r.stdout, /Remote OK/);
  }
  const texto = cli('{"functions":[{"name":"a"}]}', '  ID | NAME | STATUS\n  1 | a | ACTIVE\n', { bruto: true });
  assert.equal(texto.status, 1, 'tabela de texto do CLI (sem --output json) não é aceita como inventário');
  const quebrado = cli('{ "functions": [', '[]', { bruto: true });
  assert.equal(quebrado.status, 1);
});

test('9. lista esperada vazia: passa, mas avisa que nada foi conferido', () => {
  const r = cli({ functions: [] }, [ATIVA('a')]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /::warning::Verify remote: lista esperada vazia/);
});

test('10. CLI: argumentos obrigatórios e desconhecidos saem com 1', () => {
  const sem = spawnSync(process.execPath, [SCRIPT_VR], { encoding: 'utf8' });
  assert.equal(sem.status, 1);
  assert.match(sem.stderr, /Argumento obrigatório ausente: expectedPath/);
  const extra = cli({ functions: [] }, [], { extras: ['--nope'] });
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /Argumento desconhecido: --nope/);
  const inexistente = spawnSync(process.execPath, [SCRIPT_VR, '--expected', '/nao/existe', '--remote', '/nao/existe', '--git-sha', 'x', '--output', '/dev/null'], { encoding: 'utf8' });
  assert.equal(inexistente.status, 1);
  assert.match(inexistente.stderr, /ENOENT/);
});

test('11. CLI: invocado por symlink executa de verdade (antes: saía 0 sem verificar nada)', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'verify-link-'));
  try {
    symlinkSync(AQUI, resolve(dir, 'atalho'));
    const r = cli({ functions: [{ name: 'a' }] }, [], { script: resolve(dir, 'atalho', 'verify-remote.mjs') });
    assert.equal(r.status, 1, 'função ausente tem de reprovar também pelo atalho');
    assert.match(r.stdout, /Remote FALHOU/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
