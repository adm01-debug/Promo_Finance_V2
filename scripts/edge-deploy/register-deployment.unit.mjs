// Porto de Zapp_Web_V2/scripts/edge-deploy/register-deployment.unit.mjs — a rede
// nunca é tocada: exercita apenas as decisões de destino (allowlist https, sem
// path traversal), puras e determinísticas. resolverDestino LANÇA erro nas
// recusas; o teste confere erro e mensagem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverDestino } from './register-deployment.mjs';

test('1. allowlist: api.github.com é aceita', () => {
  const url = resolverDestino('https://api.github.com', '/repos/adm01-debug/Promo_Finance_V2/deployments', 'https://github.com');
  assert.equal(url, 'https://api.github.com/repos/adm01-debug/Promo_Finance_V2/deployments');
});

test('2. allowlist: host do GITHUB_SERVER_URL (GHE) é aceito', () => {
  const url = resolverDestino('https://github.example.com', '/deployments', 'https://github.example.com');
  assert.equal(url, 'https://github.example.com/deployments');
});

test('3. https fora da allowlist é recusado', () => {
  assert.throws(() => resolverDestino('https://api.gitlab.com', '/projetos/1/deployments', 'https://github.com'), /allowlist/);
});

test('4. http (não https) é recusado', () => {
  assert.throws(() => resolverDestino('http://api.github.com', '/deployments', 'https://github.com'), /https/);
});

