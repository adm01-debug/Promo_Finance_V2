#!/usr/bin/env node
/**
 * Confere o perimetro do GitHub contra o baseline versionado
 * (`github-settings-baseline.json`, medido ao vivo via API) e restaura o que sabe restaurar.
 *
 * Portado de Zapp_Web_V2. Lá o GITHUB_TOKEN padrão de workflow (sem o escopo
 * `administration`) fazia o guard morrer em 403 na branch protection sem abrir a issue
 * que deveria abrir, ou — pior — tratar campo omitido (`GET /repos` sem `allow_auto_merge`
 * etc., também por falta de escopo) como divergência real e tentar um PATCH que falhava.
 * Os dois casos aqui são o mesmo problema estrutural de qualquer repo nesta conta: campo
 * que não dá para ler vira **não verificável** (nunca falha silenciosa, nunca "7
 * divergências" por campo ausente), e a issue é aberta de qualquer forma — "não consegui
 * olhar" é justamente o que precisa de gente.
 *
 * Regressão real: restaura via PATCH (o que sabe restaurar) e abre/atualiza a issue
 * [settings-guard], com dedupe de 6 h por causa. Só ponto cego (nada divergiu do que foi
 * possível ler): job verde com `::warning::` e UM comentário por assinatura a cada 7 dias —
 * não um vermelho por run, que ensina a ignorar o vermelho. Tudo OK: fecha a issue.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const REPO = process.env.GITHUB_REPOSITORY ?? 'adm01-debug/Promo_Finance_V2';
const TOKEN = process.env.GITHUB_TOKEN;
// PAT fine-grained com administration:read (secret opcional `SETTINGS_GUARD_TOKEN`) para
// remover o ponto cego de branch protection/actions/merge. `||`, NUNCA `??`: secret ausente
// chega ao processo como string VAZIA, não `undefined`, e com `??` o guard mandaria
// `Authorization: Bearer ` (401, job vermelho) em vez de cair no GITHUB_TOKEN. O workflow
// também passa `SETTINGS_GUARD_TOKEN || github.token`; a comparação com TOKEN distingue
// "dedicado" de "fallback" nos dois casos.
const ADMIN_TOKEN_DEDICADO = (process.env.ADMIN_READ_TOKEN || '').trim();
const TEM_ADMIN_DEDICADO = ADMIN_TOKEN_DEDICADO !== '' && ADMIN_TOKEN_DEDICADO !== TOKEN;
let adminToken = TEM_ADMIN_DEDICADO ? ADMIN_TOKEN_DEDICADO : TOKEN;
let adminRejeitado = false;
// Sem secret dedicado ainda: a mensagem de ponto cego orienta a criar o secret direto
// (PAT fine-grained, administration:read, só este repo) — nenhum runbook a referenciar.
const ORIENTACAO_SEGREDO = 'secret `SETTINGS_GUARD_TOKEN` (PAT fine-grained, escopo administration:read, só este repositório)';
const [OWNER, REPO_NAME] = REPO.split('/');

const ISSUE_LABEL = 'settings-guard';
const ISSUE_TITLE = '[settings-guard] perimeter regression detected';
const BRANCH = 'main';
// W05: so comentarios escritos pelo proprio guard contam para o dedupe. Repo publico:
// qualquer pessoa pode colar o marcador `<!-- causa:... -->` num comentario e, sem esta
// checagem, silenciar o alerta por 6 h / 7 dias (achado no port do Zapp_Web_V2). O GITHUB_TOKEN
// de workflow comenta como `github-actions[bot]`; outro autor so via variavel explicita.
const AUTOR_DO_GUARD = process.env.SETTINGS_GUARD_AUTOR ?? 'github-actions[bot]';
const escritoPeloGuard = (registro) => registro?.user?.login === AUTOR_DO_GUARD;

const baseline = JSON.parse(
  readFileSync(new URL('./github-settings-baseline.json', import.meta.url), 'utf8'),
);

// jssecurity:S5145 — valores vindos da API do GitHub entram no log em #92/#115/#127.
// Quebras de linha / caracteres de controle são neutralizados para impedir que
// esse conteúdo forje linhas de log. Valores normais (números, booleanos) ficam iguais.
const semQuebra = (valor) => String(valor).replace(/[\r\n\u0000-\u001f\u007f]/g, ' ');

// javascript:S2871 — `.sort()` sem comparador. Ordem por código de caractere, deliberadamente
// NÃO `localeCompare`: a assinatura da causa (`assinaturaDe`) é um hash desta ordem e precisa
// ser a mesma em qualquer runner/locale; `localeCompare` muda com o ICU da máquina.
const porCodigo = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Erro de leitura por falta de escopo — não é regressão, é ponto cego. */
class NaoVerificavel extends Error {
  constructor(caminho, status, motivo) {
    super(`${status} em ${caminho}: ${motivo}`);
    this.caminho = caminho;
    this.status = status;
  }
}

