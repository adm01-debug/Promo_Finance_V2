// Porto de Zapp_Web_V2/scripts/edge-deploy/smoke-functions.unit.mjs — a rede
// nunca é tocada: o fetch é injetado como um fake determinístico. Exercita o
// contrato CORS (positivo/negativo) e o gateway anonymous 401 das funções com
// verify_jwt=true, além do fail-closed quando o config.toml não declara o bloco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { smokeFunction, runSmokeSuite } from './smoke-functions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raizProjeto = resolve(__dirname, '..', '..');
const CAMINHO_TOML = resolve(raizProjeto, 'supabase/config.toml');

function mkResponse(status, headers = {}) {
  return { status, headers: { get: (name) => headers[name.toLowerCase()] ?? headers[name] ?? null } };
}

test('1. CORS correto + anonymous 401 => smoke passa', async () => {
  const fn = { name: 'condominio-api', verify_jwt: true };
  const fetchImpl = async (url, init) => {
    if (init.method === 'OPTIONS') {
      if (String(init.headers.Origin) === 'https://edge-smoke.invalid') {
        return mkResponse(200, { 'access-control-allow-origin': null });
      }
      return mkResponse(204, { 'access-control-allow-origin': String(init.headers.Origin) });
    }
    return mkResponse(401); // POST anônimo
  };
  const result = await smokeFunction({ fn, baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co', retries: 1, fetchImpl });
  assert.equal(result.passed, true);
  assert.equal(result.checks.anonymous_gateway.passed, true);
  assert.equal(result.checks.denied_origin.passed, true);
});

test('2. origem negada refletida => smoke falha (não pode ecoar origem não confiável)', async () => {
  const fn = { name: 'condominio-api', verify_jwt: true };
  const fetchImpl = async (url, init) => {
    if (init.method === 'OPTIONS') {
      return mkResponse(200, { 'access-control-allow-origin': String(init.headers.Origin) }); // eco indesejado
    }
    return mkResponse(401);
  };
  const result = await smokeFunction({ fn, baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co', retries: 1, fetchImpl });
  assert.equal(result.passed, false);
  assert.equal(result.checks.denied_origin.passed, false);
});

test('3. POST anônimo sem 401 (webhook público) => falha no gateway', async () => {
  const fn = { name: 'webhook-publico', verify_jwt: false };
  const fetchImpl = async () => mkResponse(200); // gateway liberou sem token
  const result = await smokeFunction({ fn, baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co', retries: 1, fetchImpl });
  assert.equal(result.passed, false);
});

test('4. runSmokeSuite grava evidência e usa config.toml real para verify_jwt', async () => {
  // funções que existem de fato no supabase/config.toml do PF
  const lista = JSON.stringify({
    functions: [
      { name: 'asaas-proxy', verify_jwt: true },
      { name: 'secrets-scope', verify_jwt: true },
    ],
  });
  const dir = mkdtempSync(resolve(tmpdir(), 'smoke-'));
  const listaPath = resolve(dir, 'functions-list.json');
  const saida = resolve(dir, 'evidencia.json');
  writeFileSync(listaPath, lista);
  // config.toml real não declara bloco [functions.secrets-scope] => fail-closed
  try {
    await assert.rejects(
      runSmokeSuite({
        baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co',
        outputPath: saida,
        gitSha: 'a'.repeat(40),
        runId: '99',
        concurrency: 2,
        retries: 1,
        configToml: CAMINHO_TOML,
        functionsListPath: listaPath,
      }),
      /verify_jwt ausente no config\.toml/,
      'bloco ausente no config.toml tem de falhar (fail-closed) sem tocar rede',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// CLI e HTTP de verdade contra um servidor local efêmero (nunca o Supabase real):
// timeout, 5xx com retry, redirect, corpo não-JSON, CORS por origem e gateway.
// ---------------------------------------------------------------------------
import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, symlinkSync } from 'node:fs';
import { before, after, beforeEach } from 'node:test';

const SCRIPT = resolve(__dirname, 'smoke-functions.mjs');
const ORIGENS = JSON.parse(readFileSync(resolve(__dirname, 'allowed-origins.json'), 'utf8'));
const CANONICA = ORIGENS.exact[0];

let servidor;
let baseLocal;
let comportamento; // nome da função → (req, res) => void
let pedidos;

// Função saudável, espelhando `origemCors()` de supabase/functions/_shared/cors.ts:
// origem da allowlist → eco; fora dela → primeira origem permitida; POST sem JWT → 401.
function saudavel(req, res) {
  const origem = req.headers.origin;
  const permitida = ORIGENS.exact.includes(origem) ? origem : CANONICA;
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': permitida });
    return res.end();
  }
  res.writeHead(401, { 'Content-Type': 'application/json' });
  return res.end('{"message":"Missing authorization header"}');
}

before(async () => {
  servidor = http.createServer((req, res) => {
    const nome = decodeURIComponent(req.url.split('/')[1] ?? '');
    pedidos.push({ nome, method: req.method, origin: req.headers.origin, authorization: req.headers.authorization });
    (comportamento[nome] ?? saudavel)(req, res);
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  baseLocal = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor.closeAllConnections();
  await new Promise((ok) => servidor.close(ok));
});

beforeEach(() => {
  comportamento = {};
  pedidos = [];
});

function rodarCli(args, { script = SCRIPT } = {}) {
  return new Promise((ok) => {
    const filho = spawn(process.execPath, [script, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    filho.stdout.on('data', (d) => { stdout += d; });
    filho.stderr.on('data', (d) => { stderr += d; });
    filho.on('close', (status) => ok({ status, stdout, stderr }));
  });
}

// Monta lista + config.toml num diretório temporário e roda o CLI contra o servidor local.
async function smokeCli(funcoes, { extras = [], toml, script } = {}) {
  const dir = mkdtempSync(resolve(tmpdir(), 'smoke cli-'));
  try {
    const lista = resolve(dir, 'functions-list.json');
    const config = resolve(dir, 'config.toml');
    const saida = resolve(dir, 'evidencia.json');
    writeFileSync(lista, JSON.stringify({ functions: Object.keys(funcoes).map((name) => ({ name })) }));
    writeFileSync(config, toml ?? Object.entries(funcoes).map(([n, jwt]) => `[functions.${n}]\nverify_jwt = ${jwt}\n`).join('\n'));
    const r = await rodarCli([
      '--base-url', `${baseLocal}/`, '--output', saida, '--git-sha', 'b'.repeat(40), '--run-id', '42',
      '--config-toml', config, '--functions-list', lista, '--retries', '2', '--timeout-ms', '400', ...extras,
    ], { script });
    let evidencia = null;
    try {
      evidencia = JSON.parse(readFileSync(saida, 'utf8'));
    } catch {
      /* CLI abortou antes de gravar */
    }
    return { ...r, evidencia };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('5. CLI: funções saudáveis passam; verify_jwt=false não recebe POST de negócio', async () => {
  const r = await smokeCli({ 'asaas-proxy': true, 'asaas-webhook': false });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /PASS asaas-proxy\nPASS asaas-webhook\nEdge smoke: 2\/2 passed; 0 failed/);
  assert.deepEqual(r.evidencia.summary, { total: 2, passed: 2, failed: 0 });
  assert.equal(r.evidencia.git_sha, 'b'.repeat(40));
  assert.equal(r.evidencia.github_run_id, '42');
  assert.deepEqual(pedidos.filter((p) => p.method === 'POST').map((p) => p.nome), ['asaas-proxy']);
  assert.ok(pedidos.every((p) => p.authorization === undefined), 'o smoke é anônimo: nunca envia credencial');
  assert.deepEqual([...new Set(pedidos.filter((p) => p.method === 'OPTIONS').map((p) => p.origin))].sort(), [ORIGENS.denied_example, CANONICA].sort());
});

test('6. CLI: 5xx é repetido até o limite de --retries e reprova a função', async () => {
  comportamento.instavel = (_req, res) => { res.writeHead(503); res.end('upstream'); };
  const r = await smokeCli({ instavel: true, ok: true });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /FAIL instavel\nPASS ok\nEdge smoke: 1\/2 passed; 1 failed/);
  assert.equal(pedidos.filter((p) => p.nome === 'instavel').length, 2, 'exatamente --retries tentativas no primeiro check');
  assert.match(r.evidencia.results[0].error, /HTTP inesperado 503/);
});

test('7. CLI: 5xx transitório seguido de sucesso passa (retry funciona)', async () => {
  let vistos = 0;
  comportamento.acorda = (req, res) => {
    vistos += 1;
    if (vistos === 1) { res.writeHead(502); return res.end(); }
    return saudavel(req, res);
  };
  const r = await smokeCli({ acorda: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('8. CLI: função que não responde estoura o timeout e reprova, sem travar o smoke', async () => {
  comportamento.muda = () => {}; // nunca responde
  const inicio = Date.now();
  const r = await smokeCli({ muda: true, ok: true });
  assert.equal(r.status, 1);
  assert.ok(Date.now() - inicio < 10_000, 'limitado por --timeout-ms × --retries');
  assert.equal(r.evidencia.results[0].passed, false);
  assert.match(r.evidencia.results[0].error, /timeout|aborted/i);
  assert.equal(r.evidencia.results[1].passed, true, 'as demais funções continuam sendo testadas');
});

test('9. CLI: redirect não é seguido — CORS correto no destino não aprova a função', async () => {
  comportamento.desviada = (_req, res) => { res.writeHead(302, { Location: `${baseLocal}/ok` }); res.end(); };
  const r = await smokeCli({ desviada: true });
  assert.equal(r.status, 1, 'antes: o fetch seguia o 302 e validava a função "ok" no lugar');
  assert.equal(pedidos.some((p) => p.nome === 'ok'), false, 'o destino do redirect não pode ser consultado');
  assert.equal(r.evidencia.results[0].checks.availability.status, 302);
});

test('10. CLI: CORS quebrado reprova em cada variante', async () => {
  const cabecalho = (valor) => (req, res) => {
    if (req.method !== 'OPTIONS') return saudavel(req, res);
    res.writeHead(204, valor === undefined ? {} : { 'Access-Control-Allow-Origin': typeof valor === 'function' ? valor(req) : valor });
    return res.end();
  };
  comportamento.curinga = cabecalho('*');
  comportamento.eco = cabecalho((req) => req.headers.origin);
  comportamento.semcabecalho = cabecalho(undefined);
  comportamento.outra = cabecalho('https://outro.exemplo');
  comportamento.html = (_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html>não é a função</html>'); };
  comportamento.notfound = (_req, res) => { res.writeHead(404); res.end('{"code":"NOT_FOUND"}'); };
  const r = await smokeCli({ curinga: true, eco: true, semcabecalho: true, outra: true, html: true, notfound: true, ok: true });
  assert.equal(r.status, 1);
  const porNome = Object.fromEntries(r.evidencia.results.map((x) => [x.name, x]));
  assert.equal(porNome.curinga.checks.denied_origin.passed, false, '"*" libera qualquer origem');
  assert.equal(porNome.eco.checks.denied_origin.passed, false, 'eco da origem negada');
  assert.equal(porNome.eco.checks.availability.passed, true);
  for (const nome of ['semcabecalho', 'outra', 'html', 'notfound']) assert.equal(porNome[nome].checks.availability.passed, false, nome);
  assert.equal(porNome.notfound.checks.availability.status, 404);
  assert.deepEqual(r.evidencia.summary, { total: 7, passed: 1, failed: 6 });
});

test('11. CLI: gateway que não devolve 401 ao POST anônimo reprova (200, 403, 500)', async () => {
  const post = (status) => (req, res) => {
    if (req.method === 'OPTIONS') return saudavel(req, res);
    res.writeHead(status);
    return res.end('{}');
  };
  comportamento.aberta = post(200);
  comportamento.proibida = post(403);
  comportamento.quebrada = post(500);
  const r = await smokeCli({ aberta: true, proibida: true, quebrada: true });
  assert.equal(r.status, 1);
  assert.deepEqual(r.evidencia.results.map((x) => x.passed), [false, false, false]);
  assert.equal(r.evidencia.results[0].checks.anonymous_gateway.status, 200);
  assert.equal(r.evidencia.results[1].checks.anonymous_gateway.status, 403);
});

test('12. CLI: servidor fora do ar reprova todas com erro, sem exceção solta', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'smoke-off-'));
  try {
    writeFileSync(resolve(dir, 'l.json'), JSON.stringify({ functions: [{ name: 'a' }] }));
    writeFileSync(resolve(dir, 'c.toml'), '[functions.a]\nverify_jwt = true\n');
    const r = await rodarCli(['--base-url', 'http://127.0.0.1:9', '--output', resolve(dir, 'e.json'), '--git-sha', 'c'.repeat(40), '--run-id', '1',
      '--config-toml', resolve(dir, 'c.toml'), '--functions-list', resolve(dir, 'l.json'), '--retries', '1', '--timeout-ms', '500']);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /FAIL a\nEdge smoke: 0\/1 passed; 1 failed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('13. CLI: config.toml — bloco ausente, verify_jwt ausente e valor não booleano são fail-closed', async () => {
  const semBloco = await smokeCli({ a: true }, { toml: '[functions.outra]\nverify_jwt = true\n' });
  assert.equal(semBloco.status, 1);
  assert.match(semBloco.stderr, /verify_jwt ausente no config\.toml para a função "a"/);
  const semChave = await smokeCli({ a: true }, { toml: '[functions.a]\nimport_map = "x"\n' });
  assert.match(semChave.stderr, /verify_jwt ausente/);
  for (const valor of ['treu', '1', 'yes', '"sim"']) {
    const r = await smokeCli({ a: true }, { toml: `[functions.a]\nverify_jwt = ${valor}\n` });
    assert.equal(r.status, 1, `verify_jwt = ${valor} (antes: tratado como false, sem o teste do gateway)`);
    assert.match(r.stderr, /verify_jwt (inválido|ausente)/);
  }
  assert.equal(pedidos.length, 0, 'config inválido não dispara requisição');
  const maiusculo = await smokeCli({ a: true }, { toml: '[functions.a]\r\nverify_jwt = TRUE\r\n' });
  assert.equal(maiusculo.status, 0, maiusculo.stderr);
  assert.equal(pedidos.some((p) => p.method === 'POST'), true, 'TRUE vale como true: o gateway é testado');
});

test('14. CLI: lista vazia avisa que nada foi testado; lista ilegível falha', async () => {
  const vazia = await smokeCli({});
  assert.equal(vazia.status, 0);
  assert.match(vazia.stdout, /::warning::Edge smoke: lista de funções vazia/);
  const ruim = await rodarCli(['--base-url', baseLocal, '--output', '/dev/null', '--git-sha', 'x', '--run-id', '1', '--functions-list', '/nao/existe.json']);
  assert.equal(ruim.status, 1);
  assert.match(ruim.stderr, /ENOENT/);
});

test('15. CLI: argumentos inválidos saem com 1 e mensagem', async () => {
  const base = ['--base-url', baseLocal, '--output', '/dev/null', '--git-sha', 'x', '--run-id', '1', '--functions-list', 'l.json'];
  const casos = {
    'sem nada': [[], /Argumento obrigatório ausente: baseUrl/],
    'flag desconhecida': [[...base, '--nope'], /Argumento desconhecido: --nope/],
    'sem functions-list': [base.slice(0, 8), /--functions-list/],
    'concurrency fora da faixa': [[...base, '--concurrency', '99'], /concurrency precisa ser inteiro entre 1 e 20/],
    'retries não numérico': [[...base, '--retries', 'x'], /retries precisa ser inteiro entre 1 e 5/],
    'timeout inválido': [[...base, '--timeout-ms', '5'], /timeout-ms precisa ser inteiro/],
  };
  for (const [nome, [args, erro]] of Object.entries(casos)) {
    const r = await rodarCli(args);
    assert.equal(r.status, 1, nome);
    assert.match(r.stderr, erro, nome);
  }
});

test('16. CLI: invocado por symlink executa de verdade (antes: saía 0 sem testar nada)', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'smoke-link-'));
  try {
    symlinkSync(__dirname, resolve(dir, 'atalho'));
    const r = await smokeCli({ ok: true }, { script: resolve(dir, 'atalho', 'smoke-functions.mjs') });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Edge smoke: 1\/1 passed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('17. sem origem canônica o smoke reprova em vez de aprovar por vacuidade', async () => {
  const fetchImpl = async () => mkResponse(204, { 'access-control-allow-origin': CANONICA });
  const r = await smokeFunction({ fn: { name: 'x', verify_jwt: false }, baseUrl: 'https://exemplo.invalid', retries: 1, allowedOrigins: [], fetchImpl });
  assert.equal(r.passed, false);
  assert.match(r.error, /nenhuma origem canônica/);
});

test('18. config.toml real: toda função declarada tem verify_jwt booleano legível pelo smoke', async () => {
  const toml = readFileSync(CAMINHO_TOML, 'utf8');
  const nomes = [...toml.matchAll(/^\[functions\.([^\]]+)\]$/gm)].map((m) => m[1]);
  assert.ok(nomes.length > 50, `esperava dezenas de blocos, achei ${nomes.length}`);
  const dir = mkdtempSync(resolve(tmpdir(), 'smoke-toml-'));
  try {
    const lista = resolve(dir, 'l.json');
    writeFileSync(lista, JSON.stringify({ functions: nomes.map((name) => ({ name })) }));
    const r = await rodarCli(['--base-url', baseLocal, '--output', resolve(dir, 'e.json'), '--git-sha', 'd'.repeat(40), '--run-id', '1',
      '--functions-list', lista, '--retries', '1', '--timeout-ms', '2000']);
    assert.equal(r.status, 0, r.stderr + r.stdout.split('\n').filter((l) => l.startsWith('FAIL')).join(','));
    assert.match(r.stdout, new RegExp(`Edge smoke: ${nomes.length}/${nomes.length} passed`));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
