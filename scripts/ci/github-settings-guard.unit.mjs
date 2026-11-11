import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assinaturaDe, validarBaseline } from './github-settings-guard.mjs';

// Contratos do settings-guard. O guard é executado de VERDADE (child process) com
// um `fetch` stubbed — um teste que reimplementa a lógica no próprio arquivo
// passa a valer sobre a cópia, não sobre o guard, e foi assim que a versão
// anterior deste arquivo ficou verde enquanto o guard falhava em produção.

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'github-settings-guard.mjs');
const TITULO = '[settings-guard] perimeter regression detected';

const CONTEXTS_OK =
  "['Supabase DB Linter','Quality Gate & Tests','E2E Critical Gate','Integration tests (edge functions live)','E2E Financeiro (offline)','E2E Destructive Logout','Varredura de segredos (gitleaks)','Unit tests (offline, deterministic)']";
const PROT_OK = `send({ required_status_checks: { strict: true, contexts: ${CONTEXTS_OK} }, enforce_admins: { enabled: true }, required_linear_history: { enabled: false }, allow_force_pushes: { enabled: false } })`;
const PROT_REGRESSAO = `send({ required_status_checks: { strict: false, contexts: ${CONTEXTS_OK} }, enforce_admins: { enabled: true }, required_linear_history: { enabled: false }, allow_force_pushes: { enabled: false } })`;
const REPO_OK =
  "send({ allow_auto_merge: true, allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: true, squash_merge_commit_message: 'COMMIT_MESSAGES', squash_merge_commit_title: 'COMMIT_OR_PR_TITLE', security_and_analysis: { secret_scanning: { status: 'enabled' }, secret_scanning_push_protection: { status: 'enabled' } } })";
const ACTIONS_OK = "send({ enabled: true, allowed_actions: 'all', sha_pinning_required: false })";
const WORKFLOW_PERMS_OK = "send({ default_workflow_permissions: 'read', can_approve_pull_request_reviews: false })";
// Baseline deste repo tem actions.allowed_actions='all': o endpoint selected-actions nem
// chega a ser chamado (checarSelectedActions sai antes). O stub abaixo só existe para provar
// que, SE alguma resposta chegasse aqui (409 real da API quando allowed_actions!='selected'),
// ela não quebraria o guard — defesa, não comportamento esperado em produção.
const SELECTED_409 = "send({ message: 'All actions and workflows are allowed' }, 409)";
const SEM_ESCOPO = "send({ message: 'Resource not accessible by integration' }, 403)";

/**
 * Stub de `fetch` no mesmo formato do baseline real. `modo` escolhe a resposta:
 *   ok         — tudo conforme o baseline
 *   regressao  — strict=false (a regressão que o guard existe para pegar)
 *   semChecks  — `required_status_checks: null` (os 6 checks obrigatorios apagados;
 *                e assim que a API DESLIGA os checks — achado do Codex na PR #1920)
 *   semEscopo  — a branch protection responde 403
 *   tokenReal  — o que o GITHUB_TOKEN devolve HOJE (medido no run 38615982485):
 *                403 em branch protection e actions, e `GET /repos` 200 SEM os
 *                campos de merge (o defeito W04: isso virava "7 divergencias")
 *   parcial    — `GET /repos` 200 com PARTE dos campos de merge (cegueira parcial)
 *   injecao    — valores com \\n vindos da API (jssecurity:S5145)
 * Opcoes:
 *   issue          — simula a issue [settings-guard] ja aberta
 *   ultimoMarcador — marcador do ultimo comentario da issue (W05: dedupe por causa)
 *   idadeMs        — idade desse comentario
 *   comentarioDepois — um comentario alheio (humano/outro bot) DEPOIS do marcador
 *   autorMarcador  — quem escreveu o comentario com o marcador (default: o proprio guard)
 *   patchStatus    — status HTTP devolvido a qualquer PATCH (403 = restauracao falha)
 *   selected       — resposta de /actions/permissions/selected-actions, só usada se o baseline pedir 'selected' (default: SELECTED_409)
 */
const GUARD = 'github-actions[bot]';
function stub(
  modo,
  {
    issue = false,
    ultimoMarcador = '',
    idadeMs = 0,
    comentarioDepois = false,
    autorMarcador = GUARD,
    patchStatus = 200,
    selected = SELECTED_409,
  } = {},
) {
  const prot = {
    ok: PROT_OK,
    regressao: PROT_REGRESSAO,
    semChecks: `send({ required_status_checks: null, enforce_admins: { enabled: true }, required_linear_history: { enabled: false }, allow_force_pushes: { enabled: false } })`,
    semEscopo: SEM_ESCOPO,
    tokenReal: SEM_ESCOPO,
    parcial: PROT_OK,
    injecao: "send({ required_status_checks: { strict: 'false\\n::error::forged', contexts: ['ci'] }, enforce_admins: { enabled: true }, required_linear_history: { enabled: true }, allow_force_pushes: { enabled: false } })",
  }[modo] ?? PROT_OK;
  const workflowPerms = modo === 'tokenReal' ? SEM_ESCOPO : WORKFLOW_PERMS_OK;

  // S3923: aqui havia `modo === 'injecao' ? A : B` com A e B IDENTICOS -- ramo morto,
  // o valor nao mudava com a condicao. A correcao NAO foi apagar a distincao: foi fazer
  // os ramos diferirem de verdade, que era a intencao. Em injecao o campo repo carrega
  // quebra de linha, o que o guard precisa neutralizar antes de imprimir.
  const repo = {
    injecao:
      "send({ allow_auto_merge: true, allow_squash_merge: 'true\\n::error::forged3', allow_merge_commit: false, allow_rebase_merge: false, delete_branch_on_merge: true, squash_merge_commit_message: 'PR_BODY', squash_merge_commit_title: 'PR_TITLE' })",
    // O GET /repos real com GITHUB_TOKEN: 200, metadados publicos, NENHUM campo de merge.
    tokenReal: "send({ id: 1, name: 'r', full_name: 'o/r', private: false, default_branch: 'main' })",
    // Cegueira parcial: dois campos vieram, os outros cinco nao.
    parcial: "send({ id: 1, allow_auto_merge: true, delete_branch_on_merge: true })",
    // merge.* completo, mas o GET /repos nao trouxe security_and_analysis (token sem
    // o escopo que esse bloco exige — distinto do escopo que os campos de merge exigem).
    secAusente:
      "send({ allow_auto_merge: true, allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: true, squash_merge_commit_message: 'COMMIT_MESSAGES', squash_merge_commit_title: 'COMMIT_OR_PR_TITLE' })",
    // merge.* completo, security_and_analysis presente mas secret_scanning desligado.
    secDesligado:
      "send({ allow_auto_merge: true, allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: true, squash_merge_commit_message: 'COMMIT_MESSAGES', squash_merge_commit_title: 'COMMIT_OR_PR_TITLE', security_and_analysis: { secret_scanning: { status: 'disabled' }, secret_scanning_push_protection: { status: 'enabled' } } })",
  }[modo] ?? REPO_OK;

  const actions = modo === 'tokenReal' ? SEM_ESCOPO : ACTIONS_OK;
  const envs =
    "send({ environments: [{ name: 'copilot' },{ name: 'Preview' },{ name: 'Production' },{ name: 'Production-Ops' }] })";

  const criadoEm = new Date(Date.now() - idadeMs).toISOString();
  const totalComentarios = comentarioDepois ? 2 : 1;
  const issues = issue
    ? `send([{ number: 42, title: ${JSON.stringify(TITULO)}, comments: ${totalComentarios}, created_at: '2026-10-01T00:00:00Z', body: '', user: { login: '${GUARD}' } }])`
    : 'send([])';
  const listaComentarios = [
    `{ body: ${JSON.stringify(`${ultimoMarcador}\n(comentario com marcador)`)}, created_at: '${criadoEm}', user: { login: ${JSON.stringify(autorMarcador)} } }`,
  ];
  if (comentarioDepois) {
    listaComentarios.push(
      `{ body: 'comentario humano sem marcador, posterior ao do guard', created_at: '${new Date().toISOString()}', user: { login: 'humano' } }`,
    );
  }
  const comentarios = `send([${listaComentarios.join(', ')}])`;

  return [
    'const send = (obj, status) => {',
    '  status = status || 200;',
    '  return {',
    '    ok: status >= 200 && status < 300,',
    '    status: status,',
    "    headers: { get: () => (obj == null ? '0' : '1') },",
    '    json: async () => obj,',
    '    text: async () => JSON.stringify(obj),',
    '  };',
    '};',
    'globalThis.fetch = async (url, opts) => {',
    '  opts = opts || {};',
    "  const p = String(url).replace('https://api.github.com', '');",
    "  const method = String(opts.method || 'GET').toUpperCase();",
    "  if (p.indexOf('/issues?labels=') !== -1) return " + issues + ';',
    "  if (method === 'GET' && p.indexOf('/issues/42/comments') !== -1) return " + comentarios + ';',
    "  if (p.endsWith('/branches/main/protection')) return " + prot + ';',
    "  if (p.endsWith('/actions/permissions/workflow')) return " + workflowPerms + ';',
    "  if (p.endsWith('/actions/permissions/selected-actions')) return " + selected + ';',
    "  if (p.indexOf('/actions/permissions') !== -1) return " + actions + ';',
    "  if (method === 'GET' && p.endsWith('/rulesets')) return send([]);",
    "  if (p.indexOf('/environments') !== -1) return " + envs + ';',
    "  if (method === 'GET' && p === '/repos/o/r') return " + repo + ';',
    "  if (method === 'GET') return send({});",
    `  if (method === 'PATCH') return send({ message: 'patch' }, ${Number(patchStatus)});`,
    "  if (method === 'POST' && p.indexOf('/comments') !== -1) return send({ id: 7 });",
    "  if (method === 'POST' && p.indexOf('/issues') !== -1) return send({ number: '999\\n::error::forged2' });",
    '  return send({});',
    '};',
    '',
  ].join('\n');
}

