import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { WhatsappWebhookSchema, corsHeaders, validatePayload, createErrorResponse } from '../_shared/validation.ts'
import { authenticateWebhook } from '../_shared/webhook-auth.ts'
import { mensagemErro } from '../_shared/erros.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Sem esta guarda qualquer pessoa poderia marcar cobranças como entregues
    // ou lidas e injetar registros na trilha de auditoria financeira.
    const rawText = await req.text()
    const auth = await authenticateWebhook(supabase, {
      provider: 'whatsapp',
      req,
      rawBody: rawText,
      corsHeaders,
    })
    if (!auth.ok) return auth.response

    let rawBody: unknown
    try {
      rawBody = JSON.parse(rawText)
    } catch {
      return createErrorResponse('Corpo inválido: JSON malformado', 400)
    }
    console.log('[whatsapp-webhook] Event received (auth:', auth.mode, ')')

    const validation = validatePayload(WhatsappWebhookSchema, rawBody, "whatsapp-webhook")
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details)
    }

    const body = validation.data
    // Payload variation depending on provider (WPPConnect, Meta, etc)
    const { event, messageId, status, from } = body

    if (messageId && status) {
      // 1. Atualizar status na fila ou execuções
      await supabase
        .from('execucoes_cobranca')
        .update({ 
          status: status === 'read' ? 'lido' : status === 'delivered' ? 'entregue' : 'enviado',
          metadata: { ...rawBody, updated_at: new Date().toISOString() }
        })
        .eq('provider_message_id', messageId)

      // 2. Se for resposta (reply), registrar na auditoria/notificações
      if (event === 'message') {
        const { data: exec } = await supabase
          .from('execucoes_cobranca')
          .select('empresa_id, conta_receber_id')
          .eq('destinatario', from)

          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (exec) {
          await supabase.from('asaas_audit_trail').insert({
            payment_id: exec.conta_receber_id,
            action: 'WHATSAPP_REPLY',
            details: { message: body.text, from },
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro whatsapp webhook:', error)
    return new Response(JSON.stringify({ error: mensagemErro(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
