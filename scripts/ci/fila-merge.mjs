#!/usr/bin/env node
// Fila de atualização de branch serial para as PRs abertas contra `main`.
//
// Por que existe: com `strict=true` na branch protection (8 required status checks),
// toda PR fica BEHIND a cada merge na main. Atualizar TODAS de uma vez faz as N
// recomeçarem a CI inteira ao mesmo tempo, disputando runner — e isso não aproxima
// nenhuma PR do merge mais rápido. Este script escolhe só UMA por execução (FIFO
// pelo número da PR) e deixa a próxima execução pegar a seguinte.
//
// Diferença do design do Zapp_Web_V2 (de onde isto foi portado): lá a fila só age em
// PR com GitHub auto-merge ligado, e usa esse auto-merge como sinal de "já está em
// voo" (CI rodando de propósito). Aqui o merge é manual (AGENTS.md regra 6.5 — a
// sessão mergeia, não o GitHub), então não há `autoMergeRequest` para usar como
// sinal: a fila atua em TODA PR aberta, não-draft, contra `main`, e processa uma
// BEHIND por execução. PR com check obrigatório falhando fica fora da fila (rodaria
// de novo para falhar de novo); PR em conflito real (`DIRTY`) só sai do relatório
// quando o autor resolver.
//
// Uso no workflow: `node scripts/ci/fila-merge.mjs` (lê `gh pr list` e grava
// `pr=<número>` + `fila=<lista>` em $GITHUB_OUTPUT quando há alguém a atualizar).

import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function erroTransitorio(err) {
  const msg = String(err?.stderr ?? err?.message ?? '');
  return /HTTP (429|50[0234])|50[234] Bad Gateway|50[234] Service Unavailable|connection reset|ECONNRESET|ETIMEDOUT|timeout expired|unexpected end of JSON/i.test(msg);
}

// Teto por chamada ao `gh`: sem ele um GitHub travado segura o job até o timeout-minutes
// do workflow. ETIMEDOUT (execFileSync) entra em `erroTransitorio` e é re-tentado.
const TIMEOUT_GH_MS = 60_000;

async function execComRetry(cmd, args, opts, { tentativas = 4, delaysMs = [5000, 10000, 20000] } = {}) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return execFileSync(cmd, args, { timeout: TIMEOUT_GH_MS, ...opts });
    } catch (err) {
      if (!erroTransitorio(err) || i >= tentativas - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[Math.min(i, delaysMs.length - 1)]));
    }
  }
}

/** Lê os required status checks da branch protection de `main` (fonte viva, não baseline).
 *  Fallback: lê do baseline versionado se a API retornar 403 (GITHUB_TOKEN sem `administration:read`). */
export async function checksObrigatorios(repo, { exec = execComRetry } = {}) {
  try {
    const saida = await exec('gh', [
      'api', `repos/${repo}/branches/main/protection/required_status_checks`, '--jq', '.contexts',
    ], { encoding: 'utf8' });
    const vivos = JSON.parse(saida);
    if (ehListaDeNomes(vivos)) return vivos;
    // 200 sem `.contexts` em forma de lista (null/objeto): não dá para confiar; o baseline
    // versionado é a fonte auditável (mesmo caminho do 403).
    console.log('::warning::Resposta inesperada para required_status_checks (sem lista de contexts); usando baseline versionado.');
    return checksDoBaseline();
  } catch (err) {
    const msg = String(err?.stderr ?? err?.message ?? '');
    if (/HTTP 403|Resource not accessible/i.test(msg)) {
      // GITHUB_TOKEN não tem escopo `administration:read`; usa o baseline versionado
      // como fonte de verdade auditável (scripts/ci/github-settings-baseline.json).
      console.log('::warning::Sem permissão para ler branch protection via API (403); usando baseline versionado.');
      return checksDoBaseline();
    }
    throw err;
  }
}

const ehListaDeNomes = (v) => Array.isArray(v) && v.every((n) => typeof n === 'string' && n !== '');

function checksDoBaseline() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const baseline = JSON.parse(readFileSync(join(dir, 'github-settings-baseline.json'), 'utf8'));
  const checks = baseline.branch_protection_main?.required_status_checks;
  // Baseline sem a lista não pode virar "nenhum check obrigatório" em silêncio: a fila
  // passaria a atualizar PR com check vermelho. Falha alto (workflow vermelho) em vez disso.
  if (!ehListaDeNomes(checks)) throw new Error('github-settings-baseline.json sem branch_protection_main.required_status_checks (lista de nomes)');
  return checks;
}

const PASSOU = new Set(['SUCCESS', 'SKIPPED', 'NEUTRAL']);
const FALHOU = new Set(['FAILURE', 'TIMED_OUT', 'STARTUP_FAILURE', 'ERROR']);

