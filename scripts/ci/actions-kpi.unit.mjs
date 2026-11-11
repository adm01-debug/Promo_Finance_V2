import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  agregar,
  coletarJobs,
  coletarRuns,
  corpoDoKpi,
  duracaoMinutos,
  kpiPorArquivo,
  maisLentos,
  paginaTemMais,
  publicarIssue,
  tabela,
  tabelaLentos,
} from './actions-kpi.mjs';

const AGORA = Date.parse('2026-11-08T12:00:00Z');
const run = (nome, minutos, conclusao, diasAtras = 0, arquivo) => ({
  name: nome,
  conclusion: conclusao,
  path: arquivo ? `.github/workflows/${arquivo}` : undefined,
  run_started_at: new Date(AGORA - diasAtras * 86400000).toISOString(),
  updated_at: new Date(AGORA - diasAtras * 86400000 + minutos * 60000).toISOString(),
});

// Le o `page` de verdade da URL: `caminho.includes('page=1')` casaria com `per_page=100`
// e faria o fake devolver a mesma pagina para sempre.
const paginaDe = (caminho) => Number(new URL(caminho, 'http://x').searchParams.get('page'));

test('agregar conta runs, cancelados, falhas e minutos por workflow', () => {
  const linhas = agregar(
    [run('CI', 10, 'success'), run('CI', 20, 'cancelled'), run('CI', 5, 'failure'), run('CodeQL', 3, 'success')],
    { agora: AGORA },
  );
  const ci = linhas.find((l) => l.workflow === 'CI');
  assert.equal(ci.runs, 3);
  assert.equal(ci.cancelados, 1);
  assert.equal(ci.falhas, 1);
  assert.equal(ci.minutos, 35);
  assert.equal(ci.taxaCancelamento, 33.3);
  assert.equal(ci.taxaFalha, 33.3);
  assert.equal(linhas[0].workflow, 'CI', 'o mais frequente vem primeiro');
});

test('a janela corta run velho — o KPI e dos ultimos N dias, nao de sempre', () => {
  const linhas = agregar([run('CI', 10, 'success', 1), run('CI', 99, 'success', 30)], { agora: AGORA, janelaDias: 7 });
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].runs, 1, 'run de 30 dias atras nao pode entrar na janela de 7');
  assert.equal(linhas[0].minutos, 10);
});

test('duracao vem dos carimbos e nunca e negativa', () => {
  assert.equal(duracaoMinutos(run('CI', 7, 'success')), 7);
  assert.equal(duracaoMinutos({}), 0, 'sem carimbo, zero — nao NaN');
  assert.equal(
    duracaoMinutos({ run_started_at: '2026-11-08T12:00:00Z', updated_at: '2026-11-08T11:00:00Z' }),
    0,
    'fim antes do inicio nao vira minutos negativos',
  );
  assert.equal(duracaoMinutos({ run_started_at: 'nao-e-data', updated_at: 'tambem-nao' }), 0);
});

test('kpiPorArquivo indexa pelo arquivo do workflow, que e a chave do README', () => {
  const kpi = kpiPorArquivo(
    [
      run('CI', 10, 'success', 0, 'ci.yml'),
      run('CI', 30, 'failure', 1, 'ci.yml'),
      run('CodeQL', 5, 'success', 2, 'codeql.yml'),
      run('Apagado', 5, 'success', 2), // sem path: workflow que nao existe mais
      run('CI', 999, 'success', 40, 'ci.yml'), // fora da janela
    ],
    { agora: AGORA, janelaDias: 7 },
  );
  assert.deepEqual(Object.keys(kpi), ['ci.yml', 'codeql.yml']);
  assert.equal(kpi['ci.yml'].runs, 2);
  assert.equal(kpi['ci.yml'].custo_semana_min, 40);
  assert.equal(kpi['ci.yml'].taxa_falha_7d, '50%');
  assert.equal(kpi['codeql.yml'].taxa_falha_7d, '0%');
});

test('kpiPorArquivo normaliza o custo para 7 dias qualquer que seja a janela', () => {
  const runs = [run('CI', 60, 'success', 0, 'ci.yml')];
  assert.equal(kpiPorArquivo(runs, { agora: AGORA, janelaDias: 7 })['ci.yml'].custo_semana_min, 60);
  // 60 min em 1 dia = 420 min/semana: a coluna nao pode mudar de unidade sem avisar.
  assert.equal(kpiPorArquivo(runs, { agora: AGORA, janelaDias: 1 })['ci.yml'].custo_semana_min, 420);
});

