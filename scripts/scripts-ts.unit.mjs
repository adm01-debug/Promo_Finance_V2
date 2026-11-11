// Testes de fumaça dos scripts TypeScript soltos em scripts/ — cada um roda de
// verdade via `bun` em subprocesso (o vitest do repositório só inclui src/**).
// Os que falam com Supabase apontam para um servidor HTTP falso em 127.0.0.1.
//
// Rodar: node --test scripts/scripts-ts.unit.mjs   (requer bun no PATH)

import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = (nome) => join(RAIZ, 'scripts', nome);
const TEM_BUN = spawnSync('bun', ['--version'], { encoding: 'utf8' }).status === 0;
const opcoes = { skip: TEM_BUN ? false : 'bun não está no PATH' };

/** Roda `bun run <script>`; nunca rejeita. Ambiente mínimo (sem proxy herdado). */
function bun(nome, args = [], { env = {}, cwd = RAIZ } = {}) {
  return new Promise((done) => {
    execFile('bun', ['run', script(nome), ...args], {
      cwd,
      env: { PATH: process.env.PATH, HOME: process.env.HOME ?? '', NO_PROXY: '127.0.0.1,localhost', ...env },
      encoding: 'utf8',
      timeout: 120_000,
    }, (error, stdout, stderr) => done({ code: error ? error.code ?? 1 : 0, stdout, stderr }));
  });
}

const tmp = (prefixo) => mkdtempSync(join(tmpdir(), prefixo));

/** Sobe um servidor HTTP efêmero; `handler(req, res, corpo)`. */
async function comServidor(handler, fn) {
  const recebidas = [];
  const server = createServer((req, res) => {
    recebidas.push({ method: req.method, url: req.url, accept: req.headers.accept ?? '', apikey: req.headers.apikey ?? '' });
    handler(req, res);
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  try {
    return await fn(`http://127.0.0.1:${server.address().port}`, recebidas);
  } finally {
    server.closeAllConnections();
    await new Promise((ok) => server.close(ok));
  }
}

const json = (res, status, obj) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
};

// --- simular-*: motores puros, determinísticos --------------------------------

const SIMULADORES = [
  ['simular-observabilidade-digest.ts', /^✅ 600 cenários validados, 0 falhas\.$/m],
  ['simular-preferencias-digest.ts', /^✓ 400 cenários validados — 8 invariantes, 0 falhas\.$/m],
  ['simular-projecao-conformidade.ts', /^✓ 600 cenários validados — 15 invariantes \+ 5 casos-limite, 0 falhas\.$/m],
];

for (const [nome, esperado] of SIMULADORES) {
  test(`${nome}: todas as invariantes valem e a saída é determinística`, opcoes, async () => {
    // simular-observabilidade-digest.ts: regressão — a invariante de
    // destinatários subtraía `simulados` e reprovava 581 de 600 cenários.
    const a = await bun(nome);
    assert.equal(a.code, 0, a.stdout.slice(-600) + a.stderr.slice(-600));
    assert.match(a.stdout, esperado);
    assert.equal(a.stderr, '');
    const b = await bun(nome);
    assert.equal(b.stdout, a.stdout);
  });
}

// --- run-scenarios.ts ---------------------------------------------------------

test('run-scenarios: gera Markdown + JSON coerentes no caminho pedido', opcoes, async () => {
  const dir = tmp('pf-run-scenarios-');
  const out = join(dir, 'sub', 'nao-existia', 'rel.md');
  const r = await bun('run-scenarios.ts', ['--count', '40', '--seed', '7', '--out', out], { cwd: dir });
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /✔ 40\/40 passou · 0 falhou/);
  const resumo = JSON.parse(readFileSync(out.replace(/\.md$/, '.json'), 'utf8'));
  assert.equal(resumo.total, 40);
  assert.equal(resumo.failed, 0);
  assert.match(readFileSync(out, 'utf8'), /^# Scenario Harness/);
  assert.deepEqual(readdirSync(dir), ['sub'], 'escreveu fora do caminho pedido');
  rmSync(dir, { recursive: true, force: true });
});

test('run-scenarios: --out sem sufixo .md não deixa o JSON sobrescrever o Markdown', opcoes, async () => {
  // Regressão: os dois writeFileSync caíam no mesmo arquivo.
  const dir = tmp('pf-run-scenarios-');
  const out = join(dir, 'relatorio.txt');
  const r = await bun('run-scenarios.ts', ['--count', '10', '--out', out], { cwd: dir });
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(readFileSync(out, 'utf8'), /^# Scenario Harness/);
  assert.equal(JSON.parse(readFileSync(`${out}.json`, 'utf8')).total, 10);
  rmSync(dir, { recursive: true, force: true });
});

test('run-scenarios: `all` cobre os domínios do gerador (inclui nfe) e aceita CSV com espaços', opcoes, async () => {
  const dir = tmp('pf-run-scenarios-');
  let r = await bun('run-scenarios.ts', ['--count', '10', '--out', join(dir, 'a.md')], { cwd: dir });
  assert.match(r.stdout, /domínios=conciliacao,webhooks,cobranca,anomalias,nfe\)/);
  r = await bun('run-scenarios.ts', ['--count', '6', '--domain', ' nfe , webhooks ', '--out', join(dir, 'b.md')], { cwd: dir });
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /domínios=nfe,webhooks\)/);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(dir, 'b.json'), 'utf8')).byDomain).sort(), ['nfe', 'webhooks']);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(dir, 'a.json'), 'utf8')).byDomain).sort(), ['anomalias', 'cobranca', 'conciliacao', 'nfe', 'webhooks']);
  rmSync(dir, { recursive: true, force: true });
});