function rodarGuard(modo, opts) {
  const arquivo = 'data:text/javascript,' + encodeURIComponent(stub(modo, opts));
  const res = spawnSync(process.execPath, ['--import', arquivo, SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_TOKEN: 'x', GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: '1' },
  });
  return {
    code: res.status,
    out: `${res.stdout}${res.stderr}`,
    linhas: `${res.stdout}${res.stderr}`.split('\n'),
  };
}

// Assinatura do caso `tokenReal`: nenhuma divergencia lida, tres checagens cegas.
// `campos` repete o que o guard registra: o status HTTP quando a checagem inteira
// lancou NaoVerificavel (403 nas duas administrativas; 200 no /repos sem campos).
const CEGOS_TOKEN_REAL = [
  { nome: 'branch protection', campos: ['403'] },
  { nome: 'merge/repo', campos: ['200'] },
  { nome: 'actions', campos: ['403'] },
  { nome: 'workflow permissions', campos: ['403'] },
];
const MARCADOR_TOKEN_REAL = `<!-- causa:${assinaturaDe([], CEGOS_TOKEN_REAL)} -->`;
// Assinatura do caso `regressao`: strict=false lido, nada cego.
const MARCADOR_REGRESSAO = `<!-- causa:${assinaturaDe([{ campo: 'branch_protection_main.strict', encontrado: false }], [])} -->`;

describe('settings-guard: perimetro conforme o baseline', () => {
  it('perimetro OK: nao acusa divergencia e sai 0', () => {
    const r = rodarGuard('ok');
    assert.equal(r.code, 0, `esperava exit 0, veio ${r.code}:\n${r.out}`);
    assert.ok(r.out.includes('Perimetro OK'), `nao confirmou o OK:\n${r.out}`);
    assert.ok(!r.out.includes('::warning::'), `avisou sem motivo:\n${r.out}`);
  });

  it("actions.allowed_actions='all': checarSelectedActions nem chama a API (409 real nao quebra o guard)", () => {
    const r = rodarGuard('ok');
    assert.equal(r.code, 0, `esperava exit 0, veio ${r.code}:\n${r.out}`);
    assert.ok(!r.out.includes('selected_actions'), `checagem que nao se aplica nao pode aparecer:\n${r.out}`);
    assert.ok(!r.out.includes('NAO VERIFICAVEL'), `409 por nao-aplicabilidade nao e ponto cego:\n${r.out}`);
  });

  it("prova forte: checarSelectedActions NUNCA chama a API quando o baseline nao pede 'selected'", () => {
    // A prova anterior só olhava o texto da saída (fraca, achado da revisão adversarial:
    // um 409 que chegasse a virar `throw` sem `catch` também não imprimiria
    // 'selected_actions' nem 'NAO VERIFICAVEL' — passaria pelo mesmo jeito, por motivo
    // errado). Aqui a chamada, se acontecer, mata o processo com exit 97 na hora: só dá
    // pra ver exit 0 se o endpoint realmente nunca foi tocado.
    const stb = stub('ok').replace(
      /if \(p\.endsWith\('\/actions\/permissions\/selected-actions'\)\) return [^;]+;/,
      "if (p.endsWith('/actions/permissions/selected-actions')) { process.exit(97); }",
    );
    const arq = 'data:text/javascript,' + encodeURIComponent(stb);
    const res = spawnSync(process.execPath, ['--import', arq, SCRIPT], {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_TOKEN: 'x', GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: '1' },
    });
    assert.notEqual(res.status, 97, `checarSelectedActions chamou a API que nem deveria tocar:\n${res.stdout}${res.stderr}`);
    assert.equal(res.status, 0, `esperava exit 0, veio ${res.status}:\n${res.stdout}${res.stderr}`);
  });

  it('strict=false e detectado como divergencia (a regressao que o guard existe para pegar)', () => {
    const r = rodarGuard('regressao');
    assert.equal(r.code, 1, `esperava exit 1, veio ${r.code}:\n${r.out}`);
    assert.ok(
      r.out.includes('branch_protection_main.strict'),
      `nao apontou o campo divergente:\n${r.out}`,
    );
    assert.ok(r.out.includes('Restaurado'), `nao tentou restaurar o que sabe restaurar:\n${r.out}`);
  });

  it('required_status_checks: null e regressao (checks apagados), nunca ponto cego', () => {
    // A API usa `null` para DESLIGAR os checks obrigatorios. Tratar isso como
    // "campo nao lido" deixaria passar a pior regressao possivel: zero checks na main.
    const r = rodarGuard('semChecks');
    assert.equal(r.code, 1, `esperava exit 1, veio ${r.code}:\n${r.out}`);
    assert.ok(r.out.includes('required_status_checks desligado'), `nao nomeou a causa:\n${r.out}`);
    assert.ok(r.out.includes('branch_protection_main.required_status_checks'), `nao acusou os contexts ausentes:\n${r.out}`);
    assert.ok(!r.out.includes('NAO VERIFICAVEL'), `tratou checks apagados como ponto cego:\n${r.out}`);
    // Sem o bloco de checks o PATCH do sub-recurso nao tem o que atualizar: nao tenta.
    assert.ok(!r.out.includes('Restaurado'), `tentou restaurar sem o bloco de checks:\n${r.out}`);
  });
});

