#!/usr/bin/env node
// KPI de uso do GitHub Actions: quanto cada workflow custa e com que frequência falha,
// medido da API em vez de estimado. Alimenta `docs/ci/kpi.json`, que o
// `render-workflow-docs.mjs` usa nas colunas "custo/sem (min)" e "falha (7 d)".
//
// A API devolve `run_started_at` e `updated_at` por run, e o endpoint `/timing` devolve
// `billable: {}` em repositório público — por isso a duração sai da diferença entre os dois
// carimbos, e não do endpoint de faturamento (que seria a fonte "certa" mas não existe aqui).
//
// O núcleo é puro de propósito: `agregar`, `maisLentos`, `paginaTemMais`, `kpiPorArquivo` e
// `tabela` não tocam rede nem disco, então a conta é testável com runs sintéticos. O CLI só
// busca, chama e publica.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const KPI_PATH = path.join(RAIZ, 'docs', 'ci', 'kpi.json');

const CANCELADOS = new Set(['cancelled']);
const FALHAS = new Set(['failure', 'timed_out', 'startup_failure']);
const UM_DIA = 24 * 60 * 60 * 1000;
const POR_PAGINA = 100; // teto da API do GitHub

export function duracaoMinutos(run) {
  const inicio = Date.parse(run.run_started_at ?? '');
  const fim = Date.parse(run.updated_at ?? '');
  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim < inicio) return 0;
  return (fim - inicio) / 60000;
}

export function runsNaJanela(runs, { janelaDias = 7, agora = Date.now() } = {}) {
  const corte = agora - janelaDias * UM_DIA;
  return (runs ?? []).filter((run) => {
    const inicio = Date.parse(run.run_started_at ?? '');
    return Number.isFinite(inicio) && inicio >= corte;
  });
}

