#!/usr/bin/env node
/**
 * scripts/generate-env-manifest.mjs
 * Gera env.manifest.json a partir das fontes reais (env.ts + edge functions + ci.yml).
 * Rodar após adicionar/remover qualquer variável de ambiente.
 * O manifesto gerado é a fonte autoritativa para o audit-env.ts e para o assertSupabaseEnv.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';

// Frontend vars — lidos de src/config/env.ts (fonte de verdade)
const frontend = [
  { name: 'VITE_SUPABASE_URL',            scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_SUPABASE_PUBLISHABLE_KEY',scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_SUPABASE_PROJECT_ID',     scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_BLING_CLIENT_ID',         scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/hooks/bling/useOAuth.ts'] },
  { name: 'VITE_VAPID_PUBLIC_KEY',        scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/hooks/useWebPushSubscription.ts'] },
];

// Edge functions — extrair Deno.env.get de supabase/functions/*/index.ts
const funcsDir = 'supabase/functions';
const edgeSet = new Set();
for (const dir of readdirSync(funcsDir)) {
  if (dir === '_shared') continue;
  try {
    const t = readFileSync(`${funcsDir}/${dir}/index.ts`, 'utf8');
    for (const m of t.matchAll(/Deno\.env\.get\(['"]([A-Z0-9_]+)['"]/g)) edgeSet.add(m[1]);
  } catch { /* pasta sem index.ts */ }
}
const autoProvided = new Set([
  'SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL','SUPABASE_JWKS','SUPABASE_PUBLISHABLE_KEYS','SUPABASE_SECRET_KEYS',
]);
const edge = [...edgeSet].sort().map(name => ({
  name, scope: 'edge', required: !autoProvided.has(name),
  dest: autoProvided.has(name) ? 'supabase_auto' : 'supabase_vault',
}));

// CI — secrets referenciados no ci.yml
const ciYml = readFileSync('.github/workflows/ci.yml', 'utf8');
const ciSet = new Set([...ciYml.matchAll(/secrets\.([A-Z0-9_]+)/g)].map(m => m[1]));
const ci = [...ciSet].sort().map(name => ({ name, scope: 'ci', required: true, dest: 'github_actions' }));

const manifest = {
  generated: new Date().toISOString().split('T')[0],
  version: '1.1.0',
  description: 'Inventário autoritativo de variáveis de ambiente. NÃO editar manualmente — execute: node scripts/generate-env-manifest.mjs',
  vars: [...frontend, ...edge, ...ci],
};

writeFileSync('env.manifest.json', JSON.stringify(manifest, null, 2) + '\n');
const byScope = Object.fromEntries(['frontend','edge','ci'].map(s => [s, manifest.vars.filter(v => v.scope === s).length]));
console.log(`✓ env.manifest.json gerado: ${manifest.vars.length} vars ${JSON.stringify(byScope)}`);