describe('settings-guard: ponto cego (E95, W04, W05)', () => {
  it('403 na branch protection vira NAO VERIFICAVEL, nao falha silenciosa', () => {
    // O comportamento antigo: o erro subia, o guard morria no primeiro GET e
    // NUNCA abria a issue — 6 runs, 6 falhas silenciosas (medido em 03/10/2026).
    const r = rodarGuard('semEscopo');
    assert.ok(
      r.out.includes('NAO VERIFICAVEL'),
      `o ponto cego nao foi declarado — sem isto ele passa por "tudo certo":\n${r.out}`,
    );
    assert.ok(r.out.includes('403'), `o motivo (403 sem escopo) precisa aparecer no log:\n${r.out}`);
    assert.ok(!r.out.includes('Perimetro OK'), `nao pode declarar OK o que nao conseguiu ler:\n${r.out}`);
  });

  it('abre a issue tambem quando o problema e falta de escopo', () => {
    const r = rodarGuard('semEscopo');
    assert.ok(
      r.linhas.some((l) => l.startsWith('Issue #')),
      `nenhuma issue foi aberta — era exatamente o defeito antigo:\n${r.out}`,
    );
  });

  it('W05: so ponto cego (nada divergiu do que foi lido) sai 0 com ::warning::', () => {
    // 30 de 30 runs vermelhos em 7 dias por falta de escopo (14/10/2026) ensinam a
    // ignorar o vermelho. "Nao consegui olhar" vai para a issue; o job fica verde.
    const r = rodarGuard('semEscopo');
    assert.equal(r.code, 0, `esperava exit 0 (so ponto cego), veio ${r.code}:\n${r.out}`);
    assert.ok(r.out.includes('::warning::'), `faltou o aviso de ponto cego:\n${r.out}`);
  });

  it('W04: GET /repos sem os campos de merge e ponto cego, nao "7 divergencias"', () => {
    // Medido no run 38615982485: `merge.allow_auto_merge esperado=true encontrado=null`
    // x7. O token nao le esses campos; o guard acusava divergencia e tentava um
    // PATCH que respondia 403.
    const r = rodarGuard('tokenReal');
    assert.equal(r.code, 0, `esperava exit 0, veio ${r.code}:\n${r.out}`);
    assert.ok(!r.out.includes('divergencia:'), `acusou divergencia em campo nao lido:\n${r.out}`);
    assert.ok(!r.out.includes('encontrado=null'), `null virou divergencia:\n${r.out}`);
    assert.ok(r.out.includes('merge/repo: NAO VERIFICAVEL'), `merge/repo nao foi declarado cego:\n${r.out}`);
    assert.ok(!r.out.includes('Restaurado'), `tentou restaurar o que nao conseguiu ler:\n${r.out}`);
    assert.ok(r.linhas.some((l) => l.startsWith('Issue #')), `a issue de ponto cego precisa existir:\n${r.out}`);
  });

  it('security_and_analysis ausente e ponto cego, nao divergencia falsa (achado da revisao: nao ficava cego nem divergente)', () => {
    const r = rodarGuard('secAusente');
    assert.equal(r.code, 0, `esperava exit 0 (so ponto cego), veio ${r.code}:\n${r.out}`);
    assert.ok(r.out.includes('NAO VERIFICAVEL') || r.out.includes('PARCIALMENTE VERIFICAVEL'), `security ausente tem de aparecer como ponto cego:\n${r.out}`);
    assert.ok(r.out.includes('security_and_analysis.secret_scanning'), `nao nomeou o campo ausente:\n${r.out}`);
    assert.ok(!r.out.includes('divergencia:'), `campo ausente nao pode virar divergencia:\n${r.out}`);
  });

  it('secret_scanning desligado E CONFERIDO mesmo quando merge.* vem completo (achado: antes so era checado se merge tambem viesse completo)', () => {
    const r = rodarGuard('secDesligado');
    assert.equal(r.code, 1, `secret scanning desligado tem de reprovar, veio ${r.code}:\n${r.out}`);
    assert.ok(r.out.includes('security_and_analysis.secret_scanning'), `divergencia nao apontada:\n${r.out}`);
    assert.ok(r.out.includes('esperado=enabled') || r.out.includes('esperado=enabled'), r.out);
    assert.ok(r.out.includes('encontrado=disabled'), `valor real nao apareceu:\n${r.out}`);
  });

  it('W04: GET /repos com PARTE dos campos e parcialmente verificavel; o que veio e conferido', () => {
    const r = rodarGuard('parcial');
    assert.equal(r.code, 0, `esperava exit 0, veio ${r.code}:\n${r.out}`);
    assert.ok(r.out.includes('merge/repo: PARCIALMENTE VERIFICAVEL'), `cegueira parcial nao declarada:\n${r.out}`);
    assert.ok(r.out.includes('allow_squash_merge'), `nao listou qual campo faltou:\n${r.out}`);
    assert.ok(!r.out.includes('divergencia:'), `campo ausente virou divergencia:\n${r.out}`);
  });

  it('W05: issue aberta com a MESMA causa ha menos de 7 dias nao recebe comentario novo', () => {
    const r = rodarGuard('tokenReal', { issue: true, ultimoMarcador: MARCADOR_TOKEN_REAL, idadeMs: 60_000 });
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('Dedupe'), `deveria suprimir o comentario repetido:\n${r.out}`);
    assert.ok(!r.out.includes('atualizada com novo comentario'), `comentou de novo a mesma causa:\n${r.out}`);
  });

  it('W05: um comentario alheio DEPOIS do marcador nao zera o dedupe', () => {
    // Um humano (ou outro bot) comentando na issue nao pode fazer o guard voltar a
    // comentar a cada 6 h — e o que acontecia olhando so o ULTIMO comentario (Codex, PR #1920).
    const r = rodarGuard('tokenReal', {
      issue: true,
      ultimoMarcador: MARCADOR_TOKEN_REAL,
      idadeMs: 60_000,
      comentarioDepois: true,
    });
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('Dedupe'), `comentario alheio zerou o dedupe:\n${r.out}`);
  });

  it('W05: marcador colado por OUTRO autor nao conta para o dedupe (repo publico)', () => {
    // Qualquer pessoa pode copiar `<!-- causa:... -->` para um comentario e, sem checar o
    // autor, silenciar o alerta por 7 dias (Codex, PR #1920). So o guard se auto-deduplica.
    const r = rodarGuard('tokenReal', {
      issue: true,
      ultimoMarcador: MARCADOR_TOKEN_REAL,
      idadeMs: 60_000,
      autorMarcador: 'curioso',
    });
    assert.equal(r.code, 0, r.out);
    assert.ok(!r.out.includes('Dedupe'), `marcador de terceiro silenciou o guard:\n${r.out}`);
    assert.ok(r.out.includes('Issue #42 atualizada com novo comentario'), `o guard nao registrou a causa:\n${r.out}`);
  });

  it('W05: mesma causa com mais de 7 dias volta a comentar (lembrete semanal)', () => {
    const r = rodarGuard('tokenReal', { issue: true, ultimoMarcador: MARCADOR_TOKEN_REAL, idadeMs: 8 * 24 * 3600 * 1000 });
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('Issue #42 atualizada com novo comentario'), `nao renovou o lembrete:\n${r.out}`);
  });

  it('W05: causa diferente da ultima comenta de novo', () => {
    const r = rodarGuard('tokenReal', { issue: true, ultimoMarcador: '<!-- causa:outra -->', idadeMs: 60_000 });
    assert.ok(r.out.includes('Issue #42 atualizada com novo comentario'), `causa nova sem comentario:\n${r.out}`);
  });

  it('W05: divergencia real com restauracao EFETIVA sempre comenta (mesmo com dedupe)', () => {
    const r = rodarGuard('regressao', { issue: true, ultimoMarcador: MARCADOR_REGRESSAO, idadeMs: 60_000 });
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('Restaurado:'), `a restauracao precisa ter acontecido:\n${r.out}`);
    assert.ok(r.out.includes('Issue #42 atualizada com novo comentario'), `restauracao sem registro:\n${r.out}`);
  });

  it('W05: restauracao que FALHOU nao forca comentario — o dedupe de 6 h vale', () => {
    // Um PATCH 403 recorrente (token sem escopo) comentaria a cada 6 h se a tentativa
    // falha contasse como "restaurei" (Devin, PR #1920).
    const r = rodarGuard('regressao', {
      issue: true,
      ultimoMarcador: MARCADOR_REGRESSAO,
      idadeMs: 60_000,
      patchStatus: 403,
    });
    assert.equal(r.code, 1, r.out);
    assert.ok(!r.out.includes('Restaurado:'), `declarou restaurado um PATCH que falhou:\n${r.out}`);
    assert.ok(r.out.includes('Dedupe'), `tentativa falha forcou comentario repetido:\n${r.out}`);
  });
});