/** 401: o token foi recusado (expirado, revogado ou malformado) — nao e falta de escopo. */
class TokenRecusado extends Error {
  constructor(caminho) {
    super(`401 em ${caminho}: token recusado`);
    this.caminho = caminho;
  }
}

async function gh(method, path, body, overrideToken) {
  const tok = overrideToken ?? TOKEN;
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${tok}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'settings-guard/2.0',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new TokenRecusado(path);
  if (res.status === 403 || res.status === 404) {
    const text = await res.text().catch(() => '');
    // 404 aqui também costuma ser escopo, não ausência: a API esconde o recurso.
    throw new NaoVerificavel(path, res.status, text.slice(0, 200));
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json().catch(() => null);
}
// Leituras administrativas usam o PAT fine-grained (administration:read) quando existe;
// escritas (issues, PATCH de restauracao) continuam com o GITHUB_TOKEN.
// PAT recusado (401: expirou, foi revogado) nao derruba o guard: o resto do run volta ao
// GITHUB_TOKEN — os campos administrativos reaparecem como NAO VERIFICAVEL, e o aviso pede
// a rotacao.
async function ghAdmin(method, path, body) {
  try {
    return await gh(method, path, body, adminToken);
  } catch (e) {
    if (!(e instanceof TokenRecusado) || adminToken === TOKEN) throw e;
    adminRejeitado = true;
    adminToken = TOKEN;
    console.log(
      `::warning::SETTINGS_GUARD_TOKEN recusado (401) — expirado ou revogado. Leituras administrativas voltam ao GITHUB_TOKEN neste run; rotacionar o ${ORIENTACAO_SEGREDO}.`,
    );
    return gh(method, path, body, adminToken);
  }
}

/** De onde vieram as leituras administrativas deste run (nunca o valor do token). */
function fonteDaLeituraAdmin() {
  if (adminRejeitado) return 'GITHUB_TOKEN (SETTINGS_GUARD_TOKEN recusado com 401 — rotacionar)';
  if (TEM_ADMIN_DEDICADO) return 'SETTINGS_GUARD_TOKEN';
  return 'GITHUB_TOKEN (SETTINGS_GUARD_TOKEN ausente)';
}

// ---------------------------------------------------------------- checagens
// Cada checagem devolve { campo, esperado, encontrado } ou lança NaoVerificavel.
// `restauravel` diz se o guard sabe desfazer a divergência sozinho.

async function checarBranchProtection() {
  const protection = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/branches/${BRANCH}/protection`);
  const esperado = baseline.branch_protection_main;
  const divergencias = [];

  // W04: resposta 200 que nao e um objeto e ponto cego. Mas `required_status_checks`
  // ausente/null NAO e ponto cego: a API usa `null` para DESLIGAR os checks
  // obrigatorios (achado no port do Zapp_Web_V2). Apagar os 6 checks tem de ser
  // regressao, nunca "campo nao lido".
  if (!protection || typeof protection !== 'object') {
    throw new NaoVerificavel(`/branches/${BRANCH}/protection`, 200, 'resposta nao e um objeto de protecao');
  }
  const checks = protection.required_status_checks ?? null;
  const checksDesligados = checks === null || typeof checks !== 'object';

  const strict = checksDesligados ? null : (checks.strict ?? null);
  if (strict !== esperado.strict) {
    divergencias.push({
      campo: 'branch_protection_main.strict',
      esperado: esperado.strict,
      encontrado: checksDesligados ? 'required_status_checks desligado' : strict,
      // Sem o bloco de checks o PATCH do sub-recurso nao tem o que atualizar.
      restauravel: !checksDesligados,
    });
  }

  const enforceAdmins = protection?.enforce_admins?.enabled ?? null;
  if (enforceAdmins !== esperado.enforce_admins) {
    divergencias.push({ campo: 'branch_protection_main.enforce_admins', esperado: esperado.enforce_admins, encontrado: enforceAdmins, restauravel: false });
  }

  const contexts = checksDesligados ? [] : [...(checks.contexts ?? [])].sort(porCodigo);
  const esperados = [...esperado.required_status_checks].sort(porCodigo);
  if (contexts.join('|') !== esperados.join('|')) {
    divergencias.push({
      campo: 'branch_protection_main.required_status_checks',
      esperado: esperados.join(', '),
      encontrado: contexts.join(', ') || '(nenhum)',
      restauravel: false,
    });
  }

  const linearHistory = protection?.required_linear_history?.enabled ?? null;
  if (linearHistory !== (esperado.required_linear_history ?? null)) {
    divergencias.push({ campo: 'branch_protection_main.required_linear_history', esperado: esperado.required_linear_history ?? null, encontrado: linearHistory, restauravel: false });
  }

  const allowForcePushes = protection?.allow_force_pushes?.enabled ?? null;
  if (allowForcePushes !== (esperado.allow_force_pushes ?? null)) {
    divergencias.push({ campo: 'branch_protection_main.allow_force_pushes', esperado: esperado.allow_force_pushes ?? null, encontrado: allowForcePushes, restauravel: false });
  }

  return divergencias;
}

async function checarRepo() {
  const repo = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}`);
  const divergencias = [];
  const ausentes = [];
  for (const [campo, esperado] of Object.entries(baseline.merge)) {
    // W04: o GET /repos so devolve os campos de merge para quem tem permissao
    // push/admin. Com GITHUB_TOKEN eles simplesmente NAO vem — `null`/ausente
    // aqui e "nao consegui ler", nunca "esta diferente".
    if (!repo || typeof repo !== 'object' || !Object.hasOwn(repo, campo) || repo[campo] === null) {
      ausentes.push(campo);
      continue;
    }
    const encontrado = repo[campo];
    if (encontrado !== esperado) {
      divergencias.push({ campo: `merge.${campo}`, esperado, encontrado, restauravel: campo === 'allow_auto_merge' });
    }
  }
  if (ausentes.length === Object.keys(baseline.merge).length) {
    throw new NaoVerificavel(`/repos (merge.*)`, 200, 'resposta sem os campos de merge: o token nao tem permissao push/admin para le-los');
  }
  if (ausentes.length > 0) {
    return { divergencias, cego: `200 — campos nao expostos ao token: ${ausentes.join(', ')}`, campos: ausentes };
  }
  // W14: security_and_analysis (secret_scanning*)
  const blSec = baseline.security_and_analysis ?? {};
  for (const [chave, valorEsperado] of Object.entries(blSec)) {
    if (chave.startsWith('_')) continue; // skip JSON comment fields
    const encontrado = repo?.security_and_analysis?.[chave]?.status ?? null;
    if (encontrado !== valorEsperado) {
      divergencias.push({ campo: `security_and_analysis.${chave}`, esperado: valorEsperado, encontrado, restauravel: false });
    }
  }
  return divergencias;
}

