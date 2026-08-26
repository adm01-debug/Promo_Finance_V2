import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { authenticateWebhook } from "./webhook-auth.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*" };
const fakeSupabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    }),
  }),
} as unknown as SupabaseClient;

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.test("Bling aceita o header oficial X-Bling-Signature-256", async () => {
  const secret = "client-secret-teste";
  const rawBody = JSON.stringify({ event: "created", data: { id: 1 } });
  Deno.env.set("BLING_WEBHOOK_SECRET", secret);
  try {
    const signature = await hmacHex(secret, rawBody);
    const req = new Request("https://local/bling-webhook", {
      method: "POST",
      headers: { "X-Bling-Signature-256": `sha256=${signature}` },
      body: rawBody,
    });
    const result = await authenticateWebhook(fakeSupabase, {
      provider: "bling",
      req,
      rawBody,
      corsHeaders,
    });
    assertEquals(result, { ok: true, mode: "hmac" });
  } finally {
    Deno.env.delete("BLING_WEBHOOK_SECRET");
  }
});

Deno.test("Bling rejeita assinatura oficial inválida", async () => {
  Deno.env.set("BLING_WEBHOOK_SECRET", "client-secret-teste");
  try {
    const rawBody = "{}";
    const result = await authenticateWebhook(fakeSupabase, {
      provider: "bling",
      req: new Request("https://local/bling-webhook", {
        method: "POST",
        headers: { "X-Bling-Signature-256": "sha256=invalida" },
        body: rawBody,
      }),
      rawBody,
      corsHeaders,
    });
    assertEquals(result.ok, false);
    if (!result.ok) assertEquals(result.response.status, 401);
  } finally {
    Deno.env.delete("BLING_WEBHOOK_SECRET");
  }
});
