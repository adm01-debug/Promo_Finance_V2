import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { ConcurrencyLimiter } from '../_shared/concurrency-limiter.ts'
import { validateContract } from "../_shared/contract-validator.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const _WebhookSimSchema = z.object({
  run_id: z.string().uuid(),
  target_function: z.string().min(1),
  scenarios_count: z.number().int().positive().max(1000).optional(),
  mode: z.string().optional(),
});


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
    const _raw = await req.json();
    const _v = await validateContract(_WebhookSimSchema, _raw);
    if (!_v.success) return _v.response;
    const body = _v.data
    const { run_id, target_function, scenarios_count = 10, mode = 'normal' } = body

    if (!run_id || !target_function) {
      throw new Error('run_id e target_function são obrigatórios')
    }

    // Update status to running
    await supabase.from('webhook_simulation_runs').update({ 
      status: 'running',
      started_at: new Date().toISOString(),
      total_scenarios: scenarios_count
    }).eq('id', run_id)

    const scenarios = {
      'asaas-webhook': [
        { name: 'Pagamento Recebido', type: 'PAYMENT_RECEIVED' },
        { name: 'Pagamento Confirmado', type: 'PAYMENT_CONFIRMED' },
        { name: 'Pagamento Vencido', type: 'PAYMENT_OVERDUE' },
        { name: 'Pagamento Estornado', type: 'PAYMENT_REFUNDED' },
        { name: 'Transferência Concluída', type: 'TRANSFER_DONE' },
        { name: 'Transferência Falhou', type: 'TRANSFER_FAILED' }
      ],
      'bling-webhook': [
        { name: 'Pedido Criado', type: 'pedido.criado' },
        { name: 'Pedido Alterado', type: 'pedido.alterado' },
        { name: 'Estoque Alterado', type: 'estoque.alterado' }
      ],
      'bitrix24-webhook': [
        { name: 'Novo Negócio', type: 'ONCRMDEALADD' },
        { name: 'Negócio Atualizado', type: 'ONCRMDEALUPDATE' }
      ]
    };

    const fuzzingScenarios = [
      { name: 'Payload Malformado', type: 'MALFORMED', payload: '{ invalid json }' },
      { name: 'Campos Ausentes', type: 'MISSING_FIELDS', payload: { event: 'UNKNOWN' } },
      { name: 'UUID Inválido', type: 'INVALID_UUID', payload: { id: 'not-a-uuid', event: 'TEST' } },
      { name: 'Injeção SQL', type: 'SQL_INJECTION', payload: { event: "' OR '1'='1" } },
      { name: 'XSS Attempt', type: 'XSS', payload: { event: "<script>alert(1)</script>" } }
    ];


    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || 'simulated-token'
    const functionUrl = `${supabaseUrl}/functions/v1/${target_function}`

    const runScenario = async (i: number) => {
      let scenario;
      let payload;

      if (mode === 'fuzzing') {
        scenario = fuzzingScenarios[i % fuzzingScenarios.length]
        payload = scenario.payload
      } else {
        const targetScenarios = scenarios[target_function as keyof typeof scenarios] || scenarios['asaas-webhook']
        scenario = targetScenarios[i % targetScenarios.length]
        
        if (target_function === 'asaas-webhook') {
          payload = {
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
        } else if (target_function === 'bling-webhook') {
          payload = {
            event: scenario.type,
            data: { id: Math.floor(Math.random() * 100000), status: 'ok' }
          }
        } else {
          payload = {
            event: scenario.type,
            data: { FIELDS: { ID: Math.floor(Math.random() * 1000) } }
          }
        }

      }

      const start = Date.now()
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'asaas-access-token': WEBHOOK_TOKEN
          },
          body: typeof payload === 'string' ? payload : JSON.stringify(payload)
        })

        const duration = Date.now() - start
        const resBody = await response.json().catch(() => ({ raw: 'Response was not JSON' }))
        
        // No modo fuzzing, esperamos que a função lide com o erro (4xx) mas não quebre (5xx)
        const success = mode === 'fuzzing' ? response.status < 500 : (response.ok && resBody.success === true)

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

    // Usar limitador de concorrência para rodar milhares de simulações com segurança
    const limiter = new ConcurrencyLimiter(mode === 'stress' ? 50 : 20);
    const simulationPromises = [];

    for (let i = 0; i < scenarios_count; i++) {
      simulationPromises.push(limiter.run(() => runScenario(i)));
    }

    await Promise.all(simulationPromises);


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
