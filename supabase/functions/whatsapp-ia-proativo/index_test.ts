import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, type WhatsappIaProativoDependencies } from "./index.ts";

type Counters = {
  ai: number;
  auth: number;
  client: number;
  rateLimit: number;
};

const EMPRESA_AUTORIZADA = "11111111-1111-4111-8111-111111111111";
const EMPRESA_ALHEIA = "22222222-2222-4222-8222-222222222222";
const CLIENTE_AUTORIZADO = "33333333-3333-4333-8333-333333333333";
const CLIENTE_ALHEIO = "44444444-4444-4444-8444-444444444444";
const CONTA_AUTORIZADA = "55555555-5555-4555-8555-555555555555";
const CONTA_ALHEIA = "66666666-6666-4666-8666-666666666666";

interface DbCall {
  table: string;
  operation: "select" | "insert";
  filters: Array<{ method: string; column: string; value: unknown }>;
  payload?: unknown;
}

interface FakeDatabase {
  userEmpresas?: { data: unknown[] | null; error: unknown };
  contasVencer?: { data: unknown[] | null; error: unknown };
  contasVencidas?: { data: unknown[] | null; error: unknown };
  clientes?: { data: unknown[] | null; error: unknown };
  contasPorId?: Record<string, { data: unknown; error: unknown }>;
  clientesPorId?: Record<string, { data: unknown; error: unknown }>;
  insertError?: unknown;
}

function fakeSupabaseClient(
  database: FakeDatabase = {},
  calls: DbCall[] = [],
): ReturnType<WhatsappIaProativoDependencies["criarClient"]> {
  const client = {
    from(table: string) {
      const filters: DbCall["filters"] = [];
      let operation: DbCall["operation"] = "select";

      const resultForSelect = () => {
        if (table === "user_empresas") {
          return database.userEmpresas ?? {
            data: [{ empresa_id: EMPRESA_AUTORIZADA }],
            error: null,
          };
        }
        if (table === "contas_receber") {
          const id = filters.find((f) => f.method === "eq" && f.column === "id")
            ?.value;
          if (typeof id === "string") {
            return database.contasPorId?.[id] ?? { data: null, error: null };
          }
          return filters.some((f) =>
              f.method === "lt" && f.column === "data_vencimento"
            )
            ? database.contasVencidas ?? { data: [], error: null }
            : database.contasVencer ?? { data: [], error: null };
        }
        if (table === "clientes") {
          const id = filters.find((f) => f.method === "eq" && f.column === "id")
            ?.value;
          if (typeof id === "string") {
            return database.clientesPorId?.[id] ?? { data: null, error: null };
          }
          return database.clientes ?? { data: [], error: null };
        }
        return { data: [], error: null };
      };

      const executeSelect = () => {
        calls.push({ table, operation, filters: [...filters] });
        return resultForSelect();
      };

      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      for (const method of ["eq", "in", "gte", "lte", "lt"] as const) {
        builder[method] = (column: string, value: unknown) => {
          filters.push({ method, column, value });
          return builder;
        };
      }
      builder.maybeSingle = () => Promise.resolve(executeSelect());
      builder.insert = (payload: unknown) => {
        operation = "insert";
        calls.push({
          table,
          operation,
          filters: [...filters],
          payload,
        });
        return Promise.resolve({
          data: null,
          error: database.insertError ?? null,
        });
      };
      builder.then = (
        resolve: (value: unknown) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(executeSelect()).then(resolve, reject);

      return builder;
    },
  };

  return client as unknown as ReturnType<
    WhatsappIaProativoDependencies["criarClient"]
  >;
}

function dependencies(
  counters: Counters,
  overrides: Partial<WhatsappIaProativoDependencies> = {},
  database: FakeDatabase = {},
  dbCalls: DbCall[] = [],
): Partial<WhatsappIaProativoDependencies> {
  return {
    autorizar: () => {
      counters.auth++;
      return Promise.resolve({
        ok: true,
        dados: { origem: "usuario", userId: "usuario-teste" },
      });
    },
    buscar: (() => {
      counters.ai++;
      throw new Error("A IA não deveria ser chamada neste cenário");
    }) as typeof fetch,
    criarClient: (() => {
      counters.client++;
      return fakeSupabaseClient(database, dbCalls);
    }) as unknown as WhatsappIaProativoDependencies["criarClient"],
    verificarRateLimit: (() => {
      counters.rateLimit++;
      return Promise.resolve({
        allowed: true,
        count: 1,
        limit: 30,
        retryAfterSeconds: 0,
      });
    }) as WhatsappIaProativoDependencies["verificarRateLimit"],
    ...overrides,
  };
}

function counters(): Counters {
  return { ai: 0, auth: 0, client: 0, rateLimit: 0 };
}

function post(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/whatsapp-ia-proativo", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function withAuthEnvironment(run: () => Promise<void>): Promise<void> {
  const names = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "SUPABASE_URL",
    "INTERNAL_SECRET_INTERNAL_JOBS",
    "LOVABLE_API_KEY",
  ] as const;
  const previous = new Map(names.map((name) => [name, Deno.env.get(name)]));

  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-teste");
  Deno.env.set("SUPABASE_ANON_KEY", "anon-publica-teste");
  Deno.env.set("SUPABASE_URL", "http://supabase.invalid");
  Deno.env.set("INTERNAL_SECRET_INTERNAL_JOBS", "segredo-interno-teste");
  Deno.env.delete("LOVABLE_API_KEY");

  try {
    await run();
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) Deno.env.delete(name);
      else Deno.env.set(name, value);
    }
  }
}

