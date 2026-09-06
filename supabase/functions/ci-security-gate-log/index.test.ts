import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.env.set('DENO_TESTING', '1');

const { createHandler } = await import('./index.ts');

function makeDeps(
  options: {
    secret?: string;
    readJsonResult?: unknown;
    insertResult?: { error: { message: string } | null; count: number | null };
  } = {}
) {
  const calls = {
    readJson: 0,
    insertRows: 0,
    rows: [] as Record<string, unknown>[],
  };

  return {
    calls,
    deps: {
      getEnv: (name: string) => (name === 'CI_GATE_LOG_SECRET' ? options.secret : undefined),
      readJson: () => {
        calls.readJson++;
        return Promise.resolve(
          options.readJsonResult ?? {
            failures: [
              {
                matrix: 'rpc',
                function_name: 'fn_a',
                role_tested: 'anon',
                expected_state: 'deny',
              },
            ],
          }
        );
      },
      insertRows: (rows: Record<string, unknown>[]) => {
        calls.insertRows++;
        calls.rows = rows;
        return Promise.resolve(options.insertResult ?? { error: null, count: rows.length });
      },
    },
  };
}

function req(method = 'POST', body = '{}') {
  return new Request('http://localhost/ci-security-gate-log', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-ci-gate-secret': 'segredo-correto',
    },
    body: method === 'POST' ? body : undefined,
  });
}

Deno.test('ci-security-gate-log: OPTIONS responde 200 sem efeitos colaterais', async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(new Request('http://localhost/x', { method: 'OPTIONS' }));
  assertEquals(res.status, 200);
  assertEquals(calls.readJson, 0);
  assertEquals(calls.insertRows, 0);
});

Deno.test('ci-security-gate-log: 405 em método diferente de POST', async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(new Request('http://localhost/x', { method: 'GET' }));
  assertEquals(res.status, 405);
  assertEquals(calls.readJson, 0);
  assertEquals(calls.insertRows, 0);
});

Deno.test('ci-security-gate-log: 503 quando o segredo não está configurado', async () => {
  const { deps, calls } = makeDeps({ secret: undefined });
  const res = await createHandler(deps)(req());
  assertEquals(res.status, 503);
  assertEquals(await res.json(), { error: 'secret_not_configured' });
  assertEquals(calls.readJson, 0);
  assertEquals(calls.insertRows, 0);
});

Deno.test(
  'ci-security-gate-log: 401 com segredo incorreto e zero efeitos antes do guard',
  async () => {
    const { deps, calls } = makeDeps({ secret: 'segredo-correto' });
    const bad = new Request('http://localhost/x', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ci-gate-secret': 'segredo-errado',
      },
      body: '{}',
    });
    const res = await createHandler(deps)(bad);
    assertEquals(res.status, 401);
    assertEquals(await res.json(), { error: 'unauthorized' });
    assertEquals(calls.readJson, 0);
    assertEquals(calls.insertRows, 0);
  }
);

Deno.test('ci-security-gate-log: sucesso insere linhas mapeadas', async () => {
  const { deps, calls } = makeDeps({
    secret: 'segredo-correto',
    readJsonResult: {
      git_sha: 'abc',
      failures: [
        {
          matrix: 'rpc',
          function_name: 'fn_a',
          role_tested: 'authenticated',
          expected_state: 'allow',
          observed_status: 403,
        },
      ],
    },
  });
  const res = await createHandler(deps)(req());
  assertEquals(res.status, 201);
  assertEquals(await res.json(), { inserted: 1 });
  assertEquals(calls.readJson, 1);
  assertEquals(calls.insertRows, 1);
  assertEquals(calls.rows[0].git_sha, 'abc');
  assertEquals(calls.rows[0].function_name, 'fn_a');
  assertEquals(calls.rows[0].role_tested, 'authenticated');
});