async function checarActions() {
  const perms = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/actions/permissions`);
  const divergencias = [];
  for (const [campo, esperado] of Object.entries(baseline.actions)) {
    const encontrado = perms?.[campo] ?? null;
    if (encontrado !== esperado) {
      divergencias.push({ campo: `actions.${campo}`, esperado, encontrado, restauravel: false });
    }
  }
  return divergencias;
}

async function checarWorkflowPermissions() {
  const perms = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/actions/permissions/workflow`);
  const divergencias = [];
  const bl = baseline.workflow_permissions ?? {};
  for (const [campo, esperado] of Object.entries(bl)) {
    if (campo.startsWith('_')) continue; // skip JSON comment fields
    const encontrado = perms?.[campo] ?? null;
    if (encontrado !== esperado) {
      divergencias.push({ campo: `workflow_permissions.${campo}`, esperado, encontrado, restauravel: false });
    }
  }
  return divergencias;
}

async function checarSelectedActions() {
  // O endpoint só existe quando `actions.allowed_actions === 'selected'`; com 'all' (caso
  // deste repo hoje) a API responde 409 "All actions and workflows are allowed" — não é
  // ponto cego (nenhum escopo faltando), é a checagem não se aplicar. Sem este atalho,
  // toda run reportaria "actions (parcial)" por um campo que o baseline não pede.
  if (baseline.actions?.allowed_actions !== 'selected') return [];
  const sel = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/actions/permissions/selected-actions`);
  const divergencias = [];
  const blPatterns = [...(baseline.selected_actions_patterns ?? [])].sort();
  // A API devolve padrões com `@*` (wildcard total); strip só esse sufixo.
  // `@v1`, `@sha` e similares são preservados: diferem do baseline e disparam divergência.
  const normalizar = (p) => p.replace(/@\*$/, '');
  const encontradosPatterns = [...new Set((sel?.patterns_allowed ?? []).map(normalizar))].sort();
  if (blPatterns.join('|') !== encontradosPatterns.join('|')) {
    divergencias.push({
      campo: 'selected_actions.patterns_allowed',
      esperado: blPatterns.join(', '),
      encontrado: encontradosPatterns.join(', ') || '(nenhum)',
      restauravel: false,
    });
  }
  const blVerified = baseline.selected_actions_verified_allowed ?? false;
  const encontradoVerified = sel?.verified_allowed ?? false;
  if (encontradoVerified !== blVerified) {
    divergencias.push({ campo: 'selected_actions.verified_allowed', esperado: blVerified, encontrado: encontradoVerified, restauravel: false });
  }
  const blGithubOwned = baseline.selected_actions_github_owned_allowed ?? false;
  const encontradoGithubOwned = sel?.github_owned_allowed ?? false;
  if (encontradoGithubOwned !== blGithubOwned) {
    divergencias.push({ campo: 'selected_actions.github_owned_allowed', esperado: blGithubOwned, encontrado: encontradoGithubOwned, restauravel: false });
  }
  return divergencias;
}

async function checarRulesets() {
  const rulesets = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/rulesets`);
  const divergencias = [];
  const esperado = baseline.rulesets_count ?? 0;
  const encontrado = (rulesets ?? []).length;
  if (encontrado !== esperado) {
    divergencias.push({ campo: 'rulesets.count', esperado, encontrado, restauravel: false });
  }
  return divergencias;
}

