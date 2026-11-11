// audit-env.ts é um script Deno (`Deno.env`, `Deno.exit`), mas o núcleo é exportado e
// não toca ambiente nem rede: aqui ele roda em Node (type stripping, Node >= 22.18)
// com `buscar` falso. Nenhum teste fala com Vercel, Supabase ou GitHub.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
let mod = null;
let motivo = false;
try {
  mod = await import('./audit-env.ts');
} catch (erro) {
  motivo = `este Node não importa .ts direto (${erro.code ?? erro.message})`;
}
const opcoes = { skip: motivo };

const REF = 'bwwbeyolnnzppeuhgkcd';
const SEGREDO = ['tok', 'en-', 'Zq8'.repeat(10)].join('');
const CONFIG = { vercelToken: SEGREDO, vercelTeamId: 'team_x', vercelProject: 'prj_y', supabasePat: SEGREDO, supabaseRef: REF, githubToken: SEGREDO, githubRepo: 'dono/repo' };
const VARS = [
  { name: 'VITE_SUPABASE_PROJECT_ID', scope: 'frontend', required: true, dest: 'vercel' },
  { name: 'ASAAS_API_KEY', scope: 'edge', required: true, dest: 'supabase_vault' },
  { name: 'OPCIONAL', scope: 'edge', required: false, dest: 'supabase_vault' },
  { name: 'SUPABASE_URL', scope: 'edge', required: true, dest: 'supabase_auto' },
  { name: 'E2E_USER_PASSWORD', scope: 'ci', required: true, dest: 'github_actions' },
  { name: 'PROD_PROJECT_REF', scope: 'ci', required: true, dest: 'github_actions_vars' },
];

const leitura = (dados, erro = null) => ({ dados, erro });
function estado(over = {}) {
  return {
    vercelEnvs: leitura(new Map([['VITE_SUPABASE_PROJECT_ID', REF]])),
    supabaseSecrets: leitura(new Set(['ASAAS_API_KEY'])),
    githubSecrets: leitura(new Set(['E2E_USER_PASSWORD'])),
    githubVariables: leitura(new Map([['PROD_PROJECT_REF', REF]])),
    tokens: { vercel: true, supabase: true, github: true },
    supabaseRef: REF,
    ...over,
  };
}

test('auditar: tudo cadastrado → zero falhas e zero linhas', opcoes, () => {
  assert.deepEqual(mod.auditar(VARS, estado()), { linhas: [], failures: 0 });
});

test('auditar: obrigatória ausente em cada destino vira [MISSING]; opcional e supabase_auto não', opcoes, () => {
  const r = mod.auditar(VARS, estado({ vercelEnvs: leitura(new Map()), supabaseSecrets: leitura(new Set()), githubSecrets: leitura(new Set()), githubVariables: leitura(new Map()) }));
  assert.equal(r.failures, 4);
  assert.deepEqual(r.linhas, [
    '  ❌ [MISSING] VITE_SUPABASE_PROJECT_ID → vercel',
    '  ❌ [MISSING] ASAAS_API_KEY → supabase_vault',
    '  ❌ [MISSING] E2E_USER_PASSWORD → github_actions',
    '  ❌ [MISSING] PROD_PROJECT_REF → github_actions_vars',
  ]);
});

test('auditar: sem token o destino é SKIP (não falha); destino desconhecido é [MISSING]', opcoes, () => {
  const vazio = { vercelEnvs: leitura(new Map()), supabaseSecrets: leitura(new Set()), githubSecrets: leitura(new Set()), githubVariables: leitura(new Map()) };
  const r = mod.auditar(VARS, estado({ ...vazio, tokens: { vercel: false, supabase: false, github: false } }));
  assert.equal(r.failures, 0);
  assert.deepEqual(r.linhas, [
    '  ⚠️  SKIP VITE_SUPABASE_PROJECT_ID (sem VERCEL_TOKEN)',
    '  ⚠️  SKIP ASAAS_API_KEY (sem SUPABASE_PAT)',
    '  ⚠️  SKIP E2E_USER_PASSWORD (sem GITHUB_TOKEN)',
    '  ⚠️  SKIP PROD_PROJECT_REF (sem GITHUB_TOKEN)',
  ]);
  const desconhecido = mod.auditar([{ name: 'X', scope: 'ci', required: true, dest: 'lugar_novo' }], estado());
  assert.deepEqual(desconhecido.linhas.filter((l) => !l.includes('[ORPHAN-')), ['  ❌ [MISSING] X → lugar_novo']);
});

