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
 *
 * Executar da raiz do repositório (caminhos relativos ao diretório atual).
 * Testes: node --test scripts/generate-env-manifest.unit.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';

const ARGS = process.argv.slice(2);
if (ARGS.includes('--help') || ARGS.includes('-h')) {
  console.log('Uso: node scripts/generate-env-manifest.mjs [--check]\n  (sem flag) regenera env.manifest.json\n  --check    compara com o arquivo em disco; exit 1 se desatualizado');
  process.exit(0);
}
// Flag desconhecida aborta: um `--chek` digitado errado regenerava o arquivo
// em vez de só comparar.
const desconhecidos = ARGS.filter((a) => a !== '--check');
if (desconhecidos.length) {
  console.error(`✗ Argumento desconhecido: ${desconhecidos.join(' ')} (use --help)`);
  process.exit(2);
}
const CHECK_MODE = ARGS.includes('--check');
for (const dir of ['supabase/functions', '.github/workflows']) {
  if (!existsSync(dir)) {
    console.error(`✗ ${dir} não encontrado — execute a partir da raiz do repositório.`);
    process.exit(1);
  }
}

const EH_TESTE = (nome) => /(?:[._]test|\.spec)\.tsx?$/.test(nome);
const DIR_DE_TESTE = /^(?:__tests__|__mocks__|__fixtures__)$/;
/** Lista recursiva de .ts/.tsx de produção (sem testes, mocks e fixtures). */
function fontes(raiz) {
  const achados = [];
  const stack = [raiz];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of readdirSync(cur, { withFileTypes: true })) {
      const full = `${cur}/${e.name}`;
      if (e.isDirectory()) {
        if (!DIR_DE_TESTE.test(e.name)) stack.push(full);
      } else if (/\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts') && !EH_TESTE(e.name)) {
        achados.push(full);
      }
    }
  }
  return achados.sort();
}