test('os jobs mais lentos saem ordenados e limitados', () => {
  const jobs = [
    { name: 'a', workflow_name: 'CI', started_at: '2026-11-08T10:00:00Z', completed_at: '2026-11-08T10:01:00Z' },
    { name: 'b', workflow_name: 'CI', started_at: '2026-11-08T10:00:00Z', completed_at: '2026-11-08T10:30:00Z' },
    { name: 'c', workflow_name: 'CI', started_at: '2026-11-08T10:00:00Z', completed_at: '2026-11-08T10:10:00Z' },
  ];
  const lentos = maisLentos(jobs, { limite: 2 });
  assert.equal(lentos.length, 2);
  assert.deepEqual(
    lentos.map((l) => l.job),
    ['b', 'c'],
  );
});

test('a tabela traz as colunas pedidas e o total', () => {
  const md = tabela(agregar([run('CI', 10, 'success'), run('CI', 20, 'cancelled')], { agora: AGORA }));
  assert.match(md, /\| workflow \| runs \| cancelados \| taxa cancel\. \| falhas \| taxa falha \| minutos \|/);
  assert.match(md, /Total: \*\*2\*\* runs, \*\*30\*\* minutos\./);
  assert.match(tabelaLentos([]), /nenhum job/);
});

test('paginaTemMais continua enquanto a pagina esta cheia e dentro da janela', () => {
  const cheia = Array.from({ length: 100 }, () => run('CI', 1, 'success'));
  assert.equal(paginaTemMais(cheia, { agora: AGORA, janelaDias: 7, porPagina: 100 }), true);

  const ultima = Array.from({ length: 37 }, () => run('CI', 1, 'success'));
  assert.equal(paginaTemMais(ultima, { agora: AGORA, janelaDias: 7, porPagina: 100 }), false, 'pagina incompleta e a ultima');

  const velha = Array.from({ length: 100 }, () => run('CI', 1, 'success', 30));
  assert.equal(paginaTemMais(velha, { agora: AGORA, janelaDias: 7, porPagina: 100 }), false, 'ja saiu da janela');
});

test('coletarRuns busca a pagina seguinte em vez de parar em 100', async () => {
  const cheia = Array.from({ length: 100 }, () => run('CI', 1, 'success'));
  const chamadas = [];
  const pedirFake = async (caminho) => {
    chamadas.push(caminho);
    const pagina = paginaDe(caminho);
    if (pagina === 1) return { workflow_runs: cheia };
    if (pagina === 2) return { workflow_runs: [run('CI', 2, 'success')] };
    return { workflow_runs: [] };
  };
  const runs = await coletarRuns({ repo: 'o/r', token: 't', agora: AGORA, pedir: pedirFake });
  assert.equal(runs.length, 101, 'a segunda pagina nao pode ser ignorada');
  assert.equal(chamadas.length, 2, 'para na primeira pagina incompleta');
  assert.match(chamadas[0], /actions\/runs\?per_page=100&page=1$/);
});

test('coletarRuns nao pagina para fora da janela', async () => {
  const velha = Array.from({ length: 100 }, () => run('CI', 1, 'success', 30));
  const chamadas = [];
  const pedirFake = async (caminho) => {
    chamadas.push(caminho);
    return { workflow_runs: velha };
  };
  const runs = await coletarRuns({ repo: 'o/r', token: 't', agora: AGORA, janelaDias: 7, pedir: pedirFake });
  assert.equal(chamadas.length, 1, 'pagina ja fora da janela: para na primeira');
  assert.equal(runs.length, 100);
});

