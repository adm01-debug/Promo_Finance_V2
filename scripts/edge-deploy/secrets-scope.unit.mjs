// Porto de Zapp_Web_V2/scripts/edge-deploy/secrets-scope.unit.mjs, adaptado ao
// Promo_Finance_V2: escopo = nomes required do env.manifest.json (mesma fonte
// do gate do migrate-functions.sh), SEM escrita em secrets real — a decisão é
// pura (decidirReescrita) e roda com dry-run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { decidirReescrita, extrairNomesDeSecrets, nomesDeSecretsParaEscopo } from './secrets-scope.mjs';

const RAZA0 = dirname(fileURLToPath(import.meta.url));
const MANIFEST = resolve(RAZA0, '../../env.manifest.json');

test('1. dry-run nunca reescreve (mesmo com divergência)', () => {
  const d = decidirReescrita({ emEnsaio: true, rotateSecrets: true, nomesRemotos: ['A'], nomesEsperados: ['A', 'B'] });
  assert.equal(d.reescrever, false);
  assert.match(d.motivo, /ensaio/);
});

test('2. rollback nunca reescreve', () => {
  const d = decidirReescrita({ emRollback: true, nomesRemotos: ['A'], nomesEsperados: ['A'] });
  assert.equal(d.reescrever, false);
});

test('3. divergência detectada => reescreve e aponta o ausente', () => {
  const d = decidirReescrita({ nomesRemotos: ['A', 'C'], nomesEsperados: ['A', 'B', 'C'] });
  assert.equal(d.reescrever, true);
  assert.match(d.motivo, /B/);
});

test('4. escopo íntegro => não reescreve', () => {
  const d = decidirReescrita({ nomesRemotos: ['A', 'B'], nomesEsperados: ['A', 'B'] });
  assert.equal(d.reescrever, false);
});

test('5. leitura remota falhou (null) => fail-closed: não lê, não reescreve, marca erro fatal', () => {
  const d = decidirReescrita({ nomesRemotos: null, nomesEsperados: ['A'] });
  assert.equal(d.reescrever, false);
  assert.equal(d.erroFatal, true);
});

test('6. extrairNomesDeSecrets aceita array com name e tabela texto NAME/DIGEST', () => {
  assert.deepEqual(extrairNomesDeSecrets('{"secrets": [{"name": "A_API_KEY"}, {"name": "B_TOKEN"}]}'), ['A_API_KEY', 'B_TOKEN']);
  assert.deepEqual(extrairNomesDeSecrets('NAME DIGEST\nA_API_KEY sha256:\nB_TOKEN sha256:\n'), ['A_API_KEY', 'B_TOKEN']);
  assert.equal(extrairNomesDeSecrets(''), null);
  assert.equal(extrairNomesDeSecrets('nao é json nem tabela'), null);
});

test('7. manifest real do PF: nomes required lidos, SUPABASE_* excluído, sem vazios', () => {
  const nomes = nomesDeSecretsParaEscopo('x', MANIFEST);
  assert.ok(nomes.length >= 30, `esperado >=30 secrets required, veio ${nomes.length}`);
  assert.ok(nomes.every((n) => n.trim().length > 0 && !n.startsWith('SUPABASE_')));
  assert.ok(nomes.includes('OPENAI_API_KEY'));
  assert.ok(!nomes.includes('SUPABASE_JWT_SECRET'));
});

// ---------------------------------------------------------------------------
// CLI ponta a ponta (decisão registrada em GITHUB_OUTPUT) e bordas do extrator.
// ---------------------------------------------------------------------------
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SCRIPT_SS = resolve(RAZA0, 'secrets-scope.mjs');

