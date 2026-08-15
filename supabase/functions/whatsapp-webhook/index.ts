import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  WhatsappWebhookSchema,
  corsHeaders,
  validatePayload,
  createErrorResponse,
} from '../_shared/validation.ts';
import { authenticateWebhook } from '../_shared/webhook-auth.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Prova de origem antes de qualquer escrita: HMAC (x-hub-signature-256 /
    // x-signature) ou x-webhook-token via helper. Fail-closed: sem segredo
    // configurado -> 503, sem credencial valida -> 401.
    const rawBody = await req.text();

    const auth = await authenticateWebhook(supabase, {
      provider: 'whatsapp',
      req,
      rawBody,
      corsHeaders,
    });
    if (!auth.ok) return auth.response;

    const rawPayload = JSON.parse(rawBody);
    console.log('[whatsapp-webhook] Event received:', { evento: rawPayload?.event, messageId: rawPayload?.messageId, status: rawPayload?.status });

    // Rate limit: 120 req/min por IP (defesa em profundidade apos autenticacao)
    const ip = (req.headers.get('x-forwarded-for') || '0.0.0.0').split(',')[0].trim();
    const rl = await checkRateLimit(supabase, {
      endpoint: 'whatsapp-webhook',
      ip,
      limit: 120,
      windowSeconds: 60,
      userAgent: req.headers.get('user-agent'),
    });
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    const validation = validatePayload(WhatsappWebhookSchema, rawPayload, 'whatsapp-webhook');
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details);
    }

    const body = validation.data;
    // Payload variation depending on provider (WPPConnect, Meta, etc)
    const { event, messageId, status, from } = body;

    if (messageId && status) {
      // 1. Atualizar status na fila ou execuções
      await supabase
        .from('execucoes_cobranca')
        .update({
          status: status === 'read' ? 'lido' : status === 'delivered' ? 'entregue' : 'enviado',
          metadata: { ...rawPayload, updated_at: new Date().toISOString() },
        })
        .eq('provider_message_id', messageId);

      // 2. Se for resposta (reply), registrar na auditoria/notificações
      if (event === 'message') {
        const { data: exec } = await supabase
          .from('execucoes_cobranca')
          .select('empresa_id, conta_receber_id')
          .eq('destinatario', from)

          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (exec) {
          await supabase.from('asaas_audit_trail').insert({
            payment_id: exec.conta_receber_id,
            action: 'WHATSAPP_REPLY',
            details: { message: body.text, from },
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro whatsapp webhook:', errMsg.slice(0, 100));
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
