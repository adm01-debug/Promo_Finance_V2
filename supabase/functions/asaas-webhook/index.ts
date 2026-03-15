// ============================================
// EDGE FUNCTION: ASAAS WEBHOOK
// Recebe notificações de pagamento do ASAAS
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validar token do webhook
    const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    const receivedToken = req.headers.get('asaas-access-token')

    if (!WEBHOOK_TOKEN) {
      console.error('ASAAS_WEBHOOK_TOKEN não configurado - rejeitando webhook por segurança')
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
    console.log('Webhook ASAAS recebido:', JSON.stringify(body))

    const { event, payment, subscription } = body

    if (!event) {
      return new Response(JSON.stringify({ error: 'Payload inválido: event ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Usar service role para acesso total
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // ===== EVENTOS DE PAGAMENTO =====
    if (event.startsWith('PAYMENT_') && payment) {
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
        'PAYMENT_REFUNDED_IN_CASH': 'REFUNDED',
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
        .select('*, conta_receber_id, empresa_id')
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

      // Registrar no audit log
      try {
        await supabase.from('audit_logs').insert({
          action: 'update',
          table_name: 'asaas_payments',
          record_id: updatedPayment?.id || payment.id,
          details: `Webhook ASAAS: ${event} → status ${newStatus} (valor: ${payment.value})`,
          new_data: { event, status: newStatus, payment_id: payment.id, value: payment.value },
        })
      } catch (auditErr) {
        console.error('Erro ao registrar audit log:', auditErr)
      }

      // Gerar alerta para eventos críticos
      if (['CHARGEBACK', 'REFUNDED'].includes(newStatus)) {
        try {
          await supabase.from('alertas').insert({
            tipo: newStatus === 'CHARGEBACK' ? 'chargeback' : 'estorno',
            titulo: newStatus === 'CHARGEBACK' ? 'Chargeback recebido' : 'Estorno realizado',
            mensagem: `Cobrança ${payment.id} no valor de R$ ${payment.value?.toFixed(2)} foi ${newStatus === 'CHARGEBACK' ? 'contestada (chargeback)' : 'estornada'}.`,
            prioridade: newStatus === 'CHARGEBACK' ? 'critica' : 'alta',
            entidade_tipo: 'asaas_payment',
            entidade_id: updatedPayment?.id || payment.id,
            acao_url: '/asaas',
          })
        } catch (alertErr) {
          console.error('Erro ao criar alerta:', alertErr)
        }
      }

      return new Response(JSON.stringify({ success: true, type: 'payment', status: newStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ===== EVENTOS DE ASSINATURA =====
    if (event.startsWith('SUBSCRIPTION_') && subscription) {
      console.log(`Evento de assinatura: ${event}`, JSON.stringify(subscription))

      // Registrar no audit log
      try {
        await supabase.from('audit_logs').insert({
          action: event.includes('DELETED') || event.includes('INACTIVATED') ? 'delete' : 'update',
          table_name: 'asaas_subscriptions',
          record_id: subscription.id,
          details: `Webhook ASAAS assinatura: ${event} (valor: ${subscription.value}, ciclo: ${subscription.cycle})`,
          new_data: { event, subscription_id: subscription.id, value: subscription.value, status: subscription.status },
        })
      } catch (auditErr) {
        console.error('Erro ao registrar audit log assinatura:', auditErr)
      }

      return new Response(JSON.stringify({ success: true, type: 'subscription', event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ===== EVENTOS DE TRANSFERÊNCIA =====
    if (event.startsWith('TRANSFER_')) {
      console.log(`Evento de transferência: ${event}`, JSON.stringify(body))

      try {
        await supabase.from('audit_logs').insert({
          action: 'update',
          table_name: 'asaas_transfers',
          record_id: body.transfer?.id || 'unknown',
          details: `Webhook ASAAS transferência: ${event}`,
          new_data: { event, transfer: body.transfer },
        })
      } catch (auditErr) {
        console.error('Erro ao registrar audit log transferência:', auditErr)
      }

      return new Response(JSON.stringify({ success: true, type: 'transfer', event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Evento não mapeado - log e aceita
    console.warn(`Evento ASAAS não mapeado: ${event}`)
    return new Response(JSON.stringify({ success: true, event, message: 'Evento recebido mas não processado' }), {
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
