import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  Bitrix24WebhookSchema,
  Bitrix24WebhookV2Schema,
  corsHeaders,
  createErrorResponse,
} from '../_shared/validation.ts';
import { contractVersionHeaders, validateVersionedContract } from '../_shared/versioned-contract.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { authenticateWebhook, resolveSecret } from '../_shared/webhook-auth.ts';
import { createValidationErrorResponse } from '../_shared/contract-response.ts';
import { processWithIdempotency } from '../_shared/webhook-idempotency.ts';

/** Comparação de segredos em tempo constante-ish (mesmo estilo do auth-guard). */
function segredosIguais(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Prova de origem antes de qualquer escrita: HMAC (x-bitrix-signature) ou
    // x-webhook-token via helper; fallback para o application_token nativo que o
    // Bitrix24 envia no corpo quando o webhook de saida e criado com secret key.
    // Fail-closed: sem segredo configurado -> 503, sem credencial valida -> 401.
    const rawBody = await req.text();
    let rawPayload: Record<string, unknown> | undefined;

    const auth = await authenticateWebhook(supabase, {
      provider: 'bitrix24',
      req,
      rawBody,
      corsHeaders,
    });
    if (auth.ok) {
      // Autenticado por header (HMAC ou token compartilhado).
    } else if (auth.reason === 'missing_credential') {
      const segredo = await resolveSecret(supabase, 'bitrix24');
      if (!segredo) return createErrorResponse('Webhook nao configurado', 503);
      try {
        rawPayload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return createValidationErrorResponse([{
          path: '$', message: 'JSON malformado', code: 'invalid_json',
        }], corsHeaders);
      }
      const bruto = rawPayload as { auth?: { application_token?: string } };
      if (
        !bruto.auth?.application_token ||
        !segredosIguais(bruto.auth.application_token, segredo)
      ) {
        return createErrorResponse('Token invalido', 401);
      }
    } else {
      return auth.response;
    }

    if (rawPayload === undefined) {
      try {
        rawPayload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return createValidationErrorResponse([{
          path: '$', message: 'JSON malformado', code: 'invalid_json',
        }], corsHeaders);
      }
    }
    console.log('[bitrix24-webhook] Event received:', { evento: rawPayload?.event, ts: rawPayload?.ts });

    // Rate limit: 120 req/min por IP (defesa em profundidade apos autenticacao)
    const ip = (req.headers.get('x-forwarded-for') || '0.0.0.0').split(',')[0].trim();
    const rl = await checkRateLimit(supabase, {
      endpoint: 'bitrix24-webhook',
      ip,
      limit: 120,
      windowSeconds: 60,
      userAgent: req.headers.get('user-agent'),
    });
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    const validation = validateVersionedContract(req, rawPayload, {
      v1: Bitrix24WebhookSchema, v2: Bitrix24WebhookV2Schema, functionName: 'bitrix24-webhook',
    });
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;

    const payloadSeguro = structuredClone(rawPayload);
    const authPayload = payloadSeguro.auth;
    if (authPayload && typeof authPayload === 'object') {
      delete (authPayload as Record<string, unknown>).application_token;
    }
    const externalId = 'event_id' in payload && typeof payload.event_id === 'string'
      ? payload.event_id
      : `${payload.event}:${payload.ts ?? await sha256(rawBody)}`;
    const { claim, failure } = await processWithIdempotency(
      supabase,
      { source: 'bitrix24', externalId, eventType: payload.event, payload: payloadSeguro },
      async () => undefined,
    );
    if (claim.alreadyProcessed) {
      return new Response(JSON.stringify({ success: true, duplicated: true }), {
        headers: { ...corsHeaders, ...contractVersionHeaders(validation.version), 'Content-Type': 'application/json' },
      });
    }
    if (failure) throw new Error(`Falha ao registrar webhook Bitrix24: ${failure.status}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, ...contractVersionHeaders(validation.version), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro bitrix24 webhook:', errMsg.slice(0, 100));
    return createErrorResponse(errMsg, 500);
  }
});
