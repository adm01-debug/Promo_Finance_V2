import { assertEquals } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { createHandler, type SqlClient } from './index.ts';

function makeRequest(body: unknown, secret: string | null = 'segredo-correto'): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (secret !== null) headers.set('x-mcp-secret', secret);
  return new Request('http://localhost/mcp-query', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function makeRawRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/mcp-query', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-mcp-secret': 'segredo-correto',
      ...headers,
    },
    body,
  });
}

class MockSqlClient implements SqlClient {
  calls: string[] = [];

  async unsafe(query: string): Promise<unknown[]> {
    this.calls.push(query);
    if (query === 'SET TRANSACTION READ ONLY') return [];
    if (query.startsWith('SET LOCAL ')) return [];
    return [{ ok: true, query }];
  }

  async begin<T>(callback: (transaction: SqlClient) => Promise<T>): Promise<T> {
    this.calls.push('__begin__');
    return await callback(this);
  }
}

Deno.test('handler retorna 401 quando o segredo não é enviado', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
  });
  const response = await handler(makeRequest({ sql: 'SELECT 1' }, null));
  assertEquals(response.status, 401);
});

Deno.test('handler retorna 401 quando o segredo é inválido', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
  });
  const response = await handler(makeRequest({ sql: 'SELECT 1' }, 'segredo-errado'));
  assertEquals(response.status, 401);
});

Deno.test('handler bloqueia ataque antes de tocar no banco', async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(
    makeRequest({
      sql: "SELECT public.exec_sql('DROP TABLE public.empresas')",
    })
  );
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
  assertEquals(payload.error, 'SQL bloqueado pela política de segurança do MCP');
});

Deno.test('handler aceita SELECT legítimo e executa em transação READ ONLY', async () => {
  const client = new MockSqlClient();
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => client,
  });

  const response = await handler(makeRequest({ sql: 'SELECT * FROM public.empresas' }));
  const payload = await response.json();

  assertEquals(response.status, 200);
  assertEquals(client.calls[0], '__begin__');
  assertEquals(client.calls[1], "SET LOCAL statement_timeout = '5000ms'");
  assertEquals(client.calls[2], "SET LOCAL lock_timeout = '1000ms'");
  assertEquals(client.calls[3], 'SET TRANSACTION READ ONLY');
  assertEquals(
    client.calls[4],
    'SELECT * FROM (SELECT * FROM public.empresas) AS __mcp_limited LIMIT 100'
  );
  assertEquals(payload.count, 1);
});

Deno.test('handler aplica timeout também em escrita única', async () => {
  const client = new MockSqlClient();
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => client,
  });

  const response = await handler(
    makeRequest({
      sql: "UPDATE public.profiles SET role = 'user' WHERE id = 1",
    })
  );

  assertEquals(response.status, 200);
  assertEquals(client.calls[0], '__begin__');
  assertEquals(client.calls[1], "SET LOCAL statement_timeout = '5000ms'");
  assertEquals(client.calls[2], "SET LOCAL lock_timeout = '1000ms'");
  assertEquals(client.calls.includes('SET TRANSACTION READ ONLY'), false);
  assertEquals(client.calls[3], "UPDATE public.profiles SET role = 'user' WHERE id = 1");
});

Deno.test('handler limita quantidade de statements na transação antes do banco', async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const stmts = Array.from({ length: 101 }, () => 'SELECT 1');
  const response = await handler(
    makeRequest({
      stmts_b64: btoa(JSON.stringify(stmts)),
    })
  );
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
  assertEquals(payload.error, 'transação excede o limite de 100 statements');
});

Deno.test('handler rejeita stmt transacional não-string antes do banco', async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(
    makeRequest({
      stmts_b64: btoa(JSON.stringify(['SELECT 1', null])),
    })
  );

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
});

Deno.test('handler rejeita transação só com statements vazios', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => new MockSqlClient(),
  });

  const response = await handler(
    makeRequest({
      stmts_b64: btoa(JSON.stringify(['   ', '\n'])),
    })
  );
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(payload.error, 'transação deve conter ao menos um statement não vazio');
});

Deno.test('handler rejeita sql acima do limite de bytes antes do banco', async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(
    makeRequest({
      sql: `SELECT '${'a'.repeat(1024 * 1024)}'`,
    })
  );

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
});

Deno.test('handler rejeita sql_b64 superdimensionado antes de decodificar', async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(
    makeRequest({
      sql_b64: 'A'.repeat(1_398_119),
    })
  );

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
});

Deno.test('handler rejeita stmts_b64 superdimensionado antes de decodificar', async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(
    makeRequest({
      stmts_b64: 'A'.repeat(2_796_223),
    })
  );

  assertEquals(response.status, 413);
  assertEquals(tocouNoBanco, false);
});

Deno.test('handler rejeita payload bruto acima de 2 MiB antes do parse', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
  });

  const big = `{"sql":"${'a'.repeat(2 * 1024 * 1024)}"}`;
  const response = await handler(makeRawRequest(big));

  assertEquals(response.status, 413);
});

Deno.test('handler rejeita content-length inválido antes do parse', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
  });

  const response = await handler(makeRawRequest('{"sql":"SELECT 1"}', { 'content-length': 'abc' }));
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(payload.error, 'content-length inválido');
});

Deno.test('handler rejeita body vazio com invalid json', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
  });

  const response = await handler(makeRawRequest(''));
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(payload.error, 'invalid json');
});

