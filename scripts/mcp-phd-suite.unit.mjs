// Testes de scripts/mcp-phd-suite.mjs — a suíte roda em subprocesso contra um
// servidor MCP falso em 127.0.0.1 (porta efêmera). Nenhuma rede externa.
//
// Rodar: node --test scripts/mcp-phd-suite.unit.mjs

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(RAIZ, 'scripts', 'mcp-phd-suite.mjs');
const TOKEN = 'tok-secreto-9f8e7d';

/** Executa a suíte; nunca rejeita — devolve { code, stdout, stderr }. */
function rodar(args, env = {}) {
  return new Promise((done) => {
    execFile(process.execPath, [SCRIPT, ...args], {
      env: { PATH: process.env.PATH, ...env },
      encoding: 'utf8',
      timeout: 60_000,
    }, (error, stdout, stderr) => done({ code: error ? error.code ?? 1 : 0, stdout, stderr }));
  });
}

const conteudo = (obj) => ({ result: { content: [{ type: 'text', text: JSON.stringify(obj) }] } });

/** Simula as ferramentas usadas pelas suítes read-only (A1–A4). */
function chamarFerramenta(nome, args, modo) {
  if (nome === 'db_query') {
    const sql = String(args.sql ?? '');
    if (!sql.trim()) return conteudo({ error: 'SQL vazio' });
    if (/^EXPLAIN\s+(DELETE|UPDATE|INSERT)/i.test(sql)) {
      if (modo === 'sem-bloqueio') return conteudo({ rows: [{ plano: 'Delete on x' }], count: 1 });
      return { httpStatus: 400, error: { code: -32000, message: 'Escrita administrativa bloqueada — reenvie com allow_all_rows:true' } };
    }
    const serie = sql.match(/generate_series\(1,(\d+)\)/);
    const literal = sql.match(/^SELECT '(.*)' AS v$/);
    let rows = serie ? Array.from({ length: Number(serie[1]) }, (_, i) => ({ n: i + 1 })) : [literal ? { v: literal[1] } : { x: 1 }];
    const limite = Math.min(Math.max(Number.isInteger(args.limit) ? args.limit : 1000, 1), 10000);
    rows = rows.slice(0, limite);
    return conteudo({ rows, count: rows.length });
  }
  if (nome === 'db_transaction') {
    const stmts = JSON.parse(args.statements);
    if (stmts.length === 0) return conteudo({ error: 'nenhum statement' });
    if (stmts.some((s) => s.includes('1/0'))) return conteudo({ error: 'division by zero' });
    const rows = stmts.map((s) => {
      const m = s.match(/^SELECT (\S+) AS (\w+)$/);
      if (!m) return { '?column?': 1 };
      return { [m[2]]: m[1] === 'now()' ? '2026-01-01T00:00:00.000Z' : Number(m[1]) };
    });
    return conteudo({ rows, count: rows.length });
  }
  if (nome === 'db_join_query') return conteudo({ rows: [{ p1: 1, p2: 1 }], count: 1 });
  if (nome === 'db_batch_query') {
    return conteudo({ results: JSON.parse(args.queries).map((q) => ({ result: { rows: [{ v: Number(q.match(/SELECT (\d+)/)[1]) }] } })) });
  }
  if (nome === 'db_select') return conteudo({ rows: [{ probe: 1, ts: '2026-01-01T00:00:00Z' }], count: 1 });
  if (nome === 'db_export') return conteudo({ csv: 'x,s\n42,hi\n' });
  if (nome === 'db_health' && modo === 'a5-falha') return conteudo({ error: 'pool esgotado' });
  // Demais ferramentas da regressão A5: sucesso genérico.
  return conteudo({ ok: true, id: 'user-falso-1' });
}

/**
 * Sobe o MCP falso. `modo`:
 *   ok | tools-70 | tools-80 | sem-bloqueio | a5-falha | mudo (aceita e nunca responde)
 */