test('run-scenarios: mesma seed → mesmo resultado (fora as durações)', opcoes, async () => {
  const dir = tmp('pf-run-scenarios-');
  const semTempo = (arq) => JSON.stringify(JSON.parse(readFileSync(arq, 'utf8')), (k, v) => (/duration|ms$/i.test(k) ? undefined : v));
  await bun('run-scenarios.ts', ['--count', '30', '--seed', '99', '--out', join(dir, 'a.md')], { cwd: dir });
  await bun('run-scenarios.ts', ['--count', '30', '--seed', '99', '--out', join(dir, 'b.md')], { cwd: dir });
  assert.equal(semTempo(join(dir, 'a.json')), semTempo(join(dir, 'b.json')));
  rmSync(dir, { recursive: true, force: true });
});

test('run-scenarios: argumentos inválidos saem 2 sem rodar nem escrever nada', opcoes, async () => {
  // Regressão: `--count abc` → "0/0 passou" exit 0; domínio desconhecido → cenários vazios "passando".
  const dir = tmp('pf-run-scenarios-');
  const casos = [
    [['--count', 'abc'], /--count inválido/],
    [['--count', '0'], /--count inválido/],
    [['--count', '-3'], /--count inválido/],
    [['--count', '2.5'], /--count inválido/],
    [['--seed', 'x'], /--seed inválido/],
    [['--domain', 'inexistente'], /--domain inválido: inexistente/],
    [['--domain', 'webhooks,entregas'], /--domain inválido: entregas/],
    [['--count'], /--count exige um valor/],
    [['--out', '--count', '5'], /--out exige um valor/],
  ];
  for (const [args, esperado] of casos) {
    const r = await bun('run-scenarios.ts', args, { cwd: dir });
    assert.equal(r.code, 2, args.join(' '));
    assert.match(r.stderr, esperado);
    assert.doesNotMatch(r.stdout, /passou/);
  }
  assert.deepEqual(readdirSync(dir), []);
  const ajuda = await bun('run-scenarios.ts', ['--help'], { cwd: dir });
  assert.equal(ajuda.code, 0);
  assert.match(ajuda.stdout, /^Uso: bun run scripts\/run-scenarios\.ts/);
  assert.deepEqual(readdirSync(dir), []);
  rmSync(dir, { recursive: true, force: true });
});

// --- gerar-grafo-arquitetura.ts -------------------------------------------------

test('gerar-grafo-arquitetura --check: snapshot do repositório em dia, sem escrever', opcoes, async () => {
  const alvo = join(RAIZ, 'src/lib/arquitetura/grafo-observado.json');
  const antes = readFileSync(alvo, 'utf8');
  const r = await bun('gerar-grafo-arquitetura.ts', ['--check']);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const total = JSON.parse(antes).arestasObservadas.length;
  assert.equal(r.stdout.trim(), `ok ${total} (em dia)`);
  assert.equal(readFileSync(alvo, 'utf8'), antes);
});

