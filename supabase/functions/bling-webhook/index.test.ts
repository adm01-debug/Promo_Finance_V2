import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { handler } from "./index.ts";

/**
 * Unit Tests for Bling Webhook
 */

const originalEnvGet = Deno.env.get;

function setupMockEnv() {
  Deno.env.get = (key: string) => {
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-service-key';
    return originalEnvGet(key);
  };
}

function restoreEnv() {
  Deno.env.get = originalEnvGet;
}

Deno.test({
  name: "Bling Webhook: returns 405 for GET requests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const req = new Request("http://localhost/bling-webhook", {
      method: "GET",
    });

    const response = await handler(req);
    assertEquals(response.status, 405);
  }
});

Deno.test({
  name: "Bling Webhook: returns 400 for invalid payload",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    try {
      const req = new Request("http://localhost/bling-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: "payload" }),
      });

      const response = await handler(req);
      assertEquals(response.status, 400);
      const body = await response.json();
      assertEquals(body.error, "Invalid payload schema (Contract Violation)");
    } finally {
      restoreEnv();
    }
  }
});

Deno.test({
  name: "Bling Webhook: successfully handles a valid 'pedido.criado' event",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      // Mock any Supabase REST or RPC calls
      return new Response(JSON.stringify({ id: "event-123", ok: true }), { status: 201 });
    };

    try {
      const req = new Request("http://localhost/bling-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "pedido.criado",
          module: "Pedido de Venda",
          data: { id: 12345, situacao: { id: 6 } }
        }),
      });

      const response = await handler(req);
      assertEquals(response.status, 200);
      const body = await response.json();
      assertEquals(body.ok, true);
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  }
});