test('coletarJobs consulta os jobs de cada run e herda o nome do workflow', async () => {
  const chamadas = [];
  const pedirFake = async (caminho) => {
    chamadas.push(caminho);
    if (caminho.includes('/runs/1/jobs')) {
      return {
        jobs: [
          { name: 'lento', started_at: '2026-11-08T10:00:00Z', completed_at: '2026-11-08T10:40:00Z' },
          { name: 'rapido', started_at: '2026-11-08T10:00:00Z', completed_at: '2026-11-08T10:01:00Z' },
        ],
      };
    }
    return { jobs: [] };
  };
  const jobs = await coletarJobs([{ id: 1, name: 'CI' }], { repo: 'o/r', token: 't', pedir: pedirFake });
  assert.equal(jobs.length, 2);
  assert.match(chamadas[0], /\/repos\/o\/r\/actions\/runs\/1\/jobs\?per_page=100&page=1$/);
  assert.equal(jobs[0].workflow_name, 'CI', 'o run da o nome do workflow quando o job nao traz');
  assert.equal(maisLentos(jobs, { limite: 5 })[0].job, 'lento');
});

test('coletarJobs pagina um run com mais de 100 jobs', async () => {
  const cheia = Array.from({ length: 100 }, (_, i) => ({
    name: `job-${i}`,
    started_at: '2026-11-08T10:00:00Z',
    completed_at: '2026-11-08T10:01:00Z',
  }));
  const pedirFake = async (caminho) => {
    const pagina = paginaDe(caminho);
    if (pagina === 1) return { jobs: cheia };
    if (pagina === 2) return { jobs: [cheia[0]] };
    return { jobs: [] };
  };
  const jobs = await coletarJobs([{ id: 7, name: 'CI' }], { repo: 'o/r', token: 't', pedir: pedirFake });
  assert.equal(jobs.length, 101, 'a segunda pagina de jobs nao pode ser ignorada');
});

test('o corpo do KPI publica o ranking real dos jobs, nao um ranking vazio', () => {
  const runs = [run('CI', 5, 'success')];
  const jobs = [
    { name: 'build', workflow_name: 'CI', started_at: '2026-11-08T10:00:00Z', completed_at: '2026-11-08T10:20:00Z' },
    { name: 'test', workflow_name: 'CI', started_at: '2026-11-08T10:00:00Z', completed_at: '2026-11-08T10:04:00Z' },
  ];
  const md = corpoDoKpi(runs, jobs, { agora: AGORA, janelaDias: 7 });
  assert.match(md, /build/, 'o job mais lento tem de aparecer');
  assert.doesNotMatch(md, /nenhum job/, 'com jobs reais o placeholder nao pode aparecer');
  assert.match(md, /\| workflow \| runs \|/);
});

test('publicarIssue atualiza a issue aberta em vez de empilhar uma nova', async () => {
  const chamadas = [];
  const pedirFake = async (caminho, _token, opcoes) => {
    chamadas.push({ caminho, metodo: opcoes?.metodo ?? 'GET' });
    if (caminho.includes('labels=kpi-actions')) return [{ number: 42, title: '[kpi-actions] Semana de 2026-11-01' }];
    return {};
  };
  const r = await publicarIssue({ repo: 'o/r', token: 't', marca: 'm', corpo: 'c', pedir: pedirFake });
  assert.deepEqual(r, { acao: 'atualizada', numero: 42 });
  assert.equal(chamadas[1].metodo, 'PATCH');
  assert.match(chamadas[1].caminho, /\/issues\/42$/);
});

test('publicarIssue ignora PR que veio na listagem de issues', async () => {
  const pedirFake = async (caminho, _token, opcoes) => {
    if (caminho.includes('labels=kpi-actions')) {
      return [{ number: 9, title: '[kpi-actions] de mentira', pull_request: {} }];
    }
    if (opcoes?.metodo === 'POST') return { number: 100 };
    return {};
  };
  const r = await publicarIssue({ repo: 'o/r', token: 't', marca: 'm', corpo: 'c', pedir: pedirFake });
  assert.deepEqual(r, { acao: 'criada', numero: 100 }, 'PR com o mesmo titulo nao e a issue do KPI');
});

test('o workflow semanal roda o KPI com as permissoes que ele precisa', () => {
  const y = readFileSync(new URL('../../.github/workflows/estado-real.yml', import.meta.url), 'utf8');
  const topo = y.slice(0, y.indexOf('jobs:'));
  // zizmor reprova `write` no nivel do WORKFLOW (excessive-permissions): o escopo vale
  // para todos os jobs. A escrita fica no job, onde o escopo e exatamente o que ele usa.
  assert.doesNotMatch(topo, /^\s{2}(issues|contents|pull-requests):\s*write/m, 'escrita fica no job');
  assert.match(y, /^\s*permissions:\s*\n(?:.*\n)*?\s*issues:\s*write/m, 'o job do KPI precisa de issues: write');
  assert.match(y, /node scripts\/ci\/actions-kpi\.mjs/, 'o workflow tem de chamar o KPI');
  assert.doesNotMatch(y, /continue-on-error:\s*true/, 'etapa que nao bloqueia nao prova nada');
});