Deno.test("whatsapp-ia-proativo: OPTIONS preserva CORS sem autenticar", async () => {
  const calls = counters();
  const handler = createHandler(dependencies(calls));
  const response = await handler(
    new Request("http://localhost/whatsapp-ia-proativo", { method: "OPTIONS" }),
  );

  assertEquals(response.status, 200);
  assertEquals(calls, { ai: 0, auth: 0, client: 0, rateLimit: 0 });
  assertStringIncludes(
    response.headers.get("access-control-allow-headers") ?? "",
    "x-internal-secret",
  );
});

Deno.test("whatsapp-ia-proativo: chamada sem autenticação falha antes de IA e banco", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const deps = dependencies(calls);
    delete deps.autorizar;
    const handler = createHandler(deps);

    const response = await handler(
      new Request("http://localhost/whatsapp-ia-proativo", {
        method: "POST",
        body: "{json-inválido",
      }),
    );

    assertEquals(response.status, 401);
    assertEquals((await response.json()).error, "nao_autenticado");
    assertEquals(calls, { ai: 0, auth: 0, client: 0, rateLimit: 0 });
  });
});

Deno.test("whatsapp-ia-proativo: anon key pública não autentica o endpoint", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const deps = dependencies(calls);
    delete deps.autorizar;
    const handler = createHandler(deps);
    const response = await handler(
      post(
        {
          action: "test",
          data: { telefone: "11999999999", mensagem: "teste" },
        },
        { Authorization: "Bearer anon-publica-teste" },
      ),
    );

    assertEquals(response.status, 401);
    assertEquals(calls.client, 0);
    assertEquals(calls.rateLimit, 0);
    assertEquals(calls.ai, 0);
  });
});

Deno.test("whatsapp-ia-proativo: resultado usuário do guard mantém o fluxo do frontend", async () => {
  const calls = counters();
  const handler = createHandler(dependencies(calls));
  const response = await handler(
    post(
      {
        action: "test",
        data: { telefone: "(11) 99999-9999", mensagem: "mensagem de teste" },
      },
      { Authorization: "Bearer jwt-de-usuario-validado" },
    ),
  );

  assertEquals(response.status, 200);
  assertEquals(
    (await response.json()).whatsapp_link,
    "https://wa.me/5511999999999?text=mensagem%20de%20teste",
  );
  assertEquals(response.headers.get("access-control-allow-origin"), "*");
  assertEquals(calls, { ai: 0, auth: 1, client: 1, rateLimit: 1 });
});