describe('settings-guard: assinatura da causa', () => {
  it('e estavel e independe da ordem', () => {
    const a = assinaturaDe([{ campo: 'x', encontrado: 1 }, { campo: 'y', encontrado: 2 }], [{ nome: 'b' }, { nome: 'a' }]);
    const b = assinaturaDe([{ campo: 'y', encontrado: 2 }, { campo: 'x', encontrado: 1 }], [{ nome: 'a' }, { nome: 'b' }]);
    assert.equal(a, b);
    assert.notEqual(a, assinaturaDe([{ campo: 'x', encontrado: 3 }], []));
  });

  it('distingue QUAIS campos ficaram cegos, nao so a checagem', () => {
    // "faltou allow_auto_merge" e "faltou allow_squash_merge" davam a mesma assinatura
    // e a mudanca de ponto cego ficava 7 dias suprimida (Devin/Codex, PR #1920).
    const a = assinaturaDe([], [{ nome: 'merge/repo (parcial)', campos: ['allow_auto_merge'] }]);
    const b = assinaturaDe([], [{ nome: 'merge/repo (parcial)', campos: ['allow_squash_merge'] }]);
    assert.notEqual(a, b);
    const c = assinaturaDe([], [{ nome: 'merge/repo (parcial)', campos: ['allow_squash_merge', 'allow_auto_merge'] }]);
    const d = assinaturaDe([], [{ nome: 'merge/repo (parcial)', campos: ['allow_auto_merge', 'allow_squash_merge'] }]);
    assert.equal(c, d, 'a ordem dos campos nao pode mudar a assinatura');
  });
});

// jssecurity:S5145 (log injection) — um valor vindo da API do GitHub contendo
// `\n` NÃO pode forjar uma linha nova no log do workflow.
describe('settings-guard: log injection (jssecurity:S5145)', () => {
  it('neutraliza quebras de linha vindas da API', () => {
    const r = rodarGuard('injecao');

    const linhaDiv = r.linhas.find((l) => l.includes('divergencia:'));
    assert.ok(linhaDiv, `linha de divergencia ausente:\n${r.out}`);
    assert.ok(
      linhaDiv.includes('::error::forged'),
      `o valor nao chegou (stub quebrado?) ou foi apagado: ${JSON.stringify(linhaDiv)}`,
    );

    const linhaIssue = r.linhas.find((l) => l.startsWith('Issue #'));
    assert.ok(linhaIssue, `linha da issue ausente:\n${r.out}`);
    assert.ok(
      linhaIssue.includes('Issue #999 ::error::forged2 aberta.'),
      `valor nao-confiavel vazou cru: ${JSON.stringify(linhaIssue)}`,
    );

    assert.ok(
      !r.linhas.includes('::error::forged') && !r.linhas.includes('::error::forged2'),
      `linha de log forjada emitida:\n${r.out}`,
    );
  });
});

// W13: environments extras (Vercel-managed vs inesperados)
function rodarComEnvsExtra(extras) {
  // Injeta o stub de environments com os itens do baseline + os extras recebidos.
  const todos = ['copilot', 'Preview', 'Production', 'Production-Ops', ...extras];
  const envsStub =
    'send({ environments: [' +
    todos.map((n) => `{ name: ${JSON.stringify(n)} }`).join(',') +
    '] })';
  const stb = stub('ok').replace(
    /if \(p\.indexOf\('\/environments'\).*?return .*?;/,
    `if (p.indexOf('/environments') !== -1) return ${envsStub};`,
  );
  const arq = 'data:text/javascript,' + encodeURIComponent(stb);
  const res = spawnSync(process.execPath, ['--import', arq, SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_TOKEN: 'x', GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: '1' },
  });
  return { code: res.status, out: `${res.stdout}${res.stderr}` };
}

describe('settings-guard: W13 — environments extras', () => {
  it('extras Vercel-managed (Preview –/Production –) emitem ::warning::, nao divergencia', () => {
    const r = rodarComEnvsExtra(['Preview – promo_finance_v2', 'Production – promo_finance_v2']);
    assert.equal(r.code, 0, `esperava exit 0 (vercel-managed nao e regressao):\n${r.out}`);
    assert.ok(r.out.includes('::warning::'), `warning W13 nao emitido:\n${r.out}`);
    assert.ok(!r.out.includes('extras_inesperados'), `classific. incorreta como inesperado:\n${r.out}`);
  });

  it('extras inesperados (nao-Vercel) sao reportados como divergencia', () => {
    const r = rodarComEnvsExtra(['meu-ambiente-desconhecido']);
    assert.equal(r.code, 1, `esperava exit 1 (extra inesperado e regressao):\n${r.out}`);
    assert.ok(r.out.includes('extras_inesperados'), `divergencia nao apontada:\n${r.out}`);
    assert.ok(r.out.includes('meu-ambiente-desconhecido'), `nome do ambiente ausente:\n${r.out}`);
  });
});

// ---------------------------------------------------------------------------------------
// Cenarios adversos contra um servidor HTTP LOCAL (127.0.0.1, porta efemera) via
// GITHUB_API_URL. Nenhuma chamada sai da maquina e nenhum teste usa o token do ambiente.
// ---------------------------------------------------------------------------------------

