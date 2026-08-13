// Worker interno: consome webhooks pendentes/retrying prontos e reencaminha
// para o edge function correto de cada origem. Chamado por pg_cron a cada minuto
// e sob demanda pelo webhook-replay.
import { corsHeaders, createErrorResponse } from '../_shared/validation.ts'
import { createLogger } from '../_shared/logger.ts'
import { serviceClient, markSuccess, markFailure } from '../_shared/webhook-idempotency.ts'

const logger = createLogger('webhook-retry-worker')

// Mapa source → função de reprocessamento. Cada handler recebe o payload salvo
// e deve reexecutar a lógica de negócio de forma idempotente.
const HANDLERS: Record<string, (payload: unknown, supabase: ReturnType<typeof serviceClient>) => Promise<void>> = {
  // Asaas: reinvoca o próprio webhook via HTTP interno reproduzindo o payload.
  asaas: async (payload) => {
    const url = Deno.env.get('SUPABASE_URL')!
    const token = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
    if (!token) throw new Error('ASAAS_WEBHOOK_TOKEN ausente para replay')
    const resp = await fetch(`${url}/functions/v1/asaas-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'asaas-access-token': token,
        'x-replay': '1',
      },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      throw new Error(`asaas replay HTTP ${resp.status}: ${txt.slice(0, 300)}`)
    }
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Number(body.limit ?? 25), 200)

    const { data, error } = await supabase.rpc('webhook_dequeue_retries', { p_limit: limit })
    if (error) return createErrorResponse(`dequeue: ${error.message}`, 500)

    const rows = (data ?? []) as Array<{
      id: string
      source: string
      event_type: string | null
      payload: unknown
    }>

    let ok = 0
    let failed = 0
    for (const row of rows) {
      const handler = HANDLERS[row.source]
      if (!handler) {
        await markFailure(supabase, row.id, `sem handler de replay para source=${row.source}`, false)
        failed++
        continue
      }
      try {
        await handler(row.payload, supabase)
        // O replay via HTTP marca sucesso via claim; garantimos idempotência final aqui.
        await markSuccess(supabase, row.id, { replayed: true })
        ok++
      } catch (e) {
        const msg = (e as Error).message
        await markFailure(supabase, row.id, msg, true)
        failed++
      }
    }

    logger.info('Retry worker executado', { picked: rows.length, ok, failed })

    return new Response(JSON.stringify({ picked: rows.length, ok, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    logger.error('Falha no retry worker', { error: (e as Error).message })
    return createErrorResponse((e as Error).message, 500)
  }
})