// Estado de UM check obrigatório no head da PR: 'passou' | 'falhou' | 'pendente'.
// CANCELLED e ACTION_REQUIRED contam como pendente: não são defeito do código, e a
// próxima atualização roda o check de novo.
export function estadoDoCheck(rollup, nome) {
  const entradas = (Array.isArray(rollup) ? rollup : []).filter((c) => c && (c.name ?? c.context) === nome);
  if (entradas.length === 0) return 'pendente';
  const atual = entradas.reduce((a, b) => (String(b.startedAt ?? '') > String(a.startedAt ?? '') ? b : a));
  if (atual.__typename === 'StatusContext' || atual.state) {
    if (atual.state === 'SUCCESS') return 'passou';
    if (atual.state === 'FAILURE' || atual.state === 'ERROR') return 'falhou';
    return 'pendente';
  }
  if (atual.status !== 'COMPLETED') return 'pendente';
  if (PASSOU.has(atual.conclusion)) return 'passou';
  if (FALHOU.has(atual.conclusion)) return 'falhou';
  return 'pendente';
}

// 'fora' | 'conflito' | 'em-dia' | 'atrasada'
export function classificar(pr) {
  // Fail-closed: campo ausente/null NÃO vira "não é draft / não é fork / base main". Só age
  // quando a API disse explicitamente `false` (draft/fork) e `main` (base).
  if (pr.isDraft !== false || pr.baseRefName !== 'main') return 'fora';
  if (pr.mergeStateStatus === 'DIRTY') return 'conflito'; // conflito real: só o autor resolve
  // PR de fork: o GITHUB_TOKEN não escreve no repositório de origem — update-branch
  // nunca funcionaria. Fica fora da fila (não é "conflito", é limitação de permissão).
  if (pr.isCrossRepository !== false) return 'fora';
  if (pr.mergeStateStatus !== 'BEHIND') return 'em-dia';
  return 'atrasada';
}

export function decidir(prs, obrigatorios) {
  // Número inválido (string, 0, null) nunca entra: iria para `pr=`/`fila=` sem passar no filtro de inteiros.
  const classes = prs.filter((pr) => pr && Number.isInteger(pr.number) && pr.number > 0)
    .map((pr) => ({ pr, classe: classificar(pr) }));
  const conflitos = classes.filter((c) => c.classe === 'conflito').map((c) => c.pr.number).sort((a, b) => a - b);
  const atrasadas = classes.filter((c) => c.classe === 'atrasada');
  const bloqueadas = atrasadas
    .filter((c) => obrigatorios.some((n) => estadoDoCheck(c.pr.statusCheckRollup, n) === 'falhou'))
    .map((c) => c.pr.number);
  const fila = atrasadas
    .filter((c) => !bloqueadas.includes(c.pr.number))
    .map((c) => c.pr.number)
    .sort((a, b) => a - b); // FIFO pelo número da PR: quem abriu primeiro espera menos
  if (fila.length === 0) return { acao: 'nada', conflitos, bloqueadas };
  // `fila` vai inteira, em ordem: se o update-branch da primeira for recusado
  // (403/422), o workflow tenta a próxima na mesma execução em vez de travar.
  return { acao: 'atualizar', pr: fila[0], fila, restantes: fila.slice(1), conflitos, bloqueadas };
}

// Depois de uma recusa 403/422, o laço do workflow só tenta o próximo candidato se uma
// decisão recalculada AGORA ainda o autoriza: ele é a PRIMEIRA da fila recalculada que
// ainda não foi recusada nesta execução. A lista lida no início pode estar velha.
export function confirmarCandidato(decisao, numero, recusadas = []) {
  if (decisao.acao !== 'atualizar') return false;
  return decisao.fila.find((n) => !recusadas.includes(n)) === numero;
}

// `gh pr list` devolve mergeStateStatus=UNKNOWN enquanto o GitHub não calculou a
// mergeabilidade (cálculo assíncrono). Para essas, a defasagem vem de uma comparação
// direta (compare main...head → behind_by), que não depende desse cálculo.
export async function resolverDesconhecidos(prs, behindBy) {
  const saida = [];
  for (const pr of prs) {
    if (pr.mergeStateStatus !== 'UNKNOWN' || pr.isDraft !== false || pr.isCrossRepository !== false || !pr.headRefOid) {
      saida.push(pr);
      continue;
    }
    let atras = null;
    try {
      atras = await behindBy(pr.headRefOid);
    } catch {
      atras = null; // sem resposta: continua UNKNOWN (conservador — não entra na fila)
    }
    saida.push(atras > 0 ? { ...pr, mergeStateStatus: 'BEHIND' } : pr);
  }
  return saida;
}

const LIMITE_PRS = 100;

