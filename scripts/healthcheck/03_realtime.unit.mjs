// Teste do check de Realtime (scripts/healthcheck/03_realtime.mjs).
// O script é executado como está, em processo filho; só o import de
// '@supabase/supabase-js' é trocado por um cliente falso via hook de resolução
// (node --import), então nenhuma conexão sai da máquina.
// Rodar: node --test scripts/healthcheck/03_realtime.unit.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), '03_realtime.mjs');
const RUN_ID = '3d1f0c9a-5b7e-4f21-9a66-1c2d3e4f5a6b';
const ANON = 'anon-key-de-teste';
const SERVICE = 'service-role-SEGREDO';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hc-realtime-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));

// Cliente falso: registra tudo o que o script pede e devolve o evento conforme FAKE_RT_MODO.
fs.writeFileSync(path.join(dir, 'fake-supabase.mjs'), `
import fs from 'node:fs';
const modo = process.env.FAKE_RT_MODO || 'ok';
const log = (o) => fs.appendFileSync(process.env.FAKE_RT_LOG, JSON.stringify(o) + '\\n');
const ouvintes = {};
const avisar = (tabela, linha) => setTimeout(() => (ouvintes[tabela] || []).forEach((cb) => cb({ new: linha })), 20);
export function createClient(url, key, opts) {
  log({ op: 'createClient', url, key, opts });
  return {
    channel(nome) {
      if (modo === 'excecao') throw new Error('canal indisponível');
      const canal = {
        state: 'closed', nome,
        on(tipo, filtro, cb) { (ouvintes[filtro.table] ||= []).push(cb); log({ op: 'on', tipo, filtro }); return canal; },
        subscribe() { setTimeout(() => { canal.state = 'joined'; }, 400); return canal; },
      };
      return canal;
    },
    removeChannel: async (c) => { log({ op: 'removeChannel', nome: c.nome }); },
    from(tabela) {
      return {
        insert(linha) {
          log({ op: 'insert', tabela, linha, key });
          const erro = modo === 'erro_insert' ? { message: 'permission denied for table ' + tabela } : null;
          if (modo === 'ok') avisar(tabela, linha);
          if (modo === 'marcador_alheio') {
            avisar(tabela, { raw_payload: { healthcheck_run_id: 'outro-run' }, metadata: { healthcheck_run_id: 'outro-run' } });
          }
          return { select: () => ({ single: async () => ({ data: erro ? null : { id: 1 }, error: erro }) }) };
        },
        delete() {
          return { filter: (coluna, _op, valor) => { log({ op: 'delete', tabela, coluna, valor, key }); return Promise.resolve({ error: null }); } };
        },
      };
    },
  };
}
`);
fs.writeFileSync(path.join(dir, 'hooks.mjs'), `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@supabase/supabase-js') {
    return { url: ${JSON.stringify(pathToFileURL(path.join(dir, 'fake-supabase.mjs')).href)}, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
`);
fs.writeFileSync(path.join(dir, 'register.mjs'), `
import { register } from 'node:module';
register(${JSON.stringify(pathToFileURL(path.join(dir, 'hooks.mjs')).href)});
`);

let n = 0;
function rodar(env = {}) {
  n += 1;
  const out = path.join(dir, `out-${n}.jsonl`);
  const registro = path.join(dir, `chamadas-${n}.jsonl`);
  fs.writeFileSync(registro, '');
  const base = { PATH: process.env.PATH, RUN_ID, OUT: out, FAKE_RT_LOG: registro,
    STAGING_PROJECT_REF: 'stgref', STAGING_ANON_KEY: ANON, STAGING_SERVICE_ROLE_KEY: SERVICE };
  const r = spawnSync(process.execPath, ['--import', path.join(dir, 'register.mjs'), SCRIPT],
    { env: { ...base, ...env }, encoding: 'utf8', timeout: 60_000 });
  const jsonl = (t) => t.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return {
    r,
    arquivo: fs.existsSync(out) ? jsonl(fs.readFileSync(out, 'utf8')) : [],
    chamadas: jsonl(fs.readFileSync(registro, 'utf8')),
    jsonl,
  };
}