function cli(args, { lista, manifesto } = {}) {
  const dir = mkdtempSync(resolve(tmpdir(), 'secrets scope-'));
  try {
    const saidaGh = resolve(dir, 'out');
    const manifestPath = resolve(dir, 'env.manifest.json');
    writeFileSync(
      manifestPath,
      manifesto ?? JSON.stringify({
        vars: [
          { name: 'ASAAS_API_KEY', dest: 'supabase_vault', required: true },
          { name: 'RESEND_API_KEY', dest: 'supabase_vault', required: true },
          { name: 'OPCIONAL', dest: 'supabase_vault', required: false },
          { name: 'SUPABASE_URL', dest: 'supabase_vault', required: true },
          { name: 'VITE_X', dest: 'vercel', required: true },
        ],
      }),
    );
    const extras = [];
    if (lista !== undefined) {
      writeFileSync(resolve(dir, 'lista.txt'), lista);
      extras.push('--lista', resolve(dir, 'lista.txt'));
    }
    const r = spawnSync(process.execPath, [SCRIPT_SS, '--manifest', manifestPath, ...extras, ...args], {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: saidaGh },
    });
    let output = '';
    try {
      output = readFileSync(saidaGh, 'utf8');
    } catch {
      /* não gravou */
    }
    return { ...r, output };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const TABELA = ['', '   NAME            | DIGEST', '  -----------------|--------', '   ASAAS_API_KEY   | 3f2a', '   RESEND_API_KEY  | 9c1b', '   SUPABASE_URL    | 77aa', ''].join('\n');

test('7. CLI: nomes esperados presentes → MANTER, exit 0 e output de uma linha por chave', () => {
  for (const lista of [TABELA, JSON.stringify([{ name: 'ASAAS_API_KEY' }, { name: 'RESEND_API_KEY' }]), JSON.stringify({ secrets: ['ASAAS_API_KEY', 'RESEND_API_KEY'] })]) {
    const r = cli([], { lista });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /esperados=2 \[ASAAS_API_KEY, RESEND_API_KEY\]/, 'opcional, SUPABASE_* e outros destinos ficam fora');
    assert.match(r.stdout, /decisao=MANTER — secrets inalterados/);
    assert.equal(r.output, 'reescrever=false\nmotivo=secrets inalterados: nenhum nome esperado está ausente\n');
  }
});

test('8. CLI: nome ausente no remoto → REESCREVER com o nome no motivo', () => {
  const r = cli(['--fn', 'asaas-proxy'], { lista: TABELA.replace('RESEND_API_KEY', 'OUTRO_SEGREDO_') });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /escopo="asaas-proxy"/);
  assert.equal(r.output, 'reescrever=true\nmotivo=secrets ausentes no projeto: RESEND_API_KEY\n');
});

test('9. CLI: leitura do remoto falhou (sem --lista, arquivo vazio, erro do CLI) → fail-closed, exit 1', () => {
  for (const lista of [undefined, '', '   \n', 'Unauthorized: invalid access token\n', '[]', '{"secrets":[]}', 'null']) {
    const r = cli([], { lista });
    assert.equal(r.status, 1, JSON.stringify(lista));
    assert.match(r.stderr, /::error::não foi possível ler os secrets do projeto/);
    assert.match(r.output, /^reescrever=false\n/);
  }
});

test('10. CLI: --dry-run e --rollback nunca reescrevem; --rotate reescreve mesmo sem leitura', () => {
  assert.match(cli(['--dry-run', '--rotate']).output, /^reescrever=false\nmotivo=ensaio/);
  assert.match(cli(['--rollback', '--rotate']).output, /^reescrever=false\nmotivo=rollback/);
  const rotate = cli(['--rotate']);
  assert.equal(rotate.status, 0);
  assert.match(rotate.output, /^reescrever=true\nmotivo=rotate_secrets=true/);
});

test('11. CLI: flag desconhecida aborta com 2 sem decidir nada (antes: --dryrun era ignorada → decisão real)', () => {
  for (const args of [['--dryrun'], ['--rotate-secrets'], ['solto'], ['--lista']]) {
    const r = cli(args, { lista: args[0] === '--lista' ? undefined : TABELA.replace('RESEND_API_KEY', 'OUTRO') });
    assert.equal(r.status, 2, `${args.join(' ')} → ${r.status} ${r.stdout}`);
    assert.match(r.stderr, /::error::(argumento não reconhecido|--lista exige um valor)/);
    assert.equal(r.output, '', 'nenhuma decisão vai para o GITHUB_OUTPUT');
  }
});

test('12. CLI: manifesto ilegível ou malformado sai com 2', () => {
  for (const manifesto of ['{ quebrado', JSON.stringify({ vars: [{ dest: 'supabase_vault', required: true }] })]) {
    const r = cli([], { lista: TABELA, manifesto });
    assert.equal(r.status, 2, manifesto);
    assert.match(r.stderr, /::error::env\.manifest\.json ilegível/);
  }
});

test('13. extrator: tabela com moldura unicode, ANSI e CRLF; o digest nunca vira nome', () => {
  const unicode = ['  NAME           │ DIGEST', ' ────────────────┼────────', '  ASAAS_API_KEY  │ ABCDEF0123', '  RESEND_API_KEY │ DEADBEEF'].join('\r\n');
  assert.deepEqual(extrairNomesDeSecrets(unicode), ['ASAAS_API_KEY', 'RESEND_API_KEY']);
  assert.equal(extrairNomesDeSecrets('\x1b[1mNAME\x1b[0m | DIGEST'), null);
  assert.equal(extrairNomesDeSecrets(null), null);
  assert.equal(extrairNomesDeSecrets('{"secrets": "x"}'), null);
});
