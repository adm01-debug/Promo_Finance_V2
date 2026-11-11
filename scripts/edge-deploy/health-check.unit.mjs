// health-check.mjs contra um servidor HTTP local efêmero — nunca contra a Management API real.
// O `fetchImpl` injetado só troca a origem (api.supabase.com → 127.0.0.1:porta); método,
// cabeçalhos, corpo, timeout e política de redirect são os do próprio módulo.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, resolveScope, buildLogsSql, queryAnalytics, main } from './health-check.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dirname, 'health-check.mjs');
const REF = 'bwwbeyolnnzppeuhgkcd';
const TOKEN = ['sb', 'p_', 'f1c7'.repeat(10)].join('');
const BASE = ['--project-ref', REF, '--no-wait'];

let servidor;
let origem;
let responder; // (req, res, corpo) => void — trocado por teste
let recebidas;

before(async () => {
  servidor = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      recebidas.push({ method: req.method, url: req.url, headers: req.headers, corpo });
      responder(req, res, corpo);
    });
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  origem = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor.closeAllConnections();
  await new Promise((ok) => servidor.close(ok));
});

beforeEach(() => {
  recebidas = [];
  responder = (_req, res) => json(res, 200, { result: [{ total: 100, errors: 1 }] });
});

const json = (res, status, corpo) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(corpo));
};

const fetchLocal = (url, init) => fetch(String(url).replace('https://api.supabase.com', origem), init);

// Roda main() capturando console e garantindo que o token não aparece em nenhuma linha.
async function rodar(argv, { env = { SUPABASE_ACCESS_TOKEN: TOKEN }, fetchImpl = fetchLocal } = {}) {
  const linhas = [];
  const original = { log: console.log, error: console.error };
  console.log = (...a) => linhas.push(a.join(' '));
  console.error = (...a) => linhas.push(a.join(' '));
  let codigo;
  try {
    codigo = await main(argv, { fetchImpl, env });
  } finally {
    Object.assign(console, original);
  }
  const saida = linhas.join('\n');
  assert.equal(saida.includes(TOKEN), false, 'o token não pode aparecer na saída');
  return { codigo, saida };
}

test('taxa abaixo do limiar: OK, exit 0, e a consulta vai autenticada para o endpoint de analytics', async () => {
  const { codigo, saida } = await rodar([...BASE, '--scope', 'asaas-proxy']);
  assert.equal(codigo, 0);
  assert.match(saida, /invocações: 100 \| erros 5xx: 1 \| taxa: 1\.0%/);
  assert.match(saida, /OK — taxa de 5xx \(1\.0%\) dentro do limiar/);
  assert.equal(recebidas.length, 1);
  const [req] = recebidas;
  assert.equal(req.method, 'POST');
  assert.equal(req.url, `/v1/projects/${REF}/analytics/endpoints/logs.all`);
  assert.equal(req.headers.authorization, `Bearer ${TOKEN}`);
  assert.match(JSON.parse(req.corpo).sql, /AND m\.function IN \('asaas-proxy'\)/);
});

test('taxa acima do limiar: ::error:: e exit 1; no limite exato não falha', async () => {
  responder = (_req, res) => json(res, 200, { result: [{ total: 10, errors: 2 }] });
  const acima = await rodar(BASE);
  assert.equal(acima.codigo, 1);
  assert.match(acima.saida, /::error::Health check FALHOU — taxa de 5xx \(20\.0%\) supera o limiar de 10%/);
  responder = (_req, res) => json(res, 200, { result: [{ total: 10, errors: 1 }] });
  assert.equal((await rodar(BASE)).codigo, 0, '10% com limiar 10% não supera');
  assert.equal((await rodar([...BASE, '--threshold', '0.05'])).codigo, 1, 'limiar configurável');
  assert.equal((await rodar([...BASE, '--threshold', '0'])).codigo, 1, 'limiar zero reprova qualquer 5xx');
});

test('contagens como string numérica (BigQuery devolve INT64 como string) são medidas', async () => {
  responder = (_req, res) => json(res, 200, { result: [{ total: '50', errors: '25' }] });
  const { codigo, saida } = await rodar(BASE);
  assert.equal(codigo, 1);
  assert.match(saida, /taxa: 50\.0%/);
});