// Frontend vars — lidos de src/config/env.ts (fonte de verdade)
const frontend = [
  { name: 'VITE_SUPABASE_URL',            scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_SUPABASE_PUBLISHABLE_KEY',scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_SUPABASE_PROJECT_ID',     scope: 'frontend', required: true,  dest: 'vercel',   consumers: ['src/config/env.ts'] },
  { name: 'VITE_BLING_CLIENT_ID',         scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/hooks/bling/useOAuth.ts'] },
  { name: 'VITE_VAPID_PUBLIC_KEY',        scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/hooks/useWebPushSubscription.ts'] },
  { name: 'VITE_SENTRY_DSN',              scope: 'frontend', required: false, dest: 'vercel',   consumers: ['src/config/env.ts', 'src/lib/error-tracking.ts'] },
];
// A lista acima é curada (required/consumers). Uma VITE_* lida em src/ e ainda
// não catalogada entra como opcional — sem isso o gate `--check` não acusava
// variável nova de frontend.
if (existsSync('src')) {
  const catalogadas = new Set(frontend.map((v) => v.name));
  const novas = new Map();
  for (const arq of fontes('src')) {
    if (arq.startsWith('src/test/')) continue;
    const t = readFileSync(arq, 'utf8');
    for (const m of t.matchAll(/import\.meta\.env(?:\.|\[\s*['"`])(VITE_[A-Z0-9_]+)/g)) {
      if (catalogadas.has(m[1])) continue;
      if (!novas.has(m[1])) novas.set(m[1], new Set());
      novas.get(m[1]).add(arq);
    }
  }
  for (const name of [...novas.keys()].sort()) {
    frontend.push({ name, scope: 'frontend', required: false, dest: 'vercel', consumers: [...novas.get(name)].sort() });
  }
}

// Edge functions — todo .ts de produção sob supabase/functions/<fn>/ e
// _shared/ (recursivo): helpers ao lado do index.ts (policy.ts, layout.ts,
// handlers aninhados) também leem envs. Arquivos soltos na raiz não são
// implantados e ficam de fora.
const funcsDir = 'supabase/functions';
const edgeSet = new Set();
const LEITURAS_DE_ENV = [
  /Deno\.env\.(?:get|has)\(\s*['"`]([A-Z0-9_]+)['"`]\s*\)/g,
  // deps.getEnv('X') — indireção dos handlers testáveis (n8n-callback,
  // enviar-alerta-email, alertas): mesma leitura de env por outro nome.
  /getEnv\(\s*['"`]([A-Z0-9_]+)['"`]\s*\)/g,
  // runtimeValue(deps.x, 'X') — indireção do mcp-query (valor injetado em
  // teste ou lido do env pelo nome do 2º argumento).
  /runtimeValue\([^,()]*,\s*['"`]([A-Z0-9_]+)['"`]\s*\)/g,
];
for (const e of readdirSync(funcsDir, { withFileTypes: true })) {
  if (!e.isDirectory() || DIR_DE_TESTE.test(e.name)) continue;
  for (const arq of fontes(`${funcsDir}/${e.name}`)) {
    const t = readFileSync(arq, 'utf8');
    for (const re of LEITURAS_DE_ENV) {
      for (const m of t.matchAll(re)) edgeSet.add(m[1]);
    }
  }
}
// Lidos por template `${provider}_WEBHOOK_SECRET` em _shared/webhook-auth.ts
// (resolveSecret tem fallback em integration_secrets — ausência é válida,
// então entram como opcionais). ASAAS_WEBHOOK_SECRET não existe: o webhook
// Asaas consome ASAAS_WEBHOOK_TOKEN, enxergado pelo scan de env.
for (const prov of ['BLING','BITRIX24','WHATSAPP']) edgeSet.add(`${prov}_WEBHOOK_SECRET`);

const autoProvided = new Set([
  'SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL','SUPABASE_JWKS','SUPABASE_PUBLISHABLE_KEYS','SUPABASE_SECRET_KEYS',
]);
// Vars com fallback no código — ausência é estado válido, não config incompleta.
const opcionais = new Set([
  'ALLOWED_ORIGINS',
  // fallback 'alerts@resend.dev' em notify-performance-alert
  'ALERTS_EMAIL_FROM',
  'BLING_WEBHOOK_SECRET',
  'BITRIX24_WEBHOOK_SECRET',
  'WHATSAPP_WEBHOOK_SECRET',
  'EDGE_FUNCTION_NAME',
  'INTEGRACOES_DESATIVADAS',
  'MFA_ADMIN_ENFORCED',
  'NFE_CERT_MASTER_KEY_PREV',
  'SUPABASE_FUNCTION_NAME',
  'CONTADOR_INVITE_SECRET',
  // fallback de CONTADOR_INVITE_SECRET → service role (convidar/validar-token-contador)
  'SUPABASE_JWT_SECRET',
  // compare-schemas (ferramenta dev sem chamador) responde 503 quando ausentes
  'SCHEMA_COMPARE_EXTERNAL_URL',
  'SCHEMA_COMPARE_EXTERNAL_SERVICE_ROLE_KEY',
  'DENO_TESTING',
  'EDGE_SENTRY_DSN',
  'SENTRY_DSN',
  // sentry.ts aplica o fallback `?? 'production'` quando ausente
  'SENTRY_ENVIRONMENT',
]);
const edge = [...edgeSet].sort().map(name => ({
  name, scope: 'edge', required: !autoProvided.has(name) && !opcionais.has(name),
  dest: autoProvided.has(name) ? 'supabase_auto' : 'supabase_vault',
}));

// CI — secrets referenciados em TODOS os workflows do repositório (glob:
// enumerar nomes aqui deixava secrets de workflows novos fora do manifest)
const ciWorkflows = readdirSync('.github/workflows')
  .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  .map((f) => `.github/workflows/${f}`);
const ciSet = new Set();
const ciVarSet = new Set();
for (const wf of ciWorkflows) {
  try {
    const src = readFileSync(wf, 'utf8');
    for (const m of src.matchAll(/secrets\.([A-Z0-9_]+)/g)) {
      // GITHUB_* são providos pelo próprio Actions, não precisam de provisionamento.
      if (m[1].startsWith('GITHUB_')) continue;
      ciSet.add(m[1]);
    }
    // vars.* (variáveis do repositório) também exigem provisionamento manual —
    // sem elas o workflow falha em runtime (ex.: PROD_PROJECT_REF no schema-drift).
    // Vão para ciVarSet: variáveis vivem no endpoint /actions/variables, não em
    // /actions/secrets — destino próprio evita falso MISSING no audit-env.
    for (const m of src.matchAll(/vars\.([A-Z0-9_]+)/g)) {
      ciVarSet.add(m[1]);
    }
  } catch { /* workflow ausente — ignorar */ }
}
// Variáveis que só ativam features opt-in — funcionam ausentes (CI roda sem
// snapshots autenticados e sem simulação em prod), logo não são obrigatórias.
const VARS_OPT_IN = new Set([
  'ENABLE_AUTHENTICATED_VISUAL_SNAPSHOTS',
  'ENABLE_PRODUCTION_SIMULATION_AUDIT',
]);
const porNome = (a, b) => a.localeCompare(b);
const ci = [...ciSet].sort(porNome).map(name => ({ name, scope: 'ci', required: true, dest: 'github_actions' }));
const ciVars = [...ciVarSet].sort(porNome).map(name => ({ name, scope: 'ci', required: !VARS_OPT_IN.has(name), dest: 'github_actions_vars' }));

const freshVars = [...frontend, ...edge, ...ci, ...ciVars];

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
    // Mesmo conjunto de nomes e ainda assim diferente: atributo ou ordem.
    // dest na chave: o mesmo nome pode existir como secret E como variável do Actions.
    const chave = (v) => `${v.scope}:${v.dest}:${v.name}`;
    const emDisco = new Map((existing.vars ?? []).map((v) => [chave(v), JSON.stringify(v)]));
    const alteradas = freshVars.filter((v) => emDisco.has(chave(v)) && emDisco.get(chave(v)) !== JSON.stringify(v));
    if (alteradas.length) console.error('  Vars com atributos alterados:', alteradas.map((v) => v.name).join(', '));
    if (!added.length && !removed.length && !alteradas.length) console.error('  Mesmas vars em ordem diferente (ou duplicadas).');
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