test('sem ref/anon: unverified, exit 0 e nenhum cliente criado', () => {
  for (const faltando of ['STAGING_PROJECT_REF', 'STAGING_ANON_KEY']) {
    const { r, arquivo, chamadas } = rodar({ [faltando]: '' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(arquivo.length, 1);
    assert.deepEqual([arquivo[0].check, arquivo[0].target, arquivo[0].status], ['realtime', 'config', 'unverified']);
    assert.equal(arquivo[0].run_id, RUN_ID);
    assert.equal(chamadas.length, 0);
  }
});

test('sem service role: unverified e a chave anon não aparece na saída', () => {
  const { r, arquivo, chamadas } = rodar({ STAGING_SERVICE_ROLE_KEY: '' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(arquivo[0].status, 'unverified');
  assert.match(arquivo[0].detail, /STAGING_SERVICE_ROLE_KEY/);
  assert.equal(chamadas.length, 0);
  assert.ok(!(r.stdout + r.stderr).includes(ANON));
});

test('linha vai para stderr por padrão e para stdout com JSON_ONLY=1', () => {
  const humano = rodar({ STAGING_SERVICE_ROLE_KEY: '' });
  assert.equal(humano.r.stdout, '');
  assert.equal(humano.jsonl(humano.r.stderr).length, 1);
  const json = rodar({ STAGING_SERVICE_ROLE_KEY: '', JSON_ONLY: '1' });
  assert.equal(json.r.stderr, '');
  assert.deepEqual(json.jsonl(json.r.stdout), json.arquivo);
});

test('sem OUT o script não quebra', () => {
  const { r } = rodar({ STAGING_SERVICE_ROLE_KEY: '', OUT: '', JSON_ONLY: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).status, 'unverified');
});

test('evento recebido: pass nas duas tabelas, com latência, e limpeza do dado sintético', () => {
  const { r, arquivo, chamadas } = rodar({ JSON_ONLY: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(arquivo.map((l) => [l.target, l.status]), [['webhook_events', 'pass'], ['alerts', 'pass']]);
  for (const l of arquivo) {
    assert.equal(l.check, 'realtime');
    assert.equal(l.run_id, RUN_ID);
    // a inscrição no canal leva 400 ms no cliente falso; a latência é só insert→recepção
    assert.ok(Number.isInteger(l.latency_ms) && l.latency_ms >= 0 && l.latency_ms < 300, `latency_ms=${l.latency_ms}`);
    assert.match(l.ts, /^\d{4}-\d{2}-\d{2}T/);
  }
  const clientes = chamadas.filter((c) => c.op === 'createClient');
  assert.deepEqual(clientes.map((c) => [c.url, c.key]),
    [['https://stgref.supabase.co', ANON], ['https://stgref.supabase.co', SERVICE]]);
  assert.ok(clientes.every((c) => c.opts.auth.persistSession === false));
  // insert sintético usa a service role e carrega o marcador do run
  const inserts = chamadas.filter((c) => c.op === 'insert');
  assert.deepEqual(inserts.map((c) => [c.tabela, c.key]), [['webhook_events', SERVICE], ['alerts', SERVICE]]);
  assert.equal(inserts[0].linha.raw_payload.healthcheck_run_id, RUN_ID);
  assert.equal(inserts[1].linha.metadata.healthcheck_run_id, RUN_ID);
  assert.deepEqual(chamadas.filter((c) => c.op === 'delete').map((c) => [c.tabela, c.valor]),
    [['webhook_events', RUN_ID], ['alerts', RUN_ID]]);
  assert.equal(chamadas.filter((c) => c.op === 'removeChannel').length, 2);
  assert.ok(!(r.stdout + r.stderr).includes(SERVICE), 'service role vazou na saída');
});

test('insert recusado: fail com a mensagem do banco, exit 0', () => {
  const { r, arquivo, chamadas } = rodar({ FAKE_RT_MODO: 'erro_insert', JSON_ONLY: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(arquivo.map((l) => l.status), ['fail', 'fail']);
  assert.match(arquivo[0].detail, /insert error: permission denied for table webhook_events/);
  assert.equal(chamadas.filter((c) => c.op === 'delete').length, 2);
});

test('evento de outro run não conta: fail por timeout', () => {
  const { r, arquivo } = rodar({ FAKE_RT_MODO: 'marcador_alheio', JSON_ONLY: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(arquivo.map((l) => [l.target, l.status]), [['webhook_events', 'fail'], ['alerts', 'fail']]);
  assert.match(arquivo[0].detail, /timeout 5000ms/);
});

test('exceção do cliente vira fail do runner e a limpeza ainda roda', () => {
  const { r, arquivo, chamadas } = rodar({ FAKE_RT_MODO: 'excecao', JSON_ONLY: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(arquivo.map((l) => [l.target, l.status]), [['runner', 'fail']]);
  assert.match(arquivo[0].detail, /canal indisponível/);
  assert.equal(chamadas.filter((c) => c.op === 'delete').length, 2);
});