test('degradação controlada: 5xx, 401, corpo não-JSON, JSON inesperado e erro da API viram ::warning:: com exit 0', async () => {
  const cenarios = {
    'HTTP 500': (_q, res) => json(res, 500, { message: 'boom' }),
    'HTTP 503': (_q, res) => { res.writeHead(503); res.end('upstream'); },
    'HTTP 401 com eco do token': (q, res) => json(res, 401, { message: `token inválido: ${q.headers.authorization}` }),
    'HTML em 200': (_q, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html>manutenção</html>'); },
    'corpo vazio': (_q, res) => { res.writeHead(200); res.end(); },
    'JSON null': (_q, res) => json(res, 200, null),
    'erro em 200': (_q, res) => json(res, 200, { result: [], error: { message: 'syntax error' } }),
    'conexão derrubada': (q) => q.socket.destroy(),
  };
  for (const [nome, fn] of Object.entries(cenarios)) {
    responder = fn;
    const { codigo, saida } = await rodar(BASE);
    assert.equal(codigo, 0, nome);
    assert.match(saida, /::warning::Health check falhou ao consultar a Management API/, nome);
    assert.doesNotMatch(saida, /::error::|OK — taxa/, nome);
  }
});

test('contagem não numérica não vira "OK": avisa que não mediu (antes: NaN > limiar = falso → OK)', async () => {
  for (const linha of [{ total: 'abc', errors: 1 }, { total: 10, errors: 'x' }, { total: -5, errors: 1 }, { total: {}, errors: [] }]) {
    responder = (_req, res) => json(res, 200, { result: [linha] });
    const { codigo, saida } = await rodar(BASE);
    assert.equal(codigo, 0);
    assert.match(saida, /::warning::Health check recebeu contagens inválidas/);
    assert.doesNotMatch(saida, /OK — taxa/);
  }
});

test('sem linhas ou zero invocações: informa e sai 0', async () => {
  responder = (_req, res) => json(res, 200, { result: [] });
  assert.match((await rodar(BASE)).saida, /Nenhum log na janela de observação/);
  responder = (_req, res) => json(res, 200, { result: [{ total: 0, errors: 0 }] });
  assert.match((await rodar(BASE)).saida, /Zero invocações na janela/);
  responder = (_req, res) => json(res, 200, { result: [null] });
  assert.match((await rodar(BASE)).saida, /Nenhum log na janela de observação/);
});

test('redirect não é seguido: o token não viaja para o destino do Location', async () => {
  const outro = http.createServer((req, res) => {
    recebidas.push({ desviada: true, headers: req.headers });
    json(res, 200, { result: [{ total: 1, errors: 0 }] });
  });
  await new Promise((ok) => outro.listen(0, '127.0.0.1', ok));
  try {
    for (const status of [301, 302, 307, 308]) {
      recebidas = [];
      responder = (_req, res) => { res.writeHead(status, { Location: `http://127.0.0.1:${outro.address().port}/roubo` }); res.end(); };
      const { codigo, saida } = await rodar(BASE);
      assert.equal(codigo, 0);
      assert.match(saida, /::warning::Health check falhou ao consultar/);
      assert.equal(recebidas.some((r) => r.desviada), false, `HTTP ${status} foi seguido`);
    }
  } finally {
    await new Promise((ok) => outro.close(ok));
  }
});

test('timeout: servidor que não responde vira falha de consulta, não trava', async () => {
  responder = () => {}; // nunca responde
  const inicio = Date.now();
  await assert.rejects(
    queryAnalytics({ projectRef: REF, token: TOKEN, sql: 'SELECT 1', fetchImpl: fetchLocal, timeoutMs: 150 }),
    (erro) => erro.name === 'TimeoutError' || erro.name === 'AbortError',
  );
  assert.ok(Date.now() - inicio < 5000);
});

test('sem token (ausente, vazio ou só espaço): aviso, exit 0 e nenhuma requisição', async () => {
  for (const env of [{}, { SUPABASE_ACCESS_TOKEN: '' }, { SUPABASE_ACCESS_TOKEN: '  \n' }]) {
    const { codigo, saida } = await rodar(BASE, { env });
    assert.equal(codigo, 0);
    assert.match(saida, /::warning::SUPABASE_ACCESS_TOKEN ausente/);
  }
  assert.equal(recebidas.length, 0);
});

test('token com espaço/quebra de linha nas pontas é enviado limpo', async () => {
  await rodar(BASE, { env: { SUPABASE_ACCESS_TOKEN: `  ${TOKEN}\n` } });
  assert.equal(recebidas[0].headers.authorization, `Bearer ${TOKEN}`);
});

test('dry-run não espera nem chama a API', async () => {
  const { codigo, saida } = await rodar(['--project-ref', REF, '--dry-run', '--wait-ms', '600000']);
  assert.equal(codigo, 0);
  assert.match(saida, /Dry run: sem espera e sem chamada à API/);
  assert.equal(recebidas.length, 0);
});

test('--wait-ms é respeitado antes da consulta', async () => {
  const inicio = Date.now();
  await rodar(['--project-ref', REF, '--wait-ms', '250']);
  assert.ok(Date.now() - inicio >= 240);
  assert.equal(recebidas.length, 1);
});

test('escopo "all" usa a lista plana; escopo nomeado ignora a lista', async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'health-'));
  try {
    const lista = resolve(dir, 'functions.json');
    writeFileSync(lista, JSON.stringify({ functions: [{ name: 'asaas-proxy' }, { name: 'mcp-query' }, { verify_jwt: true }, { name: '' }] }));
    assert.deepEqual(await resolveScope('all', lista), ['asaas-proxy', 'mcp-query']);
    assert.deepEqual(await resolveScope(undefined, lista), ['asaas-proxy', 'mcp-query']);
    assert.deepEqual(await resolveScope('health', lista), ['health']);
    assert.deepEqual(await resolveScope('all', undefined), []);
    await rodar([...BASE, '--functions-list', lista]);
    assert.match(JSON.parse(recebidas[0].corpo).sql, /IN \('asaas-proxy', 'mcp-query'\)/);
    writeFileSync(lista, '{ quebrado');
    await assert.rejects(resolveScope('all', lista));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('buildLogsSql: sem slug não filtra; slug fora do formato é recusado (injeção na SQL de analytics)', () => {
  assert.doesNotMatch(buildLogsSql([], 5), /m\.function IN/);
  assert.match(buildLogsSql(['a-b', 'c_d1'], 5), /INTERVAL 5 MINUTE\) AND m\.function IN \('a-b', 'c_d1'\)$/);
  for (const ruim of ["x') OR 1=1 --", "a'b", 'a b', '', '-x', 'a;b', 'a\nb', null, 7]) {
    assert.throws(() => buildLogsSql(['ok', ruim], 5), /slug de função inválido/, JSON.stringify(ruim));
  }
});

