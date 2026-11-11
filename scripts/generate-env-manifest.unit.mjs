// Testes de scripts/generate-env-manifest.mjs — o gerador roda em subprocesso
// com cwd numa árvore de fixtures (ele resolve tudo relativo ao diretório atual).
//
// Rodar: node --test scripts/generate-env-manifest.unit.mjs

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(RAIZ, 'scripts', 'generate-env-manifest.mjs');

/** Cria uma árvore mínima de repositório; `arquivos` = { caminho: conteúdo }. */
function arvore(arquivos = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pf-env-manifest-'));
  mkdirSync(join(dir, 'supabase/functions'), { recursive: true });
  mkdirSync(join(dir, '.github/workflows'), { recursive: true });
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo);
  }
  return dir;
}

function rodar(dir, ...args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8', timeout: 30_000 });
}

function manifest(dir) {
  return JSON.parse(readFileSync(join(dir, 'env.manifest.json'), 'utf8'));
}

function gerar(arquivos) {
  const dir = arvore(arquivos);
  const r = rodar(dir);
  assert.equal(r.status, 0, r.stderr);
  const m = manifest(dir);
  rmSync(dir, { recursive: true, force: true });
  return m;
}

const nomes = (m, scope) => m.vars.filter((v) => v.scope === scope).map((v) => v.name);
const porNome = (m, name, scope) => m.vars.find((v) => v.name === name && (!scope || v.scope === scope));

const CURADAS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PROJECT_ID',
  'VITE_BLING_CLIENT_ID', 'VITE_VAPID_PUBLIC_KEY', 'VITE_SENTRY_DSN'];
const WEBHOOKS = ['BITRIX24_WEBHOOK_SECRET', 'BLING_WEBHOOK_SECRET', 'WHATSAPP_WEBHOOK_SECRET'];

// --- argumentos -------------------------------------------------------------

test('--help sai 0 sem tocar em disco', () => {
  const dir = arvore();
  for (const flag of ['--help', '-h']) {
    const r = rodar(dir, flag);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Uso: node scripts\/generate-env-manifest\.mjs/);
  }
  assert.equal(existsSync(join(dir, 'env.manifest.json')), false);
  rmSync(dir, { recursive: true, force: true });
});

test('flag desconhecida sai 2 e NÃO regenera o arquivo', () => {
  // Regressão: `--chek` (typo) caía no modo de escrita.
  const dir = arvore();
  for (const args of [['--chek'], ['--check', '--verbose'], ['check']]) {
    const r = rodar(dir, ...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, /Argumento desconhecido/);
  }
  assert.equal(existsSync(join(dir, 'env.manifest.json')), false);
  rmSync(dir, { recursive: true, force: true });
});

test('fora da raiz do repositório falha com mensagem acionável', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pf-env-manifest-vazio-'));
  for (const args of [[], ['--check']]) {
    const r = rodar(dir, ...args);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /execute a partir da raiz do repositório/);
    assert.doesNotMatch(r.stderr, /at .*node:/, 'não deve despejar stack trace');
  }
  assert.equal(existsSync(join(dir, 'env.manifest.json')), false);
  rmSync(dir, { recursive: true, force: true });
});

// --- geração ----------------------------------------------------------------

test('árvore vazia: só as curadas de frontend e os webhook secrets opcionais', () => {
  const m = gerar();
  assert.deepEqual(nomes(m, 'frontend'), CURADAS);
  assert.deepEqual(nomes(m, 'edge'), WEBHOOKS);
  assert.deepEqual(nomes(m, 'ci'), []);
  assert.equal(m.version, '1.1.0');
  assert.match(m.generated, /^\d{4}-\d{2}-\d{2}$/);
  for (const n of WEBHOOKS) assert.equal(porNome(m, n).required, false);
});

test('geração é determinística e termina com quebra de linha', () => {
  const dir = arvore({
    'supabase/functions/b/index.ts': "Deno.env.get('ZETA'); Deno.env.get('ALFA');",
    'supabase/functions/a/index.ts': "Deno.env.get('MEIO');",
    '.github/workflows/z.yml': 'x: ${{ secrets.S_B }} ${{ secrets.S_A }} ${{ vars.V_B }} ${{ vars.V_A }}',
  });
  assert.equal(rodar(dir).status, 0);
  const primeira = readFileSync(join(dir, 'env.manifest.json'), 'utf8');
  assert.equal(rodar(dir).status, 0);
  assert.equal(readFileSync(join(dir, 'env.manifest.json'), 'utf8'), primeira);
  assert.ok(primeira.endsWith('}\n'));
  const m = JSON.parse(primeira);
  assert.deepEqual(nomes(m, 'edge'), ['ALFA', ...WEBHOOKS.slice(0, 2), 'MEIO', 'WHATSAPP_WEBHOOK_SECRET', 'ZETA']);
  assert.deepEqual(m.vars.filter((v) => v.scope === 'ci').map((v) => `${v.dest}:${v.name}`),
    ['github_actions:S_A', 'github_actions:S_B', 'github_actions_vars:V_A', 'github_actions_vars:V_B']);
  rmSync(dir, { recursive: true, force: true });
});

