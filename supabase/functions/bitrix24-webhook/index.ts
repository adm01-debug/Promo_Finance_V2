import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { Bitrix24WebhookSchema, corsHeaders, validatePayload, createErrorResponse } from '../_shared/validation.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Rate limit: 120 req/min por IP
    const ip = (req.headers.get('x-forwarded-for') || '0.0.0.0').split(',')[0].trim()
    const rl = await checkRateLimit(supabase, {
      endpoint: 'bitrix24-webhook',
      ip,
      limit: 120,
      windowSeconds: 60,
      userAgent: req.headers.get('user-agent'),
    })
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders)

    const rawBody = await req.json()
    console.log("[bitrix24-webhook] Event received:", JSON.stringify(rawBody))

    const validation = validatePayload(Bitrix24WebhookSchema, rawBody, "bitrix24-webhook")
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details)
    }

    const payload = validation.data

    // Log the webhook
    await supabase.from('webhooks_log').insert({
      event_type: payload.event,
      payload: rawBody,
      provider: 'bitrix24',
      processado: true,
      correlation_id: crypto.randomUUID(),
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro bitrix24 webhook:', error)
    return createErrorResponse(error.message, 500)
  }
})
