import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checksObrigatorios,
  classificar,
  confirmarCandidato,
  decidir,
  estadoDoCheck,
  resolverDesconhecidos,
} from './fila-merge.mjs';

const OBRIGATORIOS = ['Quality Gate & Tests', 'Unit tests (offline, deterministic)'];

const pr = (number, over = {}) => ({
  number,
  isDraft: false,
  isCrossRepository: false,
  baseRefName: 'main',
  headRefOid: `sha-${number}`,
  mergeStateStatus: 'BEHIND',
  statusCheckRollup: [],
  ...over,
});

test('classificar separa draft, base errada, conflito, fork e em-dia', () => {
  assert.equal(classificar(pr(1, { isDraft: true })), 'fora');
  assert.equal(classificar(pr(2, { baseRefName: 'outra' })), 'fora');
  assert.equal(classificar(pr(3, { mergeStateStatus: 'DIRTY' })), 'conflito');
  assert.equal(classificar(pr(4, { isCrossRepository: true })), 'fora');
  assert.equal(classificar(pr(5, { mergeStateStatus: 'CLEAN' })), 'em-dia');
  assert.equal(classificar(pr(6, { mergeStateStatus: 'BEHIND' })), 'atrasada');
});

test('estadoDoCheck le a entrada mais recente e falha por FAILURE/ERROR', () => {
  assert.equal(estadoDoCheck([], 'X'), 'pendente', 'sem entrada e pendente');
  assert.equal(estadoDoCheck([{ name: 'X', status: 'COMPLETED', conclusion: 'SUCCESS' }], 'X'), 'passou');
  assert.equal(estadoDoCheck([{ name: 'X', status: 'COMPLETED', conclusion: 'FAILURE' }], 'X'), 'falhou');
  assert.equal(estadoDoCheck([{ name: 'X', status: 'IN_PROGRESS' }], 'X'), 'pendente');
  assert.equal(estadoDoCheck([{ context: 'X', state: 'FAILURE' }], 'X'), 'falhou');
  const antiga = { name: 'X', status: 'COMPLETED', conclusion: 'FAILURE', startedAt: '2026-01-01T00:00:00Z' };
  const nova = { name: 'X', status: 'COMPLETED', conclusion: 'SUCCESS', startedAt: '2026-01-02T00:00:00Z' };
  assert.equal(estadoDoCheck([antiga, nova], 'X'), 'passou', 'a entrada mais recente vence');
});

test('decidir: fila FIFO pelo numero, so atualiza quem nao tem check obrigatorio falhando', () => {
  const prs = [
    pr(20, { mergeStateStatus: 'DIRTY' }), // conflito
    pr(10), // atrasada, elegivel
    pr(15, { statusCheckRollup: [{ name: 'Quality Gate & Tests', status: 'COMPLETED', conclusion: 'FAILURE' }] }), // bloqueada
    pr(30, { mergeStateStatus: 'CLEAN' }), // em dia, fora da fila
  ];
  const decisao = decidir(prs, OBRIGATORIOS);
  assert.equal(decisao.acao, 'atualizar');
  assert.equal(decisao.pr, 10, 'a mais antiga (menor numero) elegivel vai primeiro');
  assert.deepEqual(decisao.fila, [10]);
  assert.deepEqual(decisao.conflitos, [20]);
  assert.deepEqual(decisao.bloqueadas, [15]);
});

test('decidir: sem ninguem atrasado e elegivel, acao e nada', () => {
  const decisao = decidir([pr(1, { mergeStateStatus: 'CLEAN' })], OBRIGATORIOS);
  assert.equal(decisao.acao, 'nada');
});

test('decidir: duas atrasadas elegiveis — a fila inteira sai em ordem, restantes esperam', () => {
  const decisao = decidir([pr(50), pr(12)], OBRIGATORIOS);
  assert.equal(decisao.pr, 12);
  assert.deepEqual(decisao.fila, [12, 50]);
  assert.deepEqual(decisao.restantes, [50]);
});

test('confirmarCandidato: so autoriza quem e a primeira da fila recalculada, descontadas recusas', () => {
  const decisao = decidir([pr(10), pr(20)], OBRIGATORIOS);
  assert.equal(confirmarCandidato(decisao, 10, []), true);
  assert.equal(confirmarCandidato(decisao, 20, []), false, '20 nao e a primeira');
  assert.equal(confirmarCandidato(decisao, 20, [10]), true, 'com 10 recusada, 20 passa a ser a primeira');
  assert.equal(confirmarCandidato({ acao: 'nada' }, 10, []), false, 'sem fila, nada se confirma');
});