async function checarEnvironments() {
  const dados = await ghAdmin('GET', `/repos/${OWNER}/${REPO_NAME}/environments`);
  const encontrados = (dados?.environments ?? []).map((e) => e.name).sort();
  const esperados = [...baseline.environments].sort();
  const prefixosVercel = (baseline.environments_vercel_managed?.prefixos ?? []);
  const faltando = esperados.filter((e) => !encontrados.includes(e));
  // W13: environments extras — podem ser gerenciados pela Vercel ou inesperados.
  const extras = encontrados.filter((e) => !esperados.includes(e));
  const extrasVercel = extras.filter((e) => prefixosVercel.some((p) => e.startsWith(p)));
  const extrasInesperados = extras.filter((e) => !extrasVercel.includes(e));

  const divergencias = [];
  if (faltando.length > 0) {
    divergencias.push({
      campo: 'environments.faltando',
      esperado: faltando.join(', '),
      encontrado: '(ausente)',
      restauravel: false,
    });
  }
  if (extrasVercel.length > 0) {
    // Aviso não bloqueante: Vercel cria/apaga automaticamente, não é regressão do perímetro.
    // Emite annotation do Actions e também avisa no stderr.
    console.error(`::warning::W13: environments gerenciados pela Vercel presentes (não é regressão): ${extrasVercel.join(', ')}`);
  }
  if (extrasInesperados.length > 0) {
    divergencias.push({
      campo: 'environments.extras_inesperados',
      esperado: '(nenhum além dos do baseline)',
      encontrado: extrasInesperados.join(', '),
      restauravel: false,
    });
  }
  return divergencias;
}

