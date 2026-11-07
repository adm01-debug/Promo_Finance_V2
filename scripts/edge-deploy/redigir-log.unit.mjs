// Porto de Zapp_Web_V2/scripts/edge-deploy/redigir-log.unit.mjs, adaptado ao
// Promo_Finance_V2 (a redação roda no migrate-functions.sh, não no YAML do Zapp).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { redigir, confinar } from './redigir-log.mjs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raizProjeto = resolve(__dirname, '..', '..');

test('E74: o valor do token sai do log, e a chave deixa de existir como tal', () => {
  const entrada = [
    'Deploying function asaas-proxy',
    '  curl https://bwwbeyolnnzppeuhgkcd.functions.supabase.co/asaas-proxy?access_token=sbp_abc123def456',
    '  warning: access_token expirado',
  ].join('\n');
  const saida = redigir(entrada, ['sbp_abc123def456']);
  assert.equal(saida.includes('access_token'), false, 'a string access_token não pode sobrar no artifact');
  assert.equal(saida.includes('sbp_abc123def456'), false, 'o valor do token não pode sobrar');
  assert.ok(saida.includes('token='), 'o parâmetro continua visível, só sem credencial');
});

test('E74: valor curto demais não é tratado como segredo (não troca texto comum)', () => {
  const entrada = 'campo status=ok e access_token=abc';
  const saida = redigir(entrada, ['abc']);
  assert.ok(saida.includes('status=ok'), 'texto comum tem de sobreviver');
  assert.equal(saida.includes('access_token'), false);
});

test('E74: o CLI é fail-closed quando o log não existe', () => {
  const r = spawnSync(process.execPath, ['scripts/edge-deploy/redigir-log.mjs', '/nao/existe/deploy-output.log'], {
    cwd: raizProjeto,
    encoding: 'utf8',
  });
  assert.equal(r.status, 2, 'log ausente tem de sair com 2');
});

test('S8707: confinar rejeita caminho fora da base (traversal e absoluto)', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-base-'));
  try {
    assert.throws(() => confinar('/etc/passwd', base), /fora da base/);
    assert.throws(() => confinar('../fora.txt', base), /fora da base/);
    writeFileSync(resolve(base, 'ok.log'), 'conteudo');
    const alvo = confinar(resolve(base, 'ok.log'), base);
    assert.equal(alvo, resolve(base, 'ok.log'));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('E74: redação atua no arquivo e reporta a contagem (integração CLI)', () => {
  const base = mkdtempSync(resolve(tmpdir(), 'redigir-cli-'));
  const log = resolve(base, 'deploy-out.log');
  writeFileSync(log, 'curl ...?access_token=sbp_umaChaveLonga123\n');
  try {
    const r = spawnSync(
      process.execPath,
      ['scripts/edge-deploy/redigir-log.mjs', log, '--segredo-env=TOKEN_DE_TESTE'],
      {
        cwd: raizProjeto,
        encoding: 'utf8',
        env: { ...process.env, TOKEN_DE_TESTE: 'sbp_umaChaveLonga123', REDIGIR_LOG_BASE: base },
      },
    );
    assert.equal(r.status, 0, r.stderr);
    const limpo = readFileSync(log, 'utf8');
    assert.equal(limpo.includes('access_token'), false, 'artifact subiu sem a chave access_token');
    assert.equal(limpo.includes('sbp_umaChaveLonga123'), false, 'artifact subiu sem o valor do token');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
