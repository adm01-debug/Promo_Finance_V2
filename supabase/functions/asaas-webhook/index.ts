// ============================================
// EDGE FUNCTION: ASAAS WEBHOOK
// Recebe notificações de pagamento do ASAAS
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validar token do webhook
    const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    const receivedToken = req.headers.get('asaas-access-token')

    if (WEBHOOK_TOKEN && receivedToken !== WEBHOOK_TOKEN) {
      console.error('Token de webhook inválido')
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    console.log('Webhook ASAAS recebido:', JSON.stringify(body))

    const { event, payment } = body

    if (!event || !payment) {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Usar service role para acesso total
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Mapear evento para status
    const statusMap: Record<string, string> = {
      'PAYMENT_CREATED': 'PENDING',
      'PAYMENT_AWAITING_RISK_ANALYSIS': 'PENDING',
      'PAYMENT_APPROVED_BY_RISK_ANALYSIS': 'PENDING',
      'PAYMENT_PENDING': 'PENDING',
      'PAYMENT_RECEIVED': 'RECEIVED',
      'PAYMENT_CONFIRMED': 'CONFIRMED',
      'PAYMENT_OVERDUE': 'OVERDUE',
      'PAYMENT_DELETED': 'CANCELLED',
      'PAYMENT_RESTORED': 'PENDING',
      'PAYMENT_REFUNDED': 'REFUNDED',
      'PAYMENT_RECEIVED_IN_CASH_UNDONE': 'PENDING',
      'PAYMENT_CHARGEBACK_REQUESTED': 'CHARGEBACK',
      'PAYMENT_CHARGEBACK_DISPUTE': 'CHARGEBACK',
      'PAYMENT_AWAITING_CHARGEBACK_REVERSAL': 'CHARGEBACK',
      'PAYMENT_DUNNING_RECEIVED': 'RECEIVED',
      'PAYMENT_DUNNING_REQUESTED': 'OVERDUE',
      'PAYMENT_BANK_SLIP_VIEWED': 'PENDING',
      'PAYMENT_CHECKOUT_VIEWED': 'PENDING',
    }

    const newStatus = statusMap[event] || payment.status || 'PENDING'

    // Atualizar pagamento no banco
    const updateData: any = {
      status: newStatus,
      webhook_payload: body,
      valor_liquido: payment.netValue || null,
    }

    if (['RECEIVED', 'CONFIRMED'].includes(newStatus)) {
      updateData.data_pagamento = payment.paymentDate || payment.confirmedDate || new Date().toISOString().split('T')[0]
    }

    const { data: updatedPayment, error: updateError } = await supabase
      .from('asaas_payments')
      .update(updateData)
      .eq('asaas_id', payment.id)
      .select('*, conta_receber_id')
      .maybeSingle()

    if (updateError) {
      console.error('Erro ao atualizar pagamento:', updateError)
    }

    // Sincronizar com contas_receber se vinculado
    if (updatedPayment?.conta_receber_id && ['RECEIVED', 'CONFIRMED'].includes(newStatus)) {
      await supabase
        .from('contas_receber')
        .update({
          status: 'pago',
          data_recebimento: updateData.data_pagamento,
          valor_recebido: payment.value,
        })
        .eq('id', updatedPayment.conta_receber_id)

      console.log(`Conta a receber ${updatedPayment.conta_receber_id} marcada como paga`)
    }

    // Se cobrança vencida, atualizar conta_receber também
    if (updatedPayment?.conta_receber_id && newStatus === 'OVERDUE') {
      await supabase
        .from('contas_receber')
        .update({ status: 'vencido' })
        .eq('id', updatedPayment.conta_receber_id)
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro webhook ASAAS:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