test('edge: formas de leitura reconhecidas', () => {
  const m = gerar({
    'supabase/functions/fn/index.ts': [
      "Deno.env.get('ASPAS_SIMPLES')",
      'Deno.env.get("ASPAS_DUPLAS")',
      'Deno.env.get(`CRASE_LITERAL`)',
      "Deno.env.get( 'COM_ESPACOS' )",
      "Deno.env.has('VIA_HAS')",
      "deps.getEnv('VIA_GETENV')",
      "Deno.env.get('COM_DIGITO_2')",
    ].join('\n'),
  });
  for (const n of ['ASPAS_SIMPLES', 'ASPAS_DUPLAS', 'CRASE_LITERAL', 'COM_ESPACOS', 'VIA_HAS', 'VIA_GETENV', 'COM_DIGITO_2']) {
    assert.ok(porNome(m, n, 'edge'), `${n} não detectada`);
  }
});

test('edge: nome dinâmico, minúsculo ou em escrita não vira variável', () => {
  const m = gerar({
    'supabase/functions/fn/index.ts': [
      'Deno.env.get(`INTERNAL_SECRET_${chave.toUpperCase()}`)',
      'Deno.env.get(nome)',
      "Deno.env.get('minuscula')",
      "Deno.env.set('SO_ESCRITA', '1')",
      "Deno.env.delete('SO_DELETE')",
      'Object.entries(Deno.env.toObject())',
    ].join('\n'),
  });
  assert.deepEqual(nomes(m, 'edge'), WEBHOOKS);
});

test('edge: helper ao lado do index.ts e subpastas também são lidos', () => {
  // Regressão: só <fn>/index.ts era varrido; env lida em policy.ts/layout.ts sumia do manifest.
  const m = gerar({
    'supabase/functions/fn/index.ts': "import './policy.ts';",
    'supabase/functions/fn/policy.ts': "Deno.env.get('SO_NO_HELPER')",
    'supabase/functions/fn/handlers/deep/h.ts': "Deno.env.get('SO_NA_SUBPASTA')",
    'supabase/functions/_shared/sefaz/cliente.ts': "Deno.env.get('SHARED_ANINHADO')",
    'supabase/functions/sem-index/util.ts': "Deno.env.get('FN_SEM_INDEX')",
  });
  for (const n of ['SO_NO_HELPER', 'SO_NA_SUBPASTA', 'SHARED_ANINHADO', 'FN_SEM_INDEX']) {
    assert.ok(porNome(m, n, 'edge'), `${n} não detectada`);
  }
});

test('edge: testes, mocks, fixtures e arquivos soltos na raiz ficam de fora', () => {
  const m = gerar({
    'supabase/functions/fn/index.ts': '// vazio',
    'supabase/functions/fn/index.test.ts': "Deno.env.get('EM_DOT_TEST')",
    'supabase/functions/fn/index_test.ts': "Deno.env.get('EM_UNDERSCORE_TEST')",
    'supabase/functions/fn/__tests__/a.ts': "Deno.env.get('EM_TESTS_DIR')",
    'supabase/functions/fn/__fixtures__/f.ts': "Deno.env.get('EM_FIXTURE')",
    'supabase/functions/_shared/__mocks__/m.ts': "Deno.env.get('EM_MOCK')",
    'supabase/functions/_shared/x_test.ts': "Deno.env.get('EM_SHARED_TEST')",
    'supabase/functions/stress_test.ts': "Deno.env.get('SOLTO_TESTE')",
    'supabase/functions/solto.ts': "Deno.env.get('SOLTO_NA_RAIZ')",
    'supabase/functions/fn/notas.md': "Deno.env.get('EM_MARKDOWN')",
  });
  assert.deepEqual(nomes(m, 'edge'), WEBHOOKS);
});

