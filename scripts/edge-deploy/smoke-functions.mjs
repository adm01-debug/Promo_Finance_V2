#!/usr/bin/env node
// Porto de Zapp_Web_V2/scripts/edge-deploy/smoke-functions.mjs (W61), adaptado
// ao Promo_Finance_V2: sem manifest (o PF não tem deployment-manifest.json) — a
// lista de funções vem de um JSON plano gerado pelo migrate-functions.sh e o
// contrato verify_jwt vem do supabase/config.toml (falha crítica ao estar
// ausente, igual ao fail-closed do deploy). As origens canônicas vêm de
// allowed-origins.json, espelhando ORIGENS_PADRAO do _shared/cors.ts.
//
// O smoke é não-mutante: preflight CORS (positivo e negativo) + gateway anonymous
// (POST sem JWT → 401) apenas nas funções com verify_jwt=true. Webhooks/cron
// públicos (verify_jwt=false) NUNCA recebem requisição de negócio.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const _require = createRequire(import.meta.url);
const _allowedOriginsConfig = _require('./allowed-origins.json');
const CANONICAL_ORIGINS = _allowedOriginsConfig.exact;
const DEFAULT_ALLOWED_ORIGIN = CANONICAL_ORIGINS[0]; // fallback para o smoke
const DEFAULT_DENIED_ORIGIN = _allowedOriginsConfig.denied_example ?? 'https://edge-smoke.invalid';

const CAMINHO_DIR = fileURLToPath(new URL('.', import.meta.url));

function parseArgs(argv) {
  const args = {
    concurrency: 8,
    retries: 3,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--base-url') args.baseUrl = argv[++index];
    else if (key === '--output') args.outputPath = argv[++index];
    else if (key === '--git-sha') args.gitSha = argv[++index];
    else if (key === '--run-id') args.runId = argv[++index];
    else if (key === '--config-toml') args.configToml = argv[++index];
    else if (key === '--functions-list') args.functionsListPath = argv[++index];
    else if (key === '--concurrency') args.concurrency = Number(argv[++index]);
    else if (key === '--retries') args.retries = Number(argv[++index]);
    else throw new Error(`Argumento desconhecido: ${key}`);
  }
  for (const required of ['baseUrl', 'outputPath', 'gitSha', 'runId']) {
    if (!args[required]) throw new Error(`Argumento obrigatório ausente: ${required}`);
  }
  if (!args.configToml) args.configToml = path.join(CAMINHO_DIR, '../../supabase/config.toml');
  if (!args.functionsListPath) {
    throw new Error('Argumento obrigatório ausente: --functions-list (JSON plano com { functions: [{ name, verify_jwt }] })');
  }
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1 || args.concurrency > 20) {
    throw new Error('concurrency precisa ser inteiro entre 1 e 20');
  }
  if (!Number.isInteger(args.retries) || args.retries < 1 || args.retries > 5) {
    throw new Error('retries precisa ser inteiro entre 1 e 5');
  }
  return args;
}

async function lerFuncoes(args) {
  const lista = JSON.parse(await readFile(args.functionsListPath, 'utf8'));
  const fns = (lista.functions ?? []).map((fn) => ({ name: fn.name, verify_jwt: Boolean(fn.verify_jwt) }));
  // contato verify_jwt do config.toml: bloco [functions.<nome>] com verify_jwt =...
  const toml = await readFile(args.configToml, 'utf8');
  const porNome = new Map();
  const reBloco = /^\[functions\.([^\]]+)\]$/;
  const reJwt = /^\s*verify_jwt\s*=\s*"?([a-z0-9_]+)"?\s*$/i;
  let atual = null;
  let valorJwt = null;
  const reiniciar = () => { atual = null; valorJwt = null; };
  for (const linha of toml.split(/\r?\n/)) {
    const chegaBloco = linha.match(reBloco);
    if (chegaBloco) {
      if (atual && valorJwt !== null) porNome.set(atual, valorJwt);
      reiniciar();
      atual = chegaBloco[1].trim();
      continue;
    }
    if (atual && /^\s*\[/.test(linha)) { reiniciar(); continue; }
    if (atual) {
      const jwt = linha.match(reJwt);
      if (jwt) valorJwt = jwt[1];
    }
  }
  if (atual && valorJwt !== null) porNome.set(atual, valorJwt);

  const resultado = fns.map((fn) => {
    const vjwt = porNome.get(fn.name) ?? porNome.get(`'${fn.name}'`) ?? porNome.get(`"${fn.name}"`);
    if (vjwt === undefined || vjwt === null) {
      // fail-closed: ausência de bloco no config.toml impede smoke de prosseguir,
      // igual ao fail-closed do deploy em massa.
      throw new Error(`verify_jwt ausente no config.toml para a função "${fn.name}" — recusado`);
    }
    return { name: fn.name, verify_jwt: vjwt === 'true' };
  });
  return resultado;
}

