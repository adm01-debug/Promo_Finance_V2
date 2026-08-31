import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { createHandler, type SqlClient } from "./index.ts";

function makeRequest(
  body: unknown,
  secret: string | null = "segredo-correto",
): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (secret !== null) headers.set("x-mcp-secret", secret);
  return new Request("http://localhost/mcp-query", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

class MockSqlClient implements SqlClient {
  calls: string[] = [];

  async unsafe(query: string): Promise<unknown[]> {
    this.calls.push(query);
    if (query === "SET TRANSACTION READ ONLY") return [];
    if (query.startsWith("SET LOCAL ")) return [];
    return [{ ok: true, query }];
  }

  async begin<T>(callback: (transaction: SqlClient) => Promise<T>): Promise<T> {
    this.calls.push("__begin__");
    return await callback(this);
  }
}

Deno.test("handler retorna 401 quando o segredo não é enviado", async () => {
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
  });
  const response = await handler(makeRequest({ sql: "SELECT 1" }, null));
  assertEquals(response.status, 401);
});

Deno.test("handler retorna 401 quando o segredo é inválido", async () => {
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
  });
  const response = await handler(
    makeRequest({ sql: "SELECT 1" }, "segredo-errado"),
  );
  assertEquals(response.status, 401);
});

Deno.test("handler bloqueia ataque antes de tocar no banco", async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(
    makeRequest({
      sql: "SELECT public.exec_sql('DROP TABLE public.empresas')",
    }),
  );
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
  assertEquals(
    payload.error,
    "SQL bloqueado pela política de segurança do MCP",
  );
});

Deno.test("handler aceita SELECT legítimo e executa em transação READ ONLY", async () => {
  const client = new MockSqlClient();
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => client,
  });

  const response = await handler(
    makeRequest({ sql: "SELECT * FROM public.empresas" }),
  );
  const payload = await response.json();

  assertEquals(response.status, 200);
  assertEquals(client.calls[0], "__begin__");
  assertEquals(client.calls[1], "SET LOCAL statement_timeout = '5000ms'");
  assertEquals(client.calls[2], "SET LOCAL lock_timeout = '1000ms'");
  assertEquals(client.calls[3], "SET TRANSACTION READ ONLY");
  assertEquals(
    client.calls[4],
    "SELECT * FROM (SELECT * FROM public.empresas) AS __mcp_limited LIMIT 100",
  );
  assertEquals(payload.count, 1);
});

Deno.test("handler limita quantidade de statements na transação antes do banco", async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const stmts = Array.from({ length: 101 }, () => "SELECT 1");
  const response = await handler(makeRequest({
    stmts_b64: btoa(JSON.stringify(stmts)),
  }));
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
  assertEquals(
    payload.error,
    "transação excede o limite de 100 statements",
  );
});

Deno.test("handler rejeita stmt transacional não-string antes do banco", async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(makeRequest({
    stmts_b64: btoa(JSON.stringify(["SELECT 1", null])),
  }));

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
});

Deno.test("handler rejeita transação só com statements vazios", async () => {
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => new MockSqlClient(),
  });

  const response = await handler(makeRequest({
    stmts_b64: btoa(JSON.stringify(["   ", "\n"])),
  }));
  const payload = await response.json();

  assertEquals(response.status, 400);
  assertEquals(
    payload.error,
    "transação deve conter ao menos um statement não vazio",
  );
});

Deno.test("handler rejeita sql acima do limite de bytes antes do banco", async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(makeRequest({
    sql: `SELECT '${"a".repeat(1024 * 1024)}'`,
  }));

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
});

Deno.test("handler rejeita sql_b64 superdimensionado antes de decodificar", async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(makeRequest({
    sql_b64: "A".repeat(1_398_119),
  }));

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
});

Deno.test("handler rejeita stmts_b64 superdimensionado antes de decodificar", async () => {
  let tocouNoBanco = false;
  const handler = createHandler({
    secret: "segredo-correto",
    dbUrl: "postgres://mock",
    getSql: () => {
      tocouNoBanco = true;
      return new MockSqlClient();
    },
  });

  const response = await handler(makeRequest({
    stmts_b64: "A".repeat(2_796_223),
  }));

  assertEquals(response.status, 400);
  assertEquals(tocouNoBanco, false);
});

Deno.test("handler rejeita admin.path com dot segments e método arbitrário", async () => {
  const handler = createHandler({
    secret: "segredo-correto",
    serviceKey: "srv",
    supabaseUrl: "https://supabase.local",
    fetchImpl: async () => new Response("{}"),
  });

  const respostaPath = await handler(makeRequest({
    admin: { path: "storage/v1/../secrets", method: "GET" },
  }));
  const respostaMetodo = await handler(makeRequest({
    admin: { path: "storage/v1/object/list", method: "TRACE" },
  }));

  assertEquals(respostaPath.status, 400);
  assertEquals(respostaMetodo.status, 400);
});
