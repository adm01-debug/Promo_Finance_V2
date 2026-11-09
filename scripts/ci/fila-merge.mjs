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

import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function erroTransitorio(err) {
  const msg = String(err?.stderr ?? err?.message ?? '');
  return /HTTP 50[234]|50[234] Bad Gateway|50[234] Service Unavailable|connection reset|ECONNRESET|ETIMEDOUT|timeout expired|unexpected end of JSON/i.test(msg);
}

async function execComRetry(cmd, args, opts, { tentativas = 4, delaysMs = [5000, 10000, 20000] } = {}) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return execFileSync(cmd, args, opts);
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
    return JSON.parse(saida);
  } catch (err) {
    const msg = String(err?.stderr ?? err?.message ?? '');
    if (/HTTP 403|Resource not accessible/i.test(msg)) {
      // GITHUB_TOKEN não tem escopo `administration:read`; usa o baseline versionado
      // como fonte de verdade auditável (scripts/ci/github-settings-baseline.json).
      console.log('::warning::Sem permissão para ler branch protection via API (403); usando baseline versionado.');
      const dir = dirname(fileURLToPath(import.meta.url));
      const baseline = JSON.parse(readFileSync(join(dir, 'github-settings-baseline.json'), 'utf8'));
      return baseline.branch_protection_main?.required_status_checks ?? [];
    }
    throw err;
  }
}

const PASSOU = new Set(['SUCCESS', 'SKIPPED', 'NEUTRAL']);
const FALHOU = new Set(['FAILURE', 'TIMED_OUT', 'STARTUP_FAILURE', 'ERROR']);

// Estado de UM check obrigatório no head da PR: 'passou' | 'falhou' | 'pendente'.
// CANCELLED e ACTION_REQUIRED contam como pendente: não são defeito do código, e a
// próxima atualização roda o check de novo.
export function estadoDoCheck(rollup, nome) {
  const entradas = (rollup ?? []).filter((c) => (c.name ?? c.context) === nome);
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
  if (pr.isDraft || (pr.baseRefName && pr.baseRefName !== 'main')) return 'fora';
  if (pr.mergeStateStatus === 'DIRTY') return 'conflito'; // conflito real: só o autor resolve
  // PR de fork: o GITHUB_TOKEN não escreve no repositório de origem — update-branch
  // nunca funcionaria. Fica fora da fila (não é "conflito", é limitação de permissão).
  if (pr.isCrossRepository) return 'fora';
  if (pr.mergeStateStatus !== 'BEHIND') return 'em-dia';
  return 'atrasada';
}

export function decidir(prs, obrigatorios) {
  const classes = prs.map((pr) => ({ pr, classe: classificar(pr) }));
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
    if (pr.mergeStateStatus !== 'UNKNOWN' || pr.isDraft || !pr.headRefOid) {
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

async function decisaoAtual(repo) {
  const obrigatorios = await checksObrigatorios(repo);
  let json;
  try {
    json = await execComRetry('gh', [
      'pr', 'list', '--repo', repo, '--state', 'open', '--base', 'main', '--limit', '100',
      '--json', 'number,isDraft,isCrossRepository,baseRefName,headRefOid,mergeStateStatus,statusCheckRollup',
    ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    console.error(`gh pr list falhou (${err.message?.split('\n')[0]}); nenhuma PR atualizada nesta execução.`);
    return decidir([], obrigatorios);
  }
  const behindBy = async (head) => Number((await execComRetry('gh', [
    'api', `repos/${repo}/compare/main...${head}`, '--jq', '.behind_by',
  ], { encoding: 'utf8' })).trim());
  let parsedPrs;
  try { parsedPrs = JSON.parse(json); } catch { return decidir([], obrigatorios); }
  const prs = await resolverDesconhecidos(parsedPrs, behindBy);
  return decidir(prs, obrigatorios);
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    console.error('GITHUB_REPOSITORY ausente');
    process.exit(2);
  }
  // `--confirmar N [--recusadas "A B"]`: exit 0 se N é a próxima da fila recalculada,
  // desconsideradas as já recusadas nesta execução; 3 se não. Não escreve output.
  const iConfirmar = process.argv.indexOf('--confirmar');
  if (iConfirmar !== -1) {
    const numero = Number(process.argv[iConfirmar + 1]);
    if (!Number.isInteger(numero) || numero <= 0) {
      console.error('--confirmar exige o número da PR');
      process.exit(2);
    }
    const iRecusadas = process.argv.indexOf('--recusadas');
    const recusadas = iRecusadas === -1 ? [] : String(process.argv[iRecusadas + 1] ?? '')
      .split(/\s+/).map(Number).filter((n) => Number.isInteger(n) && n > 0);
    const decisao = await decisaoAtual(repo);
    if (confirmarCandidato(decisao, numero, recusadas)) return;
    console.log(`Fila recalculada não autoriza #${numero} (não é mais a próxima).`);
    process.exit(3);
  }
  const decisao = await decisaoAtual(repo);
  const linhas = [];
  if (decisao.acao === 'nada') linhas.push('Nenhuma PR atrasada esperando atualização.');
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

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
