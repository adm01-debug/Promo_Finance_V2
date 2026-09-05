import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.env.set('DENO_TESTING', '1');

const { createHandler } = await import('./index.ts');

type InsertCall = { table: string; row: Record<string, unknown> };

function makeDeps(
  options: {
    secret?: string;
    readJsonResult?: unknown;
    insertResult?: { data: unknown; error: { message: string } | null };
  } = {}
) {
  const calls = {
    readJson: 0,
    inserts: [] as InsertCall[],
  };

  const admin = {
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => ({
        select: () => ({
          single: () => {
            calls.inserts.push({ table, row });
            return Promise.resolve(options.insertResult ?? { data: { id: 'ok' }, error: null });
          },
        }),
      }),
    }),
  };

  return {
    calls,
    deps: {
      getEnv: (name: string) => (name === 'N8N_CALLBACK_SECRET' ? options.secret : undefined),
      readJson: () => {
        calls.readJson++;
        return Promise.resolve(
          options.readJsonResult ?? {
            action: 'create_task',
            payload: { subject: 'Follow-up' },
          }
        );
      },
      admin,
    },
  };
}

function req(headers: Record<string, string> = {}) {
  return new Request('http://localhost/n8n-callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-n8n-secret': 'segredo-correto',
      ...headers,
    },
    body: '{}',
  });
}

Deno.test('n8n-callback: OPTIONS responde 200 sem tocar body ou DB', async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(new Request('http://localhost/x', { method: 'OPTIONS' }));
  assertEquals(res.status, 200);
  assertEquals(calls.readJson, 0);
  assertEquals(calls.inserts.length, 0);
});

Deno.test('n8n-callback: 405 para método inválido', async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(new Request('http://localhost/x', { method: 'GET' }));
  assertEquals(res.status, 405);
  assertEquals(calls.readJson, 0);
  assertEquals(calls.inserts.length, 0);
});

Deno.test('n8n-callback: 503 quando o segredo não está configurado', async () => {
  const { deps, calls } = makeDeps({ secret: undefined });
  const res = await createHandler(deps)(req());
  assertEquals(res.status, 503);
  assertEquals(await res.json(), { error: 'secret_not_configured' });
  assertEquals(calls.readJson, 0);
  assertEquals(calls.inserts.length, 0);
});

Deno.test('n8n-callback: 401 com segredo incorreto e zero efeitos antes do guard', async () => {
  const { deps, calls } = makeDeps({ secret: 'segredo-correto' });
  const res = await createHandler(deps)(req({ 'x-n8n-secret': 'segredo-errado' }));
  assertEquals(res.status, 401);
  assertEquals(await res.json(), { error: 'unauthorized' });
  assertEquals(calls.readJson, 0);
  assertEquals(calls.inserts.length, 0);
});

Deno.test('n8n-callback: create_task insere em bitrix24_activities', async () => {
  const { deps, calls } = makeDeps({
    secret: 'segredo-correto',
    readJsonResult: {
      action: 'create_task',
      payload: { subject: 'Task via fluxo' },
    },
    insertResult: { data: { id: 'task-1' }, error: null },
  });
  const res = await createHandler(deps)(req());
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {
    ok: true,
    action: 'create_task',
    result: { id: 'task-1' },
  });
  assertEquals(calls.readJson, 1);
  assertEquals(calls.inserts.length, 1);
  assertEquals(calls.inserts[0], {
    table: 'bitrix24_activities',
    row: {
      activity_type: 'task',
      subject: 'Task via fluxo',
      order_id: null,
      deal_id: null,
    },
  });
});