// ---------------------------------------------------------------------------
// Rede simulada: `pedir` com fetch falso (retry, timeout, erro), aviso de paginação
// truncada e CLI sem credencial. Nenhum teste fala com a API do GitHub.
// ---------------------------------------------------------------------------
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gravarKpi, pedir, runsNaJanela } from './actions-kpi.mjs';

const AQUI_KPI = dirname(fileURLToPath(import.meta.url));
const TOKEN_KPI = ['gh', 's_', 'Kp1'.repeat(12)].join('');
const SEM_ESPERA = { delaysMs: [1, 1, 1], api: 'https://api.github.invalid' };
const jsonOk = (corpo, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

async function capturarErro(fn) {
  const linhas = [];
  const original = console.error;
  console.error = (...a) => linhas.push(a.join(' '));
  try {
    return { retorno: await fn(), avisos: linhas };
  } finally {
    console.error = original;
  }
}

test('coletarRuns avisa quando o teto de paginas TRUNCA a janela (antes: calava justamente aqui)', async () => {
  const cheia = Array.from({ length: 2 }, (_, i) => ({ ...run('CI', 1, 'success', 0), id: i }));
  let n = 0;
  const pedirFalso = async () => ({ workflow_runs: cheia.map((r) => ({ ...r, id: (n += 1) })) });
  const { retorno, avisos } = await capturarErro(() => coletarRuns({ repo: 'o/r', token: 't', agora: AGORA, porPagina: 2, maxPaginas: 3, pedir: pedirFalso }));
  assert.equal(retorno.length, 6);
  assert.deepEqual(avisos, ['::warning::paginacao de runs parou no teto de 3 paginas']);
});

test('coletarRuns NAO avisa quando a ultima pagina permitida encerra a janela de verdade', async () => {
  // Página cheia cujo run mais antigo já saiu da janela: a coleta terminou certo.
  const pedirFalso = async (caminho) => ({
    workflow_runs: paginaDe(caminho) === 1 ? [run('CI', 1, 'success', 0), run('CI', 1, 'success', 1)] : [run('CI', 1, 'success', 2), run('CI', 1, 'success', 30)],
  });
  const { retorno, avisos } = await capturarErro(() => coletarRuns({ repo: 'o/r', token: 't', agora: AGORA, porPagina: 2, maxPaginas: 2, pedir: pedirFalso }));
  assert.equal(retorno.length, 4);
  assert.deepEqual(avisos, [], 'antes: "parou no teto" disparava aqui, sem nada ter sido cortado');
});

test('coletarRuns tolera resposta sem workflow_runs e run sem id', async () => {
  assert.deepEqual(await coletarRuns({ repo: 'o/r', token: 't', pedir: async () => ({}) }), []);
  const semId = await coletarRuns({ repo: 'o/r', token: 't', agora: AGORA, pedir: async () => ({ workflow_runs: [run('A', 1, 'success'), run('A', 1, 'success')] }) });
  assert.equal(semId.length, 2, 'sem id não há como deduplicar: os dois contam');
});

test('pedir: envia Bearer + versao da API, devolve o JSON e manda corpo em PATCH/POST', async () => {
  const vistos = [];
  const fetchImpl = async (url, init) => {
    vistos.push({ url, init });
    return jsonOk({ ok: true });
  };
  assert.deepEqual(await pedir('/repos/o/r/actions/runs?page=1', TOKEN_KPI, { ...SEM_ESPERA, fetchImpl }), { ok: true });
  assert.equal(vistos[0].url, 'https://api.github.invalid/repos/o/r/actions/runs?page=1');
  assert.equal(vistos[0].init.method, 'GET');
  assert.equal(vistos[0].init.headers.Authorization, `Bearer ${TOKEN_KPI}`);
  assert.equal(vistos[0].init.headers['X-GitHub-Api-Version'], '2022-11-28');
  assert.equal(vistos[0].init.body, undefined);
  assert.ok(vistos[0].init.signal instanceof AbortSignal, 'toda requisição tem teto de tempo');
  await pedir('/repos/o/r/issues/1', TOKEN_KPI, { ...SEM_ESPERA, fetchImpl, metodo: 'PATCH', corpo: { title: 't' } });
  assert.equal(vistos[1].init.body, '{"title":"t"}');
  assert.equal(vistos[1].init.headers['Content-Type'], 'application/json');
});

test('pedir: 502/503/504 e queda de rede sao repetidos; a mensagem de erro nunca traz o token', async () => {
  for (const falha of [() => new Response('x', { status: 502 }), () => new Response('x', { status: 503 }), () => new Response('x', { status: 504 }), () => { throw new TypeError('fetch failed'); }]) {
    let n = 0;
    const fetchImpl = async () => {
      n += 1;
      return n < 3 ? falha() : jsonOk({ n });
    };
    assert.deepEqual(await pedir('/x', TOKEN_KPI, { ...SEM_ESPERA, fetchImpl }), { n: 3 }, 'antes: erro de rede abortava na primeira tentativa');
  }
  let tentativas = 0;
  const sempre503 = async () => { tentativas += 1; return new Response('x', { status: 503 }); };
  await assert.rejects(pedir('/y', TOKEN_KPI, { ...SEM_ESPERA, fetchImpl: sempre503 }), (e) => e.message === 'GET /y -> 503' && !e.message.includes(TOKEN_KPI));
  assert.equal(tentativas, 4);
  tentativas = 0;
  const semRede = async () => { tentativas += 1; throw new TypeError(`fetch failed`); };
  await assert.rejects(pedir('/z', TOKEN_KPI, { ...SEM_ESPERA, fetchImpl: semRede, tentativas: 2 }), /GET \/z -> falha de rede \(TypeError: fetch failed\)/);
  assert.equal(tentativas, 2);
});

test('pedir: 401/403/404/422 falham na hora, sem retry', async () => {
  for (const status of [401, 403, 404, 422, 500]) {
    let n = 0;
    const fetchImpl = async () => { n += 1; return new Response('{"message":"x"}', { status }); };
    await assert.rejects(pedir('/w', TOKEN_KPI, { ...SEM_ESPERA, fetchImpl }), new RegExp(`GET /w -> ${status}`));
    assert.equal(n, 1, `HTTP ${status}`);
  }
});

test('pedir: servidor local que nao responde e cortado pelo timeout e repetido', async () => {
  let conexoes = 0;
  const servidor = http.createServer(() => { conexoes += 1; });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  try {
    const inicio = Date.now();
    await assert.rejects(
      pedir('/lento', TOKEN_KPI, { api: `http://127.0.0.1:${servidor.address().port}`, delaysMs: [1], timeoutMs: 150, tentativas: 2 }),
      /GET \/lento -> falha de rede \((TimeoutError|AbortError)/,
    );
    assert.equal(conexoes, 2);
    assert.ok(Date.now() - inicio < 5000);
  } finally {
    servidor.closeAllConnections();
    await new Promise((ok) => servidor.close(ok));
  }
});

test('coletarRuns + coletarJobs + publicarIssue de ponta a ponta contra um servidor HTTP local', async () => {
  const pedidos = [];
  const servidor = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      pedidos.push({ method: req.method, url: req.url, corpo });
      const url = new URL(req.url, 'http://x');
      res.setHeader('Content-Type', 'application/json');
      if (url.pathname.endsWith('/actions/runs')) return res.end(JSON.stringify({ workflow_runs: [{ ...run('CI Pipeline', 10, 'failure', 0, 'ci.yml'), id: 77 }] }));
      if (url.pathname.endsWith('/runs/77/jobs')) return res.end(JSON.stringify({ jobs: [{ name: 'quality-gate', started_at: new Date(AGORA).toISOString(), completed_at: new Date(AGORA + 300000).toISOString() }] }));
      if (req.method === 'GET' && url.pathname.endsWith('/issues')) return res.end('[]');
      if (req.method === 'POST' && url.pathname.endsWith('/issues')) { res.statusCode = 201; return res.end('{"number": 12}'); }
      res.statusCode = 404;
      return res.end('{}');
    });
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  try {
    const buscar = (caminho, token, opcoes) => pedir(caminho, token, { ...opcoes, api: `http://127.0.0.1:${servidor.address().port}`, delaysMs: [1] });
    const runs = await coletarRuns({ repo: 'o/r', token: TOKEN_KPI, agora: AGORA, pedir: buscar });
    const jobs = await coletarJobs(runs, { repo: 'o/r', token: TOKEN_KPI, pedir: buscar });
    const corpo = corpoDoKpi(runs, jobs, { agora: AGORA });
    assert.match(corpo, /\| CI Pipeline \| 1 \| 0 \| 0% \| 1 \| 100% \| 10 \|/);
    assert.match(corpo, /\| quality-gate \| CI Pipeline \| 5 \|/);
    assert.deepEqual(await publicarIssue({ repo: 'o/r', token: TOKEN_KPI, marca: '[kpi-actions] Semana', corpo, pedir: buscar }), { acao: 'criada', numero: 12 });
    const criacao = JSON.parse(pedidos.at(-1).corpo);
    assert.deepEqual(criacao.labels, ['kpi-actions']);
    assert.equal(criacao.body, corpo);
  } finally {
    servidor.closeAllConnections();
    await new Promise((ok) => servidor.close(ok));
  }
});