// ---------------------------------------------------------------- restauração

async function restaurar(campo) {
  if (campo === 'branch_protection_main.strict') {
    const protection = await gh('GET', `/repos/${OWNER}/${REPO_NAME}/branches/${BRANCH}/protection`);
    const contexts = protection?.required_status_checks?.contexts ?? [];
    await gh('PATCH', `/repos/${OWNER}/${REPO_NAME}/branches/${BRANCH}/protection/required_status_checks`, {
      strict: true,
      contexts,
    });
    return '`branch_protection_main.strict` restaurado para `true`';
  }
  if (campo === 'merge.allow_auto_merge') {
    await gh('PATCH', `/repos/${OWNER}/${REPO_NAME}`, { allow_auto_merge: true });
    return '`merge.allow_auto_merge` restaurado para `true`';
  }
  return null;
}

// ---------------------------------------------------------------- issue

async function findIssue() {
  const issues = await gh('GET', `/repos/${OWNER}/${REPO_NAME}/issues?labels=${ISSUE_LABEL}&state=open&per_page=10`);
  return Array.isArray(issues) ? issues.find((i) => i.title === ISSUE_TITLE) ?? null : null;
}

/**
 * Assinatura estavel da causa: campos divergentes (com o valor lido) + checagens cegas
 * (nome + conjunto ordenado dos campos nao lidos, quando a cegueira e parcial — sem isso
 * "faltou allow_auto_merge" e "faltou allow_squash_merge" davam a mesma assinatura e a
 * mudanca de ponto cego ficava 7 dias suprimida; achado no port do Zapp_Web_V2).
 * Nunca entra: prosa de erro, timestamp, numero de run.
 */
export function assinaturaDe(divergencias, naoVerificaveis) {
  const div = [...divergencias].map((d) => `${d.campo}=${String(d.encontrado)}`).sort(porCodigo);
  const cegos = [...naoVerificaveis]
    .map((n) => `${n.nome}:${[...(n.campos ?? [])].sort(porCodigo).join('|')}`)
    .sort(porCodigo);
  return createHash('sha256').update(JSON.stringify({ div, cegos })).digest('hex').slice(0, 16);
}

const MARCADOR = (assinatura) => `<!-- causa:${assinatura} -->`;
const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Registro MAIS RECENTE da issue que carrega o marcador desta causa (comentario ou o
 * proprio corpo), escrito PELO GUARD. Olha as 2 ultimas paginas (ate 200 comentarios): um
 * comentario humano ou de outro bot depois do marcador nao pode zerar o dedupe, e um
 * marcador colado por terceiros nao pode acioná-lo (achado no port do Zapp_Web_V2).
 * Devolve null quando a causa nunca foi registrada.
 */
async function registroMaisRecenteCom(issue, marcador) {
  const total = Number(issue.comments ?? 0);
  if (total > 0) {
    const ultimaPagina = Math.max(1, Math.ceil(total / 100));
    for (const pagina of [ultimaPagina, ultimaPagina - 1]) {
      if (pagina < 1) continue;
      const comentarios = await gh('GET', `/repos/${OWNER}/${REPO_NAME}/issues/${issue.number}/comments?per_page=100&page=${pagina}`);
      if (!Array.isArray(comentarios)) continue;
      for (let i = comentarios.length - 1; i >= 0; i -= 1) {
        const c = comentarios[i];
        if (escritoPeloGuard(c) && (c.body ?? '').includes(marcador)) return { body: c.body, created_at: c.created_at };
      }
    }
  }
  if (escritoPeloGuard(issue) && (issue.body ?? '').includes(marcador)) return { body: issue.body, created_at: issue.created_at };
  return null;
}

/**
 * W05: dedupe por causa. Comenta de novo so se esta causa ainda nao foi registrada
 * na janela (6 h com divergencia real, 7 dias so com ponto cego) ou se houve
 * restauracao EFETIVA (que precisa ficar registrada sempre; tentativa que falhou
 * nao forca — senao um PATCH 403 recorrente comentaria a cada 6 h).
 */
