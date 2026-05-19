import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const { run_id, target_function, scenarios_count = 10 } = await req.json()

    if (!run_id || !target_function) {
      throw new Error('run_id e target_function são obrigatórios')
    }

    // Atualizar status para running
    await supabase.from('webhook_simulation_runs').update({ 
      status: 'running',
      started_at: new Date().toISOString(),
      total_scenarios: scenarios_count
    }).eq('id', run_id)

    const scenarios = [
      { name: 'Pagamento Recebido', type: 'PAYMENT_RECEIVED' },
      { name: 'Pagamento Confirmado', type: 'PAYMENT_CONFIRMED' },
      { name: 'Pagamento Vencido', type: 'PAYMENT_OVERDUE' },
      { name: 'Pagamento Estornado', type: 'PAYMENT_REFUNDED' },
      { name: 'Transferência Concluída', type: 'TRANSFER_DONE' },
      { name: 'Transferência Falhou', type: 'TRANSFER_FAILED' }
    ]

    let successCount = 0
    let failureCount = 0
    const errors: any[] = []

    const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || 'simulated-token'
    const functionUrl = `${supabaseUrl}/functions/v1/${target_function}`

    for (let i = 0; i < scenarios_count; i++) {
      const scenario = scenarios[i % scenarios.length]
      const payload = {
        id: `evt_${crypto.randomUUID()}`,
        event: scenario.type,
        payment: scenario.type.startsWith('PAYMENT') ? {
          id: `pay_${crypto.randomUUID()}`,
          status: 'RECEIVED',
          value: Math.random() * 1000
        } : null,
        transfer: scenario.type.startsWith('TRANSFER') ? {
          id: `tra_${crypto.randomUUID()}`,
          status: 'PENDING',
          value: Math.random() * 5000
        } : null
      }

      const start = Date.now()
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'asaas-access-token': WEBHOOK_TOKEN
          },
          body: JSON.stringify(payload)
        })

        const duration = Date.now() - start
        const resBody = await response.json().catch(() => ({ raw: 'Response was not JSON' }))

        const success = response.ok && resBody.success === true

        if (success) successCount++
        else failureCount++

        await supabase.from('webhook_simulation_results').insert({
          run_id,
          scenario_name: `${scenario.name} #${i+1}`,
          payload,
          response_status: response.status,
          response_body: resBody,
          duration_ms: duration,
          success,
          error_message: response.ok ? null : `Status ${response.status}`
        })

      } catch (err) {
        failureCount++
        errors.push(err.message)
        await supabase.from('webhook_simulation_results').insert({
          run_id,
          scenario_name: `${scenario.name} #${i+1} (Erro)`,
          payload,
          success: false,
          error_message: err.message
        })
      }
    }

    await supabase.from('webhook_simulation_runs').update({ 
      status: 'completed',
      finished_at: new Date().toISOString(),
      success_count: successCount,
      failure_count: failureCount,
      error_summary: errors.length > 0 ? { errors: errors.slice(0, 10) } : null
    }).eq('id', run_id)

    return new Response(JSON.stringify({ success: true, run_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})