const BASELINE_PATH = join(dirname(SCRIPT), 'github-settings-baseline.json');
const BASELINE = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const CHECKS_BASELINE = BASELINE.branch_protection_main.required_status_checks;

const json = (body, status = 200) => ({ status, json: body });
const protOk = (extra = {}) => ({
  required_status_checks: { strict: true, contexts: [...CHECKS_BASELINE] },
  enforce_admins: { enabled: true },
  required_linear_history: { enabled: false },
  allow_force_pushes: { enabled: false },
  ...extra,
});
const repoOk = () => ({
  allow_auto_merge: true, allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true,
  delete_branch_on_merge: true, squash_merge_commit_message: 'COMMIT_MESSAGES', squash_merge_commit_title: 'COMMIT_OR_PR_TITLE',
  security_and_analysis: { secret_scanning: { status: 'enabled' }, secret_scanning_push_protection: { status: 'enabled' } },
});
const envsOk = () => ({ total_count: 4, environments: BASELINE.environments.map((name) => ({ name })) });

// Respostas "tudo conforme"; `over` troca rotas por objeto de resposta ou funcao (req) => resposta.
function roteador(over = {}) {
  return (req) => {
    const { method, caminho, query } = req;
    const rota = (() => {
      if (method === 'GET' && caminho.endsWith('/branches/main/protection')) return 'protection';
      if (method === 'PATCH' && caminho.endsWith('/protection/required_status_checks')) return 'patchChecks';
      if (method === 'PATCH' && caminho === '/repos/o/r') return 'patchRepo';
      if (method === 'GET' && caminho === '/repos/o/r') return 'repo';
      if (method === 'GET' && caminho.endsWith('/actions/permissions/workflow')) return 'workflow';
      if (method === 'GET' && caminho.endsWith('/actions/permissions/selected-actions')) return 'selected';
      if (method === 'GET' && caminho.endsWith('/actions/permissions')) return 'actions';
      if (method === 'GET' && caminho.endsWith('/rulesets')) return 'rulesets';
      if (method === 'GET' && caminho.endsWith('/environments')) return 'environments';
      if (method === 'GET' && caminho === '/repos/o/r/issues') return 'issues';
      if (method === 'GET' && caminho.endsWith('/issues/42/comments')) return 'comments';
      if (method === 'POST' && caminho === '/repos/o/r/labels') return 'label';
      if (method === 'POST' && caminho === '/repos/o/r/issues') return 'novaIssue';
      if (method === 'POST' && caminho.endsWith('/comments')) return 'comentar';
      if (method === 'PATCH' && caminho.startsWith('/repos/o/r/issues/')) return 'fechar';
      return 'desconhecida';
    })();
    req.rota = rota;
    if (over[rota] !== undefined) return typeof over[rota] === 'function' ? over[rota](req) : over[rota];
    switch (rota) {
      case 'protection': return json(protOk());
      case 'repo': return json(repoOk());
      case 'actions': return json({ enabled: true, allowed_actions: 'all', sha_pinning_required: false });
      case 'workflow': return json({ default_workflow_permissions: 'read', can_approve_pull_request_reviews: false });
      case 'selected': return json({ message: 'All actions and workflows are allowed' }, 409);
      case 'rulesets': return json([]);
      case 'environments': return json(envsOk());
      case 'issues': return json([]);
      case 'comments': return json([]);
      case 'label': return json({}, 201);
      case 'novaIssue': return json({ number: 77 }, 201);
      case 'comentar': return json({ id: 1 }, 201);
      case 'fechar': return json({});
      case 'patchChecks': case 'patchRepo': return json({});
      default: return json({ message: 'rota sem cenario' }, 599);
    }
  };
}

