#!/usr/bin/env node
// Porto de Zapp_Web_V2/scripts/edge-deploy/verify-remote.mjs (E74), simplificado
// para o Promo_Finance_V2: o PF não tem deployment-manifest.json, então a
// confirmação de que "a função subiu" é a presença de cada função no inventário
// remoto (`supabase functions list --project-ref ... --output json`) com status
// ACTIVE. Não há digest de bundle — o artefato registra o que foi conferido.
//
// Entrada:
//   --expected <functions-list.json>   {"functions":[{"name":"...", ...}]} gerado pelo migrate-functions.sh
//   --remote <remote-list.json>        saída de `supabase functions list --output json`
//   --git-sha <sha>                    sha deployado (do run)
//   --run-id <runid>                   id do run do GitHub (opcional)
//   --scope <all|fn>                   escopo do deploy (opcional, default all)
//   --output <saida.json>              atestação JSON
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--expected') args.expectedPath = argv[++i];
    else if (key === '--remote') args.remotePath = argv[++i];
    else if (key === '--git-sha') args.gitSha = argv[++i];
    else if (key === '--run-id') args.runId = argv[++i];
    else if (key === '--scope') args.scope = argv[++i];
    else if (key === '--output') args.outputPath = argv[++i];
    else throw new Error(`Argumento desconhecido: ${key}`);
  }
  for (const required of ['expectedPath', 'remotePath', 'gitSha', 'outputPath']) {
    if (!args[required]) throw new Error(`Argumento obrigatório ausente: ${required}`);
  }
  args.scope = args.scope || 'all';
  return args;
}

// Extrai nomes do inventário remoto, tolerando as duas formas do CLI
// (`supabase functions list --output json` pode vir como array de objetos com
// `slug`/`name`, ou como objeto `{ functions: [...] }`).
export function extrairNomesRemotos(entrada) {
  const dado = JSON.parse(entrada);
  const lista = Array.isArray(dado) ? dado : (dado && Array.isArray(dado.functions) ? dado.functions : null);
  if (!lista) return [];
  return lista
    .map((f) => (typeof f === 'string' ? f : (f && (f.slug ?? f.name ?? f.Name))))
    .filter((n) => typeof n === 'string' && n.length > 0);
}

function somenteAtivas(lista) {
  return lista.filter((f) => (typeof f === 'string' ? true : (f.status === 'ACTIVE' || f.status === 'active' || f.status === 'DEPLOYED' || f.status === 'deployed')));
}

export async function runVerifyRemote(args) {
  const expected = JSON.parse(await readFile(args.expectedPath, 'utf8'));
  const remoto = JSON.parse(await readFile(args.remotePath, 'utf8'));
  const esperados = (expected.functions ?? []).map((fn) => fn.name).filter(Boolean);
  const remotosAtivos = somenteAtivas(Array.isArray(remoto) ? remoto : (remoto.functions ?? []));
  const presentes = remotosAtivos.map((f) => (typeof f === 'string' ? f : (f.slug ?? f.name))).filter(Boolean);
  const presentesSet = new Set(presentes);
  const ausentes = esperados.filter((n) => !presentesSet.has(n));
  const atestacao = {
    schema_version: 1,
    project_ref: 'bwwbeyolnnzppeuhgkcd',
    git_sha: args.gitSha,
    github_run_id: args.runId ?? '',
    escopo: args.scope,
    source: 'verify-remote.mjs (sem digest de bundle: PF sem deployment-manifest.json)',
    checked_at: new Date().toISOString(),
    expected_count: esperados.length,
    remote_active_count: presentes.length,
    missing: ausentes,
    verified: ausentes.length === 0,
  };
  await writeFile(args.outputPath, `${JSON.stringify(atestacao, null, 2)}\n`, 'utf8');
  return atestacao;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const atestacao = await runVerifyRemote(args);
  console.log(
    `Remote OK: ${atestacao.expected_count} esperadas, ${atestacao.remote_active_count} ativas no remoto, ` +
    `faltando ${atestacao.missing.length}` + (atestacao.missing.length ? `: ${atestacao.missing.join(', ')}` : ''),
  );
  if (!atestacao.verified) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
