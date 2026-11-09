// Porto de Zapp_Web_V2/scripts/edge-deploy/deployment-record.unit.mjs, ajustado
// para o AMBIENTE_PADRAO 'producao' do Promo_Finance_V2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirDeployment, construirStatus, resumirDeployment, AMBIENTE_PADRAO } from './deployment-record.mjs';

test('1. construirDeployment exige SHA de 40 hex e monta o registro esperado', () => {
  const d = construirDeployment({ shaDeployado: '6bedb924'.padEnd(40, '0'), runId: '123', runUrl: 'https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/123', escopo: 'all' });
  assert.equal(d.ref, '6bedb924'.padEnd(40, '0'));
  assert.equal(d.environment, 'producao');
  assert.equal(d.required_contexts.length, 0);
  assert.equal(d.auto_merge, false);
  assert.equal(d.payload.escopo, 'all');
});

test('2. SHA inválido (fora de 40 hex) é rejeitado', () => {
  assert.throws(() => construirDeployment({ shaDeployado: 'abc', runId: '1', runUrl: 'u', escopo: 'all' }), /40 hex/);
  assert.throws(() => construirDeployment({ shaDeployado: 'z'.repeat(40), runId: '1', runUrl: 'u', escopo: 'all' }), /40 hex/);
});

test('3. construirStatus produz estado success para o SHA deployado', () => {
  const sha = 'a'.repeat(40);
  const d = construirDeployment({ shaDeployado: sha, runId: '1', runUrl: 'u', escopo: 'fn' });
  const s = construirStatus({ id: 42, runUrl: 'https://r/1', descricao: 'deploy ok' });
  assert.equal(s.state, 'success');
  assert.equal(s.deployment_id, 42);
  assert.equal(s.environment, 'producao');
});

test('4. resumirDeployment devolve linhas úteis para o corpo da PR/log', () => {
  const linha = resumirDeployment({ environment: 'producao', ref: 'a'.repeat(40), payload: { run_id: '12' } });
  assert.ok(linha.includes('producao'));
  assert.ok(linha.includes('12'));
});