test('resolverDesconhecidos vira BEHIND so quando a comparacao real confirma atraso', async () => {
  const comparar = async (sha) => (sha === 'sha-atrasada' ? 3 : 0);
  const prs = [
    pr(1, { mergeStateStatus: 'UNKNOWN', headRefOid: 'sha-atrasada' }),
    pr(2, { mergeStateStatus: 'UNKNOWN', headRefOid: 'sha-em-dia' }),
    pr(3, { mergeStateStatus: 'CLEAN' }), // nao e UNKNOWN: nao chama a comparacao
  ];
  const resolvidos = await resolverDesconhecidos(prs, comparar);
  assert.equal(resolvidos[0].mergeStateStatus, 'BEHIND');
  assert.equal(resolvidos[1].mergeStateStatus, 'UNKNOWN');
  assert.equal(resolvidos[2].mergeStateStatus, 'CLEAN');
});

test('resolverDesconhecidos: falha na comparacao mantem UNKNOWN (conservador)', async () => {
  const comparar = async () => { throw new Error('rede caiu'); };
  const resolvidos = await resolverDesconhecidos([pr(1, { mergeStateStatus: 'UNKNOWN' })], comparar);
  assert.equal(resolvidos[0].mergeStateStatus, 'UNKNOWN');
});

test('checksObrigatorios: 403 cai no fallback do baseline versionado', async () => {
  const mockExec = async () => {
    const err = new Error('HTTP 403');
    err.stderr = 'HTTP 403\nResource not accessible by integration';
    throw err;
  };
  const checks = await checksObrigatorios('owner/repo', { exec: mockExec });
  assert.ok(Array.isArray(checks), 'deve devolver array');
  assert.ok(checks.length > 0, 'baseline nao pode estar vazio');
  assert.ok(checks.includes('Quality Gate & Tests'), 'deve conter Quality Gate & Tests do baseline');
});

test('checksObrigatorios: erro nao-403 e relancado', async () => {
  const mockExec = async () => {
    const err = new Error('HTTP 500 Internal Server Error');
    err.stderr = 'HTTP 500 Internal Server Error';
    throw err;
  };
  await assert.rejects(
    () => checksObrigatorios('owner/repo', { exec: mockExec }),
    /HTTP 500/,
    'erro 500 nao deveria ser absorvido',
  );
});

// ---------------------------------------------------------------------------------------
// Cenarios de governanca: classificacao fail-closed e entradas malformadas da API.
// ---------------------------------------------------------------------------------------

test('classificar e fail-closed: campo ausente/null nunca vira "pode atualizar"', () => {
  const semDraft = pr(1); delete semDraft.isDraft;
  assert.equal(classificar(semDraft), 'fora', 'isDraft ausente nao pode valer como "nao e draft"');
  assert.equal(classificar(pr(2, { isDraft: null })), 'fora');
  const semFork = pr(3); delete semFork.isCrossRepository;
  assert.equal(classificar(semFork), 'fora', 'isCrossRepository ausente nao pode valer como "mesmo repo"');
  assert.equal(classificar(pr(4, { isCrossRepository: null })), 'fora');
  const semBase = pr(5); delete semBase.baseRefName;
  assert.equal(classificar(semBase), 'fora', 'base ausente nao pode valer como main');
  assert.equal(classificar(pr(6, { baseRefName: 'Main' })), 'fora', 'base e case-sensitive');
  assert.equal(classificar(pr(7, { baseRefName: ' main' })), 'fora');
});

test('decidir ignora PR com numero invalido (string, 0, negativo, null) e entradas nulas', () => {
  const decisao = decidir([pr('10'), pr(0), pr(-3), pr(null), null, undefined, pr(7)], OBRIGATORIOS);
  assert.deepEqual(decisao.fila, [7]);
  assert.equal(decisao.pr, 7);
});

test('decidir: ordem numerica (nao lexicografica) e independente da ordem de entrada', () => {
  const a = decidir([pr(100), pr(9), pr(10)], OBRIGATORIOS);
  const b = decidir([pr(10), pr(100), pr(9)], OBRIGATORIOS);
  assert.deepEqual(a.fila, [9, 10, 100]);
  assert.deepEqual(a, b);
});

