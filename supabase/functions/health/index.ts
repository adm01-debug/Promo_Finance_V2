import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/validation.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const health: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {
      edge_runtime: { status: 'operational', version: Deno.version.deno },
      database: { status: 'unknown' },
      external_apis: {
        asaas: { status: 'unknown' },
        bling: { status: 'unknown' },
      }
    }
  }

  // 1. Check Database
  try {
    const { error } = await supabase.from('asaas_config').select('count', { count: 'exact', head: true }).limit(1)
    health.services.database.status = error ? 'degraded' : 'operational'
  } catch (err) {
    health.services.database.status = 'outage'
    health.services.database.error = err.message
  }

  // 2. Check External APIs (Quick ping)
  try {
    const asaasRes = await fetch('https://api.asaas.com/v3/ping').catch(() => null)
    health.services.external_apis.asaas.status = asaasRes?.ok ? 'operational' : 'degraded'
  } catch {
    health.services.external_apis.asaas.status = 'outage'
  }

  try {
    const blingRes = await fetch('https://api.bling.com.br/Api/v3/ping').catch(() => null)
    health.services.external_apis.bling.status = blingRes?.ok ? 'operational' : 'degraded'
  } catch {
    health.services.external_apis.bling.status = 'outage'
  }

  return new Response(JSON.stringify(health), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