async function fetchWithRetry(url, init, { retries, expectedStatuses, fetchImpl }) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(20_000) });
      if (expectedStatuses.includes(response.status)) return response;
      lastError = new Error(`HTTP inesperado ${response.status}`);
      if (response.status < 500) return response;
    } catch (error) {
      lastError = error;
    }
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw lastError;
}

export async function smokeFunction({ fn, baseUrl, retries, allowedOrigins = CANONICAL_ORIGINS, fetchImpl = fetch }) {
  const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(fn.name)}`;
  try {
    // Preflight CORS positivo para cada origem canônica; o negativo não pode
    // refletir origem não confiável nem devolver `*`.
    const originChecks = [];
    for (const origin of allowedOrigins) {
      const allowed = await fetchWithRetry(url, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      }, { retries, expectedStatuses: [200, 204], fetchImpl });
      const returnedOrigin = allowed.headers.get('access-control-allow-origin');
      originChecks.push({ origin, status: allowed.status, allow_origin: returnedOrigin, passed: [200, 204].includes(allowed.status) && returnedOrigin === origin });
    }
    const availabilityOk = originChecks.every((c) => c.passed);
    const allowedOrigin = originChecks[0]?.allow_origin;

    const denied = await fetchWithRetry(url, {
      method: 'OPTIONS',
      headers: {
        Origin: DEFAULT_DENIED_ORIGIN,
        'Access-Control-Request-Method': 'POST',
      },
    }, { retries, expectedStatuses: [200, 204], fetchImpl });
    const deniedOrigin = denied.headers.get('access-control-allow-origin');
    const corsDenialOk = [200, 204].includes(denied.status) &&
      deniedOrigin !== DEFAULT_DENIED_ORIGIN && deniedOrigin !== '*';

    let anonymousGateway = null;
    if (fn.verify_jwt) {
      const anonymous = await fetchWithRetry(url, {
        method: 'POST',
        headers: { Origin: DEFAULT_ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
        body: '{}',
      }, { retries, expectedStatuses: [401], fetchImpl });
      anonymousGateway = { status: anonymous.status, passed: anonymous.status === 401 };
    }

    const passed = availabilityOk && corsDenialOk && (anonymousGateway?.passed ?? true);
    return {
      name: fn.name,
      verify_jwt: fn.verify_jwt,
      passed,
      checks: {
        availability: { status: originChecks[0]?.status ?? 200, allow_origin: allowedOrigin, passed: availabilityOk },
        canonical_origins: originChecks,
        denied_origin: { status: denied.status, allow_origin: deniedOrigin, passed: corsDenialOk },
        anonymous_gateway: anonymousGateway,
      },
    };
  } catch (error) {
    return {
      name: fn.name,
      verify_jwt: fn.verify_jwt,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

export async function runSmokeSuite(args) {
  const fns = await lerFuncoes(args);
  const results = await runPool(
    fns,
    args.concurrency,
    (fn) => smokeFunction({ fn, baseUrl: args.baseUrl, retries: args.retries }),
  );
  const passed = results.filter((result) => result.passed).length;
  const evidence = {
    schema_version: 1,
    project_ref: 'bwwbeyolnnzppeuhgkcd',
    git_sha: args.gitSha,
    github_run_id: String(args.runId),
    created_at: new Date().toISOString(),
    source: 'migrate-functions.sh (functions-list.jsonl + config.toml)',
    summary: { total: results.length, passed, failed: results.length - passed },
    results,
  };
  await writeFile(args.outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return evidence;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evidence = await runSmokeSuite(args);
  for (const result of evidence.results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
  }
  console.log(
    `Edge smoke: ${evidence.summary.passed}/${evidence.summary.total} passed; ` +
    `${evidence.summary.failed} failed`,
  );
  if (evidence.summary.failed > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
