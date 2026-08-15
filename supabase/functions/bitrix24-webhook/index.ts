import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  Bitrix24WebhookSchema,
  corsHeaders,
  validatePayload,
  createErrorResponse,
} from '../_shared/validation.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { authenticateWebhook, resolveSecret } from '../_shared/webhook-auth.ts';

/** Comparação de segredos em tempo constante-ish (mesmo estilo do auth-guard). */
function segredosIguais(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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
      const bruto = JSON.parse(rawBody) as { auth?: { application_token?: string } };
      if (
        !bruto.auth?.application_token ||
        !segredosIguais(bruto.auth.application_token, segredo)
      ) {
        return createErrorResponse('Token invalido', 401);
      }
    } else {
      return auth.response;
    }

    const rawPayload = JSON.parse(rawBody);
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

    const validation = validatePayload(Bitrix24WebhookSchema, rawPayload, 'bitrix24-webhook');
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details);
    }

    const payload = validation.data;

    // Log the webhook
    await supabase.from('webhooks_log').insert({
      event_type: payload.event,
      payload: rawPayload,
      provider: 'bitrix24',
      processado: true,
      correlation_id: crypto.randomUUID(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro bitrix24 webhook:', errMsg.slice(0, 100));
    return createErrorResponse(error.message, 500);
  }
});