test('5. path traversal e caminho sem barra inicial são recusados', () => {
  assert.throws(() => resolverDestino('https://api.github.com', '/repos/../etc', 'https://github.com'), /\.\.\//);
  assert.throws(() => resolverDestino('https://api.github.com', 'repos/adm01-debug', 'https://github.com'), /começar com \//);
});

// ---------------------------------------------------------------------------
// Fluxo de registro com `env` e `fetchImpl` injetados: nenhuma chamada real ao GitHub.
// ---------------------------------------------------------------------------
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registrar } from './register-deployment.mjs';

const SCRIPT_RD = resolve(dirname(fileURLToPath(import.meta.url)), 'register-deployment.mjs');
const SHA = 'a1b2c3d4'.repeat(5);
const TOKEN_FICTICIO = ['gh', 's_', 'Zz9'.repeat(12)].join('');
const ENV_OK = { GITHUB_TOKEN: TOKEN_FICTICIO, GITHUB_REPOSITORY: 'adm01-debug/Promo_Finance_V2', GITHUB_RUN_ID: '555', DEPLOYED_GIT_SHA: SHA, ESCOPO: 'asaas-proxy' };

async function capturar(fn) {
  const linhas = [];
  const original = console.log;
  console.log = (...a) => linhas.push(a.join(' '));
  try {
    const retorno = await fn();
    return { retorno, saida: linhas.join('\n') };
  } finally {
    console.log = original;
  }
}

const respostaJson = (status, corpo) => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

test('6. registrar: cria deployment + status com ref = sha deployado e grava o output', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'register-'));
  const pedidos = [];
  const fetchImpl = async (url, init) => {
    pedidos.push({ url, init, corpo: JSON.parse(init.body) });
    return pedidos.length === 1
      ? respostaJson(201, { id: 9001, ref: SHA, environment: 'producao', payload: { run_id: '555' } })
      : respostaJson(201, { state: 'success' });
  };
  try {
    const saidaGh = resolve(dir, 'out');
    const { retorno, saida } = await capturar(() => registrar({ env: { ...ENV_OK, GITHUB_OUTPUT: saidaGh }, fetchImpl }));
    assert.deepEqual(retorno, { registrado: true, deploymentId: 9001 });
    assert.equal(pedidos[0].url, 'https://api.github.com/repos/adm01-debug/Promo_Finance_V2/deployments');
    assert.equal(pedidos[0].corpo.ref, SHA);
    assert.equal(pedidos[0].corpo.payload.escopo, 'asaas-proxy');
    assert.equal(pedidos[0].init.headers.Authorization, `Bearer ${TOKEN_FICTICIO}`);
    assert.ok(pedidos[0].init.signal instanceof AbortSignal, 'requisição com teto de tempo');
    assert.equal(pedidos[1].url, 'https://api.github.com/repos/adm01-debug/Promo_Finance_V2/deployments/9001/statuses');
    assert.equal(pedidos[1].corpo.state, 'success');
    assert.match(saida, /::notice::Deployment registrado: producao @ a1b2c3d4 \(run 555\) \(id=9001, status=success\)/);
    assert.equal(readFileSync(saidaGh, 'utf8'), 'deployment_id=9001\n');
    assert.equal(saida.includes(TOKEN_FICTICIO), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('7. registrar: pré-condição ausente avisa SEM tocar a rede (antes: POST com "Bearer undefined")', async () => {
  const semRede = async () => { throw new Error('rede não pode ser tocada'); };
  const casos = {
    'GITHUB_TOKEN ausente': { ...ENV_OK, GITHUB_TOKEN: undefined },
    'GITHUB_TOKEN ausente ': { ...ENV_OK, GITHUB_TOKEN: '  ' },
    'GITHUB_REPOSITORY ausente': { ...ENV_OK, GITHUB_REPOSITORY: undefined },
    'GITHUB_REPOSITORY ausente ou fora do formato': { ...ENV_OK, GITHUB_REPOSITORY: 'dono/repo/../../orgs/x' },
    'sha de 40 hex': { ...ENV_OK, DEPLOYED_GIT_SHA: 'main' },
    'destino não permitido': { ...ENV_OK, GITHUB_API_URL: 'https://evil.exemplo' },
    'exige https': { ...ENV_OK, GITHUB_API_URL: 'http://api.github.com' },
  };
  for (const [mensagem, env] of Object.entries(casos)) {
    const { retorno, saida } = await capturar(() => registrar({ env, fetchImpl: semRede }));
    assert.deepEqual(retorno, { registrado: false, deploymentId: null }, mensagem);
    assert.match(saida, /^::warning::Falha ao registrar o Deployment \(deploy não afetado\): /, mensagem);
    assert.ok(saida.includes(mensagem.trim()), `${mensagem} → ${saida}`);
    assert.doesNotMatch(saida, /rede não pode ser tocada/, mensagem);
    assert.equal(saida.includes(TOKEN_FICTICIO), false);
  }
});

test('8. registrar: falha HTTP, corpo não-JSON, rede e timeout viram ::warning:: em uma linha só', async () => {
  const cenarios = {
    'HTTP 422': async () => new Response('{"message":"No ref found"}\n::error::forjado', { status: 422 }),
    'HTTP 500': async () => new Response('boom', { status: 500 }),
    'HTML em 201': async () => new Response('<html>proxy</html>', { status: 201 }),
    'rede': async () => { throw new TypeError('fetch failed'); },
    'sem id': async () => respostaJson(201, { ref: SHA }),
  };
  for (const [nome, fetchImpl] of Object.entries(cenarios)) {
    const { retorno, saida } = await capturar(() => registrar({ env: ENV_OK, fetchImpl }));
    assert.equal(retorno.registrado, false, nome);
    assert.equal(saida.split('\n').length, 1, `${nome}: quebra de linha na resposta não pode forjar comando de workflow`);
    assert.match(saida, /^::warning::Falha ao registrar/, nome);
  }
});

test('9. registrar: servidor que não responde é cortado pelo timeout', async () => {
  const servidor = http.createServer(() => {}); // aceita e nunca responde
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  try {
    const origem = `http://127.0.0.1:${servidor.address().port}`;
    const fetchLocal = (url, init) => fetch(String(url).replace('https://api.github.com', origem), init);
    const inicio = Date.now();
    const { retorno, saida } = await capturar(() => registrar({ env: ENV_OK, fetchImpl: fetchLocal, timeoutMs: 200 }));
    assert.equal(retorno.registrado, false);
    assert.match(saida, /::warning::Falha ao registrar/);
    assert.ok(Date.now() - inicio < 5000);
  } finally {
    servidor.closeAllConnections();
    await new Promise((ok) => servidor.close(ok));
  }
});

test('10. valor vindo da API com quebra de linha não abre variável nova em GITHUB_OUTPUT', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'register-inj-'));
  try {
    const saidaGh = resolve(dir, 'out');
    let n = 0;
    const fetchImpl = async () => {
      n += 1;
      return n === 1
        ? respostaJson(201, { id: '1\nreescrever=true', ref: SHA, environment: 'producao\n::error::x', payload: { run_id: '1' } })
        : respostaJson(201, { state: 'success\n::error::y' });
    };
    const { saida } = await capturar(() => registrar({ env: { ...ENV_OK, GITHUB_OUTPUT: saidaGh }, fetchImpl }));
    assert.equal(readFileSync(saidaGh, 'utf8').split('\n').filter(Boolean).length, 1);
    assert.equal(saida.split('\n').filter((l) => l.startsWith('::error::')).length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('11. importar o módulo não registra nada (antes: o POST saía no import)', () => {
  const env = { ...process.env, ...ENV_OK, GITHUB_API_URL: 'https://destino-recusado.invalid' };
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(SCRIPT_RD)}); console.log('importado');`], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'importado\n', 'nenhuma linha de registro/aviso no import');
});

test('12. CLI: best-effort — falha de pré-condição sai 0 com ::warning::, sem rede', () => {
  const env = { ...process.env, ...ENV_OK, DEPLOYED_GIT_SHA: 'nao-e-sha', GITHUB_API_URL: 'https://destino-recusado.invalid' };
  const r = spawnSync(process.execPath, [SCRIPT_RD], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^::warning::Falha ao registrar o Deployment \(deploy não afetado\): shaDeployado precisa ser um sha de 40 hex/);
  assert.equal((r.stdout + r.stderr).includes(TOKEN_FICTICIO), false);
});
