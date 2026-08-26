import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { handler } from "./index.ts";

const originalEnvGet = Deno.env.get;

function setupMockEnv() {
  Deno.env.get = (key: string) => {
    if (key === "SUPABASE_URL") return "https://test.supabase.co";
    if (key === "SUPABASE_SERVICE_ROLE_KEY") return "test-service-key";
    if (key === "WHATSAPP_WEBHOOK_SECRET") return "whatsapp-secret";
    return originalEnvGet(key);
  };
}

function restoreEnv() {
  Deno.env.get = originalEnvGet;
}

Deno.test({
  name: "WhatsApp Webhook: v2 inválido retorna 422 com header de versão",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(null), { status: 200 });
    try {
      const response = await handler(new Request("http://localhost/whatsapp-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-token": "whatsapp-secret",
          "x-contract-version": "v2",
        },
        body: JSON.stringify({
          event: "message",
          from: "5511999999999",
        }),
      }));

      const body = await response.json();
      assertEquals(response.status, 422);
      assertEquals(body.code, "VALIDATION_ERROR");
      assertEquals(response.headers.get("x-contract-version"), "v2");
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  },
});

Deno.test({
  name: "WhatsApp Webhook: JSON malformado autenticado retorna 422",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    try {
      const response = await handler(new Request("http://localhost/whatsapp-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-token": "whatsapp-secret",
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
