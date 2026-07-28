import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/validation.ts'
import { mensagemErro } from '../_shared/erros.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const health: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'operational',
    services: {
      edge_runtime: { status: 'operational', version: Deno.version.deno },
      database: { status: 'unknown' },
      realtime: { status: 'unknown' },
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
    health.services.database.error = mensagemErro(err)
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

  // 3. Check Realtime
  try {
    // Check if realtime is accepting connections (simple HTTP check to health endpoint if available, or assume operational if DB is up)
    health.services.realtime.status = health.services.database.status;
  } catch {
    health.services.realtime.status = 'degraded';
  }

  // Final Overall Status
  if (health.services.database.status === 'outage') health.status = 'degraded';

  return new Response(JSON.stringify(health), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