test('auditar: leitura falhada é [READ-FAIL] — uma falha por destino, sem enxurrada de [MISSING] falso', opcoes, () => {
  const muitas = Array.from({ length: 50 }, (_, i) => ({ name: `SEGREDO_${i}`, scope: 'edge', required: true, dest: 'supabase_vault' }));
  const r = mod.auditar(muitas, estado({ supabaseSecrets: leitura(new Set(), 'HTTP 401') }));
  assert.equal(r.failures, 1, 'antes: 50 [MISSING] para um token expirado');
  assert.deepEqual(r.linhas.filter((l) => !l.includes('[ORPHAN-')), ['  ❌ [READ-FAIL] supabase_vault: leitura do destino falhou (HTTP 401)']);
  const todos = mod.auditar(VARS, estado({ vercelEnvs: leitura(new Map(), 'HTTP 403'), supabaseSecrets: leitura(new Set(), 'TimeoutError'), githubSecrets: leitura(new Set(), 'HTTP 500'), githubVariables: leitura(new Map(), 'HTTP 404') }));
  assert.equal(todos.failures, 4);
  assert.deepEqual(todos.linhas.map((l) => l.trim().split(' ')[1]), ['[READ-FAIL]', '[READ-FAIL]', '[READ-FAIL]', '[READ-FAIL]']);
});

test('auditar: cadastrada e não declarada é aviso [ORPHAN-*], não falha', opcoes, () => {
  const r = mod.auditar(VARS, estado({
    vercelEnvs: leitura(new Map([['VITE_SUPABASE_PROJECT_ID', REF], ['SOBRA_V', 'x']])),
    supabaseSecrets: leitura(new Set(['ASAAS_API_KEY', 'SOBRA_S'])),
    githubSecrets: leitura(new Set(['E2E_USER_PASSWORD', 'SOBRA_G'])),
    githubVariables: leitura(new Map([['PROD_PROJECT_REF', REF], ['SOBRA_GV', 'y']])),
  }));
  assert.equal(r.failures, 0);
  assert.deepEqual(r.linhas, ['  ⚠️  [ORPHAN-VERCEL]   SOBRA_V', '  ⚠️  [ORPHAN-SUPABASE] SOBRA_S', '  ⚠️  [ORPHAN-GITHUB]   SOBRA_G', '  ⚠️  [ORPHAN-GH-VARS]  SOBRA_GV']);
});

test('auditar: referência de projeto apontando para outro banco é [BAD-REF]; valor vazio (secret) não', opcoes, () => {
  const r = mod.auditar(VARS, estado({
    vercelEnvs: leitura(new Map([['VITE_SUPABASE_PROJECT_ID', 'pgxfvjmuubtbowutlide']])),
    githubVariables: leitura(new Map([['PROD_PROJECT_REF', 'outroprojeto']])),
  }));
  assert.equal(r.failures, 2);
  assert.deepEqual(r.linhas, [
    `  ❌ [BAD-REF] VITE_SUPABASE_PROJECT_ID → vercel aponta para 'pgxfvjmuubtbowutlide', esperado '${REF}'`,
    `  ❌ [BAD-REF] PROD_PROJECT_REF → github_actions_vars aponta para 'outroprojeto', esperado '${REF}'`,
  ]);
  assert.equal(mod.auditar(VARS, estado({ vercelEnvs: leitura(new Map([['VITE_SUPABASE_PROJECT_ID', '']])) })).failures, 0);
});

// ---- leitura dos destinos com `buscar` falso --------------------------------
function buscarFalso(rotas) {
  const pedidos = [];
  const buscar = async (url, headers) => {
    pedidos.push({ url, headers });
    const u = new URL(url);
    const rota = rotas[`${u.host}${u.pathname}`];
    if (rota === undefined) return { ok: false, erro: 'HTTP 404', json: null };
    const r = typeof rota === 'function' ? rota(u) : rota;
    return r.erro ? { ok: false, erro: r.erro, json: null } : { ok: true, erro: '', json: r };
  };
  return { buscar, pedidos };
}

const GH = 'api.github.com/repos/dono/repo';
const paginar = (campo, itens) => (u) => {
  const pagina = Number(u.searchParams.get('page'));
  const por = Number(u.searchParams.get('per_page'));
  return { total_count: itens.length, [campo]: itens.slice((pagina - 1) * por, pagina * por) };
};