async function decisaoAtual(repo) {
  const obrigatorios = await checksObrigatorios(repo);
  let json;
  try {
    json = await execComRetry('gh', [
      'pr', 'list', '--repo', repo, '--state', 'open', '--base', 'main', '--limit', String(LIMITE_PRS),
      '--json', 'number,isDraft,isCrossRepository,baseRefName,headRefOid,mergeStateStatus,statusCheckRollup',
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    console.log('::warning::Não foi possível listar as PRs abertas; fila pausada nesta execução.');
    console.error(`gh pr list falhou (${err.message?.split('\n')[0]}); nenhuma PR atualizada nesta execução.`);
    return { ...decidir([], obrigatorios), falhou: true };
  }
  const behindBy = async (head) => Number((await execComRetry('gh', [
    'api', `repos/${repo}/compare/main...${head}`, '--jq', '.behind_by',
  ], { encoding: 'utf8' })).trim());
  let parsedPrs;
  try { parsedPrs = JSON.parse(json); } catch { parsedPrs = null; }
  if (!Array.isArray(parsedPrs)) {
    console.log('::warning::Resposta de `gh pr list` não é uma lista JSON; fila pausada nesta execução.');
    return { ...decidir([], obrigatorios), falhou: true };
  }
  // `--limit 100` corta em silêncio: PR além da centésima nunca entraria na fila.
  if (parsedPrs.length >= LIMITE_PRS) console.log(`::warning::${parsedPrs.length} PRs abertas (limite da consulta = ${LIMITE_PRS}); PRs além do limite não entram na fila.`);
  const prs = await resolverDesconhecidos(parsedPrs, behindBy);
  return decidir(prs, obrigatorios);
}

const USO = 'Uso: node scripts/ci/fila-merge.mjs [--confirmar N [--recusadas "A B"]]  (exige GITHUB_REPOSITORY=dono/repo)';

// Flag desconhecida ou sem valor é exit 2: ignorar em silêncio (`--confirmr 5`) rodaria o
// modo "escolher e gravar output" no lugar do modo "confirmar".
function lerArgs(argv) {
  const args = { confirmar: null, recusadas: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') return { ajuda: true };
    if (a === '--confirmar' || a === '--recusadas') {
      const valor = argv[i + 1];
      if (valor === undefined || (a === '--confirmar' && valor.startsWith('--'))) {
        return { erro: `${a} exige um valor` };
      }
      i++;
      if (a === '--confirmar') {
        if (!/^[1-9]\d*$/.test(valor.trim())) return { erro: '--confirmar exige o número da PR' };
        args.confirmar = Number(valor);
      } else {
        const itens = valor.split(/\s+/).filter(Boolean);
        if (!itens.every((n) => /^[1-9]\d*$/.test(n))) return { erro: `--recusadas inválido: ${JSON.stringify(valor)}` };
        args.recusadas = itens.map(Number);
      }
      continue;
    }
    return { erro: `argumento desconhecido: ${a}` };
  }
  if (args.recusadas.length && args.confirmar === null) return { erro: '--recusadas só vale junto de --confirmar' };
  return args;
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  if (args.ajuda) {
    console.log(USO);
    return;
  }
  if (args.erro) {
    console.error(`${args.erro}\n${USO}`);
    process.exit(2);
  }
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    console.error('GITHUB_REPOSITORY ausente');
    process.exit(2);
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.error(`GITHUB_REPOSITORY inválido: ${JSON.stringify(repo)} (esperado dono/repo)`);
    process.exit(2);
  }
  // `--confirmar N [--recusadas "A B"]`: exit 0 se N é a próxima da fila recalculada,
  // desconsideradas as já recusadas nesta execução; 3 se não. Não escreve output.
  if (args.confirmar !== null) {
    const decisao = await decisaoAtual(repo);
    if (confirmarCandidato(decisao, args.confirmar, args.recusadas)) return;
    console.log(`Fila recalculada não autoriza #${args.confirmar} (não é mais a próxima).`);
    process.exit(3);
  }
  const decisao = await decisaoAtual(repo);
  const linhas = [];
  if (decisao.falhou) linhas.push('Não foi possível ler as PRs abertas; nenhuma atualizada nesta execução (a próxima reavalia).');
  else if (decisao.acao === 'nada') linhas.push('Nenhuma PR atrasada esperando atualização.');
  if (decisao.acao === 'atualizar') {
    linhas.push(`Próxima da fila: #${decisao.pr}.`);
    if (decisao.restantes.length) linhas.push(`Esperando a vez (sem gastar CI): #${decisao.restantes.join(', #')}.`);
  }
  if (decisao.bloqueadas.length) linhas.push(`Fora da fila até corrigir check obrigatório: #${decisao.bloqueadas.join(', #')}.`);
  if (decisao.conflitos.length) linhas.push(`Conflito real com main — só o autor resolve: #${decisao.conflitos.join(', #')}.`);
  for (const l of linhas) console.log(l);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Fila de atualização de branch\n\n${linhas.map((l) => `- ${l}`).join('\n')}\n`);
  if (process.env.GITHUB_OUTPUT && decisao.acao === 'atualizar') {
    const fila = decisao.fila.filter((n) => Number.isInteger(n) && n > 0).join(' ');
    appendFileSync(process.env.GITHUB_OUTPUT, `pr=${decisao.pr}\nfila=${fila}\n`);
  }
}

// `process.argv[1] === fileURLToPath(import.meta.url)` falha com symlink no caminho (o
// Node resolve o módulo para o caminho real, argv[1] não) e o script sairia 0 sem fazer nada.
function executadoDiretamente() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (executadoDiretamente()) await main();