Deno.test("whatsapp-ia-proativo: empresa alheia falha antes de rate limit, IA ou link", async () => {
  const calls = counters();
  const dbCalls: DbCall[] = [];
  const handler = createHandler(dependencies(calls, {}, {}, dbCalls));
  const response = await handler(
    post({
      action: "enviar-mensagem",
      data: {
        empresa_id: EMPRESA_ALHEIA,
        telefone: "11999999999",
        mensagem: "não pode sair",
      },
    }),
  );

  assertEquals(response.status, 403);
  const body = await response.json();
  assertEquals(body.error, "sem_permissao_empresa");
  assertEquals(body.whatsapp_link, undefined);
  assertEquals(calls, { ai: 0, auth: 1, client: 1, rateLimit: 0 });
  assertEquals(dbCalls.map((call) => call.table), ["user_empresas"]);
  assertEquals(
    dbCalls[0].filters,
    [
      { method: "eq", column: "user_id", value: "usuario-teste" },
      { method: "eq", column: "ativo", value: true },
    ],
  );
});

Deno.test("whatsapp-ia-proativo: falha ao resolver tenant fecha antes de IA ou ação", async () => {
  const calls = counters();
  const dbCalls: DbCall[] = [];
  const handler = createHandler(dependencies(
    calls,
    {},
    { userEmpresas: { data: null, error: { message: "indisponível" } } },
    dbCalls,
  ));
  const response = await handler(
    post({
      action: "gerar-resposta-ia",
      data: { pergunta_cliente: "Posso parcelar?", contexto: {} },
    }),
  );

  assertEquals(response.status, 503);
  assertEquals((await response.json()).error, "erro_autorizacao");
  assertEquals(calls, { ai: 0, auth: 1, client: 1, rateLimit: 0 });
  assertEquals(dbCalls.map((call) => call.table), ["user_empresas"]);
});

Deno.test("whatsapp-ia-proativo: usuário sem empresa ativa falha fechado antes do link", async () => {
  const calls = counters();
  const handler = createHandler(dependencies(
    calls,
    {},
    { userEmpresas: { data: [], error: null } },
  ));
  const response = await handler(
    post({
      action: "test",
      data: { telefone: "11999999999", mensagem: "não pode sair" },
    }),
  );

  assertEquals(response.status, 403);
  const body = await response.json();
  assertEquals(body.error, "sem_permissao_empresa");
  assertEquals(body.whatsapp_link, undefined);
  assertEquals(calls, { ai: 0, auth: 1, client: 1, rateLimit: 0 });
});

Deno.test("whatsapp-ia-proativo: consultas de alertas filtram contas e clientes pelo tenant", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const dbCalls: DbCall[] = [];
    const handler = createHandler(dependencies(
      calls,
      {},
      {
        contasVencer: {
          data: [
            {
              id: CONTA_AUTORIZADA,
              empresa_id: EMPRESA_AUTORIZADA,
              cliente_id: CLIENTE_AUTORIZADO,
              valor: 100,
              data_vencimento: "2026-09-02",
              descricao: "Conta permitida",
            },
            {
              id: CONTA_ALHEIA,
              empresa_id: EMPRESA_ALHEIA,
              cliente_id: CLIENTE_ALHEIO,
              valor: 999,
              data_vencimento: "2026-09-02",
              descricao: "Conta alheia injetada pelo mock",
            },
          ],
          error: null,
        },
        contasVencidas: { data: [], error: null },
        clientes: {
          data: [
            {
              id: CLIENTE_AUTORIZADO,
              empresa_id: EMPRESA_AUTORIZADA,
              razao_social: "Cliente permitido",
              nome: null,
              telefone: "11999999999",
            },
            {
              id: CLIENTE_ALHEIO,
              empresa_id: EMPRESA_ALHEIA,
              razao_social: "Cliente alheio",
              nome: null,
              telefone: "11888888888",
            },
          ],
          error: null,
        },
      },
      dbCalls,
    ));

    const response = await handler(
      post({ action: "analisar-alertas", data: {} }),
    );

    assertEquals(response.status, 200);
    const body = await response.json();
    assertEquals(body.resumo.total, 1);
    assertEquals(body.alertas[0].cliente_nome, "Cliente permitido");
    assertEquals(body.alertas[0].dados.empresa_id, EMPRESA_AUTORIZADA);
    assertEquals(body.alertas[0].dados.conta_receber_id, CONTA_AUTORIZADA);
    assertEquals(calls.ai, 0);

    const consultasTenant = dbCalls.filter((call) =>
      call.table === "contas_receber" || call.table === "clientes"
    );
    assertEquals(consultasTenant.length, 3);
    for (const consulta of consultasTenant) {
      assertEquals(
        consulta.filters.some((filtro) =>
          filtro.method === "in" && filtro.column === "empresa_id" &&
          JSON.stringify(filtro.value) === JSON.stringify([EMPRESA_AUTORIZADA])
        ),
        true,
      );
    }
  });
});