test('GitHub: secrets paginados além de 100 e somados aos dos environments (antes: página 1 de 30, só do repo)', opcoes, async () => {
  const doRepo = Array.from({ length: 150 }, (_, i) => ({ name: `REPO_${i}` }));
  const { buscar, pedidos } = buscarFalso({
    [`${GH}/actions/secrets`]: paginar('secrets', doRepo),
    [`${GH}/environments`]: paginar('environments', [{ name: 'Production' }, { name: 'homologação/qa' }]),
    [`${GH}/environments/Production/secrets`]: paginar('secrets', [{ name: 'PROD_DB_URL' }]),
    [`${GH}/environments/homologa%C3%A7%C3%A3o%2Fqa/secrets`]: paginar('secrets', [{ name: 'STAGING_DB_URL' }]),
  });
  const r = await mod.fetchGithubSecrets(CONFIG, buscar);
  assert.equal(r.erro, null);
  assert.equal(r.dados.size, 152);
  assert.ok(r.dados.has('REPO_149') && r.dados.has('PROD_DB_URL') && r.dados.has('STAGING_DB_URL'));
  assert.ok(pedidos.every((p) => p.url.includes('per_page=100')));
  assert.equal(pedidos.filter((p) => p.url.includes('/actions/secrets')).length, 2, 'duas páginas para 150 itens');
  assert.ok(pedidos.every((p) => p.headers.Authorization === `token ${SEGREDO}`));
});

test('GitHub: variables de environment e do repo; o valor do repositório prevalece', opcoes, async () => {
  const { buscar } = buscarFalso({
    [`${GH}/actions/variables`]: paginar('variables', [{ name: 'PROD_PROJECT_REF', value: REF }]),
    [`${GH}/environments`]: paginar('environments', [{ name: 'Production' }]),
    [`${GH}/environments/Production/variables`]: paginar('variables', [{ name: 'PROD_PROJECT_REF', value: 'outro' }, { name: 'SO_NO_AMBIENTE', value: '1' }]),
  });
  const r = await mod.fetchGithubVariables(CONFIG, buscar);
  assert.equal(r.erro, null);
  assert.deepEqual([...r.dados], [['PROD_PROJECT_REF', REF], ['SO_NO_AMBIENTE', '1']]);
});

test('falha em qualquer etapa da leitura vira `erro`, nunca "destino vazio"', opcoes, async () => {
  const falha = { erro: 'HTTP 401' };
  const casos = [
    [mod.fetchGithubSecrets, { [`${GH}/actions/secrets`]: falha }, 'HTTP 401'],
    [mod.fetchGithubSecrets, { [`${GH}/actions/secrets`]: paginar('secrets', []), [`${GH}/environments`]: falha }, 'environments: HTTP 401'],
    [mod.fetchGithubSecrets, { [`${GH}/actions/secrets`]: paginar('secrets', []), [`${GH}/environments`]: paginar('environments', [{ name: 'P' }]) }, 'environment P: HTTP 404'],
    [mod.fetchGithubVariables, { [`${GH}/environments`]: paginar('environments', []), [`${GH}/actions/variables`]: falha }, 'HTTP 401'],
    [mod.fetchVercelEnvs, { 'api.vercel.com/v10/projects/prj_y/env': falha }, 'HTTP 401'],
    [mod.fetchSupabaseSecrets, { [`api.supabase.com/v1/projects/${REF}/secrets`]: falha }, 'HTTP 401'],
    [mod.fetchSupabaseSecrets, { [`api.supabase.com/v1/projects/${REF}/secrets`]: { message: 'não é lista' } }, 'resposta inesperada'],
  ];
  for (const [fn, rotas, esperado] of casos) {
    const r = await fn(CONFIG, buscarFalso(rotas).buscar);
    assert.equal(r.erro, esperado, fn.name);
  }
});

test('sem token nenhum destino é consultado', opcoes, async () => {
  const proibido = async () => { throw new Error('rede não pode ser tocada'); };
  const semTokens = { ...CONFIG, vercelToken: '', supabasePat: '', githubToken: '' };
  for (const fn of [mod.fetchVercelEnvs, mod.fetchSupabaseSecrets, mod.fetchGithubSecrets, mod.fetchGithubVariables]) {
    const r = await fn(semTokens, proibido);
    assert.equal(r.erro, null);
    assert.equal(r.dados.size, 0);
  }
});

test('Vercel: só valor `plain` é comparado — cifrado/secret não gera [BAD-REF] falso', opcoes, async () => {
  const { buscar, pedidos } = buscarFalso({
    'api.vercel.com/v10/projects/prj_y/env': { envs: [
      { key: 'VITE_SUPABASE_PROJECT_ID', value: 'eyJjaWZyYWRvIjoidGV4dG8ifQ==', type: 'encrypted' },
      { key: 'SUPABASE_PROJECT_ID', type: 'sensitive' },
      { key: 'SUPABASE_REF', value: 'outroprojeto', type: 'plain' },
      { key: 'LEGADO_SEM_TIPO', value: 'x' },
    ] },
  });
  const r = await mod.fetchVercelEnvs(CONFIG, buscar);
  assert.deepEqual([...r.dados], [['VITE_SUPABASE_PROJECT_ID', ''], ['SUPABASE_PROJECT_ID', ''], ['SUPABASE_REF', 'outroprojeto'], ['LEGADO_SEM_TIPO', 'x']]);
  assert.equal(pedidos[0].url, 'https://api.vercel.com/v10/projects/prj_y/env?teamId=team_x');
  assert.equal(pedidos[0].headers.Authorization, `Bearer ${SEGREDO}`);
});

