// Porto de Zapp_Web_V2/scripts/edge-deploy/register-deployment.unit.mjs — a rede
// nunca é tocada: exercita apenas as decisões de destino (allowlist https, sem
// path traversal), puras e determinísticas. resolverDestino LANÇA erro nas
// recusas; o teste confere erro e mensagem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverDestino } from './register-deployment.mjs';

test('1. allowlist: api.github.com é aceita', () => {
  const url = resolverDestino('https://api.github.com', '/repos/adm01-debug/Promo_Finance_V2/deployments', 'https://github.com');
  assert.equal(url, 'https://api.github.com/repos/adm01-debug/Promo_Finance_V2/deployments');
});

test('2. allowlist: host do GITHUB_SERVER_URL (GHE) é aceito', () => {
  const url = resolverDestino('https://github.example.com', '/deployments', 'https://github.example.com');
  assert.equal(url, 'https://github.example.com/deployments');
});

test('3. https fora da allowlist é recusado', () => {
  assert.throws(() => resolverDestino('https://api.gitlab.com', '/projetos/1/deployments', 'https://github.com'), /allowlist/);
});

test('4. http (não https) é recusado', () => {
  assert.throws(() => resolverDestino('http://api.github.com', '/deployments', 'https://github.com'), /https/);
});

test('5. path traversal e caminho sem barra inicial são recusados', () => {
  assert.throws(() => resolverDestino('https://api.github.com', '/repos/../etc', 'https://github.com'), /\.\.\//);
  assert.throws(() => resolverDestino('https://api.github.com', 'repos/adm01-debug', 'https://github.com'), /começar com \//);
});
