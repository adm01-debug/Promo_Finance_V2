import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validatePayload, createErrorResponse, AsaasWebhookSchema, corsHeaders } from '../_shared/validation.ts'

Deno.serve(async (req) => {
  const startTime = Date.now()
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const correlation_id = crypto.randomUUID()
  const ip_origem = req.headers.get('x-forwarded-for') || 'desconhecido'

  try {
    const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    const receivedToken = req.headers.get('asaas-access-token')

    if (WEBHOOK_TOKEN && receivedToken !== WEBHOOK_TOKEN) {
      console.error('Token de webhook inválido')
      return createErrorResponse('Token inválido', 403)
    }

    const body = await req.json()
    const validation = validatePayload(AsaasWebhookSchema, body)
    
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details)
    }

    const { event, payment, transfer } = validation.data


    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 1. Processar COBRANÇAS (Payments)
    if (payment) {
      const { data: localPayment } = await supabase
        .from('asaas_payments')
        .select('id, status, asaas_id')
        .eq('asaas_id', payment.id)
        .maybeSingle()

      if (localPayment) {
        const statusMap: Record<string, string> = {
          'PAYMENT_RECEIVED': 'RECEIVED',
          'PAYMENT_CONFIRMED': 'CONFIRMED',
          'PAYMENT_OVERDUE': 'OVERDUE',
          'PAYMENT_DELETED': 'CANCELLED',
          'PAYMENT_REFUNDED': 'REFUNDED',
          'PAYMENT_CHARGEBACK_REQUESTED': 'CHARGEBACK',
        }
        
        const newStatus = statusMap[event] || payment.status

        if (newStatus !== localPayment.status) {
          await supabase.from('asaas_payments').update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          }).eq('id', localPayment.id)

          await supabase.from('asaas_audit_trail').insert({
            payment_id: localPayment.id,
            action: 'WEBHOOK_PAYMENT',
            previous_status: localPayment.status,
            new_status: newStatus,
            details: { event, message: `Status de cobrança alterado via Webhook: ${event}` }
          })
        }
      }
    }

    // 2. Processar TRANSFERÊNCIAS (Cashout)
    if (transfer) {
      const { data: localTransfer } = await supabase
        .from('asaas_transfers')
        .select('id, status, asaas_id')
        .eq('asaas_id', transfer.id)
        .maybeSingle()

      if (localTransfer) {
        const transferStatusMap: Record<string, string> = {
          'TRANSFER_DONE': 'DONE',
          'TRANSFER_CANCELLED': 'CANCELLED',
          'TRANSFER_FAILED': 'FAILED',
        }
        
        const newStatus = transferStatusMap[event] || transfer.status

        if (newStatus !== localTransfer.status) {
          await supabase.from('asaas_transfers').update({ 
            status: newStatus,
            updated_at: new Date().toISOString(),
            transaction_receipt_url: transfer.transactionReceiptUrl || null
          }).eq('id', localTransfer.id)

          await supabase.from('asaas_audit_trail').insert({
            action: 'WEBHOOK_TRANSFER',
            details: { 
              transfer_id: localTransfer.id,
              event, 
              previous_status: localTransfer.status,
              new_status: newStatus,
              message: `Status de transferência alterado via Webhook: ${event}` 
            }
          })
        }
      }
    }

    // Logar recepção do webhook com sucesso
    await supabase.from('webhooks_log').insert({
      event_type: event,
      payload: body,
      processado: true,
      correlation_id,
      ip_origem,
      duration_ms: Date.now() - startTime,
      provider: 'asaas',
      asaas_event_id: body.id
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro webhook:', error)
    
    // Logar falha no webhook
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      
      await supabase.from('webhooks_log').insert({
        event_type: 'ERROR',
        payload: { error: error.message },
        processado: false,
        erro_mensagem: error.message,
        correlation_id: (req as any).correlation_id || 'N/A',
        ip_origem: req.headers.get('x-forwarded-for') || 'desconhecido',
        duration_ms: Date.now() - startTime
      })
    } catch (logErr) {
      console.error('Erro ao logar falha:', logErr)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
