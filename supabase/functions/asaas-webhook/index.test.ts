import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { handler } from "./index.ts";

const originalEnvGet = Deno.env.get;

function setupMockEnv() {
  Deno.env.get = (key: string) => {
    if (key === "SUPABASE_URL") return "https://test.supabase.co";
    if (key === "SUPABASE_SERVICE_ROLE_KEY") return "test-service-key";
    if (key === "ASAAS_WEBHOOK_TOKEN") return "test-asaas-token";
    return originalEnvGet(key);
  };
}

function restoreEnv() {
  Deno.env.get = originalEnvGet;
}

Deno.test({
  name: "Asaas Webhook: v1 inválido retorna 422 com header de versão",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(null), { status: 200 });
    try {
      const response = await handler(new Request("http://localhost/asaas-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "asaas-access-token": "test-asaas-token",
        },
        body: JSON.stringify({ payment: { id: "pay_123" } }),
      }));

      const body = await response.json();
      assertEquals(response.status, 422);
      assertEquals(body.code, "VALIDATION_ERROR");
      assertEquals(response.headers.get("x-contract-version"), "v1");
      assertEquals(response.headers.get("deprecation"), "true");
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  },
});

Deno.test({
  name: "Asaas Webhook: v2 JSON malformado retorna 422",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    try {
      const response = await handler(new Request("http://localhost/asaas-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "asaas-access-token": "test-asaas-token",
          "x-contract-version": "v2",
        },
        body: "{",
      }));
      const body = await response.json();
      assertEquals(response.status, 422);
      assertEquals(body.code, "VALIDATION_ERROR");
      assertEquals(body.fields[0].code, "invalid_json");
    } finally {
      restoreEnv();
    }
  },
});