test('gerar-grafo-arquitetura: grava, confere e acusa snapshot adulterado (árvore de fixture)', opcoes, async () => {
  const dir = tmp('pf-grafo-');
  mkdirSync(join(dir, 'src/lib/arquitetura'), { recursive: true });
  writeFileSync(join(dir, 'src/lib/arquitetura/modulos.ts'), '// marcador de raiz\n');
  const alvo = join(dir, 'src/lib/arquitetura/grafo-observado.json');

  let r = await bun('gerar-grafo-arquitetura.ts', ['--check'], { cwd: dir });
  assert.equal(r.code, 1, 'sem snapshot em disco o --check precisa falhar');
  assert.equal(existsSync(alvo), false, '--check não pode criar o arquivo');

  r = await bun('gerar-grafo-arquitetura.ts', [], { cwd: dir });
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const bruto = readFileSync(alvo, 'utf8');
  const snap = JSON.parse(bruto);
  assert.equal(r.stdout.trim(), `ok ${snap.arestasObservadas.length}`);
  assert.deepEqual(Object.keys(snap), ['geradoPor', 'arestasObservadas', 'totalImportsAnalisados', 'driftResumo']);
  assert.deepEqual(snap.arestasObservadas, [...snap.arestasObservadas].sort());
  assert.ok(bruto.endsWith('}\n'));

  assert.equal((await bun('gerar-grafo-arquitetura.ts', ['--check'], { cwd: dir })).code, 0);
  writeFileSync(alvo, bruto.replace('"totalImportsAnalisados": ', '"totalImportsAnalisados": 9'));
  r = await bun('gerar-grafo-arquitetura.ts', ['--check'], { cwd: dir });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /desatualizado/);
  rmSync(dir, { recursive: true, force: true });
});

test('gerar-grafo-arquitetura: fora da raiz ou com flag errada não grava nada', opcoes, async () => {
  // Regressão: fora da raiz morria com ENOENT cru; flag desconhecida regravava o snapshot.
  const dir = tmp('pf-grafo-');
  let r = await bun('gerar-grafo-arquitetura.ts', [], { cwd: dir });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /não é a raiz do repositório/);
  r = await bun('gerar-grafo-arquitetura.ts', ['--chek'], { cwd: dir });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /Argumento desconhecido: --chek/);
  assert.deepEqual(readdirSync(dir), []);
  rmSync(dir, { recursive: true, force: true });
});

// --- stress-test.ts (alvo: servidor falso local) ------------------------------

const ENV_SUPABASE = (url) => ({ SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: 'chave-falsa-de-teste' });

test('stress-test: dispara exatamente STRESS_TOTAL requisições e sai 0', opcoes, async () => {
  await comServidor((_req, res) => json(res, 200, [{ id: 'p1' }]), async (url, recebidas) => {
    // 20 com concorrência 7 → lotes 7+7+6. Regressão: o último lote ia cheio (21).
    const r = await bun('stress-test.ts', [], { env: { ...ENV_SUPABASE(url), STRESS_TOTAL: '20', STRESS_CONCURRENCY: '7' } });
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /- Total: 20\n- Success: 20\n- Fails: 0/);
    assert.equal(recebidas.length, 20);
    assert.ok(recebidas.every((x) => x.method === 'GET' && x.url.startsWith('/rest/v1/profiles?select=id&limit=1')));
    assert.ok(!(r.stdout + r.stderr).includes('chave-falsa-de-teste'), 'service role key vazou na saída');
  });
});

test('stress-test: falhas contam e viram exit 1 com o primeiro erro', opcoes, async () => {
  // Regressão: 500 falhas em 500 terminavam com exit 0.
  await comServidor((_req, res) => json(res, 500, { message: 'pool esgotado', code: 'XX000' }), async (url) => {
    const r = await bun('stress-test.ts', [], { env: { ...ENV_SUPABASE(url), STRESS_TOTAL: '6', STRESS_CONCURRENCY: '3' } });
    assert.equal(r.code, 1);
    assert.match(r.stdout, /- Success: 0\n- Fails: 6/);
    assert.match(r.stderr, /6 requisição\(ões\) falharam\. Primeiro erro: pool esgotado/);
  });
});

test('stress-test: servidor que não responde estoura o timeout em vez de travar', opcoes, async () => {
  await comServidor(() => { /* nunca responde */ }, async (url) => {
    const r = await bun('stress-test.ts', [], { env: { ...ENV_SUPABASE(url), STRESS_TOTAL: '2', STRESS_CONCURRENCY: '2', STRESS_TIMEOUT_MS: '400' } });
    assert.equal(r.code, 1);
    assert.match(r.stdout, /- Fails: 2/);
  });
});

