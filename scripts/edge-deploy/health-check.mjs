#!/usr/bin/env node
// Porto de Zapp_Web_V2/scripts/edge-deploy/health-check.mjs (W65), adaptado ao
// Promo_Finance_V2 (project ref canônico e escopo via lista plana, sem manifest).
// Pós-deploy health check — consulta logs de erro pela Management API e falha
// com ::error:: se a taxa de 5xx superar o limiar. Degradação controlada: falha
// de transporte ou API indisponível → ::warning::, nunca ::error:: — o check não
// pode derrubar deploys por indisponibilidade de observabilidade.
import { readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CANONICAL_PROJECT = 'bwwbeyolnnzppeuhgkcd';
const MGMT_BASE = 'https://api.supabase.com';
const DEFAULT_THRESHOLD = 0.10; // 10% de 5xx = falha
const DEFAULT_WAIT_MS = 5 * 60 * 1000; // 5 min
const WINDOW_MINUTES = 5;
// Slug de edge function. O que não tiver esta forma não entra na SQL de analytics.
const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

// Valor de flag: ausente (fim do argv) ou outra flag no lugar é erro de uso.
function valorDe(argv, i) {
  const v = argv[i + 1];
  if (v === undefined || v.startsWith('--')) throw new Error(`${argv[i]} exige um valor`);
  return v;
}

export function parseArgs(argv) {
  const args = {
    threshold: DEFAULT_THRESHOLD,
    waitMs: DEFAULT_WAIT_MS,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--project-ref') args.projectRef = valorDe(argv, i++);
    else if (argv[i] === '--scope') args.scope = valorDe(argv, i++);
    else if (argv[i] === '--threshold') args.threshold = Number(valorDe(argv, i++));
    else if (argv[i] === '--wait-ms') args.waitMs = Number(valorDe(argv, i++));
    else if (argv[i] === '--no-wait') args.waitMs = 0;
    else if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--functions-list') args.functionsListPath = valorDe(argv, i++);
    else throw new Error(`Argumento desconhecido: ${argv[i]}`);
  }
  if (!args.projectRef) throw new Error('--project-ref obrigatório');
  if (args.projectRef !== CANONICAL_PROJECT) throw new Error('Apenas o projeto canônico é aceito');
  // Limiar NaN (ou "10" querendo dizer 10%) tornava `taxa > limiar` sempre falso:
  // o check respondia "OK" com qualquer taxa de erro.
  if (!Number.isFinite(args.threshold) || args.threshold < 0 || args.threshold > 1) {
    throw new Error('--threshold precisa ser uma fração entre 0 e 1 (ex.: 0.10 = 10%)');
  }
  if (!Number.isInteger(args.waitMs) || args.waitMs < 0) {
    throw new Error('--wait-ms precisa ser inteiro >= 0');
  }
  return args;
}

// Retorna lista de slugs a verificar: escopo "all" → todas as funções da lista
// plana (gerada pelo migrate-functions.sh); caso contrário, só a função nomeada.
export async function resolveScope(scope, functionsListPath) {
  if (scope && scope !== 'all') return [scope];
  if (functionsListPath) {
    const raw = JSON.parse(await readFile(functionsListPath, 'utf8'));
    return (raw.functions ?? []).map((fn) => fn.name).filter(Boolean);
  }
  return [];
}

// Monta a SQL de análise de logs de edge para a janela configurada.
// A API de analytics do Supabase usa BigQuery-flavored SQL contra a tabela
// `edge_logs`. O campo de status HTTP fica em metadata[offset(0)].response.statusCode
// (array UNNEST necessário porque metadata é REPEATED).
export function buildLogsSql(slugs, windowMinutes) {
  // Os slugs vêm de argumento/arquivo e entram entre aspas simples na SQL.
  const invalido = slugs.find((s) => typeof s !== 'string' || !SLUG.test(s));
  if (invalido !== undefined) throw new Error(`slug de função inválido para a consulta: ${JSON.stringify(invalido)}`);
  const slugFilter = slugs.length > 0
    ? `AND m.function IN (${slugs.map((s) => `'${s}'`).join(', ')})`
    : '';
  return (
    `SELECT ` +
    `  COUNT(1) AS total, ` +
    `  COUNTIF(CAST(m.response.statusCode AS INT64) >= 500) AS errors ` +
    `FROM edge_logs ` +
    `  CROSS JOIN UNNEST(metadata) AS m ` +
    `WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${windowMinutes} MINUTE) ` +
    slugFilter
  ).trim();
}

// Chama a Management API de analytics do Supabase.
// Lança se o HTTP não for 2xx; devolve null se a resposta não tiver linhas.
export async function queryAnalytics({ projectRef, token, sql, fetchImpl = fetch, timeoutMs = 30_000 }) {
  const url = `${MGMT_BASE}/v1/projects/${projectRef}/analytics/endpoints/logs.all`;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
    // A requisição carrega o token: redirect vira falha (→ warning), não é seguido.
    redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    // Não logar o corpo da resposta: pode conter detalhes de autenticação.
    throw new Error(`Management API retornou HTTP ${res.status} na consulta de analytics`);
  }
  const json = await res.json();
  if (json === null || typeof json !== 'object') throw new Error('Management API devolveu corpo inesperado na consulta de analytics');
  // 2xx com `error` preenchido é consulta recusada, não "sem logs".
  if (json.error) throw new Error('Management API devolveu erro na consulta de analytics');
  // A API retorna { result: [{ total: N, errors: N }] } quando bem-sucedida.
  if (!Array.isArray(json.result) || json.result.length === 0) return null;
  return json.result[0];
}

