import { assertEquals } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { parseJsonBody } from './validation.ts';

/**
 * Execução real do helper (não só a detecção textual do gate zod-coverage):
 * corpo malformado tem de virar 422 com `invalid_json` e CORS, e corpo válido
 * tem de passar intacto. Antes do helper, o `req.json()` nu estourava e o
 * catch do handler respondia 500 — que `withEdgeObservability` conta como erro
 * e leva para o SLO, o health score e os alertas de p95.
 */

function req(corpo: string | null): Request {
  return new Request('https://exemplo.test/fn', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://exemplo.test' },
    body: corpo,
  });
}

Deno.test('corpo JSON válido passa intacto', async () => {
  const r = await parseJsonBody(req('{"a":1,"b":"x"}'), 'teste');
  assertEquals(r.success, true);
  if (r.success) assertEquals(r.data, { a: 1, b: 'x' });
});

Deno.test('JSON truncado devolve 422 com invalid_json', async () => {
  const r = await parseJsonBody(req('{"a":1,'), 'teste');
  assertEquals(r.success, false);
  if (r.success) return;
  assertEquals(r.response.status, 422);
  const body = await r.response.json();
  assertEquals(body.fields[0].code, 'invalid_json');
  assertEquals(body.fields[0].path, '$');
  assertEquals(typeof r.response.headers.get('access-control-allow-origin'), 'string');
  assertEquals(r.response.headers.get('content-type'), 'application/json');
});

Deno.test('corpo vazio devolve 422, não 500', async () => {
  const r = await parseJsonBody(req(''), 'teste');
  assertEquals(r.success, false);
  if (!r.success) assertEquals(r.response.status, 422);
});

Deno.test('headers explícitos têm precedência sobre o CORS calculado', async () => {
  const r = await parseJsonBody(req('nao-e-json'), 'teste', { 'x-marcador': 'sim' });
  assertEquals(r.success, false);
  if (!r.success) assertEquals(r.response.headers.get('x-marcador'), 'sim');
});
