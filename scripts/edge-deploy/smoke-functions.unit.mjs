// Porto de Zapp_Web_V2/scripts/edge-deploy/smoke-functions.unit.mjs — a rede
// nunca é tocada: o fetch é injetado como um fake determinístico. Exercita o
// contrato CORS (positivo/negativo) e o gateway anonymous 401 das funções com
// verify_jwt=true, além do fail-closed quando o config.toml não declara o bloco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { smokeFunction, runSmokeSuite } from './smoke-functions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raizProjeto = resolve(__dirname, '..', '..');
const CAMINHO_TOML = resolve(raizProjeto, 'supabase/config.toml');

function mkResponse(status, headers = {}) {
  return { status, headers: { get: (name) => headers[name.toLowerCase()] ?? headers[name] ?? null } };
}

test('1. CORS correto + anonymous 401 => smoke passa', async () => {
  const fn = { name: 'condominio-api', verify_jwt: true };
  const fetchImpl = async (url, init) => {
    if (init.method === 'OPTIONS') {
      if (String(init.headers.Origin) === 'https://edge-smoke.invalid') {
        return mkResponse(200, { 'access-control-allow-origin': null });
      }
      return mkResponse(204, { 'access-control-allow-origin': String(init.headers.Origin) });
    }
    return mkResponse(401); // POST anônimo
  };
  const result = await smokeFunction({ fn, baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co', retries: 1, fetchImpl });
  assert.equal(result.passed, true);
  assert.equal(result.checks.anonymous_gateway.passed, true);
  assert.equal(result.checks.denied_origin.passed, true);
});

test('2. origem negada refletida => smoke falha (não pode ecoar origem não confiável)', async () => {
  const fn = { name: 'condominio-api', verify_jwt: true };
  const fetchImpl = async (url, init) => {
    if (init.method === 'OPTIONS') {
      return mkResponse(200, { 'access-control-allow-origin': String(init.headers.Origin) }); // eco indesejado
    }
    return mkResponse(401);
  };
  const result = await smokeFunction({ fn, baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co', retries: 1, fetchImpl });
  assert.equal(result.passed, false);
  assert.equal(result.checks.denied_origin.passed, false);
});

test('3. POST anônimo sem 401 (webhook público) => falha no gateway', async () => {
  const fn = { name: 'webhook-publico', verify_jwt: false };
  const fetchImpl = async () => mkResponse(200); // gateway liberou sem token
  const result = await smokeFunction({ fn, baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co', retries: 1, fetchImpl });
  assert.equal(result.passed, false);
});

test('4. runSmokeSuite grava evidência e usa config.toml real para verify_jwt', async () => {
  // funções que existem de fato no supabase/config.toml do PF
  const lista = JSON.stringify({
    functions: [
      { name: 'asaas-proxy', verify_jwt: true },
      { name: 'secrets-scope', verify_jwt: true },
    ],
  });
  const dir = mkdtempSync(resolve(tmpdir(), 'smoke-'));
  const listaPath = resolve(dir, 'functions-list.json');
  const saida = resolve(dir, 'evidencia.json');
  writeFileSync(listaPath, lista);
  // config.toml real não declara bloco [functions.secrets-scope] => fail-closed
  try {
    await assert.rejects(
      runSmokeSuite({
        baseUrl: 'https://bwwbeyolnnzppeuhgkcd.functions.supabase.co',
        outputPath: saida,
        gitSha: 'a'.repeat(40),
        runId: '99',
        concurrency: 2,
        retries: 1,
        configToml: CAMINHO_TOML,
        functionsListPath: listaPath,
      }),
      /verify_jwt ausente no config\.toml/,
      'bloco ausente no config.toml tem de falhar (fail-closed) sem tocar rede',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