async function abrirOuAtualizarIssue(body, { assinatura, janelaMs, forcar = false } = {}) {
  const existing = await findIssue();
  if (existing) {
    if (assinatura && !forcar) {
      const registro = await registroMaisRecenteCom(existing, MARCADOR(assinatura));
      const idadeMs = registro?.created_at ? Date.now() - new Date(registro.created_at).getTime() : Infinity;
      if (registro && idadeMs < janelaMs) {
        console.log(`Dedupe: mesma causa (${assinatura}) ha menos de ${Math.round(janelaMs / 3600000)} h; comentario suprimido (issue #${semQuebra(existing.number)}).`);
        return existing.number;
      }
    }
    await gh('POST', `/repos/${OWNER}/${REPO_NAME}/issues/${existing.number}/comments`, { body });
    console.log(`Issue #${semQuebra(existing.number)} atualizada com novo comentario.`);
    return existing.number;
  }
  await gh('POST', `/repos/${OWNER}/${REPO_NAME}/labels`, {
    name: ISSUE_LABEL,
    color: 'e11d48',
    description: 'Perimeter regression detected by settings-guard',
  }).catch(() => {});
  const issue = await gh('POST', `/repos/${OWNER}/${REPO_NAME}/issues`, {
    title: ISSUE_TITLE,
    body,
    labels: [ISSUE_LABEL],
  });
  console.log(`Issue #${semQuebra(issue.number)} aberta.`);
  return issue.number;

}

async function fecharIssue() {
  const existing = await findIssue();
  if (!existing) return;
  await gh('PATCH', `/repos/${OWNER}/${REPO_NAME}/issues/${existing.number}`, {
    state: 'closed',
    state_reason: 'completed',
  });
  await gh('POST', `/repos/${OWNER}/${REPO_NAME}/issues/${existing.number}/comments`, {
    body: '✅ Perimetro conferido contra o baseline — fechando automaticamente.',
  });
  console.log(`Issue #${existing.number} fechada.`);
}

// ---------------------------------------------------------------- principal

