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
    if (key === 'BLING_WEBHOOK_SECRET') return 'test-webhook-secret';
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
  name: "Bling Webhook: returns 422 for invalid payload",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    try {
      const req = new Request("http://localhost/bling-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-token": "test-webhook-secret",
        },
        body: JSON.stringify({ invalid: "payload" }),
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => new Response(JSON.stringify(null), { status: 200 });
      const response = await handler(req);
      globalThis.fetch = originalFetch;
      assertEquals(response.status, 422);
      const body = await response.json();
      assertEquals(body.code, "VALIDATION_ERROR");
      assertEquals(Array.isArray(body.fields), true);
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
      if (String(url).includes("/rpc/webhook_claim")) {
        return new Response(JSON.stringify([{
          id: "event-123", status: "processing", attempts: 1, already_processed: false,
        }]), { status: 200 });
      }
      if (String(url).includes("/rpc/webhook_mark_success")) {
        return new Response(JSON.stringify(null), { status: 200 });
      }
      return new Response(JSON.stringify({ id: "event-123", ok: true }), { status: 201 });
    };

    try {
      const req = new Request("http://localhost/bling-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-token": "test-webhook-secret",
        },
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

Deno.test({
  name: "Bling Webhook: rejeita requisição sem autenticação",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(null), { status: 200 });
    try {
      const response = await handler(new Request("http://localhost/bling-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "pedido.criado", module: "Pedido de Venda", data: { id: 1 } }),
      }));
      assertEquals(response.status, 401);
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  },
});

Deno.test({
  name: "Bling Webhook: JSON malformado autenticado retorna envelope 422",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(null), { status: 200 });
    try {
      const response = await handler(new Request("http://localhost/bling-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-token": "test-webhook-secret",
        },
        body: "{",
      }));
      const body = await response.json();
      assertEquals(response.status, 422);
      assertEquals(body.code, "VALIDATION_ERROR");
      assertEquals(body.fields[0].code, "invalid_json");
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  },
});
