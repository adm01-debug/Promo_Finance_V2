import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { handler } from "./index.ts";

/**
 * Unit Tests for Asaas Proxy
 * Testing authorization and basic validation logic
 */

const originalEnvGet = Deno.env.get;

function setupMockEnv() {
  Deno.env.get = (key: string) => {
    if (key === 'ASAAS_API_KEY') return 'test-key';
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-service-key';
    return originalEnvGet(key);
  };
}

function restoreEnv() {
  Deno.env.get = originalEnvGet;
}

Deno.test({
  name: "Asaas Proxy: returns 401 if Authorization header is missing",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    try {
      const req = new Request("http://localhost/asaas-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listar_clientes", data: {} }),
      });

      const response = await handler(req);
      assertEquals(response.status, 401);
      const body = await response.json();
      assertEquals(body.error, "Não autorizado");
    } finally {
      restoreEnv();
    }
  }
});

Deno.test({
  name: "Asaas Proxy: returns 400 for invalid action (Ação desconhecida)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes("/auth/v1/user")) {
        return new Response(JSON.stringify({ user: { id: "test-user" } }), { status: 200 });
      }
      if (urlStr.includes("/rest/v1/user_roles")) {
        return new Response(JSON.stringify([{ role: "admin" }]), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    };

    try {
      const req = new Request("http://localhost/asaas-proxy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer some-token"
        },
        body: JSON.stringify({ action: "unknown_action_test", data: {} }),
      });

      const response = await handler(req);
      const body = await response.json();
      assertEquals(response.status, 400);
      assertEquals(body.error, "Ação desconhecida: unknown_action_test");
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  }
});

Deno.test({
  name: "Asaas Proxy: successfully calls consultar_saldo",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupMockEnv();
    
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes("/auth/v1/user")) {
        return new Response(JSON.stringify({ user: { id: "test-user" } }), { status: 200 });
      }
      if (urlStr.includes("/rest/v1/user_roles")) {
        return new Response(JSON.stringify([{ role: "admin" }]), { status: 200 });
      }
      if (urlStr.includes("/finance/balance")) {
        return new Response(JSON.stringify({ balance: 1500.50 }), { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        });
      }
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    };

    try {
      const req = new Request("http://localhost/asaas-proxy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer some-token"
        },
        body: JSON.stringify({ action: "consultar_saldo", data: {} }),
      });

      const response = await handler(req);
      assertEquals(response.status, 200);
      const body = await response.json();
      assertEquals(body.balance, 1500.50);
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  }
});