async function main() {
  if (!TOKEN) {
    console.error('::error::GITHUB_TOKEN ausente');
    process.exit(1);
  }
  console.log(`Leitura administrativa: ${fonteDaLeituraAdmin()}`);
  const checagens = [
    ['branch protection', checarBranchProtection],
    ['merge/repo', checarRepo],
    ['actions', checarActions],
    ['workflow permissions', checarWorkflowPermissions],
    ['selected actions', checarSelectedActions],
    ['rulesets', checarRulesets],
    ['environments', checarEnvironments],
  ];

  const divergencias = [];
  const naoVerificaveis = [];

  for (const [nome, fn] of checagens) {
    try {
      const resultado = await fn();
      const encontradas = Array.isArray(resultado) ? resultado : resultado.divergencias;
      if (!Array.isArray(resultado) && resultado.cego) {
        console.log(`::warning::${nome}: PARCIALMENTE VERIFICAVEL — ${semQuebra(resultado.cego)}`);
        naoVerificaveis.push({ nome: `${nome} (parcial)`, motivo: resultado.cego, campos: resultado.campos ?? [] });
      }
      console.log(`${nome}: ${encontradas.length === 0 ? 'OK' : `${encontradas.length} divergencia(s)`}`);
      divergencias.push(...encontradas);
    } catch (e) {
      if (e instanceof NaoVerificavel) {
        // Ponto cego declarado: não é regressão, mas precisa aparecer.
        console.log(`::warning::${nome}: NAO VERIFICAVEL — ${semQuebra(e.message)}`);
        naoVerificaveis.push({ nome, motivo: `${e.status} — ${e.message.split(': ').slice(1).join(': ')}`, campos: [String(e.status)] });
      } else {
        throw e;
      }
    }
  }

  for (const d of divergencias) {
    console.log(`divergencia: ${semQuebra(d.campo)} esperado=${semQuebra(d.esperado)} encontrado=${semQuebra(d.encontrado)}`);
  }

  // W17: salva snapshot do perimetro medido para artifact de diff.
  const snapshotPath = process.env.PERIMETER_SNAPSHOT_PATH;
  if (snapshotPath) {
    const snapshot = {
      medido_em: new Date().toISOString(),
      run_id: process.env.GITHUB_RUN_ID ?? 'manual',
      divergencias,
      nao_verificaveis: naoVerificaveis,
    };
    writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    console.log(`Snapshot do perimetro salvo em ${snapshotPath}`);
  }

  if (divergencias.length === 0 && naoVerificaveis.length === 0) {
    console.log('✅ Perimetro OK — nenhuma regressao detectada.');
    await fecharIssue();
    return;
  }

  // Restaura só o que o guard sabe restaurar; o resto vira alerta. Sucesso e falha
  // ficam em listas separadas: so o sucesso forca comentario (achado no port do Zapp_Web_V2).
  const restaurados = [];
  const restauracoesEfetivas = [];
  for (const d of divergencias.filter((x) => x.restauravel)) {
    try {
      const feito = await restaurar(d.campo);
      if (feito) {
        restaurados.push(feito);
        restauracoesEfetivas.push(d.campo);
        console.log(`Restaurado: ${semQuebra(d.campo)}`);
      }
    } catch (e) {
      restaurados.push(`⚠️ falhou ao restaurar \`${d.campo}\`: ${e.message.split(':')[0]}`);
    }
  }

  const soCegos = divergencias.length === 0;
  const assinatura = assinaturaDe(divergencias, naoVerificaveis);
  const linhas = [
    MARCADOR(assinatura),
    soCegos ? '## 👁️ Ponto cego do perímetro (nada divergiu do que foi possível ler)' : '## ⚠️ Divergência de perímetro detectada',
    '',
    `Baseline: \`scripts/ci/github-settings-baseline.json\` (medido em ${baseline.medido_em})`,
    '',
  ];

  if (divergencias.length > 0) {
    linhas.push(
      '### Divergências',
      '',
      '| Campo | Esperado | Encontrado |',
      '|---|---|---|',
      ...divergencias.map(
        (d) =>
          `| \`${semQuebra(d.campo)}\` | \`${semQuebra(d.esperado)}\` | \`${semQuebra(d.encontrado)}\` |`,
      ),
      '',
    );
  }

  if (naoVerificaveis.length > 0) {
    linhas.push(
      '### Não verificável com o token do workflow',
      '',
      'Estes campos **não puderam ser conferidos** — a API exige escopo que o token usado não tem.',
      'Não é "está tudo certo": é "não consegui olhar".',
      '',
      `Leitura administrativa deste run: ${fonteDaLeituraAdmin()}. Para eliminar este ponto cego, crie o ${ORIENTACAO_SEGREDO}.`,
      '',
      '| Checagem | Motivo |',
      '|---|---|',
      ...naoVerificaveis.map((n) => `| ${n.nome} | ${n.motivo.replace(/\|/g, '/')} |`),
      '',
    );
  }

  if (restaurados.length > 0) {
    linhas.push('### Restaurações aplicadas', '', ...restaurados.map((r) => `- ${r}`), '');
  }

  linhas.push(
    `Run: https://github.com/${REPO}/actions/runs/${process.env.GITHUB_RUN_ID ?? 'manual'}`,
    `Timestamp: ${new Date().toISOString()}`,
  );

  await abrirOuAtualizarIssue(linhas.join('\n'), {
    assinatura,
    janelaMs: soCegos ? SETE_DIAS_MS : SEIS_HORAS_MS,
    forcar: restauracoesEfetivas.length > 0,
  });

  if (soCegos) {
    // "nao consegui olhar" precisa de gente (a issue existe para isso), mas NAO e
    // regressao — um run vermelho a cada 6 h por falta de escopo ensina a ignorar o
    // vermelho. O job sai verde com aviso; a credencial de leitura administrativa
    // dedicada e o que fecha o ponto cego de verdade.
    console.log(`::warning::Perimetro com ${naoVerificaveis.length} ponto(s) cego(s) e nenhuma divergencia lida. Ver issue [settings-guard].`);
    return;
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error('::error::' + e.message);
    process.exit(1);
  });
}
