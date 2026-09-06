#!/usr/bin/env node
/**
 * Suíte exaustiva MCP — Promo Finance
 *
 * Uso seguro:
 *   node scripts/mcp-phd-suite.mjs --url URL [--token TOKEN]
 *   MCP_TOKEN=... node scripts/mcp-phd-suite.mjs --url URL
 *
 * Regras:
 *   - `--url` é obrigatório.
 *   - token somente por `--token` ou `MCP_TOKEN`.
 *   - modo padrão é estritamente read-only (A1–A4).
 *   - testes mutáveis exigem `--suite a5 --allow-mutations --confirm-target <alvo>`.
 *   - `--dry-run` e `--self-test` nunca fazem chamadas de rede.
 *   - alvo compatível deste script = Worker MCP com endpoint JSON-RPC `/mcp`.
 *   - não use este script contra o Edge `mcp-query`, que expõe HTTP JSON próprio.
 */

const HELP_TEXT = `
Uso:
  node scripts/mcp-phd-suite.mjs --url URL [opções]

Opções:
  --url URL                  Endpoint MCP alvo (obrigatório)
  --token TOKEN              Token Bearer; alternativamente use MCP_TOKEN
  --suite LISTA              Suites separadas por vírgula: a1,a2,a3,a4,a5
                             Alias: readonly (= a1,a2,a3,a4), all (= a1..a5)
  --allow-mutations          Libera suites mutáveis
  --confirm-target ALVO      Confirma explicitamente o alvo mutável
  --verbose                  Logs extras
  --dry-run                  Mostra a execução planejada sem rede
  --self-test                Valida parser/seleção/guardas sem rede
  --help                     Mostra esta ajuda

Exemplos:
  MCP_TOKEN=*** node scripts/mcp-phd-suite.mjs --url https://worker.exemplo.dev/mcp
  node scripts/mcp-phd-suite.mjs --url https://worker.exemplo.dev/mcp --suite a5 --allow-mutations --confirm-target worker.exemplo.dev/mcp

Compatibilidade de alvo:
  - Compatível: Worker MCP que exponha JSON-RPC em /mcp
  - Incompatível: Edge Function supabase/functions/mcp-query (HTTP JSON, sem tools/list / tools/call)
`.trim();

const READ_ONLY_SUITES = ['a1', 'a2', 'a3', 'a4'];
const MUTATION_SUITES = ['a5'];
const SUITE_ORDER = ['a1', 'a2', 'a3', 'a4', 'a5'];

const SUITE_ALIASES = {
  readonly: READ_ONLY_SUITES,
  'read-only': READ_ONLY_SUITES,
  all: SUITE_ORDER,
};

const THRESHOLDS = {
  db_vacuum: 60_000,
  db_relationships: 10_000,
  db_describe_table: 8_000,
  db_batch_query: 6_000,
  __default__: 5_000,
};

const MCP_BLOCK_PATTERNS = [
  'SQL bloqueado pela política de segurança do MCP',
  'Query destrutiva bloqueada',
  'Escrita administrativa bloqueada',
];

const A3_BLOCK_VECTORS = [
  {
    label: 'EXPLAIN DELETE sentinel',
    sql: 'EXPLAIN DELETE FROM __mcp_probe_delete_sentinel__ WHERE id = 1',
    expectedBlock: 'Escrita administrativa bloqueada',
  },
  {
    label: 'EXPLAIN UPDATE sentinel',
    sql: 'EXPLAIN UPDATE __mcp_probe_update_sentinel__ SET probe = 0 WHERE id = 1',
    expectedBlock: 'Escrita administrativa bloqueada',
  },
  {
    label: 'EXPLAIN INSERT sentinel',
    sql: 'EXPLAIN INSERT INTO __mcp_probe_insert_sentinel__ (id) VALUES (1)',
    expectedBlock: 'Escrita administrativa bloqueada',
  },
];

const READONLY_SQL_SAMPLES = [
  'SELECT 1 AS a',
  'SELECT 2 AS b',
  'SELECT 1',
  'SELECT 3',
  'SELECT generate_series(1,10) AS n',
  'SELECT now() AS t1',
  'SELECT now() AS t2',
  'SELECT 10 AS v',
  'SELECT 20 AS v',
  ...A3_BLOCK_VECTORS.map((item) => item.sql),
  "SELECT '🎉 ñoño αβγ' AS v",
  'SELECT 1 AS x',
  'SELECT generate_series(1,3) AS n',
  "SELECT 42 AS x, 'hi' AS s",
  'SELECT 42',
  ...Array.from({ length: 50 }, (_, i) => `SELECT ${i} AS n`),
];

const threshold = (name, hasTable) => {
  if (name === 'db_vacuum' && !hasTable) return THRESHOLDS.db_vacuum;
  return THRESHOLDS[name] ?? THRESHOLDS.__default__;
};