/** Devolve o exit code: 1 só quando a taxa de 5xx MEDIDA supera o limiar; no resto, 0. */
export async function main(argv = process.argv.slice(2), { fetchImpl = fetch, env = process.env } = {}) {
  const args = parseArgs(argv);
  const token = env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error('::warning::SUPABASE_ACCESS_TOKEN ausente — health check ignorado');
    return 0;
  }

  const slugs = await resolveScope(args.scope, args.functionsListPath);
  const nomeScope = args.scope || 'all';

  if (args.dryRun) {
    console.log(`[health-check] Ensaio — escopo: ${nomeScope}; funções: ${slugs.length || '(todas)'}`);
    console.log('[health-check] Dry run: sem espera e sem chamada à API.');
    return 0;
  }

  if (args.waitMs > 0) {
    const minutos = Math.round(args.waitMs / 60_000);
    console.log(`[health-check] Aguardando ${minutos} min para os logs de pós-deploy estabilizarem…`);
    await new Promise((resolve) => setTimeout(resolve, args.waitMs));
  }

  const sql = buildLogsSql(slugs, WINDOW_MINUTES);
  let row;
  try {
    row = await queryAnalytics({
      projectRef: args.projectRef,
      token,
      sql,
      fetchImpl,
    });
  } catch (err) {
    // Falha de transporte ou API indisponível → warning, não bloqueia o deploy.
    console.error(`::warning::Health check falhou ao consultar a Management API: ${err.message}. Prosseguindo.`);
    return 0;
  }

  if (row === null) {
    console.log('[health-check] Nenhum log na janela de observação — sem invocações recentes ou logs ainda não propagados.');
    return 0;
  }

  const total = Number(row?.total ?? 0);
  const errors = Number(row?.errors ?? 0);

  // Contagem não numérica virava NaN, e `NaN > limiar` é falso: saía "OK" sem ter medido nada.
  if (!Number.isFinite(total) || !Number.isFinite(errors) || total < 0 || errors < 0) {
    console.error('::warning::Health check recebeu contagens inválidas da Management API — taxa de erro não medida. Prosseguindo.');
    return 0;
  }

  if (total === 0) {
    console.log('[health-check] Zero invocações na janela — sem tráfego suficiente para medir taxa de erro.');
    return 0;
  }

  const errorRate = errors / total;
  const pct = (errorRate * 100).toFixed(1);
  console.log(`[health-check] Escopo: ${nomeScope} | invocações: ${total} | erros 5xx: ${errors} | taxa: ${pct}%`);

  if (errorRate > args.threshold) {
    const limiar = (args.threshold * 100).toFixed(0);
    console.error(
      `::error::Health check FALHOU — taxa de 5xx (${pct}%) supera o limiar de ${limiar}% ` +
        `nas últimas ${WINDOW_MINUTES} min. Verifique os logs da função e considere o rollback.`
    );
    return 1;
  }
  console.log(`[health-check] OK — taxa de 5xx (${pct}%) dentro do limiar.`);
  return 0;
}

// Só roda quando é o script invocado: importar o módulo (teste) não consulta nada.
function invocadoDireto() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (invocadoDireto()) {
  main()
    .then((codigo) => {
      process.exitCode = codigo;
    })
    .catch((err) => {
      console.error(`::warning::health-check.mjs falhou inesperadamente: ${err.message}. Prosseguindo.`);
    });
}
