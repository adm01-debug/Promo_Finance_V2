#!/usr/bin/env node
/**
 * scripts/generate-env-manifest.mjs
 * Gera env.manifest.json a partir das fontes reais (env.ts + edge functions + ci.yml).
 * Rodar após adicionar/remover qualquer variável de ambiente.
 * O manifesto gerado é a fonte autoritativa para o audit-env.ts e para o assertSupabaseEnv.
 *
 * Modos:
 *   node scripts/generate-env-manifest.mjs           — regenera em disco (atualiza `generated`)
 *   node scripts/generate-env-manifest.mjs --check   — compara com o arquivo em disco;
 *     exit 0 se as variáveis batem, exit 1 se diferirem (ignora o campo `generated`)
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';

const CHECK_MODE = process.argv.includes('--check');

// Frontend vars — lidos de src/config/env.ts (fonte de verdade)
const frontend = [
  { name: 'VITE_SUPABASE_URL',            scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_SUPABASE_PUBLISHABLE_KEY',scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_SUPABASE_PROJECT_ID',     scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_BLING_CLIENT_ID',         scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/hooks/bling/useOAuth.ts'] },
  { name: 'VITE_VAPID_PUBLIC_KEY',        scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/hooks/useWebPushSubscription.ts'] },
  { name: 'VITE_SENTRY_DSN',              scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/config/env.ts', 'src/lib/error-tracking.ts'] },
];

// Edge functions — extrair Deno.env.get de supabase/functions/*/index.ts
const funcsDir = 'supabase/functions';
const edgeSet = new Set();
for (const dir of readdirSync(funcsDir)) {
  if (dir === '_shared') {
    // Scan _shared/*.ts (exceto arquivos _test.ts) — contém helpers usados por todas as funções
    try {
      for (const f of readdirSync(`${funcsDir}/_shared`)) {
        if (!f.endsWith('.ts') || f.endsWith('_test.ts')) continue;
        const t = readFileSync(`${funcsDir}/_shared/${f}`, 'utf8');
        for (const m of t.matchAll(/Deno\.env\.get\(['"]([A-Z0-9_]+)['"]\)/g)) edgeSet.add(m[1]);
      }
    } catch { /* _shared ausente */ }
    continue;
  }
  try {
    const t = readFileSync(`${funcsDir}/${dir}/index.ts`, 'utf8');
    for (const m of t.matchAll(/Deno\.env\.get\(['"]([A-Z0-9_]+)['"]\)/g)) edgeSet.add(m[1]);
  } catch { /* pasta sem index.ts */ }
}
const autoProvided = new Set([
  'SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL','SUPABASE_JWKS','SUPABASE_PUBLISHABLE_KEYS','SUPABASE_SECRET_KEYS',
]);
// Vars com fallback no código — ausência é estado válido, não config incompleta.
const opcionais = new Set([
  'ALLOWED_ORIGINS',
  'EDGE_FUNCTION_NAME',
  'MFA_ADMIN_ENFORCED',
  'SUPABASE_FUNCTION_NAME',
]);
const edge = [...edgeSet].sort().map(name => ({
  name, scope: 'edge', required: !autoProvided.has(name) && !opcionais.has(name),
  dest: autoProvided.has(name) ? 'supabase_auto' : 'supabase_vault',
}));

// CI — secrets referenciados em todos os workflows do repositório
const ciWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/supabase-linter.yml',
];
const ciSet = new Set();
for (const wf of ciWorkflows) {
  try {
    const src = readFileSync(wf, 'utf8');
    for (const m of src.matchAll(/secrets\.([A-Z0-9_]+)/g)) ciSet.add(m[1]);
  } catch { /* workflow ausente — ignorar */ }
}
const ci = [...ciSet].sort().map(name => ({ name, scope: 'ci', required: true, dest: 'github_actions' }));

const freshVars = [...frontend, ...edge, ...ci];

if (CHECK_MODE) {
  let existing;
  try {
    existing = JSON.parse(readFileSync('env.manifest.json', 'utf8'));
  } catch {
    console.error('✗ env.manifest.json não encontrado — execute sem --check para gerar.');
    process.exit(1);
  }
  // Compara apenas `vars` (ignora `generated` que muda com a data de execução)
  const onDisk = JSON.stringify(existing.vars ?? []);
  const inMemory = JSON.stringify(freshVars);
  if (onDisk === inMemory) {
    console.log('✓ env.manifest.json em dia (vars sem alteração).');
    process.exit(0);
  } else {
    console.error('✗ env.manifest.json desatualizado — execute: node scripts/generate-env-manifest.mjs');
    const diskNames = (existing.vars ?? []).map(v => v.name);
    const freshNames = freshVars.map(v => v.name);
    const added = freshNames.filter(n => !diskNames.includes(n));
    const removed = diskNames.filter(n => !freshNames.includes(n));
    if (added.length) console.error('  Novas vars não registradas:', added.join(', '));
    if (removed.length) console.error('  Vars removidas do código:', removed.join(', '));
    process.exit(1);
  }
}

const manifest = {
  generated: new Date().toISOString().split('T')[0],
  version: '1.1.0',
  description: 'Inventário autoritativo de variáveis de ambiente. NÃO editar manualmente — execute: node scripts/generate-env-manifest.mjs',
  vars: freshVars,
};

writeFileSync('env.manifest.json', JSON.stringify(manifest, null, 2) + '\n');
const byScope = Object.fromEntries(['frontend','edge','ci'].map(s => [s, manifest.vars.filter(v => v.scope === s).length]));
console.log(`✓ env.manifest.json gerado: ${manifest.vars.length} vars ${JSON.stringify(byScope)}`);