test('gravarKpi escreve JSON deterministico (chaves ordenadas, newline final) e e idempotente', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kpi grava-'));
  try {
    const destino = join(dir, 'sub', 'kpi.json');
    const runs = [run('Z', 4, 'failure', 0, 'z.yml'), run('A', 2, 'success', 0, 'a.yml'), run('Velho', 9, 'failure', 30, 'velho.yml'), run('Sem path', 1, 'success', 0)];
    const dados = gravarKpi(runs, { agora: AGORA, destino });
    const texto = readFileSync(destino, 'utf8');
    assert.equal(texto, `${JSON.stringify(dados, null, 2)}\n`);
    assert.deepEqual(Object.keys(JSON.parse(texto)), ['a.yml', 'z.yml']);
    gravarKpi([...runs].reverse(), { agora: AGORA, destino });
    assert.equal(readFileSync(destino, 'utf8'), texto, 'a ordem dos runs não muda o arquivo');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('bordas do nucleo: carimbo invalido, run em andamento e janela vazia', () => {
  assert.equal(duracaoMinutos({}), 0);
  assert.equal(duracaoMinutos({ run_started_at: 'ontem', updated_at: 'hoje' }), 0);
  assert.deepEqual(runsNaJanela(null), []);
  assert.deepEqual(runsNaJanela([{ run_started_at: null }, {}], { agora: AGORA }), []);
  assert.deepEqual(agregar([], { agora: AGORA }), []);
  assert.deepEqual(kpiPorArquivo(undefined, { agora: AGORA }), {});
  const emAndamento = agregar([run('CI', 3, null)], { agora: AGORA });
  assert.deepEqual([emAndamento[0].falhas, emAndamento[0].cancelados, emAndamento[0].minutos], [0, 0, 3]);
  assert.match(tabela([]), /Total: \*\*0\*\* runs, \*\*0\*\* minutos\./);
  assert.equal(tabelaLentos([]), '_nenhum job registrado na janela_');
  assert.deepEqual(maisLentos(undefined), []);
});

test('CLI: sem GITHUB_REPOSITORY ou sem token sai 2 antes de qualquer requisicao', () => {
  const script = join(AQUI_KPI, 'actions-kpi.mjs');
  // GITHUB_API_URL aponta para um destino morto: mesmo que a checagem regredisse, o teste não fala com o GitHub.
  const base = { PATH: process.env.PATH, GITHUB_API_URL: 'http://127.0.0.1:9' };
  for (const env of [base, { ...base, GITHUB_REPOSITORY: 'o/r' }, { ...base, GH_TOKEN: TOKEN_KPI }, { ...base, GITHUB_REPOSITORY: '', GITHUB_TOKEN: TOKEN_KPI }]) {
    const r = spawnSync(process.execPath, [script], { encoding: 'utf8', env, timeout: 20_000 });
    assert.equal(r.status, 2, JSON.stringify(Object.keys(env)));
    assert.match(r.stderr, /::error::GITHUB_REPOSITORY e GH_TOKEN sao obrigatorios/);
    assert.equal((r.stdout + r.stderr).includes(TOKEN_KPI), false);
  }
});
