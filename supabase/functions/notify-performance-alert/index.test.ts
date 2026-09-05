import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.env.set('DENO_TESTING', '1');

const { createHandler } = await import('./index.ts');

function makeDeps(
  options: {
    guardResult?:
      | { ok: true; dados: { origem: 'service_role' | 'segredo_cron' } }
      | { ok: false; resposta: Response };
    readJsonResult?: unknown;
    env?: Record<string, string | undefined>;
  } = {}
) {
  const calls = {
    guard: 0,
    readJson: 0,
    fetch: 0,
    telemetry: 0,
  };

  return {
    calls,
    deps: {
      getEnv: (name: string) => options.env?.[name],
      guardInternal: () => {
        calls.guard++;
        return Promise.resolve(
          options.guardResult ?? { ok: true as const, dados: { origem: 'segredo_cron' as const } }
        );
      },
      readJson: () => {
        calls.readJson++;
        return Promise.resolve(options.readJsonResult ?? { severity: 'warning', source: 'pg' });
      },
      fetch: () => {
        calls.fetch++;
        return Promise.resolve(new Response(null, { status: 202 }));
      },
      telemetryInsert: () => {
        calls.telemetry++;
        return Promise.resolve();
      },
      nowIso: () => '2026-08-31T12:00:00.000Z',
    },
  };
}

function req(method = 'POST') {
  return new Request('http://localhost/notify-performance-alert', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': 'cron-secret',
    },
    body: method === 'POST' ? '{}' : undefined,
  });
}

Deno.test('notify-performance-alert: OPTIONS responde 200 sem guard nem I/O', async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(new Request('http://localhost/x', { method: 'OPTIONS' }));
  assertEquals(res.status, 200);
  assertEquals(calls.guard, 0);
  assertEquals(calls.readJson, 0);
  assertEquals(calls.fetch, 0);
  assertEquals(calls.telemetry, 0);
});

Deno.test('notify-performance-alert: 405 em método inválido', async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(req('GET'));
  assertEquals(res.status, 405);
  assertEquals(calls.guard, 0);
  assertEquals(calls.readJson, 0);
  assertEquals(calls.fetch, 0);
  assertEquals(calls.telemetry, 0);
});

Deno.test(
  'notify-performance-alert: preserva falha de misconfig do guard e não toca body/fetch/DB',
  async () => {
    const { deps, calls } = makeDeps({
      guardResult: {
        ok: false,
        resposta: new Response(JSON.stringify({ error: 'secret_not_configured' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      },
    });
    const res = await createHandler(deps)(req());
    assertEquals(res.status, 503);
    assertEquals(await res.json(), { error: 'secret_not_configured' });
    assertEquals(calls.guard, 1);
    assertEquals(calls.readJson, 0);
    assertEquals(calls.fetch, 0);
    assertEquals(calls.telemetry, 0);
  }
);

Deno.test('notify-performance-alert: 401 do guard bloqueia efeitos antes do body', async () => {
  const { deps, calls } = makeDeps({
    guardResult: {
      ok: false,
      resposta: new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    },
  });
  const res = await createHandler(deps)(req());
  assertEquals(res.status, 401);
  assertEquals(await res.json(), { error: 'unauthorized' });
  assertEquals(calls.guard, 1);
  assertEquals(calls.readJson, 0);
  assertEquals(calls.fetch, 0);
  assertEquals(calls.telemetry, 0);
});

Deno.test(
  'notify-performance-alert: warning interno notifica canais configurados e grava telemetria',
  async () => {
    const { deps, calls } = makeDeps({
      env: {
        SLACK_WEBHOOK_URL: 'https://hooks.slack.test',
        RESEND_API_KEY: 'resend-key',
        ALERTS_EMAIL_TO: 'ops@empresa.com',
        ALERTS_EMAIL_FROM: 'alertas@empresa.com',
      },
      readJsonResult: {
        alert: {
          id: 'alert-1',
          severity: 'warning',
          source: 'pg_stat_statements',
          reason: 'ratio alto',
        },
      },
    });
    const res = await createHandler(deps)(req());
    const payload = await res.json();
    assertEquals(res.status, 200);
    assertEquals(payload.ok, true);
    assertEquals(calls.guard, 1);
    assertEquals(calls.readJson, 1);
    assertEquals(calls.fetch, 2);
    assertEquals(calls.telemetry, 1);
  }
);