test('edge: classificação de destino e obrigatoriedade', () => {
  const m = gerar({
    'supabase/functions/fn/index.ts':
      "Deno.env.get('SUPABASE_URL'); Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); Deno.env.get('ALLOWED_ORIGINS'); Deno.env.get('RESEND_API_KEY');",
  });
  assert.deepEqual(porNome(m, 'SUPABASE_URL'), { name: 'SUPABASE_URL', scope: 'edge', required: false, dest: 'supabase_auto' });
  assert.equal(porNome(m, 'SUPABASE_SERVICE_ROLE_KEY').dest, 'supabase_auto');
  assert.deepEqual(porNome(m, 'ALLOWED_ORIGINS'), { name: 'ALLOWED_ORIGINS', scope: 'edge', required: false, dest: 'supabase_vault' });
  assert.deepEqual(porNome(m, 'RESEND_API_KEY'), { name: 'RESEND_API_KEY', scope: 'edge', required: true, dest: 'supabase_vault' });
});

test('ci: secrets e vars de .yml/.yaml; GITHUB_* e outros arquivos ignorados', () => {
  const m = gerar({
    '.github/workflows/a.yml': 'env:\n  A: ${{ secrets.SEGREDO_A }}\n  T: ${{ secrets.GITHUB_TOKEN }}\n  V: ${{ vars.VAR_A }}\n  O: ${{ vars.ENABLE_PRODUCTION_SIMULATION_AUDIT }}\n',
    '.github/workflows/b.yaml': 'if: ${{ secrets.SEGREDO_B != \'\' }}\n',
    '.github/workflows/README.md': '${{ secrets.EM_README }}',
    '.github/workflows/sub/c.yml': '${{ secrets.EM_SUBPASTA }}',
  });
  assert.deepEqual(nomes(m, 'ci'), ['SEGREDO_A', 'SEGREDO_B', 'ENABLE_PRODUCTION_SIMULATION_AUDIT', 'VAR_A']);
  assert.deepEqual(porNome(m, 'SEGREDO_A'), { name: 'SEGREDO_A', scope: 'ci', required: true, dest: 'github_actions' });
  assert.deepEqual(porNome(m, 'VAR_A'), { name: 'VAR_A', scope: 'ci', required: true, dest: 'github_actions_vars' });
  assert.equal(porNome(m, 'ENABLE_PRODUCTION_SIMULATION_AUDIT').required, false);
});

test('mesmo nome em edge e ci aparece nos dois escopos', () => {
  const m = gerar({
    'supabase/functions/fn/index.ts': "Deno.env.get('COMPARTILHADA')",
    '.github/workflows/a.yml': '${{ secrets.COMPARTILHADA }}',
  });
  assert.deepEqual(m.vars.filter((v) => v.name === 'COMPARTILHADA').map((v) => v.scope), ['edge', 'ci']);
});

test('frontend: VITE_* nova em src/ entra como opcional com consumidores', () => {
  // Regressão: a lista de frontend era só a curada — variável nova passava pelo gate.
  const m = gerar({
    'src/lib/b.ts': 'const x = import.meta.env.VITE_NOVA_FLAG;\nconst u = import.meta.env.VITE_SUPABASE_URL;',
    'src/a/c.tsx': "const y = import.meta.env['VITE_NOVA_FLAG'];\nconst z = import.meta.env[\"VITE_OUTRA\"];",
    'src/lib/b.test.ts': 'import.meta.env.VITE_SO_EM_TESTE',
    'src/lib/__tests__/d.ts': 'import.meta.env.VITE_SO_EM_TESTS_DIR',
    'src/test/setup.ts': 'import.meta.env.VITE_SO_EM_SETUP',
    'src/vite-env.d.ts': 'interface ImportMetaEnv { readonly VITE_SO_NO_TIPO: string }',
    'src/lib/e.ts': 'const modo = import.meta.env.MODE; const dev = import.meta.env.DEV;',
  });
  assert.deepEqual(nomes(m, 'frontend'), [...CURADAS, 'VITE_NOVA_FLAG', 'VITE_OUTRA']);
  assert.deepEqual(porNome(m, 'VITE_NOVA_FLAG'),
    { name: 'VITE_NOVA_FLAG', scope: 'frontend', required: false, dest: 'vercel', consumers: ['src/a/c.tsx', 'src/lib/b.ts'] });
  assert.deepEqual(porNome(m, 'VITE_SUPABASE_URL').consumers, ['src/config/env.ts']);
});