async function comServidor(modo, fn) {
  const recebidas = [];
  const server = createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      recebidas.push({ method: req.method, url: req.url });
      if (modo === 'mudo') return; // segura a conexão aberta
      const json = (status, obj, headers = {}) => {
        res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
        res.end(JSON.stringify(obj));
      };
      if (req.method === 'OPTIONS') return json(204, {}, { 'Access-Control-Allow-Origin': '*' });
      if (req.method === 'GET' && req.url === '/.well-known/oauth-authorization-server') {
        return json(200, { authorization_endpoint: 'http://x/authorize', token_endpoint: 'http://x/token', code_challenge_methods_supported: ['S256'] });
      }
      const autorizado = req.headers.authorization === `Bearer ${TOKEN}` || req.url === `/${TOKEN}/mcp`;
      if (!autorizado) return json(401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer realm="mcp"' });
      let rpc;
      try { rpc = JSON.parse(corpo); } catch { return json(400, { error: 'json inválido' }); }
      const base = { jsonrpc: '2.0', id: rpc.id };
      if (rpc.method === 'initialize') return json(200, { ...base, result: { serverInfo: { name: 'falso', version: '1.4.2' } } });
      if (rpc.method === 'tools/list') {
        const total = modo === 'tools-70' ? 70 : modo === 'tools-80' ? 80 : 71;
        return json(200, { ...base, result: { tools: Array.from({ length: total }, (_, i) => ({ name: `t${i}` })) } });
      }
      if (rpc.method === 'tools/call') {
        const { httpStatus = 200, ...resp } = chamarFerramenta(rpc.params.name, rpc.params.arguments ?? {}, modo);
        return json(httpStatus, { ...base, ...resp });
      }
      return json(200, { ...base, error: { code: -32601, message: 'Method not found' } });
    });
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${server.address().port}/mcp`;
  try {
    return await fn(url, recebidas);
  } finally {
    server.closeAllConnections();
    await new Promise((ok) => server.close(ok));
  }
}

// --- sem rede ---------------------------------------------------------------

test('--self-test passa e não exige URL nem token', async () => {
  const r = await rodar(['--self-test']);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Self-test OK: \d+ verificações\./);
  assert.doesNotMatch(r.stdout, /❌/);
});

test('--help sai 0 e documenta flags e ambiente', async () => {
  const r = await rodar(['--help']);
  assert.equal(r.code, 0);
  for (const trecho of ['--url URL', '--allow-mutations', '--confirm-target', 'MCP_TOKEN', 'MCP_TIMEOUT_MS']) {
    assert.ok(r.stdout.includes(trecho), `help sem ${trecho}`);
  }
});

test('erros de uso saem 1 com FATAL e sem stack trace', async () => {
  const casos = [
    [[], {}, /--url` é obrigatório/],
    [['--url', 'https://w.example.dev/mcp'], {}, /Token ausente/],
    [['--url'], { MCP_TOKEN: TOKEN }, /Flag --url exige um valor/],
    [['--url', 'https://w.example.dev/mcp', '--nao-existe'], { MCP_TOKEN: TOKEN }, /Flag desconhecida: --nao-existe/],
    [['--url', 'não é url'], { MCP_TOKEN: TOKEN }, /URL inválida/],
    [['--url', 'https://w.example.dev/mcp', '--suite', 'a9'], { MCP_TOKEN: TOKEN }, /Suite inválida: a9/],
    [['--url', 'https://w.example.dev/mcp', '--suite', 'a5'], { MCP_TOKEN: TOKEN }, /exigem --allow-mutations/],
    [['--url', 'https://w.example.dev/mcp', '--suite', 'all', '--allow-mutations'], { MCP_TOKEN: TOKEN }, /exigem --confirm-target w\.example\.dev\/mcp/],
    [['--url', 'https://w.example.dev/mcp', '--suite', 'a5', '--allow-mutations', '--confirm-target', 'outro'], { MCP_TOKEN: TOKEN }, /Confirmação de alvo divergente/],
  ];
  for (const [args, env, esperado] of casos) {
    const r = await rodar(args, env);
    assert.equal(r.code, 1, args.join(' '));
    assert.match(r.stderr, esperado);
    assert.match(r.stderr, /^FATAL:/);
    assert.doesNotMatch(r.stderr, /\n\s+at /);
  }
});

