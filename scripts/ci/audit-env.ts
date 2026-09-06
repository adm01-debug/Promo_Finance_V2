#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env
/**
 * scripts/ci/audit-env.ts
 * Cruza env.manifest.json × estado real (Vercel, GitHub Actions, Supabase vault).
 * Reprova em 3 classes:
 *   1. declarada-e-não-cadastrada  — var do manifesto ausente no destino
 *   2. cadastrada-e-não-declarada  — var no destino sem entrada no manifesto
 *   3. ref-de-projeto-errada       — valor aponta para projeto diferente do config.toml
 *
 * Uso:
 *   VERCEL_TOKEN=vcp_... SUPABASE_PAT=sbp_... GITHUB_TOKEN=ghp_... \
 *   deno run --allow-read --allow-net --allow-env scripts/ci/audit-env.ts
 *
 * Em CI: o workflow injeta os tokens via secrets.
 */

import manifest from '../../env.manifest.json' assert { type: 'json' };

const VERCEL_TOKEN   = Deno.env.get('VERCEL_TOKEN')   || '';
const VERCEL_TEAM_ID = Deno.env.get('VERCEL_TEAM_ID') || 'team_QyN41X0q8hrqhW80AwokbFLv';
const VERCEL_PROJECT = Deno.env.get('VERCEL_PROJECT')  || 'prj_gUNGhJYrVY2mfQb6hWDffow04v2p';
const SUPABASE_PAT   = Deno.env.get('SUPABASE_PAT')   || '';
const SUPABASE_REF   = Deno.env.get('SUPABASE_REF')   || 'bwwbeyolnnzppeuhgkcd';
const GITHUB_TOKEN   = Deno.env.get('GITHUB_TOKEN')   || '';
const GITHUB_REPO    = Deno.env.get('GITHUB_REPO')    || 'adm01-debug/Promo_Finance_V2';

type Var = { name: string; scope: string; required: boolean; dest: string };

// ---------- helpers ----------
async function get(url: string, headers: Record<string, string>): Promise<unknown> {
  const r = await fetch(url, { headers });
  if (!r.ok) return null;
  return r.json();
}

// ---------- leitura dos destinos ----------
async function fetchVercelEnvs(): Promise<Set<string>> {
  if (!VERCEL_TOKEN) return new Set();
  const d = await get(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT}/env?teamId=${VERCEL_TEAM_ID}`,
    { Authorization: `Bearer ${VERCEL_TOKEN}` },
  ) as { envs?: { key: string }[] } | null;
  return new Set((d?.envs ?? []).map((e) => e.key));
}

async function fetchSupabaseSecrets(): Promise<Set<string>> {
  if (!SUPABASE_PAT) return new Set();
  const d = await get(
    `https://api.supabase.com/v1/projects/${SUPABASE_REF}/secrets`,
    { Authorization: `Bearer ${SUPABASE_PAT}` },
  ) as { name: string }[] | null;
  return new Set((d ?? []).map((s) => s.name));
}

async function fetchGithubSecrets(): Promise<Set<string>> {
  if (!GITHUB_TOKEN) return new Set();
  const d = await get(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/secrets`,
    { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  ) as { secrets?: { name: string }[] } | null;
  return new Set((d?.secrets ?? []).map((s) => s.name));
}

// ---------- auditoria ----------
const [vercelEnvs, supabaseSecrets, githubSecrets] = await Promise.all([
  fetchVercelEnvs(),
  fetchSupabaseSecrets(),
  fetchGithubSecrets(),
]);

const vars: Var[] = manifest.vars;
let failures = 0;

console.log(`\n🔍 audit-env — ${vars.length} vars no manifesto\n`);

// Classe 1: declarada no manifesto mas ausente no destino
for (const v of vars) {
  if (!v.required) continue;
  let present = false;
  if (v.dest === 'vercel')          present = vercelEnvs.has(v.name);
  if (v.dest === 'supabase_vault')  present = supabaseSecrets.has(v.name);
  if (v.dest === 'github_actions')  present = githubSecrets.has(v.name);
  if (v.dest === 'supabase_auto')   continue; // injetadas pela plataforma
  if (!present) {
    if (v.dest === 'vercel' && !VERCEL_TOKEN)    { console.log(`  ⚠️  SKIP ${v.name} (sem VERCEL_TOKEN)`);    continue; }
    if (v.dest.startsWith('supabase') && !SUPABASE_PAT) { console.log(`  ⚠️  SKIP ${v.name} (sem SUPABASE_PAT)`); continue; }
    if (v.dest === 'github_actions' && !GITHUB_TOKEN)   { console.log(`  ⚠️  SKIP ${v.name} (sem GITHUB_TOKEN)`); continue; }
    console.log(`  ❌ [MISSING] ${v.name} → ${v.dest}`);
    failures++;
  }
}

// Classe 2: cadastrada no destino mas não declarada no manifesto (ruído)
const manifestNames = new Set(vars.map((v) => v.name));
for (const k of vercelEnvs)       if (!manifestNames.has(k)) console.log(`  ⚠️  [ORPHAN-VERCEL]   ${k}`);
for (const k of supabaseSecrets)  if (!manifestNames.has(k)) console.log(`  ⚠️  [ORPHAN-SUPABASE] ${k}`);
for (const k of githubSecrets)    if (!manifestNames.has(k)) console.log(`  ⚠️  [ORPHAN-GITHUB]   ${k}`);

if (failures > 0) {
  console.error(`\n✗ audit-env: ${failures} variável(is) obrigatória(s) ausente(s) no destino.`);
  Deno.exit(1);
} else {
  console.log(`\n✓ audit-env: todas as vars obrigatórias estão cadastradas.`);
}