test('estadoDoCheck tolera rollup nulo, nao-lista e entradas nulas', () => {
  assert.equal(estadoDoCheck(null, 'X'), 'pendente');
  assert.equal(estadoDoCheck({ name: 'X' }, 'X'), 'pendente', 'objeto no lugar de lista');
  assert.equal(estadoDoCheck([null, undefined, { name: 'X', status: 'COMPLETED', conclusion: 'FAILURE' }], 'X'), 'falhou');
});

test('estadoDoCheck: CANCELLED/ACTION_REQUIRED/SKIPPED/StatusContext PENDING', () => {
  const run = (conclusion) => estadoDoCheck([{ name: 'X', status: 'COMPLETED', conclusion }], 'X');
  assert.equal(run('CANCELLED'), 'pendente');
  assert.equal(run('ACTION_REQUIRED'), 'pendente');
  assert.equal(run('SKIPPED'), 'passou');
  assert.equal(run('TIMED_OUT'), 'falhou');
  assert.equal(estadoDoCheck([{ context: 'X', state: 'PENDING' }], 'X'), 'pendente');
  assert.equal(estadoDoCheck([{ context: 'X', state: 'SUCCESS' }], 'X'), 'passou');
  assert.equal(run(null), 'pendente', 'conclusion nula com COMPLETED nao e sucesso');
  assert.equal(estadoDoCheck([{ name: 'x', status: 'COMPLETED', conclusion: 'FAILURE' }], 'X'), 'pendente', 'nome e case-sensitive');
});

test('checksObrigatorios: resposta 200 sem lista (null/objeto/itens nao-string) cai no baseline, nunca quebra nem vira vazio', async () => {
  for (const saida of ['null', '{}', '[1,2]', '["", "a"]', '"texto"']) {
    const checks = await checksObrigatorios('o/r', { exec: async () => saida });
    assert.ok(checks.includes('Quality Gate & Tests'), `saida ${saida} deveria usar o baseline`);
  }
});

test('checksObrigatorios: lista viva valida (inclusive vazia) e respeitada', async () => {
  assert.deepEqual(await checksObrigatorios('o/r', { exec: async () => '["A","B"]' }), ['A', 'B']);
  assert.deepEqual(await checksObrigatorios('o/r', { exec: async () => '[]' }), []);
});

test('checksObrigatorios: JSON invalido e relancado (nao vira lista vazia)', async () => {
  await assert.rejects(() => checksObrigatorios('o/r', { exec: async () => 'nao e json' }));
});

test('resolverDesconhecidos nao consulta a API para draft, fork nem campo ausente', async () => {
  const consultadas = [];
  const comparar = async (sha) => { consultadas.push(sha); return 5; };
  const semFork = pr(4, { mergeStateStatus: 'UNKNOWN', headRefOid: 'sha-semfork' }); delete semFork.isCrossRepository;
  const prs = [
    pr(1, { mergeStateStatus: 'UNKNOWN', isDraft: true, headRefOid: 'sha-draft' }),
    pr(2, { mergeStateStatus: 'UNKNOWN', isCrossRepository: true, headRefOid: 'sha-fork' }),
    pr(3, { mergeStateStatus: 'UNKNOWN', headRefOid: 'sha-ok' }),
    semFork,
  ];
  const r = await resolverDesconhecidos(prs, comparar);
  assert.deepEqual(consultadas, ['sha-ok']);
  assert.equal(r[2].mergeStateStatus, 'BEHIND');
  assert.equal(r[0].mergeStateStatus, 'UNKNOWN');
});

test('resolverDesconhecidos: comparacao que devolve NaN/negativo mantem UNKNOWN', async () => {
  const r = await resolverDesconhecidos([pr(1, { mergeStateStatus: 'UNKNOWN' }), pr(2, { mergeStateStatus: 'UNKNOWN' })], async (sha) => (sha === 'sha-1' ? NaN : -1));
  assert.equal(r[0].mergeStateStatus, 'UNKNOWN');
  assert.equal(r[1].mergeStateStatus, 'UNKNOWN');
});

// ---------------------------------------------------------------------------------------
// CLI de verdade (processo filho) com um `gh` falso no PATH: nada toca a rede.
// ---------------------------------------------------------------------------------------

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'fila-merge.mjs');
const BASELINE = join(dirname(fileURLToPath(import.meta.url)), 'github-settings-baseline.json');