async function rodarReal(handler, { env = {}, script = SCRIPT, timeoutMs = 20_000 } = {}) {
  const requisicoes = [];
  const servidor = createServer((req, res) => {
    const pedacos = [];
    req.on('data', (c) => pedacos.push(c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://127.0.0.1');
      const registro = {
        method: req.method, caminho: url.pathname, query: Object.fromEntries(url.searchParams),
        auth: req.headers.authorization, corpo: pedacos.length ? Buffer.concat(pedacos).toString('utf8') : '',
      };
      requisicoes.push(registro);
      const r = handler(registro);
      if (r.travar) return; // nunca responde (teste de timeout)
      res.statusCode = r.status ?? 200;
      if (r.raw !== undefined) {
        res.end(r.raw);
      } else {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(r.json ?? null));
      }
    });
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const porta = servidor.address().port;
  try {
    const filho = spawn(process.execPath, [script], {
      env: {
        PATH: process.env.PATH,
        GITHUB_TOKEN: 'x',
        GITHUB_REPOSITORY: 'o/r',
        GITHUB_RUN_ID: '1',
        GITHUB_API_URL: `http://127.0.0.1:${porta}`,
        SETTINGS_GUARD_RETRY_MS: '0',
        ...env,
      },
    });
    let out = '';
    filho.stdout.on('data', (c) => { out += c; });
    filho.stderr.on('data', (c) => { out += c; });
    const code = await new Promise((ok) => {
      const t = setTimeout(() => { filho.kill('SIGKILL'); ok('TIMEOUT'); }, timeoutMs);
      filho.on('close', (c) => { clearTimeout(t); ok(c); });
    });
    return { code, out, requisicoes, linhas: out.split('\n') };
  } finally {
    servidor.closeAllConnections?.();
    await new Promise((ok) => servidor.close(ok));
  }
}

const postadas = (r, rota) => r.requisicoes.filter((q) => q.rota === rota);

describe('settings-guard (HTTP local): falso OK em protecao removida e respostas malformadas', () => {
  it('baseline de controle: tudo conforme sai 0 com "Perimetro OK"', async () => {
    const r = await rodarReal(roteador());
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('Perimetro OK'), r.out);
    assert.ok(r.requisicoes.every((q) => q.auth === 'Bearer x'));
  });

  it('404 "Branch not protected" e REGRESSAO (protecao removida), nao ponto cego verde', async () => {
    const r = await rodarReal(roteador({ protection: json({ message: 'Branch not protected', status: '404' }, 404) }));
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('divergencia: branch_protection_main'), r.out);
    assert.ok(!r.out.includes('branch protection: NAO VERIFICAVEL'), r.out);
    assert.ok(!r.out.includes('Perimetro OK'), r.out);
  });

  it('404 generico (escopo escondendo o recurso) continua ponto cego, nao regressao', async () => {
    const r = await rodarReal(roteador({ protection: json({ message: 'Not Found' }, 404) }));
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('branch protection: NAO VERIFICAVEL'), r.out);
  });

  it('rulesets: corpo "null", JSON invalido ou objeto NAO contam como "0 rulesets"', async () => {
    for (const rulesets of [{ status: 200, raw: 'null' }, { status: 200, raw: '{"message":"x"}' }, { status: 200, raw: '{nao json' }]) {
      const r = await rodarReal(roteador({ rulesets }));
      assert.ok(!r.out.includes('Perimetro OK'), `rulesets=${JSON.stringify(rulesets)} aprovou:\n${r.out}`);
      if (rulesets.raw === '{nao json') assert.equal(r.code, 1, 'JSON invalido e erro de API, exit 1');
      else assert.ok(r.out.includes('rulesets: NAO VERIFICAVEL'), r.out);
    }
  });

  it('rulesets: um ruleset inesperado e divergencia', async () => {
    const r = await rodarReal(roteador({ rulesets: json([{ id: 1 }]) }));
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('rulesets.count'), r.out);
  });

  it('GET /repos com campo de merge explicitamente false diverge; ausente continua ponto cego', async () => {
    const r1 = await rodarReal(roteador({ repo: json({ ...repoOk(), allow_squash_merge: false }) }));
    assert.equal(r1.code, 1, r1.out);
    assert.ok(r1.out.includes('merge.allow_squash_merge'), r1.out);
    const sem = repoOk(); delete sem.allow_squash_merge;
    const r2 = await rodarReal(roteador({ repo: json(sem) }));
    assert.equal(r2.code, 0, r2.out);
    assert.ok(r2.out.includes('PARCIALMENTE VERIFICAVEL'), r2.out);
  });

  it('actions: campo omitido (sha_pinning_required) e ponto cego parcial; false explicito conforme', async () => {
    const r = await rodarReal(roteador({ actions: json({ enabled: true, allowed_actions: 'all' }) }));
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('actions: PARCIALMENTE VERIFICAVEL'), r.out);
    assert.ok(r.out.includes('actions.sha_pinning_required'), r.out);
    assert.ok(!r.out.includes('divergencia:'), r.out);
  });

  it('actions desligado (enabled=false, allowed_actions omitido pela API) e divergencia + ponto cego, nao OK', async () => {
    const r = await rodarReal(roteador({ actions: json({ enabled: false }) }));
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('divergencia: actions.enabled esperado=true encontrado=false'), r.out);
  });

  it('actions/workflow com corpo null ou lista = ponto cego total (nunca "tudo null" nem OK)', async () => {
    for (const raw of ['null', '[]']) {
      const r = await rodarReal(roteador({ actions: { status: 200, raw }, workflow: { status: 200, raw } }));
      assert.equal(r.code, 0, r.out);
      assert.ok(r.out.includes('actions: NAO VERIFICAVEL') && r.out.includes('workflow permissions: NAO VERIFICAVEL'), r.out);
      assert.ok(!r.out.includes('Perimetro OK'), r.out);
    }
  });

  it('workflow_permissions divergente (write) e detectado', async () => {
    const r = await rodarReal(roteador({ workflow: json({ default_workflow_permissions: 'write', can_approve_pull_request_reviews: false }) }));
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('workflow_permissions.default_workflow_permissions'), r.out);
  });

  it('required_approving_review_count do baseline agora e conferido', async () => {
    const r = await rodarReal(roteador({ protection: json(protOk({ required_pull_request_reviews: { required_approving_review_count: 2 } })) }));
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('required_approving_review_count esperado=0 encontrado=2'), r.out);
  });

  it('contexts: ordem diferente nao e divergencia; caixa/espaco/duplicata/extra e', async () => {
    const embaralhado = [...CHECKS_BASELINE].reverse();
    const ok = await rodarReal(roteador({ protection: json(protOk({ required_status_checks: { strict: true, contexts: embaralhado } })) }));
    assert.equal(ok.code, 0, ok.out);
    const variantes = [
      [...CHECKS_BASELINE.slice(1), CHECKS_BASELINE[0].toLowerCase()],
      [...CHECKS_BASELINE.slice(1), `${CHECKS_BASELINE[0]} `],
      [...CHECKS_BASELINE, CHECKS_BASELINE[0]],
      [...CHECKS_BASELINE, 'extra'],
      CHECKS_BASELINE.slice(1),
    ];
    for (const contexts of variantes) {
      const r = await rodarReal(roteador({ protection: json(protOk({ required_status_checks: { strict: true, contexts } })) }));
      assert.equal(r.code, 1, `contexts=${JSON.stringify(contexts)} passou:\n${r.out}`);
      assert.ok(r.out.includes('branch_protection_main.required_status_checks'), r.out);
    }
  });

  it('contexts que nao e lista e ponto cego (nao TypeError, nao OK)', async () => {
    const r = await rodarReal(roteador({ protection: json(protOk({ required_status_checks: { strict: true, contexts: 'texto' } })) }));
    assert.ok(!r.out.includes('Perimetro OK'), r.out);
    assert.ok(r.out.includes('branch protection: NAO VERIFICAVEL'), r.out);
  });

  it('flags de protecao: enforce_admins off, linear_history on e force_push on divergem; ausentes = null divergem', async () => {
    const r = await rodarReal(roteador({ protection: json(protOk({ enforce_admins: { enabled: false }, required_linear_history: { enabled: true }, allow_force_pushes: { enabled: true } })) }));
    assert.equal(r.code, 1, r.out);
    for (const campo of ['enforce_admins', 'required_linear_history', 'allow_force_pushes']) assert.ok(r.out.includes(`branch_protection_main.${campo}`), r.out);
    const sem = protOk(); delete sem.enforce_admins;
    const r2 = await rodarReal(roteador({ protection: json(sem) }));
    assert.equal(r2.code, 1, 'enforce_admins ausente na protecao lida e divergencia (campo faz parte do bloco de protecao)');
  });
});

describe('settings-guard (HTTP local): erros de API, retry, timeout e paginacao', () => {
  it('5xx transitorio em GET e re-tentado e o guard conclui OK', async () => {
    let n = 0;
    const r = await rodarReal(roteador({ rulesets: () => (++n < 3 ? { status: 502, raw: 'bad gateway' } : json([])) }));
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('Perimetro OK'), r.out);
    assert.equal(postadas(r, 'rulesets').length, 3);
  });

  it('5xx persistente: exit 1, 3 tentativas, sem "OK" e sem tratar como ponto cego', async () => {
    const r = await rodarReal(roteador({ rulesets: { status: 500, raw: 'boom' } }));
    assert.equal(r.code, 1, r.out);
    assert.equal(postadas(r, 'rulesets').length, 3);
    assert.ok(!r.out.includes('Perimetro OK') && !r.out.includes('NAO VERIFICAVEL'), r.out);
  });

  it('403 de rate limit NAO e falta de escopo: exit 1 (antes virava ponto cego verde)', async () => {
    const r = await rodarReal(roteador({ protection: json({ message: 'API rate limit exceeded for user ID 1.' }, 403) }));
    assert.equal(r.code, 1, r.out);
    assert.ok(!r.out.includes('branch protection: NAO VERIFICAVEL'), r.out);
    const r2 = await rodarReal(roteador({ protection: json({ message: 'You have exceeded a secondary rate limit.' }, 403) }));
    assert.equal(r2.code, 1, r2.out);
  });

  it('429 e exit 1 (com retry), nunca OK', async () => {
    const r = await rodarReal(roteador({ environments: json({ message: 'slow down' }, 429) }));
    assert.equal(r.code, 1, r.out);
    assert.equal(postadas(r, 'environments').length, 3);
  });

  it('4xx definitivo (422) em GET nao e re-tentado', async () => {
    const r = await rodarReal(roteador({ rulesets: json({ message: 'invalido' }, 422) }));
    assert.equal(r.code, 1, r.out);
    assert.equal(postadas(r, 'rulesets').length, 1);
  });

  it('servidor que nunca responde: timeout e exit 1 (nao pendura ate o timeout do job)', async () => {
    const r = await rodarReal(roteador({ rulesets: { travar: true } }), { env: { SETTINGS_GUARD_TIMEOUT_MS: '300' }, timeoutMs: 15_000 });
    assert.equal(r.code, 1, r.out);
    assert.ok(!r.out.includes('Perimetro OK'), r.out);
  });

  it('JSON invalido num 200 de checagem de protecao e erro (exit 1), nao "campo ausente"', async () => {
    const r = await rodarReal(roteador({ protection: { status: 200, raw: '{"required_status_checks": {' } }));
    assert.equal(r.code, 1, r.out);
    assert.ok(!r.out.includes('Perimetro OK'), r.out);
  });

  it('environments pagina: extra inesperado na pagina 2 e detectado (antes so lia 30)', async () => {
    const pagina1 = BASELINE.environments.concat(Array.from({ length: 96 }, (_, i) => `Preview – b${i}`));
    const handler = (req) => {
      const pg = Number(req.query.page ?? 1);
      const todos = [...pagina1, 'intruso-na-pagina-2'];
      const fatia = todos.slice((pg - 1) * 100, pg * 100);
      return json({ total_count: todos.length, environments: fatia.map((name) => ({ name })) });
    };
    const r = await rodarReal(roteador({ environments: handler }));
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('intruso-na-pagina-2'), r.out);
    assert.equal(postadas(r, 'environments').length, 2);
    assert.ok(postadas(r, 'environments').every((q) => q.query.per_page === '100'));
  });

  it('environments malformado (sem lista, itens nulos) e ponto cego/ignorado, nunca TypeError nem OK por vacuidade', async () => {
    const r = await rodarReal(roteador({ environments: json({ total_count: 0 }) }));
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes('environments: NAO VERIFICAVEL'), r.out);
    const r2 = await rodarReal(roteador({ environments: json({ total_count: 5, environments: [null, { name: 7 }, ...BASELINE.environments.map((name) => ({ name }))] }) }));
    assert.equal(r2.code, 0, r2.out);
  });

  it('environment do baseline faltando e divergencia', async () => {
    const r = await rodarReal(roteador({ environments: json({ total_count: 3, environments: BASELINE.environments.slice(1).map((name) => ({ name })) }) }));
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes('environments.faltando'), r.out);
  });

  it('findIssue le 100 por pagina (a issue do guard nao pode ficar fora da primeira pagina de 10)', async () => {
    const r = await rodarReal(roteador());
    assert.equal(postadas(r, 'issues')[0].query.per_page, '100');
  });
});

