import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { handler } from "./index.ts";

const originalEnvGet = Deno.env.get;
const originalFetch = globalThis.fetch;

async function executarSemRede(req: Request): Promise<Response> {
  let chamadasExternas = 0;
  Deno.env.get = (key: string) => {
    if (key === "SUPABASE_SERVICE_ROLE_KEY") return "service-role-de-teste";
    if (key === "INTERNAL_SECRET_EXECUTAR_ANALISE_PREDITIVA") {
      return "segredo-correto";
    }
    return originalEnvGet(key);
  };
  globalThis.fetch = () => {
    chamadasExternas++;
    throw new Error(
      "A autenticação deveria falhar antes de qualquer acesso externo",
    );
  };

  try {
    const response = await handler(req);
    assertEquals(chamadasExternas, 0);
    return response;
  } finally {
    Deno.env.get = originalEnvGet;
    globalThis.fetch = originalFetch;
  }
}

Deno.test("executar-analise-preditiva rejeita chamada sem credencial antes de acessar serviços", async () => {
  const response = await executarSemRede(
    new Request("http://localhost/executar-analise-preditiva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
  );

  assertEquals(response.status, 401);
  assertEquals((await response.json()).error, "chamada_nao_autorizada");
});

Deno.test("executar-analise-preditiva rejeita segredo interno incorreto antes de acessar serviços", async () => {
  const response = await executarSemRede(
    new Request("http://localhost/executar-analise-preditiva", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": "segredo-incorreto",
      },
      body: JSON.stringify({}),
    }),
  );

  assertEquals(response.status, 401);
  assertEquals((await response.json()).error, "chamada_nao_autorizada");
});

Deno.test("executar-analise-preditiva preserva preflight e anuncia os headers internos", async () => {
  const response = await handler(
    new Request("http://localhost/executar-analise-preditiva", {
      method: "OPTIONS",
    }),
  );

  assertEquals(response.status, 200);
  assertStringIncludes(
    response.headers.get("Access-Control-Allow-Headers") ?? "",
    "x-internal-secret",
  );
});
