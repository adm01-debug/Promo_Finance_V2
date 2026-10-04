import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { withEdgeObservability, capturarExcecaoSentry } from './edge-observability.ts';

// Sem SUPABASE_URL/KEY o flush é no-op; sem EDGE_SENTRY_DSN o envio é no-op —
// os testes exercitam a lógica do wrapper sem dependência externa.

Deno.test('withEdgeObservability devolve a resposta do handler', async () => {
  const wrapped = withEdgeObservability('fn-teste', () => new Response('ok', { status: 201 }));
  const res = await wrapped(new Request('https://x/fn'));
  assertEquals(res.status, 201);
  assertEquals(await res.text(), 'ok');
});

Deno.test('withEdgeObservability propaga exceção do handler', async () => {
  const wrapped = withEdgeObservability('fn-teste', () => {
    throw new Error('kaboom');
  });
  await assertRejects(async () => await wrapped(new Request('https://x/fn')), Error, 'kaboom');
});

Deno.test('preflight OPTIONS não passa pelo caminho de métricas', async () => {
  let chamado = false;
  const wrapped = withEdgeObservability('fn-teste', () => {
    chamado = true;
    return new Response(null, { status: 204 });
  });
  const res = await wrapped(new Request('https://x/fn', { method: 'OPTIONS' }));
  assertEquals(res.status, 204);
  assertEquals(chamado, true);
});

Deno.test('capturarExcecaoSentry sem DSN é no-op que resolve', async () => {
  await capturarExcecaoSentry(new Error('x'), { function_name: 'fn' });
});

Deno.test('capturarExcecaoSentry com DSN inválida é no-op que resolve', async () => {
  Deno.env.set('EDGE_SENTRY_DSN', 'notaurl');
  try {
    await capturarExcecaoSentry(new Error('x'), { function_name: 'fn' });
  } finally {
    Deno.env.delete('EDGE_SENTRY_DSN');
  }
});

Deno.test('resposta SSE entrega o stream completo sem bloquear', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('data: 1\n\n'));
      controller.enqueue(new TextEncoder().encode('data: 2\n\n'));
      controller.close();
    },
  });
  const wrapped = withEdgeObservability(
    'fn-sse',
    () =>
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
  );
  const res = await wrapped(new Request('https://x/fn'));
  assertEquals(res.status, 200);
  assertEquals(await res.text(), 'data: 1\n\ndata: 2\n\n');
});

Deno.test('requestId prefere x-request-id e cai para x-correlation-id', async () => {
  let visto: string | undefined;
  // createLogger injeta request_id no context — espia pelo console do logger.
  const logOriginal = console.log;
  console.log = (s: unknown) => {
    try {
      const j = JSON.parse(String(s));
      if (j.event === 'request_end') visto = j.context?.request_id;
    } catch {
      /* ignora */
    }
  };
  try {
    const wrapped = withEdgeObservability('fn-req', () => new Response('ok'));
    await wrapped(new Request('https://x/fn', { headers: { 'x-request-id': 'RID-1' } }));
    assertEquals(visto, 'RID-1');
    await wrapped(new Request('https://x/fn', { headers: { 'x-correlation-id': 'CID-1' } }));
    assertEquals(visto, 'CID-1');
  } finally {
    console.log = logOriginal;
  }
});
