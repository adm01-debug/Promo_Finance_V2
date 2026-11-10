import test from 'node:test';
import assert from 'node:assert/strict';
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