// --- --check ----------------------------------------------------------------

function comManifest(arquivos, mutar) {
  const dir = arvore(arquivos);
  assert.equal(rodar(dir).status, 0);
  if (mutar) {
    const m = manifest(dir);
    mutar(m, dir);
    if (existsSync(join(dir, 'env.manifest.json'))) writeFileSync(join(dir, 'env.manifest.json'), JSON.stringify(m, null, 2) + '\n');
  }
  return dir;
}

const BASE = { 'supabase/functions/fn/index.ts': "Deno.env.get('ATUAL')", '.github/workflows/a.yml': '${{ secrets.S }}' };

test('--check em dia sai 0, ignora `generated` e não escreve', () => {
  const dir = comManifest(BASE, (m) => { m.generated = '1999-01-01'; });
  const antes = readFileSync(join(dir, 'env.manifest.json'), 'utf8');
  const r = rodar(dir, '--check');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /em dia/);
  assert.equal(readFileSync(join(dir, 'env.manifest.json'), 'utf8'), antes);
  rmSync(dir, { recursive: true, force: true });
});

test('--check acusa variável nova e não reescreve o arquivo', () => {
  const dir = comManifest(BASE);
  writeFileSync(join(dir, 'supabase/functions/fn/extra.ts'), "Deno.env.get('RECEM_CRIADA')");
  const antes = readFileSync(join(dir, 'env.manifest.json'), 'utf8');
  const r = rodar(dir, '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /desatualizado/);
  assert.match(r.stderr, /Novas vars não registradas: RECEM_CRIADA/);
  assert.equal(readFileSync(join(dir, 'env.manifest.json'), 'utf8'), antes);
  rmSync(dir, { recursive: true, force: true });
});

test('--check acusa variável removida do código', () => {
  const dir = comManifest(BASE);
  writeFileSync(join(dir, 'supabase/functions/fn/index.ts'), '// sem env');
  const r = rodar(dir, '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Vars removidas do código: ATUAL/);
  rmSync(dir, { recursive: true, force: true });
});

test('--check acusa atributo editado à mão e ordem trocada', () => {
  let dir = comManifest(BASE, (m) => { m.vars.find((v) => v.name === 'ATUAL').required = false; });
  let r = rodar(dir, '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Vars com atributos alterados: ATUAL/);
  rmSync(dir, { recursive: true, force: true });

  dir = comManifest(BASE, (m) => { m.vars.reverse(); });
  r = rodar(dir, '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ordem diferente/);
  rmSync(dir, { recursive: true, force: true });
});

test('--check com manifest ausente, inválido ou sem `vars` sai 1', () => {
  let dir = comManifest(BASE, (_m, d) => rmSync(join(d, 'env.manifest.json')));
  let r = rodar(dir, '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /não encontrado/);
  writeFileSync(join(dir, 'env.manifest.json'), '{ isto não é json');
  assert.equal(rodar(dir, '--check').status, 1);
  writeFileSync(join(dir, 'env.manifest.json'), '{}');
  r = rodar(dir, '--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Novas vars não registradas/);
  rmSync(dir, { recursive: true, force: true });
});

test('fluxo do CI: --check falha → regenera → --check passa', () => {
  const dir = comManifest(BASE);
  writeFileSync(join(dir, '.github/workflows/novo.yml'), '${{ secrets.NOVO_SEGREDO }} ${{ vars.NOVA_VAR }}');
  assert.equal(rodar(dir, '--check').status, 1);
  assert.equal(rodar(dir).status, 0);
  assert.equal(rodar(dir, '--check').status, 0);
  assert.ok(porNome(manifest(dir), 'NOVO_SEGREDO', 'ci'));
  rmSync(dir, { recursive: true, force: true });
});

// --- repositório real -------------------------------------------------------

test('env.manifest.json do repositório está em dia (mesmo gate do ci.yml)', () => {
  const r = rodar(RAIZ, '--check');
  assert.equal(r.status, 0, r.stderr);
});

test('manifest do repositório: curadas presentes e nenhuma entrada duplicada', () => {
  const m = JSON.parse(readFileSync(join(RAIZ, 'env.manifest.json'), 'utf8'));
  const frontend = nomes(m, 'frontend');
  for (const n of CURADAS) assert.ok(frontend.includes(n), `${n} ausente`);
  assert.equal(new Set(m.vars.map((v) => `${v.scope}:${v.dest}:${v.name}`)).size, m.vars.length, 'entrada duplicada');
});