test('slug malicioso via --scope não chega à API', async () => {
  await assert.rejects(rodar([...BASE, '--scope', "x') OR ('1'='1"]), /slug de função inválido/);
  assert.equal(recebidas.length, 0);
});

test('parseArgs: valida projeto, limiar, espera e flags', () => {
  assert.deepEqual(parseArgs(['--project-ref', REF]), { threshold: 0.1, waitMs: 300000, dryRun: false, projectRef: REF });
  assert.equal(parseArgs(['--project-ref', REF, '--threshold', '0.25']).threshold, 0.25);
  assert.equal(parseArgs(['--project-ref', REF, '--wait-ms', '0']).waitMs, 0);
  const invalidos = {
    'sem projeto': [],
    'projeto não canônico': ['--project-ref', 'pgxfvjmuubtbowutlide'],
    'flag desconhecida': ['--project-ref', REF, '--nope'],
    'limiar não numérico (antes: NaN → sempre OK)': ['--project-ref', REF, '--threshold', 'abc'],
    'limiar em percentual (antes: nunca falhava)': ['--project-ref', REF, '--threshold', '10'],
    'limiar negativo': ['--project-ref', REF, '--threshold', '-0.1'],
    'limiar sem valor': ['--project-ref', REF, '--threshold'],
    'limiar seguido de flag': ['--project-ref', REF, '--threshold', '--no-wait'],
    'espera não numérica': ['--project-ref', REF, '--wait-ms', 'cinco'],
    'espera negativa': ['--project-ref', REF, '--wait-ms', '-1'],
    'espera fracionária': ['--project-ref', REF, '--wait-ms', '1.5'],
    'project-ref sem valor': ['--project-ref'],
    'functions-list sem valor': ['--project-ref', REF, '--functions-list'],
  };
  for (const [nome, argv] of Object.entries(invalidos)) assert.throws(() => parseArgs(argv), Error, nome);
});

// ---- CLI: só os caminhos que não tocam rede -------------------------------
function cli(args, env = {}) {
  const limpo = { ...process.env, ...env };
  if (!('SUPABASE_ACCESS_TOKEN' in env)) delete limpo.SUPABASE_ACCESS_TOKEN;
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env: limpo, timeout: 20_000 });
}

test('CLI: sem token avisa e sai 0', () => {
  const r = cli(BASE);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /::warning::SUPABASE_ACCESS_TOKEN ausente — health check ignorado/);
});

test('CLI: dry-run com token sai 0 sem rede e sem imprimir o token', () => {
  const r = cli(['--project-ref', REF, '--dry-run', '--scope', 'asaas-proxy'], { SUPABASE_ACCESS_TOKEN: TOKEN });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Ensaio — escopo: asaas-proxy; funções: 1/);
  assert.equal((r.stdout + r.stderr).includes(TOKEN), false);
});

test('CLI: erro de uso degrada para ::warning:: com exit 0 (contrato: o check não derruba o deploy)', () => {
  for (const args of [[], ['--project-ref', 'outro'], [...BASE, '--threshold', 'abc'], [...BASE, '--nope']]) {
    const r = cli(args, { SUPABASE_ACCESS_TOKEN: TOKEN });
    assert.equal(r.status, 0, args.join(' '));
    assert.match(r.stderr, /::warning::health-check\.mjs falhou inesperadamente: .+ Prosseguindo\./);
    assert.equal(r.stdout.includes('OK — taxa'), false, 'argumento inválido não pode sair como "OK"');
  }
});

test('importar o módulo não executa o check (antes: main() rodava no import)', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(SCRIPT)}); console.log('importado');`], {
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: '' },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 'importado');
  assert.equal(r.stderr.includes('health-check'), false, r.stderr);
});