// `gh` falso: le o cenario de $FAKE_GH_CENARIO (JSON), registra cada chamada em $FAKE_GH_LOG.
// Rotas: 'protection' | 'prlist' | 'compare:<sha>' -> { stdout, stderr, code }.
const GH_FALSO = String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const cen = JSON.parse(fs.readFileSync(process.env.FAKE_GH_CENARIO, 'utf8'));
fs.appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(args) + '\n');
let rota = 'desconhecida';
if (args[0] === 'api' && /required_status_checks$/.test(args[1])) rota = 'protection';
else if (args[0] === 'pr' && args[1] === 'list') rota = 'prlist';
else if (args[0] === 'api' && /\/compare\/main\.\.\./.test(args[1])) rota = 'compare:' + args[1].split('...')[1];
const r = cen[rota] ?? { stdout: '', stderr: 'HTTP 404 rota sem cenario: ' + rota, code: 1 };
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.code ?? 0);
`;

function montarSandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'fila merge '));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), GH_FALSO);
  chmodSync(join(bin, 'gh'), 0o755);
  return { dir, bin, cenario: join(dir, 'cenario.json'), log: join(dir, 'gh.log'), output: join(dir, 'output.txt'), summary: join(dir, 'summary.md') };
}

const prJson = (n, over = {}) => ({
  number: n, isDraft: false, isCrossRepository: false, baseRefName: 'main', headRefOid: `sha-${n}`, mergeStateStatus: 'BEHIND', statusCheckRollup: [], ...over,
});

function rodarCli(cenario, { args = [], env = {}, script = SCRIPT } = {}) {
  const sb = montarSandbox();
  try {
    writeFileSync(sb.cenario, JSON.stringify({ protection: { stdout: JSON.stringify(OBRIGATORIOS) }, ...cenario }));
    writeFileSync(sb.log, '');
    writeFileSync(sb.output, '');
    const res = spawnSync(process.execPath, [script, ...args], {
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        PATH: `${sb.bin}:${process.env.PATH}`,
        GITHUB_REPOSITORY: 'o/r',
        GITHUB_OUTPUT: sb.output,
        GITHUB_STEP_SUMMARY: sb.summary,
        FAKE_GH_CENARIO: sb.cenario,
        FAKE_GH_LOG: sb.log,
        ...env,
      },
    });
    const chamadas = readFileSync(sb.log, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    return { code: res.status, out: `${res.stdout}${res.stderr}`, output: readFileSync(sb.output, 'utf8'), chamadas, sb };
  } finally {
    rmSync(sb.dir, { recursive: true, force: true });
  }
}

const lista = (...prs) => ({ prlist: { stdout: JSON.stringify(prs) } });

test('CLI: duas atrasadas + conflito + bloqueada: escolhe so a menor e grava pr=/fila= no output', () => {
  const r = rodarCli(lista(
    prJson(20), prJson(10), prJson(30, { mergeStateStatus: 'DIRTY' }),
    prJson(15, { statusCheckRollup: [{ name: 'Quality Gate & Tests', status: 'COMPLETED', conclusion: 'FAILURE' }] }),
  ));
  assert.equal(r.code, 0, r.out);
  assert.equal(r.output, 'pr=10\nfila=10 20\n');
  assert.match(r.out, /Próxima da fila: #10/);
  assert.match(r.out, /Fora da fila até corrigir check obrigatório: #15/);
  assert.match(r.out, /Conflito real com main.*#30/);
});

test('CLI: draft, fork, base errada e campos ausentes nunca entram na fila', () => {
  const semDraft = prJson(5); delete semDraft.isDraft;
  const semFork = prJson(6); delete semFork.isCrossRepository;
  const r = rodarCli(lista(prJson(1, { isDraft: true }), prJson(2, { isCrossRepository: true }), prJson(3, { baseRefName: 'dev' }), semDraft, semFork, prJson(4)));
  assert.equal(r.code, 0, r.out);
  assert.equal(r.output, 'pr=4\nfila=4\n', 'so a #4 e legitima');
});

test('CLI: sem PR atrasada nao escreve output e sai 0', () => {
  const r = rodarCli(lista(prJson(1, { mergeStateStatus: 'CLEAN' })));
  assert.equal(r.code, 0, r.out);
  assert.equal(r.output, '');
  assert.match(r.out, /Nenhuma PR atrasada/);
});

test('CLI: idempotente — duas execucoes com a mesma entrada dao a mesma saida', () => {
  const cen = lista(prJson(8), prJson(3));
  const a = rodarCli(cen);
  const b = rodarCli(cen);
  assert.equal(a.output, b.output);
  assert.equal(a.output, 'pr=3\nfila=3 8\n');
});

test('CLI: gh pr list falhando nao atualiza ninguem, avisa e sai 0 (sem dizer que nao ha PR)', () => {
  const r = rodarCli({ prlist: { stderr: 'HTTP 404 Not Found', code: 1 } });
  assert.equal(r.code, 0, r.out);
  assert.equal(r.output, '');
  assert.match(r.out, /::warning::Não foi possível listar/);
  assert.doesNotMatch(r.out, /Nenhuma PR atrasada/, 'falha de leitura nao pode parecer "fila vazia"');
});

test('CLI: gh pr list com JSON invalido ou nao-lista (objeto, null, string) nao derruba nem age', () => {
  for (const stdout of ['nao json', '{}', 'null', '"x"', '']) {
    const r = rodarCli({ prlist: { stdout } });
    assert.equal(r.code, 0, `stdout=${JSON.stringify(stdout)}: ${r.out}`);
    assert.equal(r.output, '');
    assert.match(r.out, /::warning::/);
  }
});

test('CLI: exatamente 100 PRs (limite da consulta) avisa que pode haver corte', () => {
  const prs = Array.from({ length: 100 }, (_, i) => prJson(i + 1, { mergeStateStatus: 'CLEAN' }));
  const r = rodarCli(lista(...prs));
  assert.match(r.out, /::warning::100 PRs abertas \(limite/);
  const r2 = rodarCli(lista(...prs.slice(0, 99)));
  assert.doesNotMatch(r2.out, /limite da consulta/);
});

test('CLI: protection devolvendo "null" usa o baseline (PR com check do baseline falhando fica bloqueada)', () => {
  const r = rodarCli({
    protection: { stdout: 'null' },
    ...lista(prJson(1, { statusCheckRollup: [{ name: 'E2E Critical Gate', status: 'COMPLETED', conclusion: 'FAILURE' }] }), prJson(2)),
  });
  assert.equal(r.code, 0, r.out);
  assert.equal(r.output, 'pr=2\nfila=2\n');
});

test('CLI: 403 na protection cai no baseline; erro definitivo (404) falha alto com exit 1', () => {
  const ok = rodarCli({ protection: { stderr: 'gh: Resource not accessible by integration (HTTP 403)', code: 1 }, ...lista(prJson(2)) });
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /usando baseline versionado/);
  const ruim = rodarCli({ protection: { stderr: 'gh: Not Found (HTTP 404)', code: 1 }, ...lista(prJson(2)) });
  assert.equal(ruim.code, 1, ruim.out);
  assert.equal(ruim.output, '', 'sem leitura confiavel dos checks nao se escolhe PR');
});

test('CLI: UNKNOWN so entra se a comparacao real confirmar atraso; fork/draft UNKNOWN nem consulta', () => {
  const r = rodarCli({
    ...lista(
      prJson(1, { mergeStateStatus: 'UNKNOWN' }),
      prJson(2, { mergeStateStatus: 'UNKNOWN' }),
      prJson(3, { mergeStateStatus: 'UNKNOWN', isCrossRepository: true }),
      prJson(4, { mergeStateStatus: 'UNKNOWN', isDraft: true }),
    ),
    'compare:sha-1': { stdout: '2\n' },
    'compare:sha-2': { stderr: 'HTTP 404', code: 1 },
  });
  assert.equal(r.code, 0, r.out);
  assert.equal(r.output, 'pr=1\nfila=1\n');
  const comparadas = r.chamadas.filter((c) => /compare/.test(c[1] ?? '')).map((c) => c[1]);
  assert.deepEqual(comparadas.sort(), ['repos/o/r/compare/main...sha-1', 'repos/o/r/compare/main...sha-2']);
});

test('CLI --confirmar: 0 se e a proxima, 3 se nao, descontando --recusadas; nunca escreve output', () => {
  const cen = lista(prJson(10), prJson(20));
  assert.equal(rodarCli(cen, { args: ['--confirmar', '10'] }).code, 0);
  const nao = rodarCli(cen, { args: ['--confirmar', '20'] });
  assert.equal(nao.code, 3, nao.out);
  assert.equal(nao.output, '');
  assert.equal(rodarCli(cen, { args: ['--confirmar', '20', '--recusadas', ' 10'] }).code, 0, 'recusadas com espaco inicial, como o workflow envia');
  assert.equal(rodarCli(cen, { args: ['--confirmar', '30'] }).code, 3, 'PR fora da fila');
});

test('CLI --confirmar: se nao consegue ler as PRs, NAO autoriza (exit 3)', () => {
  const r = rodarCli({ prlist: { stderr: 'HTTP 404', code: 1 } }, { args: ['--confirmar', '10'] });
  assert.equal(r.code, 3, r.out);
});

test('CLI: argumentos invalidos sao exit 2 e nunca chamam o gh', () => {
  const invalidos = [
    ['--confirmr', '5'],
    ['--confirmar'],
    ['--confirmar', '--recusadas', '1'],
    ['--confirmar', 'abc'],
    ['--confirmar', '0'],
    ['--confirmar', '-4'],
    ['--confirmar', '1.5'],
    ['--confirmar', '10', '--recusadas'],
    ['--confirmar', '10', '--recusadas', '3 x'],
    ['--recusadas', '3'],
    ['10'],
    ['--dry-run'],
  ];
  for (const args of invalidos) {
    const r = rodarCli(lista(prJson(10)), { args });
    assert.equal(r.code, 2, `args=${JSON.stringify(args)} => ${r.code}\n${r.out}`);
    assert.equal(r.chamadas.length, 0, `args=${JSON.stringify(args)} chamou o gh`);
    assert.equal(r.output, '');
  }
});

test('CLI --help: imprime o uso e sai 0 sem chamar o gh', () => {
  const r = rodarCli(lista(prJson(10)), { args: ['--help'] });
  assert.equal(r.code, 0);
  assert.match(r.out, /Uso: node scripts\/ci\/fila-merge\.mjs/);
  assert.equal(r.chamadas.length, 0);
});

test('CLI: GITHUB_REPOSITORY ausente, vazio ou malformado e exit 2', () => {
  for (const valor of [undefined, '', 'semBarra', 'a b/c', 'o/r/extra', '../x/y z']) {
    const env = valor === undefined ? { GITHUB_REPOSITORY: undefined } : { GITHUB_REPOSITORY: valor };
    const sb = montarSandbox();
    try {
      const e = { PATH: `${sb.bin}:${process.env.PATH}`, FAKE_GH_CENARIO: sb.cenario, FAKE_GH_LOG: sb.log, ...env };
      if (valor === undefined) delete e.GITHUB_REPOSITORY;
      writeFileSync(sb.cenario, '{}');
      writeFileSync(sb.log, '');
      const res = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8', env: e });
      assert.equal(res.status, 2, `GITHUB_REPOSITORY=${JSON.stringify(valor)} => ${res.status}`);
      assert.equal(readFileSync(sb.log, 'utf8'), '', 'nao pode chamar o gh com repo invalido');
    } finally {
      rmSync(sb.dir, { recursive: true, force: true });
    }
  }
});

test('CLI: invocado por symlink (e por caminho com espaco) executa de verdade — nao sai 0 sem fazer nada', () => {
  const alvo = mkdtempSync(join(tmpdir(), 'fila link '));
  try {
    const dirScripts = join(alvo, 'pasta com espaco');
    mkdirSync(dirScripts);
    const link = join(dirScripts, 'fila.mjs');
    symlinkSync(SCRIPT, link);
    const r = rodarCli(lista(prJson(5)), { script: link });
    assert.equal(r.code, 0, r.out);
    assert.equal(r.output, 'pr=5\nfila=5\n', 'via symlink o script precisa rodar a decisao');
  } finally {
    rmSync(alvo, { recursive: true, force: true });
  }
});

test('baseline versionado tem a lista de required_status_checks que o fallback usa', () => {
  const bl = JSON.parse(readFileSync(BASELINE, 'utf8'));
  assert.ok(Array.isArray(bl.branch_protection_main.required_status_checks) && bl.branch_protection_main.required_status_checks.length > 0);
});
