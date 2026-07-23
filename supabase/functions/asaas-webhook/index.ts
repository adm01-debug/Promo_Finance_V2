import { validatePayload, createErrorResponse, AsaasWebhookSchema, corsHeaders } from '../_shared/validation.ts'
import { createLogger } from '../_shared/logger.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'
import { processWithIdempotency, RetryableError, serviceClient } from '../_shared/webhook-idempotency.ts'

const logger = createLogger('asaas-webhook')

Deno.serve(async (req) => {
  const startTime = Date.now()
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const correlation_id = crypto.randomUUID()
  const ip_origem = req.headers.get('x-forwarded-for') || 'desconhecido'

  try {
    const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    if (!WEBHOOK_TOKEN) {
      logger.error('ASAAS_WEBHOOK_TOKEN não configurado — rejeitando webhook', { correlation_id })
      return createErrorResponse('Webhook não configurado', 503)
    }
    const receivedToken = req.headers.get('asaas-access-token')
    if (receivedToken !== WEBHOOK_TOKEN) {
      logger.error('Token de webhook inválido', { ip_origem, correlation_id })
      return createErrorResponse('Token inválido', 403)
    }

    const body = await req.json()
    const validation = validatePayload(AsaasWebhookSchema, body)
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details)
    }
    const { event, payment, transfer } = validation.data

    const supabase = serviceClient()

    // Rate limit defensivo (defesa em profundidade — token continua sendo a defesa primária).
    const rl = await checkRateLimit(supabase, {
      endpoint: 'asaas-webhook',
      ip: ip_origem.split(',')[0].trim(),
      limit: 120,
      windowSeconds: 60,
      userAgent: req.headers.get('user-agent'),
    })
    if (!rl.allowed) {
      logger.warn('Rate limit atingido', { ip_origem, correlation_id })
      return rateLimitResponse(rl, corsHeaders)
    }

    // Idempotência atômica + reprocessamento seguro
    const externalId: string | null =
      (typeof body.id === 'string' && body.id) ||
      (payment?.id ? `payment:${payment.id}:${event}` : null) ||
      (transfer?.id ? `transfer:${transfer.id}:${event}` : null) ||
      null

    const { claim, failure } = await processWithIdempotency(
      supabase,
      { source: 'asaas', externalId, eventType: event, payload: body, maxAttempts: 5 },
      async () => {
        // 1. Cobranças
        if (payment) {
          const { data: localPayment, error: selErr } = await supabase
            .from('asaas_payments')
            .select('id, status, asaas_id')
            .eq('asaas_id', payment.id)
            .maybeSingle()
          if (selErr) throw new RetryableError(`select asaas_payments: ${selErr.message}`)

          if (localPayment) {
            const statusMap: Record<string, string> = {
              PAYMENT_RECEIVED: 'RECEIVED',
              PAYMENT_CONFIRMED: 'CONFIRMED',
              PAYMENT_OVERDUE: 'OVERDUE',
              PAYMENT_DELETED: 'CANCELLED',
              PAYMENT_REFUNDED: 'REFUNDED',
              PAYMENT_CHARGEBACK_REQUESTED: 'CHARGEBACK',
            }
            const newStatus = statusMap[event] || payment.status
            if (newStatus !== localPayment.status) {
              const { error: updErr } = await supabase
                .from('asaas_payments')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', localPayment.id)
              if (updErr) throw new RetryableError(`update asaas_payments: ${updErr.message}`)

              await supabase.from('asaas_audit_trail').insert({
                payment_id: localPayment.id,
                action: 'WEBHOOK_PAYMENT',
                previous_status: localPayment.status,
                new_status: newStatus,
                details: { event, message: `Status alterado via Webhook: ${event}` },
              })
            }
          }
        }

        // 2. Transferências
        if (transfer) {
          const { data: localTransfer, error: selErr } = await supabase
            .from('asaas_transfers')
            .select('id, status, asaas_id')
            .eq('asaas_id', transfer.id)
            .maybeSingle()
          if (selErr) throw new RetryableError(`select asaas_transfers: ${selErr.message}`)

          if (localTransfer) {
            const map: Record<string, string> = {
              TRANSFER_DONE: 'DONE',
              TRANSFER_CANCELLED: 'CANCELLED',
              TRANSFER_FAILED: 'FAILED',
            }
            const newStatus = map[event] || transfer.status
            if (newStatus !== localTransfer.status) {
              const { error: updErr } = await supabase
                .from('asaas_transfers')
                .update({
                  status: newStatus,
                  updated_at: new Date().toISOString(),
                  transaction_receipt_url: transfer.transactionReceiptUrl || null,
                })
                .eq('id', localTransfer.id)
              if (updErr) throw new RetryableError(`update asaas_transfers: ${updErr.message}`)

              await supabase.from('asaas_audit_trail').insert({
                action: 'WEBHOOK_TRANSFER',
                details: {
                  transfer_id: localTransfer.id,
                  event,
                  previous_status: localTransfer.status,
                  new_status: newStatus,
                  message: `Transferência alterada via Webhook: ${event}`,
                },
              })
            }
          }
        }
      },
    )

    if (claim.alreadyProcessed) {
      logger.info('Webhook Asaas já processado (idempotência)', { correlation_id, external_id: externalId })
      return new Response(JSON.stringify({ success: true, duplicated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (failure) {
      logger.warn('Webhook Asaas falhou; reagendado ou movido ao DLQ', {
        correlation_id,
        status: failure.status,
        will_retry: failure.willRetry,
        next_retry_at: failure.nextRetryAt,
        dlq_id: failure.dlqId,
        duration_ms: Date.now() - startTime,
      })
      // Devolvemos 200 para o Asaas não retransmitir — nosso retry é interno.
      return new Response(
        JSON.stringify({ success: false, will_retry: failure.willRetry, status: failure.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    logger.error('Erro fatal no webhook Asaas', {
      correlation_id,
      error: (error as Error).message,
      duration_ms: Date.now() - startTime,
    })
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
