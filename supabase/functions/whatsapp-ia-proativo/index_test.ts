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

function dependencies(
  counters: Counters,
  overrides: Partial<WhatsappIaProativoDependencies> = {},
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
      return {};
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
  ] as const;
  const previous = new Map(names.map((name) => [name, Deno.env.get(name)]));

  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-teste");
  Deno.env.set("SUPABASE_ANON_KEY", "anon-publica-teste");
  Deno.env.set("SUPABASE_URL", "http://supabase.invalid");
  Deno.env.set("INTERNAL_SECRET_INTERNAL_JOBS", "segredo-interno-teste");

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

Deno.test("whatsapp-ia-proativo: contrato legado dos callers internos continua válido", async () => {
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