Deno.test('handler exige exatamente um modo por request', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
  });

  const respostaSemModo = await handler(makeRequest({ limit: 10 }));
  const respostaComDoisModos = await handler(
    makeRequest({
      sql: 'SELECT 1',
      admin: { path: 'auth/v1/admin/users', method: 'GET' },
    })
  );
  const respostaSqlDuplicado = await handler(
    makeRequest({
      sql: 'SELECT 1',
      sql_b64: btoa('SELECT 2'),
    })
  );

  assertEquals(respostaSemModo.status, 400);
  assertEquals(respostaComDoisModos.status, 400);
  assertEquals(respostaSqlDuplicado.status, 400);
});

Deno.test('handler aplica timeout também em transação mista', async () => {
  const client = new MockSqlClient();
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => client,
  });

  const response = await handler(
    makeRequest({
      allow_all_rows: true,
      stmts_b64: btoa(
        JSON.stringify(["UPDATE public.profiles SET role = 'user' WHERE id = 1", 'SELECT 1'])
      ),
    })
  );

  assertEquals(response.status, 200);
  assertEquals(client.calls[0], '__begin__');
  assertEquals(client.calls[1], "SET LOCAL statement_timeout = '5000ms'");
  assertEquals(client.calls[2], "SET LOCAL lock_timeout = '1000ms'");
  assertEquals(client.calls.includes('SET TRANSACTION READ ONLY'), false);
});

Deno.test('handler rejeita bypass de escrita ampla com predicado não-identitário', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    dbUrl: 'postgres://mock',
    getSql: () => new MockSqlClient(),
  });

  const response = await handler(
    makeRequest({
      sql: 'UPDATE public.audit_logs SET archived = true WHERE created_at < now()',
    })
  );

  assertEquals(response.status, 400);
});

Deno.test(
  'handler rejeita admin.path com dot segments, método arbitrário e rota fora da allowlist',
  async () => {
    const handler = createHandler({
      secret: 'segredo-correto',
      serviceKey: 'srv',
      supabaseUrl: 'https://supabase.local',
      fetchImpl: async () => new Response('{}'),
    });

    const respostaPath = await handler(
      makeRequest({
        admin: { path: 'storage/v1/../secrets', method: 'GET' },
      })
    );
    const respostaMetodo = await handler(
      makeRequest({
        admin: { path: 'storage/v1/object/list', method: 'TRACE' },
      })
    );
    const respostaRota = await handler(
      makeRequest({
        admin: { path: 'auth/v1/admin/audit', method: 'GET' },
      })
    );

    assertEquals(respostaPath.status, 400);
    assertEquals(respostaMetodo.status, 400);
    assertEquals(respostaRota.status, 400);
  }
);

Deno.test('handler limita body e resposta do proxy admin', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    serviceKey: 'srv',
    supabaseUrl: 'https://supabase.local',
    fetchImpl: async () => new Response('x'.repeat(1024 * 1024 + 1)),
  });

  const respostaBody = await handler(
    makeRequest({
      admin: {
        path: 'storage/v1/object/list',
        method: 'POST',
        body: { payload: 'x'.repeat(256 * 1024) },
      },
    })
  );
  const respostaResposta = await handler(
    makeRequest({
      admin: { path: 'auth/v1/admin/users', method: 'GET' },
    })
  );

  assertEquals(respostaBody.status, 413);
  assertEquals(respostaResposta.status, 502);
});

Deno.test('handler aceita rotas admin allowlisted realmente usadas pelo worker', async () => {
  const chamadas: Array<{ url: string; method: string; body?: string }> = [];
  const handler = createHandler({
    secret: 'segredo-correto',
    serviceKey: 'srv',
    supabaseUrl: 'https://supabase.local',
    fetchImpl: async (input, init) => {
      chamadas.push({
        url: String(input),
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? init.body : undefined,
      });
      return new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const respostaEsvaziarBucket = await handler(
    makeRequest({
      admin: { path: 'storage/v1/bucket/arquivos/empty', method: 'POST' },
    })
  );
  const respostaDeletePrefixos = await handler(
    makeRequest({
      admin: {
        path: 'storage/v1/object/arquivos',
        method: 'DELETE',
        body: { prefixes: ['empresa-1/', 'empresa-2/tmp/'] },
      },
    })
  );

  assertEquals(respostaEsvaziarBucket.status, 200);
  assertEquals(respostaDeletePrefixos.status, 200);
  assertEquals(chamadas[0], {
    url: 'https://supabase.local/storage/v1/bucket/arquivos/empty',
    method: 'POST',
    body: undefined,
  });
  assertEquals(chamadas[1], {
    url: 'https://supabase.local/storage/v1/object/arquivos',
    method: 'DELETE',
    body: '{"prefixes":["empresa-1/","empresa-2/tmp/"]}',
  });
});

Deno.test('handler exige contrato explícito para DELETE storage/v1/object/<bucket>', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    serviceKey: 'srv',
    supabaseUrl: 'https://supabase.local',
    fetchImpl: async () => new Response('{}'),
  });

  const semPrefixes = await handler(
    makeRequest({
      admin: { path: 'storage/v1/object/arquivos', method: 'DELETE' },
    })
  );
  const prefixosInvalidos = await handler(
    makeRequest({
      admin: {
        path: 'storage/v1/object/arquivos',
        method: 'DELETE',
        body: { prefixes: ['', 1] },
      },
    })
  );

  assertEquals(semPrefixes.status, 400);
  assertEquals(prefixosInvalidos.status, 400);
});

Deno.test('handler aborta proxy admin em timeout', async () => {
  const handler = createHandler({
    secret: 'segredo-correto',
    serviceKey: 'srv',
    supabaseUrl: 'https://supabase.local',
    fetchImpl: (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('abortado')));
      }),
  });

  const response = await handler(
    makeRequest({
      admin: { path: 'auth/v1/admin/users', method: 'GET' },
    })
  );

  assertEquals(response.status, 504);
});