Deno.test("whatsapp-ia-proativo: conta cross-tenant não gera link nem histórico", async () => {
  const calls = counters();
  const dbCalls: DbCall[] = [];
  const handler = createHandler(dependencies(
    calls,
    {},
    {
      contasPorId: {
        [CONTA_ALHEIA]: {
          data: {
            id: CONTA_ALHEIA,
            empresa_id: EMPRESA_ALHEIA,
            cliente_id: CLIENTE_ALHEIO,
          },
          error: null,
        },
      },
    },
    dbCalls,
  ));
  const response = await handler(
    post({
      action: "enviar-mensagem",
      data: {
        conta_receber_id: CONTA_ALHEIA,
        telefone: "11888888888",
        mensagem: "tentativa cross-tenant",
      },
    }),
  );

  assertEquals(response.status, 403);
  const body = await response.json();
  assertEquals(body.whatsapp_link, undefined);
  assertEquals(calls.ai, 0);
  assertEquals(
    dbCalls.some((call) => call.operation === "insert"),
    false,
  );
  const consultaConta = dbCalls.find((call) => call.table === "contas_receber");
  assertEquals(
    consultaConta?.filters.some((filtro) =>
      filtro.method === "in" && filtro.column === "empresa_id" &&
      JSON.stringify(filtro.value) === JSON.stringify([EMPRESA_AUTORIZADA])
    ),
    true,
  );
});

Deno.test("whatsapp-ia-proativo: vínculo conta-cliente entre tenants falha fechado", async () => {
  const calls = counters();
  const dbCalls: DbCall[] = [];
  const handler = createHandler(dependencies(
    calls,
    {},
    {
      contasPorId: {
        [CONTA_AUTORIZADA]: {
          data: {
            id: CONTA_AUTORIZADA,
            empresa_id: EMPRESA_AUTORIZADA,
            cliente_id: CLIENTE_ALHEIO,
          },
          error: null,
        },
      },
      clientesPorId: {
        [CLIENTE_ALHEIO]: {
          // Simula dado legado inconsistente, mesmo que o proxy ignore filtros.
          data: { id: CLIENTE_ALHEIO, empresa_id: EMPRESA_ALHEIA },
          error: null,
        },
      },
    },
    dbCalls,
  ));
  const response = await handler(
    post({
      action: "enviar-mensagem",
      data: {
        conta_receber_id: CONTA_AUTORIZADA,
        telefone: "11888888888",
        mensagem: "não pode sair",
      },
    }),
  );

  assertEquals(response.status, 403);
  assertEquals((await response.json()).whatsapp_link, undefined);
  assertEquals(calls.ai, 0);
  assertEquals(
    dbCalls.some((call) => call.operation === "insert"),
    false,
  );
  const consultaCliente = dbCalls.find((call) => call.table === "clientes");
  assertEquals(
    consultaCliente?.filters.some((filtro) =>
      filtro.method === "eq" && filtro.column === "empresa_id" &&
      filtro.value === EMPRESA_AUTORIZADA
    ),
    true,
  );
});

