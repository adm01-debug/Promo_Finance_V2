// Cliente helper para idempotência atômica + reprocessamento seguro de webhooks.
// Usa as RPCs webhook_claim / webhook_mark_success / webhook_mark_failure.
//
// Contrato:
//  1. Chame `claimWebhook` no início do handler.
//  2. Se `alreadyProcessed=true`, responda 200 sem reprocessar.
//  3. Execute a lógica. Ao fim: `markSuccess` ou `markFailure`.
//
// Falhas transitórias (rede, 5xx) devem passar `retryable=true` — o backoff
// exponencial no banco reagenda automaticamente. Falhas de contrato (400/422)
// devem passar `retryable=false` para promover ao DLQ imediatamente.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type WebhookClaim = {
  id: string;
  status: string;
  attempts: number;
  alreadyProcessed: boolean;
};

export type WebhookFailureResult = {
  status: string;
  willRetry: boolean;
  nextRetryAt: string | null;
  dlqId: string | null;
};

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function claimWebhook(
  supabase: SupabaseClient,
  args: {
    source: string;
    externalId: string | null;
    eventType: string;
    payload: unknown;
    maxAttempts?: number;
  },
): Promise<WebhookClaim> {
  const { data, error } = await supabase.rpc("webhook_claim", {
    p_source: args.source,
    p_external_id: args.externalId,
    p_event_type: args.eventType,
    p_payload: args.payload ?? {},
    p_max_attempts: args.maxAttempts ?? 5,
  });
  if (error) throw new Error(`webhook_claim failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("webhook_claim returned empty result");
  return {
    id: row.id as string,
    status: row.status as string,
    attempts: row.attempts as number,
    alreadyProcessed: Boolean(row.already_processed),
  };
}

export async function markSuccess(
  supabase: SupabaseClient,
  id: string,
  response?: unknown,
): Promise<void> {
  const { error } = await supabase.rpc("webhook_mark_success", {
    p_id: id,
    p_response: response ?? null,
  });
  if (error) throw new Error(`webhook_mark_success failed: ${error.message}`);
}

export async function markFailure(
  supabase: SupabaseClient,
  id: string,
  errorMessage: string,
  retryable = true,
): Promise<WebhookFailureResult> {
  const { data, error } = await supabase.rpc("webhook_mark_failure", {
    p_id: id,
    p_error: errorMessage.slice(0, 2000),
    p_retryable: retryable,
  });
  if (error) throw new Error(`webhook_mark_failure failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    status: row?.status ?? "unknown",
    willRetry: Boolean(row?.will_retry),
    nextRetryAt: row?.next_retry_at ?? null,
    dlqId: row?.dlq_id ?? null,
  };
}

/**
 * Wrapper de conveniência: envolve `handler` com claim + success/failure.
 * `handler` deve lançar `RetryableError` para forçar retry ou qualquer outro
 * Error para promover diretamente ao DLQ.
 */
export class RetryableError extends Error {
  readonly retryable = true as const;
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

export async function processWithIdempotency<T>(
  supabase: SupabaseClient,
  args: {
    source: string;
    externalId: string | null;
    eventType: string;
    payload: unknown;
    maxAttempts?: number;
  },
  handler: (ctx: { webhookId: string; attempts: number }) => Promise<T>,
): Promise<{ claim: WebhookClaim; result?: T; failure?: WebhookFailureResult }> {
  const claim = await claimWebhook(supabase, args);
  if (claim.alreadyProcessed) return { claim };

  try {
    const result = await handler({ webhookId: claim.id, attempts: claim.attempts });
    await markSuccess(supabase, claim.id, { ok: true });
    return { claim, result };
  } catch (err) {
    const retryable = err instanceof RetryableError;
    const failure = await markFailure(
      supabase,
      claim.id,
      err instanceof Error ? err.message : String(err),
      retryable,
    );
    return { claim, failure };
  }
}