test('stress-test: configuração inválida e alvo de produção são recusados sem rede', opcoes, async () => {
  let r = await bun('stress-test.ts', [], { env: {} });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios/);

  for (const [nome, valor] of [['STRESS_TOTAL', '0'], ['STRESS_CONCURRENCY', 'abc'], ['STRESS_TIMEOUT_MS', '-1']]) {
    r = await bun('stress-test.ts', [], { env: { ...ENV_SUPABASE('http://127.0.0.1:9'), [nome]: valor } });
    assert.equal(r.code, 2, nome);
    assert.match(r.stderr, new RegExp(`${nome} inválido`));
  }
  r = await bun('stress-test.ts', [], { env: ENV_SUPABASE('não é url') });
  assert.equal(r.code, 2);

  // O guard sai antes de criar o cliente: nenhuma requisição chega a ser feita.
  const refProd = readFileSync(join(RAIZ, 'supabase/config.toml'), 'utf8').match(/^project_id\s*=\s*"([^"]+)"/m)[1];
  r = await bun('stress-test.ts', [], { env: { ...ENV_SUPABASE(`https://${refProd}.supabase.co`), STRESS_TOTAL: '1' } });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /projeto de PRODUÇÃO — carga recusada/);
  assert.doesNotMatch(r.stdout, /Starting Load/);
});

// --- generate-simulation-report.ts (PostgREST falso) ----------------------------

/** PostgREST mínimo: `runs` e `results` controlam o que cada tabela devolve. */
function postgrest({ runs, results, erroEm }) {
  return (req, res) => {
    const tabela = new URL(req.url, 'http://x').pathname.replace('/rest/v1/', '');
    if (erroEm === tabela) return json(res, 500, { message: `falha em ${tabela}`, code: 'XX000' });
    const linhas = tabela === 'webhook_simulation_runs' ? runs : results;
    if ((req.headers.accept ?? '').includes('vnd.pgrst.object')) {
      if (linhas.length !== 1) {
        return json(res, 406, { code: 'PGRST116', details: `The result contains ${linhas.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
      }
      return json(res, 200, linhas[0]);
    }
    return json(res, 200, linhas);
  };
}

const RUN = { id: 'run-1', target_function: 'asaas-webhook', status: 'completed', total_scenarios: 3, success_count: 2, failure_count: 1, started_at: '2026-01-01T00:00:00Z', finished_at: null };
const RESULTS = [
  { response_status: 200, duration_ms: 100, success: true },
  { response_status: 200, duration_ms: 200, success: true },
  { response_status: 500, duration_ms: null, success: false },
];

test('generate-simulation-report: imprime a última execução e as métricas', opcoes, async () => {
  await comServidor(postgrest({ runs: [RUN], results: RESULTS }), async (url, recebidas) => {
    const r = await bun('generate-simulation-report.ts', [], { env: ENV_SUPABASE(url) });
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /--- Run Details \[run-1\] ---/);
    assert.match(r.stdout, /Function: asaas-webhook/);
    assert.match(r.stdout, /Finished: In progress/);
    assert.match(r.stdout, /Average Latency: 100\.00ms/);
    assert.match(r.stdout, /"?200"?: 2/);
    assert.match(r.stdout, /"?500"?: 1/);
    assert.match(r.stdout, /Report generated successfully/);
    assert.match(recebidas[0].url, /webhook_simulation_runs\?select=\*&order=started_at\.desc&limit=1/);
    assert.match(recebidas[1].url, /webhook_simulation_results\?select=response_status%2Cduration_ms%2Csuccess&run_id=eq\.run-1/);
    assert.ok(recebidas.every((x) => x.method === 'GET'), 'o relatório é somente leitura');
  });
});

test('generate-simulation-report: sem execuções informa e sai 0', opcoes, async () => {
  // Regressão: .single() transformava "tabela vazia" em erro PGRST116.
  await comServidor(postgrest({ runs: [], results: [] }), async (url) => {
    const r = await bun('generate-simulation-report.ts', [], { env: ENV_SUPABASE(url) });
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /No simulation runs found/);
    assert.doesNotMatch(r.stdout, /Report generated successfully/);
  });
});

test('generate-simulation-report: erro de consulta sai 1 (antes saía 0)', opcoes, async () => {
  for (const tabela of ['webhook_simulation_runs', 'webhook_simulation_results']) {
    await comServidor(postgrest({ runs: [RUN], results: RESULTS, erroEm: tabela }), async (url) => {
      const r = await bun('generate-simulation-report.ts', [], { env: ENV_SUPABASE(url) });
      assert.equal(r.code, 1, tabela);
      assert.match(r.stderr, new RegExp(`falha em ${tabela}`));
      assert.doesNotMatch(r.stdout, /Report generated successfully/);
    });
  }
});

test('generate-simulation-report: sem env sai 1 antes de qualquer requisição', opcoes, async () => {
  const r = await bun('generate-simulation-report.ts', [], { env: {} });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/);
});
