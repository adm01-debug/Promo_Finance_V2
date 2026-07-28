/**
 * Autenticação de webhooks públicos (entrada não autenticada por JWT).
 *
 * Todo webhook que escreve no banco com `service_role` precisa provar que a
 * requisição veio realmente do provedor. Sem isso qualquer pessoa na internet
 * pode forjar eventos (marcar cobranças como pagas/entregues, injetar trilha de
 * auditoria, poluir filas de sincronização).
 *
 * Modos aceitos, nesta ordem:
 *  1. Assinatura HMAC-SHA256 do corpo bruto (hex ou base64) em um dos headers
 *     configurados pelo provedor.
 *  2. Token compartilhado estático em `x-webhook-token`.
 *
 * O segredo é lido de `integration_secrets` (tabela server-only, sem policies)
 * com fallback para variável de ambiente. Se nenhum segredo estiver
 * configurado a função FALHA FECHADA (503) — nunca aceita tráfego anônimo.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/** Headers de assinatura conhecidos por provedor (ordem de preferência). */
const SIGNATURE_HEADERS: Record<string, readonly string[]> = {
  whatsapp: ["x-hub-signature-256", "x-signature", "x-webhook-signature"],
  bitrix24: ["x-bitrix-signature", "x-signature", "x-webhook-signature"],
  bling: ["x-bling-signature", "x-signature", "x-webhook-signature"],
};

const DEFAULT_SIGNATURE_HEADERS = ["x-signature", "x-webhook-signature"] as const;

export interface WebhookAuthOk {
  ok: true;
  /** Como a requisição foi autenticada — útil para auditoria. */
  mode: "hmac" | "token";
}

export interface WebhookAuthFail {
  ok: false;
  /** Resposta pronta para retornar ao chamador. */
  response: Response;
  reason: string;
}

export type WebhookAuthResult = WebhookAuthOk | WebhookAuthFail;

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Comparação de tamanho fixo para evitar vazamento por curto-circuito. */
function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function hmacSha256(secret: string, payload: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
}

/**
 * Recupera o segredo do provedor. `integration_secrets` tem precedência para
 * permitir rotação sem redeploy; o env serve de bootstrap.
 */
async function resolveSecret(
  supabase: SupabaseClient,
  provider: string,
): Promise<string | null> {
  const chave = `${provider}_webhook_secret`;

  try {
    const { data } = await supabase
      .from("integration_secrets")
      .select("valor")
      .eq("chave", chave)
      .maybeSingle();

    const valor = (data as { valor?: string } | null)?.valor?.trim();
    if (valor) return valor;
  } catch (_err) {
    // Tabela indisponível não pode virar bypass — cai para o env abaixo.
  }

  const fromEnv = Deno.env.get(`${provider.toUpperCase()}_WEBHOOK_SECRET`)?.trim();
  return fromEnv || null;
}

/**
 * Autentica um webhook. Deve ser chamada com o corpo BRUTO (texto), antes de
 * qualquer `JSON.parse`, porque a assinatura cobre os bytes originais.
 */
export async function authenticateWebhook(
  supabase: SupabaseClient,
  params: {
    provider: keyof typeof SIGNATURE_HEADERS | string;
    req: Request;
    rawBody: string;
    corsHeaders: Record<string, string>;
  },
): Promise<WebhookAuthResult> {
  const { provider, req, rawBody, corsHeaders } = params;

  const secret = await resolveSecret(supabase, provider);
  if (!secret) {
    console.error(
      `[webhook-auth] Segredo ausente para "${provider}" — requisição rejeitada (fail-closed).`,
    );
    return {
      ok: false,
      reason: "secret_not_configured",
      response: jsonResponse(
        { error: "Webhook não configurado" },
        503,
        corsHeaders,
      ),
    };
  }

  // 1) Assinatura HMAC do corpo bruto.
  const headers = SIGNATURE_HEADERS[provider] ?? DEFAULT_SIGNATURE_HEADERS;
  for (const header of headers) {
    const provided = req.headers.get(header)?.trim();
    if (!provided) continue;

    // Alguns provedores prefixam com o algoritmo (`sha256=...`).
    const normalized = provided.replace(/^sha256=/i, "").trim();
    const digest = await hmacSha256(secret, rawBody);

    if (equals(normalized.toLowerCase(), toHex(digest)) || equals(normalized, toBase64(digest))) {
      return { ok: true, mode: "hmac" };
    }

    console.warn(`[webhook-auth] Assinatura inválida para "${provider}" em ${header}.`);
    return {
      ok: false,
      reason: "invalid_signature",
      response: jsonResponse({ error: "Assinatura inválida" }, 401, corsHeaders),
    };
  }

  // 2) Token compartilhado (provedores sem suporte a HMAC).
  const token = req.headers.get("x-webhook-token")?.trim();
  if (token && equals(token, secret)) {
    return { ok: true, mode: "token" };
  }

  console.warn(`[webhook-auth] Requisição sem credencial válida para "${provider}".`);
  return {
    ok: false,
    reason: "missing_credential",
    response: jsonResponse({ error: "Não autorizado" }, 401, corsHeaders),
  };
}