test('executar: ponta a ponta com destinos falsos; nenhuma linha traz o token', opcoes, async () => {
  const { buscar } = buscarFalso({
    'api.vercel.com/v10/projects/prj_y/env': { envs: [{ key: 'VITE_SUPABASE_PROJECT_ID', value: 'errado', type: 'plain' }] },
    [`api.supabase.com/v1/projects/${REF}/secrets`]: [{ name: 'ASAAS_API_KEY' }, { name: 'ORFA' }],
    [`${GH}/actions/secrets`]: { erro: 'HTTP 403' },
    [`${GH}/environments`]: paginar('environments', []),
    [`${GH}/actions/variables`]: paginar('variables', []),
  });
  const r = await mod.executar(VARS, CONFIG, buscar);
  assert.deepEqual(r.linhas, [
    '  ❌ [READ-FAIL] github_actions: leitura do destino falhou (HTTP 403)',
    '  ❌ [MISSING] PROD_PROJECT_REF → github_actions_vars',
    '  ⚠️  [ORPHAN-SUPABASE] ORFA',
    `  ❌ [BAD-REF] VITE_SUPABASE_PROJECT_ID → vercel aponta para 'errado', esperado '${REF}'`,
  ]);
  assert.equal(r.failures, 3);
  assert.equal(r.linhas.join('\n').includes(SEGREDO), false);
});

test('manifesto real: sem tokens é tudo SKIP, zero falhas e zero rede', opcoes, async () => {
  const manifesto = JSON.parse(readFileSync(join(AQUI, '..', '..', 'env.manifest.json'), 'utf8'));
  const proibido = async () => { throw new Error('rede não pode ser tocada'); };
  const r = await mod.executar(manifesto.vars, { ...CONFIG, vercelToken: '', supabasePat: '', githubToken: '' }, proibido);
  assert.equal(r.failures, 0);
  assert.ok(r.linhas.length > 0);
  assert.ok(r.linhas.every((l) => /^ {2}⚠️ {2}SKIP \S+ \(sem (VERCEL_TOKEN|SUPABASE_PAT|GITHUB_TOKEN)\)$/.test(l)), r.linhas.find((l) => !l.includes('SKIP')));
  const destinos = new Set(manifesto.vars.map((v) => v.dest));
  for (const d of destinos) assert.ok(['vercel', 'supabase_vault', 'supabase_auto', 'github_actions', 'github_actions_vars'].includes(d), `destino sem tratamento no auditor: ${d}`);
});

// ---- `get` contra servidor HTTP local ---------------------------------------
test('get: 2xx devolve o JSON; erro HTTP, corpo não-JSON, queda e timeout viram { ok: false } sem ecoar credencial', opcoes, async () => {
  const servidor = http.createServer((req, res) => {
    if (req.url === '/ok') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ eco: req.headers.authorization })); }
    if (req.url === '/401') { res.statusCode = 401; return res.end(JSON.stringify({ message: `bad credentials ${req.headers.authorization}` })); }
    if (req.url === '/html') return res.end('<html>manutenção</html>');
    if (req.url === '/derruba') return req.socket.destroy();
    return undefined; // /lento: nunca responde
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const cab = { Authorization: `Bearer ${SEGREDO}` };
  try {
    assert.deepEqual(await mod.get(`${base}/ok`, cab), { ok: true, erro: '', json: { eco: `Bearer ${SEGREDO}` } });
    assert.deepEqual(await mod.get(`${base}/401`, cab), { ok: false, erro: 'HTTP 401', json: null });
    for (const rota of ['/html', '/derruba']) {
      const r = await mod.get(`${base}${rota}`, cab);
      assert.equal(r.ok, false, rota);
      assert.equal(JSON.stringify(r).includes(SEGREDO), false, rota);
    }
    const lento = await mod.get(`${base}/lento`, cab, fetch, 150);
    assert.deepEqual(lento, { ok: false, erro: 'TimeoutError', json: null });
  } finally {
    servidor.closeAllConnections();
    await new Promise((ok) => servidor.close(ok));
  }
});

test('fonte: import attributes com `with` (Deno 2 não parseia `assert`) e execução só quando é o script principal', () => {
  const fonte = readFileSync(join(AQUI, 'audit-env.ts'), 'utf8');
  assert.match(fonte, /import manifest from '\.\.\/\.\.\/env\.manifest\.json' with \{ type: 'json' \};/);
  assert.doesNotMatch(fonte, /\bassert \{ type:/);
  assert.match(fonte, /if \(import\.meta\.main\) await principal\(\);/);
  assert.doesNotMatch(fonte, /@ts-ignore|: any\b/);
});