Deno.test("whatsapp-ia-proativo: histórico usa empresa e cliente da conta autorizada", async () => {
  const calls = counters();
  const dbCalls: DbCall[] = [];
  const handler = createHandler(dependencies(
    calls,
    {},
    {
      contasPorId: {
        [CONTA_AUTORIZADA]: {
          data: {
            id: CONTA_AUTORIZADA,
            empresa_id: EMPRESA_AUTORIZADA,
            cliente_id: CLIENTE_AUTORIZADO,
          },
          error: null,
        },
      },
      clientesPorId: {
        [CLIENTE_AUTORIZADO]: {
          data: {
            id: CLIENTE_AUTORIZADO,
            empresa_id: EMPRESA_AUTORIZADA,
          },
          error: null,
        },
      },
    },
    dbCalls,
  ));
  const response = await handler(
    post({
      action: "enviar-mensagem",
      data: {
        conta_receber_id: CONTA_AUTORIZADA,
        telefone: "11999999999",
        mensagem: "mensagem autorizada",
        metadata: {
          origem: "painel-cobranca",
          tentativa: 2,
          conta_receber_id: CONTA_ALHEIA,
          telefone: "valor-não-confiável",
        },
      },
    }),
  );

  assertEquals(response.status, 200);
  const insert = dbCalls.find((call) => call.operation === "insert");
  assertEquals(insert?.table, "historico_cobranca_whatsapp");
  const payload = insert?.payload as Record<string, unknown>;
  // Gate de compatibilidade com o schema canônico: estas colunas não existem.
  assertEquals(Object.hasOwn(payload, "conta_receber_id"), false);
  assertEquals(Object.hasOwn(payload, "telefone"), false);
  assertEquals(
    payload,
    {
      empresa_id: EMPRESA_AUTORIZADA,
      cliente_id: CLIENTE_AUTORIZADO,
      mensagem: "mensagem autorizada",
      status: "gerado",
      metadata: {
        origem: "painel-cobranca",
        tentativa: 2,
        conta_receber_id: CONTA_AUTORIZADA,
        telefone: "5511999999999",
      },
    },
  );
  assertEquals(calls.ai, 0);
});

Deno.test("whatsapp-ia-proativo: empresa alheia no contexto não chega à IA", async () => {
  await withAuthEnvironment(async () => {
    Deno.env.set("LOVABLE_API_KEY", "lovable-teste");
    const calls = counters();
    const handler = createHandler(dependencies(calls));
    const response = await handler(
      post({
        action: "gerar-resposta-ia",
        data: {
          pergunta_cliente: "Posso parcelar?",
          contexto: { empresa_id: EMPRESA_ALHEIA },
        },
      }),
    );

    assertEquals(response.status, 403);
    assertEquals((await response.json()).error, "sem_permissao_empresa");
    assertEquals(calls, { ai: 0, auth: 1, client: 1, rateLimit: 0 });
  });
});

Deno.test("whatsapp-ia-proativo: service_role Bearer mantém chamadas internas", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const deps = dependencies(calls);
    delete deps.autorizar;
    const handler = createHandler(deps);
    const response = await handler(
      post(
        {
          action: "test",
          data: { telefone: "11999999999", mensagem: "interno" },
        },
        { Authorization: "Bearer service-role-teste" },
      ),
    );

    assertEquals(response.status, 200);
    assertEquals(calls.client, 1);
    assertEquals(calls.rateLimit, 1);
    assertEquals(calls.ai, 0);
  });
});

Deno.test("whatsapp-ia-proativo: service_role via apikey mantém chamadas internas", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const deps = dependencies(calls);
    delete deps.autorizar;
    const handler = createHandler(deps);
    const response = await handler(
      post(
        {
          action: "test",
          data: { telefone: "11999999999", mensagem: "interno" },
        },
        { apikey: "service-role-teste" },
      ),
    );

    assertEquals(response.status, 200);
    assertEquals(calls.client, 1);
    assertEquals(calls.rateLimit, 1);
    assertEquals(calls.ai, 0);
  });
});

