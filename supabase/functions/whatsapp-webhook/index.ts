import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    console.log("[whatsapp-webhook] Event received:", JSON.stringify(body))

    // Payload variation depending on provider (WPPConnect, Meta, etc)
    const { event, messageId, status, from } = body

    if (messageId && status) {
      // 1. Atualizar status na fila ou execuções
      await supabase
        .from('execucoes_cobranca')
        .update({ 
          status: status === 'read' ? 'lido' : status === 'delivered' ? 'entregue' : 'enviado',
          metadata: { ...body, updated_at: new Date().toISOString() }
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