test('URL sem TLS fora de loopback é recusada (token iria em claro)', async () => {
  // Regressão: http://, ftp:// e javascript: eram aceitos.
  for (const url of ['http://worker.example.dev/mcp', 'ftp://worker.example.dev/mcp', 'javascript:alert(1)']) {
    const r = await rodar(['--url', url, '--dry-run'], { MCP_TOKEN: TOKEN });
    assert.equal(r.code, 1, url);
    assert.match(r.stderr, /URL precisa ser https/);
  }
});

test('--dry-run mostra o plano, não usa rede e não exige token', async () => {
  // Porta 9 (discard): qualquer tentativa de conexão falharia.
  let r = await rodar(['--url', 'http://127.0.0.1:9/mcp', '--dry-run', '--suite', 'a1,a4']);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /suites: a1, a4/);
  assert.match(r.stdout, /rede será usada: não/);
  assert.match(r.stdout, /token: ausente/);

  r = await rodar(['--url=https://w.example.dev/mcp', '--dry-run', '--suite=all', '--allow-mutations', '--confirm-target=w.example.dev/mcp'], { MCP_TOKEN: TOKEN });
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /suites: a1, a2, a3, a4, a5/);
  assert.match(r.stdout, /modo mutável: sim/);
  assert.match(r.stdout, /token: fornecido/);
  assert.ok(!r.stdout.includes(TOKEN), 'token impresso no plano');
});

test('MCP_TIMEOUT_MS inválido é recusado antes de qualquer requisição', async () => {
  await comServidor('ok', async (url, recebidas) => {
    const r = await rodar(['--url', url], { MCP_TOKEN: TOKEN, MCP_TIMEOUT_MS: 'abc' });
    assert.equal(r.code, 1);
    assert.match(r.stderr, /MCP_TIMEOUT_MS inválido/);
    assert.equal(recebidas.length, 0);
  });
});

// --- contra o servidor falso --------------------------------------------------

test('servidor íntegro: A1–A4 passam, exit 0 e denominador = verificações executadas', async () => {
  await comServidor('ok', async (url) => {
    const r = await rodar(['--url', url], { MCP_TOKEN: TOKEN });
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /A1 Protocol&Auth ✅ 11\/11/);
    assert.match(r.stdout, /A2 Atomicity&SQL  ✅ 11\/11/);
    assert.match(r.stdout, /A3 Security       ✅ 5\/5/);
    assert.match(r.stdout, /A4 Edge Cases     ✅ 9\/9/);
    assert.match(r.stdout, /RESULT: PASS:36 {2}FAIL:0/);
    assert.match(r.stdout, /TODAS AS VERIFICAÇÕES PASSARAM/);
    assert.ok(!(r.stdout + r.stderr).includes(TOKEN), 'token vazou na saída');
  });
});

test('--suite restringe o que roda e o padrão nunca inclui a5', async () => {
  await comServidor('ok', async (url) => {
    const r = await rodar(['--url', url, '--suite', 'a3', '--token', TOKEN]);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Suites: a3\n/);
    assert.doesNotMatch(r.stdout, /A1 Protocol|A5 Regression/);
    assert.match(r.stdout, /Modo mutável: desligado/);
  });
});

