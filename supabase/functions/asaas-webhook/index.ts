import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-platform-runtime, x-supabase-client-platform-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    const receivedToken = req.headers.get('asaas-access-token')

    if (!WEBHOOK_TOKEN) {
      console.error('ASAAS_WEBHOOK_TOKEN não configurado')
      return new Response(JSON.stringify({ error: 'Webhook token não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (receivedToken !== WEBHOOK_TOKEN) {
      console.error('Token de webhook inválido')
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { event, payment } = body

    if (!event || !payment) {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Buscar pagamento local
    const { data: localPayment } = await supabase
      .from('asaas_payments')
      .select('id, status, asaas_id')
      .eq('asaas_id', payment.id)
      .maybeSingle()

    if (localPayment) {
      // Mapeamento de status (simplificado para o exemplo)
      const statusMap: Record<string, string> = {
        'PAYMENT_RECEIVED': 'RECEIVED',
        'PAYMENT_CONFIRMED': 'CONFIRMED',
        'PAYMENT_OVERDUE': 'OVERDUE',
        'PAYMENT_DELETED': 'CANCELLED',
      }
      
      const newStatus = statusMap[event] || payment.status

      if (newStatus !== localPayment.status) {
        // Atualizar status
        await supabase.from('asaas_payments').update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        }).eq('id', localPayment.id)

        // Registrar na trilha de auditoria
        await supabase.from('asaas_audit_trail').insert({
          payment_id: localPayment.id,
          action: 'WEBHOOK_RECEIVED',
          previous_status: localPayment.status,
          new_status: newStatus,
          details: { event, message: `Status alterado via Webhook Asaas: ${event}` }
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