Deno.test("whatsapp-ia-proativo: job interno sem empresa preserva escopo global", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const dbCalls: DbCall[] = [];
    const deps = dependencies(calls, {}, {}, dbCalls);
    delete deps.autorizar;
    const handler = createHandler(deps);
    const response = await handler(
      post(
        { action: "analisar-alertas", data: {} },
        { Authorization: "Bearer service-role-teste" },
      ),
    );

    assertEquals(response.status, 200);
    assertEquals(
      dbCalls.some((call) => call.table === "user_empresas"),
      false,
    );
    const consultasNegocio = dbCalls.filter((call) =>
      call.table === "contas_receber" || call.table === "clientes"
    );
    assertEquals(consultasNegocio.length, 2);
    assertEquals(
      consultasNegocio.some((call) =>
        call.filters.some((filtro) => filtro.column === "empresa_id")
      ),
      false,
    );
  });
});

Deno.test("whatsapp-ia-proativo: job interno com empresa restringe o próprio escopo", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const dbCalls: DbCall[] = [];
    const deps = dependencies(calls, {}, {}, dbCalls);
    delete deps.autorizar;
    const handler = createHandler(deps);
    const response = await handler(
      post(
        {
          action: "analisar-alertas",
          data: { empresa_id: EMPRESA_AUTORIZADA },
        },
        { Authorization: "Bearer service-role-teste" },
      ),
    );

    assertEquals(response.status, 200);
    assertEquals(
      dbCalls.some((call) => call.table === "user_empresas"),
      false,
    );
    const consultasNegocio = dbCalls.filter((call) =>
      call.table === "contas_receber" || call.table === "clientes"
    );
    assertEquals(consultasNegocio.length, 2);
    for (const consulta of consultasNegocio) {
      assertEquals(
        consulta.filters.some((filtro) =>
          filtro.method === "in" && filtro.column === "empresa_id" &&
          JSON.stringify(filtro.value) === JSON.stringify([EMPRESA_AUTORIZADA])
        ),
        true,
      );
    }
  });
});

Deno.test("whatsapp-ia-proativo: segredo interno rotacionável mantém automações", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const deps = dependencies(calls);
    delete deps.autorizar;
    const handler = createHandler(deps);
    const response = await handler(
      post(
        { action: "test", data: { telefone: "11999999999", mensagem: "cron" } },
        { "x-internal-secret": "segredo-interno-teste" },
      ),
    );

    assertEquals(response.status, 200);
    assertEquals(calls.client, 1);
    assertEquals(calls.rateLimit, 1);
    assertEquals(calls.ai, 0);
  });
});

Deno.test("whatsapp-ia-proativo: segredo interno incorreto falha fechado", async () => {
  await withAuthEnvironment(async () => {
    const calls = counters();
    const deps = dependencies(calls);
    delete deps.autorizar;
    const handler = createHandler(deps);
    const response = await handler(
      post(
        { action: "test", data: { telefone: "11999999999", mensagem: "cron" } },
        { "x-internal-secret": "segredo-incorreto" },
      ),
    );

    assertEquals(response.status, 401);
    assertEquals(calls.client, 0);
    assertEquals(calls.rateLimit, 0);
    assertEquals(calls.ai, 0);
  });
});

Deno.test("whatsapp-ia-proativo: contrato legado continua válido para usuário autorizado", async () => {
  const calls = counters();
  const handler = createHandler(dependencies(calls));
  const response = await handler(
    post(
      { phone: "11987654321", message: "cobrança automatizada" },
      { Authorization: "Bearer jwt-de-usuario-validado" },
    ),
  );

  assertEquals(response.status, 200);
  const body = await response.json();
  assertEquals(body.numero, "5511987654321");
  assertEquals(
    body.whatsapp_link,
    "https://wa.me/5511987654321?text=cobran%C3%A7a%20automatizada",
  );
  assertEquals(calls.ai, 0);
});