function fail(message) {
  throw new Error(message);
}

function parseArgv(argv, env = process.env) {
  const parsed = {
    url: '',
    token: '',
    suiteInputs: [],
    verbose: false,
    dryRun: false,
    selfTest: false,
    help: false,
    allowMutations: false,
    confirmTarget: '',
  };

  const expectValue = (flag, index) => {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      fail(`Flag ${flag} exige um valor.`);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg === '--verbose') {
      parsed.verbose = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--self-test') {
      parsed.selfTest = true;
      continue;
    }
    if (arg === '--allow-mutations') {
      parsed.allowMutations = true;
      continue;
    }

    if (arg === '--url') {
      parsed.url = expectValue('--url', i);
      i += 1;
      continue;
    }
    if (arg.startsWith('--url=')) {
      parsed.url = arg.slice('--url='.length);
      if (!parsed.url) fail('Flag --url exige um valor.');
      continue;
    }

    if (arg === '--token') {
      parsed.token = expectValue('--token', i);
      i += 1;
      continue;
    }
    if (arg.startsWith('--token=')) {
      parsed.token = arg.slice('--token='.length);
      if (!parsed.token) fail('Flag --token exige um valor.');
      continue;
    }

    if (arg === '--suite') {
      parsed.suiteInputs.push(expectValue('--suite', i));
      i += 1;
      continue;
    }
    if (arg.startsWith('--suite=')) {
      const suiteValue = arg.slice('--suite='.length);
      if (!suiteValue) fail('Flag --suite exige um valor.');
      parsed.suiteInputs.push(suiteValue);
      continue;
    }

    if (arg === '--confirm-target') {
      parsed.confirmTarget = expectValue('--confirm-target', i);
      i += 1;
      continue;
    }
    if (arg.startsWith('--confirm-target=')) {
      parsed.confirmTarget = arg.slice('--confirm-target='.length);
      if (!parsed.confirmTarget) fail('Flag --confirm-target exige um valor.');
      continue;
    }

    fail(`Flag desconhecida: ${arg}`);
  }

  if (!parsed.token) {
    parsed.token = env.MCP_TOKEN || '';
  }

  return parsed;
}

function parseSuiteSelection(inputs) {
  const selected = new Set();
  const raw = inputs.length ? inputs : ['readonly'];

  for (const input of raw) {
    for (const piece of input.split(',')) {
      const suite = piece.trim().toLowerCase();
      if (!suite) continue;

      const expanded = SUITE_ALIASES[suite];
      if (expanded) {
        expanded.forEach((item) => selected.add(item));
        continue;
      }

      if (!SUITE_ORDER.includes(suite)) {
        fail(`Suite inválida: ${suite}. Use ${SUITE_ORDER.join(', ')} ou aliases readonly/all.`);
      }
      selected.add(suite);
    }
  }

  return SUITE_ORDER.filter((suite) => selected.has(suite));
}