describe('settings-guard (HTTP local): restauracao nao pode causar dano', () => {
  const protStrictFalse = (contexts) => json(protOk({ required_status_checks: { strict: false, contexts } }));

  it('NAO faz PATCH com contexts vazios (apagaria os checks obrigatorios)', async () => {
    const r = await rodarReal(roteador({ protection: protStrictFalse([]) }));
    assert.equal(r.code, 1, r.out);
    assert.equal(postadas(r, 'patchChecks').length, 0, `PATCH indevido: ${JSON.stringify(postadas(r, 'patchChecks'))}`);
    assert.ok(r.out.includes('divergencia: branch_protection_main.strict'), r.out);
  });

  it('restaura strict com a lista viva de contexts, lendo a protecao com o token ADMIN quando existe', async () => {
    const r = await rodarReal(
      roteador({
        protection: (req) => (req.auth === 'Bearer admin' ? protStrictFalse([...CHECKS_BASELINE]) : json({ message: 'Resource not accessible by integration' }, 403)),
      }),
      { env: { ADMIN_READ_TOKEN: 'admin' } },
    );
    assert.equal(r.code, 1, r.out);
    const patches = postadas(r, 'patchChecks');
    assert.equal(patches.length, 1, r.out);
    assert.equal(patches[0].auth, 'Bearer x', 'escrita segue com o GITHUB_TOKEN');
    assert.deepEqual(JSON.parse(patches[0].corpo), { strict: true, contexts: CHECKS_BASELINE });
    assert.ok(r.out.includes('Restaurado: branch_protection_main.strict'), r.out);
  });

  it('allow_auto_merge desligado e restaurado com o valor do baseline', async () => {
    const r = await rodarReal(roteador({ repo: json({ ...repoOk(), allow_auto_merge: false }) }));
    assert.equal(r.code, 1, r.out);
    const patches = postadas(r, 'patchRepo');
    assert.equal(patches.length, 1);
    assert.deepEqual(JSON.parse(patches[0].corpo), { allow_auto_merge: true });
  });
});

