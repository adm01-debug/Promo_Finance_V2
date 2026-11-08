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