export function agregar(runs, { janelaDias = 7, agora = Date.now() } = {}) {
  const porWorkflow = new Map();
  for (const run of runsNaJanela(runs, { janelaDias, agora })) {
    const nome = run.name || run.workflow_id || '(sem nome)';
    const atual = porWorkflow.get(nome) ?? { workflow: nome, runs: 0, cancelados: 0, falhas: 0, minutos: 0 };
    atual.runs += 1;
    if (CANCELADOS.has(run.conclusion)) atual.cancelados += 1;
    if (FALHAS.has(run.conclusion)) atual.falhas += 1;
    atual.minutos += duracaoMinutos(run);
    porWorkflow.set(nome, atual);
  }
  return [...porWorkflow.values()]
    .map((l) => ({
      ...l,
      minutos: Math.round(l.minutos * 10) / 10,
      taxaCancelamento: l.runs ? Math.round((l.cancelados / l.runs) * 1000) / 10 : 0,
      taxaFalha: l.runs ? Math.round((l.falhas / l.runs) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.runs - a.runs || b.minutos - a.minutos);
}

/**
 * Mesma conta, indexada pelo ARQUIVO do workflow (`run.path` = `.github/workflows/ci.yml`),
 * que é a chave que o README gerado usa. Run sem `path` (workflow apagado) é ignorado:
 * sem o arquivo não há linha no README para receber o número.
 */
export function kpiPorArquivo(runs, { janelaDias = 7, agora = Date.now() } = {}) {
  const acc = new Map();
  for (const run of runsNaJanela(runs, { janelaDias, agora })) {
    const arquivo = typeof run.path === 'string' ? run.path.split('/').pop() : '';
    if (!arquivo) continue;
    const atual = acc.get(arquivo) ?? { runs: 0, falhas: 0, minutos: 0 };
    atual.runs += 1;
    if (FALHAS.has(run.conclusion)) atual.falhas += 1;
    atual.minutos += duracaoMinutos(run);
    acc.set(arquivo, atual);
  }
  const saida = {};
  // Normaliza a janela para 7 dias: `custo_semana_min` tem de significar a mesma coisa
  // qualquer que seja JANELA_DIAS, senão a coluna do README muda de unidade sem avisar.
  const fator = 7 / janelaDias;
  for (const arquivo of [...acc.keys()].sort()) {
    const { runs: n, falhas, minutos } = acc.get(arquivo);
    saida[arquivo] = {
      runs: n,
      custo_semana_min: Math.round(minutos * fator * 10) / 10,
      taxa_falha_7d: `${n ? Math.round((falhas / n) * 1000) / 10 : 0}%`,
    };
  }
  return saida;
}

// A API devolve os runs do mais novo para o mais antigo. Se a página veio cheia E o run mais
// antigo dela ainda está dentro da janela, pode haver run da janela na página seguinte — então
// vale continuar. Página incompleta é a última; página cujo run mais antigo já saiu da janela
// significa que a próxima só teria coisa velha.
export function paginaTemMais(pagina, { janelaDias = 7, agora = Date.now(), porPagina = POR_PAGINA } = {}) {
  const runs = pagina ?? [];
  if (runs.length < porPagina) return false;
  const tempos = runs.map((r) => Date.parse(r.run_started_at ?? '')).filter(Number.isFinite);
  if (!tempos.length) return false;
  return Math.min(...tempos) >= agora - janelaDias * UM_DIA;
}

export function maisLentos(jobs, { limite = 5 } = {}) {
  return (jobs ?? [])
    .map((j) => ({
      job: j.name,
      workflow: j.workflow_name ?? '',
      minutos: Math.round(duracaoMinutos({ run_started_at: j.started_at, updated_at: j.completed_at }) * 10) / 10,
    }))
    .sort((a, b) => b.minutos - a.minutos)
    .slice(0, limite);
}

export function tabela(agregado, { titulo = 'KPI do GitHub Actions — 7 dias' } = {}) {
  const linhas = [
    `## ${titulo}`,
    '',
    '| workflow | runs | cancelados | taxa cancel. | falhas | taxa falha | minutos |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...agregado.map(
      (l) =>
        `| ${l.workflow} | ${l.runs} | ${l.cancelados} | ${l.taxaCancelamento}% | ${l.falhas} | ${l.taxaFalha}% | ${l.minutos} |`,
    ),
  ];
  const totalRuns = agregado.reduce((a, l) => a + l.runs, 0);
  const totalMin = Math.round(agregado.reduce((a, l) => a + l.minutos, 0) * 10) / 10;
  linhas.push('', `Total: **${totalRuns}** runs, **${totalMin}** minutos.`);
  return linhas.join('\n');
}

export function tabelaLentos(lentos) {
  if (!lentos.length) return '_nenhum job registrado na janela_';
  return [
    '### 5 jobs mais lentos',
    '',
    '| job | workflow | minutos |',
    '| --- | --- | ---: |',
    ...lentos.map((l) => `| ${l.job} | ${l.workflow} | ${l.minutos} |`),
  ].join('\n');
}

// Corpo publicado (Job Summary + issue): tabela por workflow + ranking dos jobs. Puro, para o
// teste provar que o ranking sai dos jobs reais e não de uma lista vazia.
export function corpoDoKpi(runs, jobs, { janelaDias = 7, agora = Date.now(), titulo } = {}) {
  return [
    tabela(agregar(runs, { janelaDias, agora }), { titulo: titulo ?? `KPI do GitHub Actions — ${janelaDias} dias` }),
    '',
    tabelaLentos(maisLentos(jobs, { limite: 5 })),
  ].join('\n');
}

// ---------------------------------------------------------------- CLI
const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const CABECALHOS = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

async function pedir(caminho, token, { metodo = 'GET', corpo, tentativas = 4, delaysMs = [5000, 10000, 20000] } = {}) {
  for (let i = 0; i < tentativas; i++) {
    const r = await fetch(`${API}${caminho}`, {
      method: metodo,
      headers: { ...CABECALHOS(token), ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (r.ok) return r.json();
    const transitorio = r.status === 502 || r.status === 503 || r.status === 504;
    if (!transitorio || i >= tentativas - 1) throw new Error(`${metodo} ${caminho} -> ${r.status}`);
    await new Promise((res) => setTimeout(res, delaysMs[Math.min(i, delaysMs.length - 1)]));
  }
}

// Pagina os runs até cobrir a janela inteira. `pedir` é injetável para o teste exercitar a
// paginação sem rede. O teto de páginas é só trava anti-loop (100 páginas = 10k runs).
export async function coletarRuns({
  repo,
  token,
  janelaDias = 7,
  agora = Date.now(),
  porPagina = POR_PAGINA,
  maxPaginas = 100,
  pedir: buscar = pedir,
} = {}) {
  const todos = [];
  const vistos = new Set();
  for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
    const { workflow_runs: runs = [] } = await buscar(
      `/repos/${repo}/actions/runs?per_page=${porPagina}&page=${pagina}`,
      token,
    );
    for (const run of runs) {
      if (run.id !== undefined && vistos.has(run.id)) continue;
      if (run.id !== undefined) vistos.add(run.id);
      todos.push(run);
    }
    if (!paginaTemMais(runs, { janelaDias, agora, porPagina })) {
      if (pagina === maxPaginas && runs.length >= porPagina) {
        console.error(`::warning::paginacao de runs parou no teto de ${maxPaginas} paginas`);
      }
      break;
    }
  }
  return todos;
}

// Busca os jobs de cada run (paginando o próprio run, que também corta em 100) e preenche
// `workflow_name` com o nome do run quando o endpoint de jobs não o traz.
export async function coletarJobs(
  runs,
  { repo, token, porPagina = POR_PAGINA, maxPaginas = 100, pedir: buscar = pedir } = {},
) {
  const jobs = [];
  for (const run of runs ?? []) {
    const id = run.id ?? run.run_id;
    if (id === undefined || id === null) continue;
    for (let pagina = 1; pagina <= maxPaginas; pagina += 1) {
      const { jobs: paginaJobs = [] } = await buscar(
        `/repos/${repo}/actions/runs/${id}/jobs?per_page=${porPagina}&page=${pagina}`,
        token,
      );
      for (const job of paginaJobs) jobs.push({ ...job, workflow_name: job.workflow_name ?? run.name ?? '' });
      if (paginaJobs.length < porPagina) break;
    }
  }
  return jobs;
}

// Uma issue por semana, não uma pilha: procura a aberta com a etiqueta e atualiza; se não
// houver, cria. Rodar duas vezes no mesmo dia não duplica nada.
export async function publicarIssue({ repo, token, marca, corpo, pedir: buscar = pedir }) {
  const abertas = await buscar(`/repos/${repo}/issues?state=open&labels=kpi-actions&per_page=10`, token);
  const existente = (abertas ?? []).find((i) => !i.pull_request && String(i.title).startsWith('[kpi-actions]'));
  if (existente) {
    await buscar(`/repos/${repo}/issues/${existente.number}`, token, {
      metodo: 'PATCH',
      corpo: { title: marca, body: corpo },
    });
    return { acao: 'atualizada', numero: existente.number };
  }
  const criada = await buscar(`/repos/${repo}/issues`, token, {
    metodo: 'POST',
    corpo: { title: marca, body: corpo, labels: ['kpi-actions'] },
  });
  return { acao: 'criada', numero: criada.number };
}

export function gravarKpi(runs, { janelaDias = 7, agora = Date.now(), destino = KPI_PATH } = {}) {
  const dados = kpiPorArquivo(runs, { janelaDias, agora });
  mkdirSync(path.dirname(destino), { recursive: true });
  writeFileSync(destino, `${JSON.stringify(dados, null, 2)}\n`);
  return dados;
}

async function principal() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    console.error('::error::GITHUB_REPOSITORY e GH_TOKEN sao obrigatorios');
    process.exit(2);
  }
  const _janelaEnv = Number(process.env.JANELA_DIAS ?? 7);
  const janela = Number.isFinite(_janelaEnv) && _janelaEnv > 0 ? _janelaEnv : 7;
  const runs = await coletarRuns({ repo, token, janelaDias: janela });
  // Limita a 50 runs mais recentes para o ranking de jobs (1 request HTTP por run).
  const jobs = await coletarJobs(runsNaJanela(runs, { janelaDias: janela }).slice(0, 50), { repo, token });
  const corpo = corpoDoKpi(runs, jobs, { janelaDias: janela });
  console.log(corpo);
  const kpi = gravarKpi(runs, { janelaDias: janela });
  console.log(`docs/ci/kpi.json: ${Object.keys(kpi).length} workflows`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${corpo}\n`);
  if (process.env.PUBLICAR_ISSUE === '0') return;
  const marca = `[kpi-actions] Semana de ${new Date().toISOString().slice(0, 10)}`;
  const r = await publicarIssue({ repo, token, marca, corpo });
  console.log(`issue ${r.acao}: #${r.numero}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((e) => {
    console.error(`::error::${e.message}`);
    process.exit(1);
  });
}