describe('settings-guard (HTTP local): issue, log e saida', () => {
  it('divergencia abre a issue com label e corpo, e sai 1', async () => {
    const r = await rodarReal(roteador({ rulesets: json([{ id: 1 }]) }));
    assert.equal(r.code, 1, r.out);
    const novas = postadas(r, 'novaIssue');
    assert.equal(novas.length, 1);
    assert.deepEqual(JSON.parse(novas[0].corpo).labels, ['settings-guard']);
    assert.ok(JSON.parse(novas[0].corpo).body.includes('rulesets.count'));
  });

  it('OK com issue aberta fecha a issue; ponto cego NAO fecha', async () => {
    const aberta = json([{ number: 42, title: TITULO, comments: 0, body: '', user: { login: GUARD } }]);
    const ok = await rodarReal(roteador({ issues: aberta }));
    assert.equal(ok.code, 0, ok.out);
    assert.equal(postadas(ok, 'fechar').length, 1);
    const cego = await rodarReal(roteador({ issues: aberta, protection: json({ message: 'Resource not accessible by integration' }, 403) }));
    assert.equal(cego.code, 0, cego.out);
    assert.equal(postadas(cego, 'fechar').length, 0, 'ponto cego nao pode fechar a issue');
  });

  it('erro de API com quebra de linha no corpo nao forja linha ::error:: no log', async () => {
    const r = await rodarReal(roteador({ rulesets: { status: 500, raw: 'falha\n::error::forjado\n::add-mask::x' } }));
    assert.equal(r.code, 1, r.out);
    assert.ok(!r.linhas.some((l) => l.startsWith('::error::forjado') || l.startsWith('::add-mask::')), r.out);
  });

  it('motivo de ponto cego com quebra de linha e pipe nao quebra a tabela da issue', async () => {
    const r = await rodarReal(roteador({ protection: { status: 403, raw: 'linha1\n| col | forjada' } }));
    assert.equal(r.code, 0, r.out);
    const corpo = JSON.parse(postadas(r, 'novaIssue')[0].corpo).body;
    const linhaTabela = corpo.split('\n').filter((l) => l.startsWith('| branch protection'));
    assert.equal(linhaTabela.length, 1, corpo);
    assert.ok(!corpo.includes('linha1\n'), `quebra de linha do motivo vazou para a tabela:\n${corpo}`);
  });

  it('snapshot do perimetro e gravado quando PERIMETER_SNAPSHOT_PATH existe', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'guard snap '));
    try {
      const alvo = join(dir, 'snap.json');
      const r = await rodarReal(roteador({ rulesets: json([{ id: 1 }]) }), { env: { PERIMETER_SNAPSHOT_PATH: alvo } });
      assert.equal(r.code, 1, r.out);
      const snap = JSON.parse(readFileSync(alvo, 'utf8'));
      assert.equal(snap.divergencias.length, 1);
      assert.equal(snap.run_id, '1');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('settings-guard (HTTP local): configuracao e invocacao', () => {
  it('GITHUB_TOKEN vazio e exit 1 sem nenhuma chamada', async () => {
    const r = await rodarReal(roteador(), { env: { GITHUB_TOKEN: '' } });
    assert.equal(r.code, 1, r.out);
    assert.equal(r.requisicoes.length, 0);
  });

  it('GITHUB_REPOSITORY malformado e exit 2 sem nenhuma chamada', async () => {
    for (const repo of ['semBarra', 'a b/c', 'o/r/extra', '/r', 'o/']) {
      const r = await rodarReal(roteador(), { env: { GITHUB_REPOSITORY: repo } });
      assert.equal(r.code, 2, `repo=${repo}: ${r.out}`);
      assert.equal(r.requisicoes.length, 0);
    }
  });

  it('invocado por symlink em pasta com espaco executa a conferencia (antes: exit 0 mudo = falso OK)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'guard link '));
    try {
      const sub = join(dir, 'pasta com espaço');
      mkdirSync(sub);
      const link = join(sub, 'guard.mjs');
      symlinkSync(SCRIPT, link);
      const r = await rodarReal(roteador({ rulesets: json([{ id: 1 }]) }), { script: link });
      assert.equal(r.code, 1, `via symlink o guard deveria detectar o ruleset extra:\n${r.out}`);
      assert.ok(r.requisicoes.length > 0, 'nenhuma requisicao feita: o guard nao rodou');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('baseline estruturalmente invalido: exit 2 sem chamar a API (nao aprova por vacuidade)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'guard bl '));
    try {
      const variantes = {
        secao_vazia: { ...BASELINE, merge: {} },
        sem_actions: (() => { const b = { ...BASELINE }; delete b.actions; return b; })(),
        checks_vazios: { ...BASELINE, branch_protection_main: { ...BASELINE.branch_protection_main, required_status_checks: [] } },
        campo_ignorado: { ...BASELINE, branch_protection_main: { ...BASELINE.branch_protection_main, require_code_owner_reviews: true } },
      };
      for (const [nome, bl] of Object.entries(variantes)) {
        const sub = join(dir, nome);
        mkdirSync(sub);
        copyFileSync(SCRIPT, join(sub, 'guard.mjs'));
        writeFileSync(join(sub, 'github-settings-baseline.json'), JSON.stringify(bl));
        const r = await rodarReal(roteador(), { script: join(sub, 'guard.mjs') });
        assert.equal(r.code, 2, `${nome}: ${r.out}`);
        assert.ok(r.out.includes('baseline invalido'), `${nome}: ${r.out}`);
        assert.equal(r.requisicoes.length, 0, `${nome}: chamou a API com baseline invalido`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("selected-actions: 500 cujo corpo contem '409' NAO e engolido como 409 (baseline 'selected')", async () => {
    const dir = mkdtempSync(join(tmpdir(), 'guard sel '));
    try {
      copyFileSync(SCRIPT, join(dir, 'guard.mjs'));
      const bl = { ...BASELINE, actions: { ...BASELINE.actions, allowed_actions: 'selected' }, selected_actions_patterns: [] };
      writeFileSync(join(dir, 'github-settings-baseline.json'), JSON.stringify(bl));
      const sobre = { actions: json({ enabled: true, allowed_actions: 'selected', sha_pinning_required: false }) };
      const r500 = await rodarReal(roteador({ ...sobre, selected: { status: 500, raw: 'erro interno ref 409' } }), { script: join(dir, 'guard.mjs') });
      assert.equal(r500.code, 1, r500.out);
      const r409 = await rodarReal(roteador({ ...sobre, selected: json({ message: 'All actions and workflows are allowed' }, 409) }), { script: join(dir, 'guard.mjs') });
      assert.equal(r409.code, 0, r409.out);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('settings-guard (HTTP local): campos opcionais do baseline sao conferidos de verdade', () => {
  it('required_conversation_resolution/allow_deletions no baseline divergem da protecao lida', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'guard opc '));
    try {
      copyFileSync(SCRIPT, join(dir, 'guard.mjs'));
      const bl = JSON.parse(JSON.stringify(BASELINE));
      bl.branch_protection_main.required_conversation_resolution = true;
      bl.branch_protection_main.allow_deletions = false;
      writeFileSync(join(dir, 'github-settings-baseline.json'), JSON.stringify(bl));
      const r = await rodarReal(roteador({ protection: json(protOk({ required_conversation_resolution: { enabled: false }, allow_deletions: { enabled: true } })) }), { script: join(dir, 'guard.mjs') });
      assert.equal(r.code, 1, r.out);
      assert.ok(r.out.includes('branch_protection_main.required_conversation_resolution esperado=true encontrado=false'), r.out);
      assert.ok(r.out.includes('branch_protection_main.allow_deletions esperado=false encontrado=true'), r.out);
      const ok = await rodarReal(roteador({ protection: json(protOk({ required_conversation_resolution: { enabled: true }, allow_deletions: { enabled: false } })) }), { script: join(dir, 'guard.mjs') });
      assert.equal(ok.code, 0, ok.out);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('settings-guard: validarBaseline', () => {
  const clone = () => JSON.parse(JSON.stringify(BASELINE));
  it('o baseline versionado e valido', () => {
    assert.deepEqual(validarBaseline(BASELINE), []);
  });
  it('detecta chave a menos, vazia e tipo errado', () => {
    const casos = {
      'nao e objeto': null,
      'array': [],
      'sem branch_protection_main': (() => { const b = clone(); delete b.branch_protection_main; return b; })(),
      'strict string': (() => { const b = clone(); b.branch_protection_main.strict = 'true'; return b; })(),
      'enforce_admins ausente': (() => { const b = clone(); delete b.branch_protection_main.enforce_admins; return b; })(),
      'checks string': (() => { const b = clone(); b.branch_protection_main.required_status_checks = 'a,b'; return b; })(),
      'checks com item vazio': (() => { const b = clone(); b.branch_protection_main.required_status_checks.push(' '); return b; })(),
      'reviews negativo': (() => { const b = clone(); b.branch_protection_main.required_approving_review_count = -1; return b; })(),
      'linear_history string': (() => { const b = clone(); b.branch_protection_main.required_linear_history = 'false'; return b; })(),
      'merge vazio': (() => { const b = clone(); b.merge = {}; return b; })(),
      'merge so comentario': (() => { const b = clone(); b.merge = { _x: 1 }; return b; })(),
      'actions ausente': (() => { const b = clone(); delete b.actions; return b; })(),
      'workflow_permissions lista': (() => { const b = clone(); b.workflow_permissions = []; return b; })(),
      'rulesets_count string': (() => { const b = clone(); b.rulesets_count = '0'; return b; })(),
      'environments ausente': (() => { const b = clone(); delete b.environments; return b; })(),
      'environments com numero': (() => { const b = clone(); b.environments = ['a', 3]; return b; })(),
      'campo desconhecido em branch_protection_main': (() => { const b = clone(); b.branch_protection_main.dismiss_stale_reviews = true; return b; })(),
    };
    for (const [nome, bl] of Object.entries(casos)) {
      assert.ok(validarBaseline(bl).length > 0, `${nome} deveria ser invalido`);
    }
  });
  it('aceita campos opcionais conhecidos e comentarios com underscore', () => {
    const b = clone();
    b.branch_protection_main._nota = 'x';
    b.branch_protection_main.required_conversation_resolution = true;
    b.branch_protection_main.allow_deletions = false;
    assert.deepEqual(validarBaseline(b), []);
  });
});
