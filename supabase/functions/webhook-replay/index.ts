// Endpoint admin para replay manual de webhooks (por ID) ou em lote (por origem/status).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders, createErrorResponse } from '../_shared/validation.ts'
import { createLogger } from '../_shared/logger.ts'
import { z } from '../_shared/zod.ts'
import { createValidationErrorResponse } from '../_shared/contract-response.ts'

const logger = createLogger('webhook-replay')
const ReplayBodySchema = z.object({
  ids: z.array(z.string().uuid()).optional(), source: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(), limit: z.number().int().min(1).max(500).optional(),
}).strict()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return createErrorResponse('Autenticação requerida', 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validar quem chama
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return createErrorResponse('Token inválido', 401)

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    })
    if (roleErr || !isAdmin) return createErrorResponse('Somente administradores', 403)

    const rawBody = await req.json().catch(() => ({}))
    const parsed = ReplayBodySchema.safeParse(rawBody)
    if (!parsed.success) return createValidationErrorResponse(parsed.error, corsHeaders)
    const body = parsed.data
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : []
    const source: string | undefined = typeof body.source === 'string' ? body.source : undefined
    const status: string | undefined = typeof body.status === 'string' ? body.status : undefined
    const limit = Math.min(Number(body.limit ?? 50), 500)

    let targetIds = ids
    if (targetIds.length === 0) {
      const q = admin.from('webhooks_log').select('id').order('last_error_at', { ascending: false }).limit(limit)
      if (source) q.eq('source', source)
      q.in('status', status ? [status] : ['failed', 'dead', 'retrying'])
      const { data, error } = await q
      if (error) return createErrorResponse(`Falha ao listar: ${error.message}`, 500)
      targetIds = (data ?? []).map((r) => r.id as string)
    }

    if (targetIds.length === 0) {
      return new Response(JSON.stringify({ replayed: 0, ids: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: Array<{ id: string; ok: boolean; error?: string }> = []
    for (const id of targetIds) {
      const { error } = await admin.rpc('webhook_replay', { p_id: id })
      results.push({ id, ok: !error, error: error?.message })
    }

    logger.info('Replay executado', { by: userData.user.id, count: results.length })

    // Dispara imediatamente o worker de retry para acelerar reprocessamento.
    try {
      await fetch(`${url}/functions/v1/webhook-retry-worker`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'replay', limit: Math.min(targetIds.length, 100) }),
      })
    } catch { /* best-effort */ }

    return new Response(JSON.stringify({ replayed: results.filter((r) => r.ok).length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return createErrorResponse((e as Error).message, 500)
  }
})