test('falha de segurança: suíte marcada com ❌, exit 1 e falhas listadas', async () => {
  // Regressão: a linha da suíte imprimia "✅ N/10" mesmo com verificações reprovadas.
  await comServidor('sem-bloqueio', async (url) => {
    const r = await rodar(['--url', url, '--suite', 'a3,a4'], { MCP_TOKEN: TOKEN });
    assert.equal(r.code, 1);
    assert.match(r.stdout, /A3 Security       ❌ 1\/5/);
    assert.match(r.stdout, /A4 Edge Cases     ✅ 9\/9/);
    assert.match(r.stdout, /RESULT: PASS:10 {2}FAIL:4/);
    assert.match(r.stderr, /❌ A3\.block-EXPLAIN DELETE sentinel/);
    assert.match(r.stderr, /❌ A3\.delete-no-filter/);
    assert.doesNotMatch(r.stdout, /TODAS AS VERIFICAÇÕES PASSARAM/);
  });
});

test('contagem de ferramentas: 70 reprova, 80 passa', async () => {
  // Regressão: exigia exatamente 71 — qualquer ferramenta nova reprovava a suíte.
  await comServidor('tools-70', async (url) => {
    const r = await rodar(['--url', url, '--suite', 'a1'], { MCP_TOKEN: TOKEN });
    assert.equal(r.code, 1);
    assert.match(r.stdout, /A1 Protocol&Auth ❌ 10\/11/);
    assert.match(r.stderr, /❌ A1\.tools-71: 70/);
  });
  await comServidor('tools-80', async (url) => {
    const r = await rodar(['--url', url, '--suite', 'a1'], { MCP_TOKEN: TOKEN });
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /A1 Protocol&Auth ✅ 11\/11/);
  });
});

test('a5 (mutável) só roda com confirmação exata do alvo e reporta a regressão', async () => {
  await comServidor('ok', async (url, recebidas) => {
    const semConfirmar = await rodar(['--url', url, '--suite', 'a5', '--allow-mutations'], { MCP_TOKEN: TOKEN });
    assert.equal(semConfirmar.code, 1);
    assert.equal(recebidas.length, 0, 'houve requisição sem confirmação do alvo');

    const r = await rodar(['--url', url, '--suite', 'a5', '--allow-mutations', '--confirm-target', '127.0.0.1/mcp'], { MCP_TOKEN: TOKEN });
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Modo mutável: ATIVADO/);
    assert.match(r.stdout, /A5 Regression     ✅ 71\/71 reg/);
    assert.match(r.stdout, /RESULT: PASS:74 {2}FAIL:0/);
  });
  await comServidor('a5-falha', async (url) => {
    const r = await rodar(['--url', url, '--suite', 'a5', '--allow-mutations', '--confirm-target', '127.0.0.1/mcp'], { MCP_TOKEN: TOKEN });
    assert.equal(r.code, 1);
    assert.match(r.stdout, /A5 Regression     ❌ 70\/71 reg/);
    assert.match(r.stderr, /❌ A5\.reg:db_health/);
  });
});

test('token errado: exit 1 e o token não aparece na saída', async () => {
  await comServidor('ok', async (url) => {
    const errado = 'token-errado-abc123';
    const r = await rodar(['--url', url, '--suite', 'a1', '--token', errado]);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /A1 Protocol&Auth ❌/);
    assert.ok(!(r.stdout + r.stderr).includes(errado), 'token vazou na saída');
  });
});

test('servidor que não responde: timeout com exit 1 em vez de travar', async () => {
  // Regressão: fetch sem timeout — a suíte ficava pendurada para sempre.
  await comServidor('mudo', async (url) => {
    const t0 = Date.now();
    const r = await rodar(['--url', url, '--suite', 'a1'], { MCP_TOKEN: TOKEN, MCP_TIMEOUT_MS: '400' });
    assert.equal(r.code, 1);
    assert.match(r.stderr, /FATAL: requisição excedeu o timeout de 400ms/);
    assert.ok(Date.now() - t0 < 15_000, 'demorou demais para desistir');
  });
});

test('servidor fora do ar: FATAL com exit 1', async () => {
  let url;
  await comServidor('ok', async (u) => { url = u; });
  const r = await rodar(['--url', url, '--suite', 'a1'], { MCP_TOKEN: TOKEN, MCP_TIMEOUT_MS: '2000' });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /^FATAL:/m);
});