function detectTarget(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail(`URL inválida: ${url}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const path = parsed.pathname.replace(/\/+$/, '');
  const normalizedPath = path || '/';
  const subdomain = hostname.split('.')[0];
  const isSupabaseHost = hostname.endsWith('.supabase.co');

  return {
    hostname,
    normalizedPath,
    projectRef: isSupabaseHost && subdomain ? subdomain : '',
    descriptor: isSupabaseHost && subdomain ? subdomain : `${hostname}${normalizedPath}`,
  };
}

function validateConfig(config) {
  if (config.help || config.selfTest) return config;

  if (!config.url) {
    fail('`--url` é obrigatório. Não há URL default por segurança.');
  }

  detectTarget(config.url);

  if (!config.token) {
    fail('Token ausente. Forneça `--token` ou exporte `MCP_TOKEN`.');
  }

  const selectedSuites = parseSuiteSelection(config.suiteInputs);
  const mutationSuites = selectedSuites.filter((suite) => MUTATION_SUITES.includes(suite));
  const target = detectTarget(config.url);

  if (mutationSuites.length > 0) {
    if (!config.allowMutations) {
      fail(`Suites mutáveis (${mutationSuites.join(', ')}) exigem --allow-mutations.`);
    }
    if (!config.confirmTarget) {
      fail(`Suites mutáveis (${mutationSuites.join(', ')}) exigem --confirm-target ${target.descriptor}.`);
    }
    if (config.confirmTarget !== target.descriptor) {
      fail(`Confirmação de alvo divergente. Esperado: ${target.descriptor}. Recebido: ${config.confirmTarget}.`);
    }
  }

  return {
    ...config,
    selectedSuites,
    mutationSuites,
    target,
  };
}

function printPlan(config) {
  const lines = [
    'Plano de execução (dry-run)',
    `- alvo: ${config.url}`,
    `- descritor: ${config.target.descriptor}`,
    `- suites: ${config.selectedSuites.join(', ')}`,
    `- modo mutável: ${config.mutationSuites.length > 0 ? 'sim' : 'não'}`,
    `- rede será usada: não`,
    `- token: ${config.token ? 'fornecido' : 'ausente'}`,
  ];
  console.log(lines.join('\n'));
}

function runSelfTest() {
  const tests = [];

  const test = (name, fn) => {
    try {
      fn();
      tests.push({ name, ok: true });
    } catch (error) {
      tests.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  };

  test('parse --url/--token explícitos', () => {
    const parsed = parseArgv(['--url', 'https://demo.example/mcp', '--token', 'abc']);
    if (parsed.url !== 'https://demo.example/mcp') fail('url incorreta');
    if (parsed.token !== 'abc') fail('token incorreto');
  });

  test('parse com sintaxe --flag=valor', () => {
    const parsed = parseArgv(['--url=https://demo.example/mcp', '--suite=a1,a4', '--confirm-target=demo.example/mcp']);
    if (parsed.url !== 'https://demo.example/mcp') fail('url incorreta');
    if (parsed.suiteInputs[0] !== 'a1,a4') fail('suite incorreta');
    if (parsed.confirmTarget !== 'demo.example/mcp') fail('confirm incorreto');
  });

  test('fallback de token via env', () => {
    const parsed = parseArgv(['--url', 'https://demo.example/mcp'], { MCP_TOKEN: 'env-token' });
    if (parsed.token !== 'env-token') fail('env não aplicado');
  });

  test('readonly é padrão', () => {
    const suites = parseSuiteSelection([]);
    if (JSON.stringify(suites) !== JSON.stringify(READ_ONLY_SUITES)) fail('readonly padrão divergente');
  });

  test('alias all expande todas as suites', () => {
    const suites = parseSuiteSelection(['all']);
    if (JSON.stringify(suites) !== JSON.stringify(SUITE_ORDER)) fail('alias all divergente');
  });

  test('detecta project-ref Supabase', () => {
    const target = detectTarget('https://abc123.supabase.co/functions/v1/mcp-query');
    if (target.projectRef !== 'abc123') fail('project-ref não detectado');
    if (target.descriptor !== 'abc123') fail('descritor supabase divergente');
  });

  test('detecta alvo por host/path em worker', () => {
    const target = detectTarget('https://worker.example.dev/mcp/');
    if (target.descriptor !== 'worker.example.dev/mcp') fail('descritor worker divergente');
  });

  test('bloqueia execução sem URL', () => {
    let ok = false;
    try {
      validateConfig({ url: '', token: 'x', suiteInputs: [], help: false, selfTest: false, allowMutations: false, confirmTarget: '', verbose: false, dryRun: false });
    } catch (error) {
      ok = String(error.message).includes('--url');
    }
    if (!ok) fail('não bloqueou ausência de URL');
  });

  test('bloqueia mutação sem confirmação', () => {
    let ok = false;
    try {
      validateConfig({
        ...parseArgv(['--url', 'https://worker.example.dev/mcp', '--suite', 'a5', '--token', 'abc', '--allow-mutations']),
      });
    } catch (error) {
      ok = String(error.message).includes('--confirm-target');
    }
    if (!ok) fail('não bloqueou mutação sem confirmação');
  });

  test('aceita mutação com confirmação exata do alvo', () => {
    const validated = validateConfig({
      ...parseArgv([
        '--url',
        'https://worker.example.dev/mcp',
        '--suite',
        'a5',
        '--token',
        'abc',
        '--allow-mutations',
        '--confirm-target',
        'worker.example.dev/mcp',
      ]),
    });
    if (validated.mutationSuites[0] !== 'a5') fail('suite mutável não reconhecida');
  });

  test('readonly não contém comandos persistentes', () => {
    const forbidden = /\b(ALTER|DROP|TRUNCATE|RESET|VACUUM|GRANT|REVOKE|COMMENT|CREATE|INSERT|UPDATE|DELETE)\b/i;
    const allowedExplainWrite = /^EXPLAIN\s+(INSERT|UPDATE|DELETE)\b/i;
    const offenders = READONLY_SQL_SAMPLES.filter((sql) => forbidden.test(sql) && !allowedExplainWrite.test(sql));
    if (offenders.length > 0) fail(`SQL persistente no catálogo readonly: ${offenders.join(' | ')}`);
  });

  test('readonly não referencia tabelas reais em SQL mutável', () => {
    const hasRealTableRef = READONLY_SQL_SAMPLES.some((sql) =>
      /\b(DELETE|UPDATE|INSERT|ALTER|DROP|TRUNCATE|CREATE)\b/i.test(sql) &&
      /\bmcp_probe\b|\bpublic\./i.test(sql),
    );
    if (hasRealTableRef) fail('catálogo readonly contém SQL mutável apontando para tabela real');
  });

  test('vetores A3 usam apenas objetos sentinela', () => {
    const invalid = A3_BLOCK_VECTORS.filter((item) => !item.sql.includes('__mcp_probe_') || !item.sql.startsWith('EXPLAIN '));
    if (invalid.length > 0) fail(`vetor A3 fora do padrão sentinela: ${invalid.map((item) => item.label).join(', ')}`);
  });

  test('reconhece contrato novo de bloqueio do mcp-query', () => {
    const response = {
      status: 400,
      parsed: {
        error: 'SQL bloqueado pela política de segurança do MCP',
        reason: 'Escrita administrativa bloqueada — reenvie com allow_all_rows:true somente se intencional',
      },
    };
    if (!isExplicitMcpBlock(response, 'Escrita administrativa bloqueada')) {
      fail('contrato novo do mcp-query não foi reconhecido');
    }
  });

  test('help documenta incompatibilidade com edge mcp-query', () => {
    if (!HELP_TEXT.includes('Incompatível: Edge Function supabase/functions/mcp-query')) {
      fail('help não documenta alvo incompatível');
    }
  });

  const failed = tests.filter((item) => !item.ok);
  for (const item of tests) {
    console.log(`${item.ok ? '✅' : '❌'} ${item.name}${item.ok ? '' : ` — ${item.error}`}`);
  }
  if (failed.length > 0) {
    process.exitCode = 1;
    return;
  }
  console.log(`Self-test OK: ${tests.length} verificações.`);
}

let runtimeConfig = null;
let reqId = 1;
let results = { pass: [], fail: [], warn: [] };

function resetRunState() {
  reqId = 1;
  results = { pass: [], fail: [], warn: [] };
}

async function rawPost(body, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${runtimeConfig.token}`,
    ...extraHeaders,
  };
  const t0 = Date.now();
  const res = await fetch(runtimeConfig.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const ms = Date.now() - t0;
  const txt = await res.text();
  let json;
  try {
    json = JSON.parse(txt);
  } catch {
    json = { _raw: txt };
  }
  return { status: res.status, json, ms, headers: Object.fromEntries(res.headers) };
}

async function callTool(name, args = {}) {
  const r = await rawPost({
    jsonrpc: '2.0',
    id: reqId++,
    method: 'tools/call',
    params: { name, arguments: args },
  });
  const text = r.json?.result?.content?.[0]?.text;
  let parsed;
  try {
    parsed = JSON.parse(text || 'null');
  } catch {
    parsed = { _raw: text };
  }
  const ms = r.ms;
  const thr = threshold(name, !!args.table);
  if (ms > thr) {
    results.warn.push({ name, ms, threshold: thr, msg: `${ms}ms > ${thr}ms threshold` });
    if (runtimeConfig.verbose) {
      console.warn(`  ⚠️  ${name} lento: ${ms}ms (threshold ${thr}ms)`);
    }
  }
  return { ...r, parsed, ms };
}

function assert(name, cond, actual, expected) {
  if (cond) {
    results.pass.push(name);
    return true;
  }
  results.fail.push({ name, actual: JSON.stringify(actual)?.slice(0, 200), expected });
  return false;
}

function warn_(name, msg) {
  results.warn.push({ name, msg });
}

function getBlockMarkers(response) {
  return [
    response?.parsed?.error,
    response?.parsed?.reason,
    response?.json?.error?.message,
    response?.json?.message,
  ]
    .filter((value) => typeof value === 'string')
    .filter((value) => MCP_BLOCK_PATTERNS.some((pattern) => value.includes(pattern)));
}

function isExplicitMcpBlock(response, expectedBlock) {
  if (response?.status !== 400) return false;
  return getBlockMarkers(response).some((value) => value.includes(expectedBlock));
}

async function runA1() {
  process.stdout.write('A1 Protocol&Auth ');
  const init = await rawPost({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'phd', version: '1' } },
  });
  assert('A1.version', init.json?.result?.serverInfo?.version?.startsWith('1.'), init.json?.result?.serverInfo?.version, '1.x.x');
  assert('A1.tools-71', (await rawPost({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json?.result?.tools?.length === 71, null, 71);

  const noAuth = await fetch(runtimeConfig.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"jsonrpc":"2.0","id":3,"method":"tools/list"}',
  });
  assert('A1.401-noauth', noAuth.status === 401, noAuth.status, 401);

  const wrongAuth = await rawPost(
    { jsonrpc: '2.0', id: 4, method: 'tools/list' },
    { Authorization: 'Bearer WRONG' },
  );
  assert('A1.401-wrongauth', wrongAuth.status === 401, wrongAuth.status, 401);

  const baseUrl = runtimeConfig.url.replace(/\/mcp\/?$/, '');
  const disc = await (await fetch(`${baseUrl}/.well-known/oauth-authorization-server`)).json();
  assert('A1.oauth-S256', disc.code_challenge_methods_supported?.includes('S256'), disc, 'S256');
  assert('A1.oauth-pkce', !!disc.authorization_endpoint && !!disc.token_endpoint, disc, 'endpoints');

  const opts = await fetch(runtimeConfig.url, { method: 'OPTIONS' });
  assert('A1.cors-star', opts.headers.get('access-control-allow-origin') === '*', null, '*');

  const pathAuth = await fetch(`${baseUrl}/${runtimeConfig.token}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/list' }),
  });
  assert('A1.path-token', pathAuth.status === 200, pathAuth.status, 200);

  const unknownMethod = await rawPost({ jsonrpc: '2.0', id: 6, method: 'bad/method' });
  assert('A1.unknown-method', unknownMethod.json?.error?.code === -32601, unknownMethod.json?.error?.code, -32601);

  const wwwAuth =
    (await fetch(runtimeConfig.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).headers.get('www-authenticate') || '';
  assert('A1.www-auth-bearer', wwwAuth.toLowerCase().includes('bearer'), wwwAuth, 'Bearer');

  process.stdout.write(`✅ ${results.pass.filter((p) => p.startsWith('A1')).length}/9\n`);
}

async function runA2() {
  process.stdout.write('A2 Atomicity&SQL  ');
  const h = await callTool('db_transaction', { statements: JSON.stringify(['SELECT 1 AS a', 'SELECT 2 AS b']) });
  assert('A2.txn-happy', h.parsed?.count === 2 && h.parsed?.rows?.[0]?.a === 1, h.parsed, 'count=2,a=1');

  const f = await callTool('db_transaction', { statements: JSON.stringify(['SELECT 1', 'SELECT 1/0', 'SELECT 3']) });
  assert('A2.txn-rollback-error', !!f.parsed?.error, f.parsed, 'error');
  assert('A2.txn-no-partial', !f.parsed?.rows, f.parsed?.rows, undefined);

  const e = await callTool('db_transaction', { statements: JSON.stringify([]) });
  assert('A2.txn-empty', !!e.parsed?.error, e.parsed, 'error');

  const sj = await callTool('db_join_query', { table1: 'mcp_probe', table2: 'mcp_probe', on: 't1.probe=t2.probe', limit: 1 });
  assert('A2.self-join-no-error', !sj.parsed?.error, sj.parsed, 'no error');
  assert('A2.self-join-returns', sj.parsed?.rows?.length >= 0, sj.parsed, 'rows array');

  const lim = await callTool('db_query', { sql: 'SELECT generate_series(1,10) AS n', limit: 3 });
  assert('A2.limit-applied', lim.parsed?.count <= 3, lim.parsed?.count, '<=3');

  const ts = await callTool('db_transaction', { statements: JSON.stringify(['SELECT now() AS t1', 'SELECT now() AS t2']) });
  const [r1, r2] = ts.parsed?.rows || [];
  const diff = Math.abs(new Date(r1?.t1 || r1?.t2) - new Date(r2?.t2 || r2?.t1));
  assert('A2.consistent-snapshot', diff < 2000, diff, '<2000ms');

  const b = await callTool('db_batch_query', { queries: JSON.stringify(['SELECT 10 AS v', 'SELECT 20 AS v']) });
  assert(
    'A2.batch-independent',
    b.parsed?.results?.[0]?.result?.rows?.[0]?.v === 10 && b.parsed?.results?.[1]?.result?.rows?.[0]?.v === 20,
    b.parsed,
    '10,20',
  );

  const p = await callTool('db_select', { table: 'mcp_probe', limit: 1 });
  assert('A2.mcp-probe-probe-col', p.parsed?.rows?.[0]?.probe === 1, p.parsed?.rows?.[0], '{probe:1}');
  assert('A2.mcp-probe-ts-col', !!p.parsed?.rows?.[0]?.ts, p.parsed?.rows?.[0]?.ts, 'timestamp');

  process.stdout.write(`✅ ${results.pass.filter((p) => p.startsWith('A2')).length}/11\n`);
}

async function runA3() {
  process.stdout.write('A3 Security       ');
  for (const { label, sql, expectedBlock } of A3_BLOCK_VECTORS) {
    const r = await callTool('db_query', { sql });
    if (!assert(`A3.block-${label}`, isExplicitMcpBlock(r, expectedBlock), { status: r.status, parsed: r.parsed, rpc: r.json?.error }, expectedBlock)) {
      warn_(`A3.block-${label}`, 'SECURITY: MCP não retornou bloqueio explícito para SQL administrativo sentinela.');
    }
  }

  const err = await rawPost(
    { jsonrpc: '2.0', id: 99, method: 'tools/call', params: { name: 'ping', arguments: {} } },
    { Authorization: 'Bearer WRONG' },
  );
  assert('A3.token-not-leaked', !JSON.stringify(err).includes(runtimeConfig.token), 'leaked', 'not leaked');

  const nd = await callTool('db_query', { sql: 'EXPLAIN DELETE FROM __mcp_probe_delete_filter_sentinel__' });
  assert(
    'A3.delete-no-filter',
    isExplicitMcpBlock(nd, 'Escrita administrativa bloqueada'),
    { status: nd.status, parsed: nd.parsed, rpc: nd.json?.error },
    'Escrita administrativa bloqueada',
  );

  process.stdout.write(`✅ ${results.pass.filter((p) => p.startsWith('A3')).length}/10\n`);
}

async function runA4() {
  process.stdout.write('A4 Edge Cases     ');
  const uni = await callTool('db_query', { sql: "SELECT '🎉 ñoño αβγ' AS v" });
  assert('A4.unicode', uni.parsed?.rows?.[0]?.v === '🎉 ñoño αβγ', uni.parsed?.rows?.[0]?.v, 'unicode');

  const blank = await callTool('db_query', { sql: '   ' });
  assert('A4.blank-sql', !!blank.parsed?.error, blank.parsed, 'error');

  const negLim = await callTool('db_query', { sql: 'SELECT 1 AS x', limit: -1 });
  assert('A4.neg-limit', negLim.parsed?.count <= 1, negLim.parsed?.count, '<=1');

  const bigLim = await callTool('db_query', { sql: 'SELECT generate_series(1,3) AS n', limit: 99999999 });
  assert('A4.overflow-limit', bigLim.parsed?.count <= 10000, bigLim.parsed?.count, '<=10000');

  const csv = await callTool('db_export', { sql: "SELECT 42 AS x, 'hi' AS s", format: 'csv' });
  assert('A4.csv-header', csv.parsed?.csv?.includes('x'), csv.parsed?.csv, 'x in header');
  assert('A4.csv-value', csv.parsed?.csv?.includes('42'), csv.parsed?.csv, '42 in body');

  const alias = await callTool('db_join_query', {
    table1: 'mcp_probe',
    table2: 'mcp_probe',
    on: 't1.probe=t2.probe',
    select: 't1.probe AS p1, t2.probe AS p2',
    limit: 1,
  });
  assert('A4.alias-rewrite', !alias.parsed?.error, alias.parsed, 'no error');

  const partial = await callTool('db_transaction', { statements: JSON.stringify(['SELECT 42', 'SELECT 1/0']) });
  assert('A4.no-partial-rows', !partial.parsed?.rows, partial.parsed?.rows, undefined);

  const fifty = Array.from({ length: 50 }, (_, i) => `SELECT ${i} AS n`);
  const big = await callTool('db_transaction', { statements: JSON.stringify(fifty) });
  const big50 = big.parsed?.count === 50 || !!big.parsed?.error;
  assert('A4.fifty-stmts', big50, big.parsed?.count, '50 or error');
  if (big.parsed?.error) {
    warn_('A4.fifty-stmts', `PG simple query length limit hit at 50 stmts: ${JSON.stringify(big.parsed.error)}`);
  }

  process.stdout.write(`✅ ${results.pass.filter((p) => p.startsWith('A4')).length}/9\n`);
}

async function runA5() {
  process.stdout.write('A5 Regression     ');

  const expectError = new Set([
    'db_insert',
    'db_update',
    'db_upsert',
    'db_alter_table',
    'db_copy_data',
    'storage_get_object_info',
    'storage_create_signed_url',
    'storage_move_object',
    'storage_delete_object',
    'storage_create_bucket',
    'storage_empty_bucket',
    'storage_delete_bucket',
    'auth_get_user',
    'auth_list_users_by_email',
    'auth_update_user',
    'auth_delete_user',
  ]);

  const tools71 = [
    ['ping', {}],
    ['db_health', {}],
    ['db_connection_info', {}],
    ['db_overview', {}],
    ['db_list_schemas', {}],
    ['db_list_tables', { limit: 5 }],
    ['db_list_columns', { table: 'mcp_probe' }],
    ['db_describe_table', { table: 'mcp_probe' }],
    ['db_list_views', {}],
    ['db_list_enums', {}],
    ['db_list_extensions', {}],
    ['db_list_roles', {}],
    ['db_list_indexes', { table: 'mcp_probe' }],
    ['db_list_functions', {}],
    ['db_list_triggers', {}],
    ['db_list_policies', {}],
    ['db_constraints', { table: 'mcp_probe' }],
    ['db_relationships', {}],
    ['db_sequences', {}],
    ['db_migrations', {}],
    ['db_pg_settings', { limit: 5 }],
    ['db_select', { table: 'mcp_probe', limit: 1 }],
    ['db_count', { table: 'mcp_probe' }],
    ['db_insert', { table: '__noop__', data: '{"x":1}' }],
    ['db_update', { table: '__noop__', filter: 'id=0', data: '{"x":1}' }],
    ['db_upsert', { table: '__noop__', data: '{"x":1}' }],
    ['db_delete', { table: 'mcp_probe', filter: 'probe=__noop__' }],
    ['db_query', { sql: 'SELECT 1 AS probe', limit: 1 }],
    ['db_batch_query', { queries: JSON.stringify(['SELECT 1', 'SELECT 2']) }],
    ['db_transaction', { statements: JSON.stringify(['SELECT 1 AS a', 'SELECT 2 AS b']) }],
    ['db_explain', { sql: 'SELECT * FROM mcp_probe LIMIT 1', analyze: false }],
    ['db_stats', {}],
    ['db_active_queries', { limit: 5 }],
    ['db_slow_queries', { limit: 5 }],
    ['db_locks', { limit: 5 }],
    ['db_disk_usage', { limit: 5 }],
    ['db_table_bloat', { limit: 5 }],
    ['db_index_usage', { table: 'mcp_probe', limit: 5 }],
    ['db_missing_indexes', { limit: 5 }],
    ['db_duplicate_indexes', {}],
    ['db_column_stats', { table: 'mcp_probe', column: 'probe' }],
    ['db_vacuum', { table: 'mcp_probe', analyze: true }],
    ['db_alter_table', { table: '__noop__', action: 'add_column', column: 'x', column_type: 'TEXT' }],
    ['db_aggregate', { table: 'mcp_probe', func: 'count' }],
    ['db_join_query', { table1: 'mcp_probe', table2: 'mcp_probe', on: 't1.probe=t2.probe', limit: 1 }],
    ['db_search_global', { query: 'probe', limit: 5 }],
    ['db_sample', { table: 'mcp_probe', limit: 3 }],
    ['db_export', { sql: 'SELECT probe FROM mcp_probe', format: 'json' }],
    ['db_copy_data', { from_table: '__noop__', to_table: '__noop2__' }],
    ['db_set_comment', { table: 'mcp_probe', comment: 'phd-suite' }],
    ['db_rls_manage', { table: 'empresas', action: 'enable' }],
    ['db_grant', { table: 'mcp_probe', role: 'anon', action: 'grant', privileges: 'SELECT' }],
    ['storage_list_buckets', {}],
    ['storage_get_bucket', { bucket: 'nfe-xml' }],
    ['storage_list_objects', { bucket: 'nfe-xml', limit: 3 }],
    ['storage_get_object_info', { bucket: 'nfe-xml', path: '__noop__' }],
    ['storage_create_signed_url', { bucket: 'nfe-xml', path: '__noop__' }],
    ['storage_move_object', { bucket: 'nfe-xml', from_path: '__a__', to_path: '__b__' }],
    ['storage_delete_object', { bucket: 'nfe-xml', path: '__noop__' }],
    ['storage_create_bucket', { name: `phd_${Date.now()}`, is_public: false }],
    ['storage_update_bucket', { bucket: 'nfe-xml', is_public: false }],
    ['storage_empty_bucket', { bucket: '__noop__' }],
    ['storage_delete_bucket', { bucket: '__noop__' }],
    ['functions_list', {}],
    ['functions_ping', { function_name: 'health' }],
    ['auth_list_users', { limit: 1 }],
    ['auth_get_user', { user_id: '00000000-0000-0000-0000-000000000000' }],
    ['auth_list_users_by_email', { email: 'probe@noop.test' }],
    ['auth_create_user', { email: `phd.${Date.now()}@noop.invalid`, password: 'PhD@123456!', email_confirm: true }],
    ['auth_update_user', { user_id: '00000000-0000-0000-0000-000000000000', metadata: '{"phd":1}' }],
    ['auth_delete_user', { user_id: '00000000-0000-0000-0000-000000000000' }],
  ];

  let pass71 = 0;
  let fail71 = 0;
  const timings = {};
  let createdUserId = null;

  for (const [name, args] of tools71) {
    const callArgs = { ...args };

    if (name === 'auth_create_user') {
      const r = await callTool(name, callArgs);
      timings[name] = r.ms;
      if (r.parsed?.id) {
        createdUserId = r.parsed.id;
        const updateEntry = tools71.find(([n]) => n === 'auth_update_user');
        const deleteEntry = tools71.find(([n]) => n === 'auth_delete_user');
        if (updateEntry) {
          updateEntry[1].user_id = createdUserId;
          expectError.delete('auth_update_user');
        }
        if (deleteEntry) {
          deleteEntry[1].user_id = createdUserId;
          expectError.delete('auth_delete_user');
        }
        pass71 += 1;
        results.pass.push(`A5.reg:${name}`);
      } else {
        fail71 += 1;
        results.fail.push({ name: `A5.reg:${name}`, actual: JSON.stringify(r.parsed)?.slice(0, 150) });
      }
      continue;
    }

    const r = await callTool(name, callArgs);
    timings[name] = r.ms;
    const ok = !r.json?.error && (!r.parsed?.error || expectError.has(name));
    if (ok) {
      pass71 += 1;
      results.pass.push(`A5.reg:${name}`);
    } else {
      fail71 += 1;
      results.fail.push({ name: `A5.reg:${name}`, actual: JSON.stringify(r.parsed)?.slice(0, 150), rpc: r.json?.error });
    }
  }

  const conc = await Promise.all(Array.from({ length: 5 }, (_, i) => callTool('db_query', { sql: `SELECT ${i + 1} AS n` })));
  assert('A5.concurrency-5x', conc.every((r) => !r.json?.error), conc.filter((r) => r.json?.error).length, 0);

  const stab = await Promise.all(Array.from({ length: 5 }, () => callTool('db_select', { table: 'mcp_probe' })));
  assert('A5.stability-5x', stab.every((r) => r.parsed?.rows?.[0]?.probe === 1), null, 'probe=1 sempre');

  const txns = await Promise.all(
    Array.from({ length: 3 }, (_, i) => callTool('db_transaction', { statements: JSON.stringify([`SELECT ${i} AS a`, `SELECT ${i + 10} AS b`]) })),
  );
  assert('A5.concurrent-txns', txns.every((r) => r.parsed?.count === 2), txns.map((r) => r.parsed?.count), 'all 2');

  const sorted = Object.entries(timings).sort(([, a], [, b]) => b - a);
  const avg = Math.round(sorted.reduce((sum, [, ms]) => sum + ms, 0) / sorted.length);
  const perf = `avg:${avg}ms  slowest:${sorted[0]?.[0]}(${sorted[0]?.[1]}ms)`;

  process.stdout.write(`✅ ${pass71}/71 reg  ${perf}\n`);
  if (fail71 > 0) {
    results.fail
      .filter((f) => f.name?.startsWith('A5.reg:'))
      .forEach((f) => console.error(`     ❌ ${f.name}: ${f.actual}`));
  }
}

const SUITE_RUNNERS = {
  a1: runA1,
  a2: runA2,
  a3: runA3,
  a4: runA4,
  a5: runA5,
};

async function main() {
  const parsed = parseArgv(process.argv.slice(2));

  if (parsed.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (parsed.selfTest) {
    runSelfTest();
    return;
  }

  runtimeConfig = validateConfig(parsed);

  if (runtimeConfig.dryRun) {
    printPlan(runtimeConfig);
    return;
  }

  resetRunState();

  console.log('═══════════════════════════════════════════════════════');
  console.log(` PhD MCP Test Suite  target: ${runtimeConfig.url}`);
  console.log(` Suites: ${runtimeConfig.selectedSuites.join(', ')}`);
  console.log(` Modo mutável: ${runtimeConfig.mutationSuites.length > 0 ? 'ATIVADO' : 'desligado (read-only)'}`);
  console.log('═══════════════════════════════════════════════════════');

  const t0 = Date.now();
  for (const suite of runtimeConfig.selectedSuites) {
    await SUITE_RUNNERS[suite]();
  }
  const total = Date.now() - t0;

  const totalPass = results.pass.length;
  const totalFail = results.fail.length;
  const totalWarn = results.warn.length;
  const perfWarns = results.warn.filter((w) => w.threshold);

  console.log('═══════════════════════════════════════════════════════');
  console.log(` RESULT: PASS:${totalPass}  FAIL:${totalFail}  WARN:${totalWarn}  (${(total / 1000).toFixed(1)}s)`);
  if (perfWarns.length) {
    console.log(' Perf warnings (slow but functional):');
    perfWarns.forEach((w) => console.log(`   ⚠️  ${w.name}: ${w.ms}ms > ${w.threshold}ms threshold`));
  }
  if (totalFail > 0) {
    console.log(' FAILURES:');
    results.fail.forEach((f) => console.error(`   ❌ ${f.name}: ${f.actual}`));
    process.exit(1);
  }
  console.log(` ${totalFail === 0 ? '✅ TODAS AS VERIFICAÇÕES PASSARAM' : '❌ FALHAS DETECTADAS'}`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch((error) => {
  console.error('FATAL:', error instanceof Error ? error.message : error);
  process.exit(1);
});
