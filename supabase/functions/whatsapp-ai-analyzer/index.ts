import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import { z } from '../_shared/zod.ts'
import { validateContract } from "../_shared/contract-validator.ts"
import { exigirChamadaInterna } from "../_shared/auth-guard.ts";
import { mensagemErro } from "../_shared/erros.ts";

const WhatsappAnalyzerBodySchema = z.object({
  record: z.object({
    id: z.union([z.string(), z.number()]),
    mensagem: z.string().min(1).max(4096),
  }),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // [auth-guard] Endpoint de automacao interna: exige service role ou segredo
  // rotacionavel em `x-cron-secret`. Sem isso a funcao roda com service role
  // para qualquer requisicao anonima da internet.
  const guard = await exigirChamadaInterna(req);
  if (!guard.ok) return guard.resposta;


  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const rawBody = await req.json().catch(() => ({}))
    const validation = await validateContract(WhatsappAnalyzerBodySchema, rawBody)
    if (!validation.success) return validation.response
    const { id, mensagem } = validation.data.record


    // Call AI Gateway (OpenAI)
    const prompt = `Analise a seguinte mensagem de cobrança enviada via WhatsApp para um cliente inadimplente e forneça um JSON com:
    1. sentimento: (positivo, neutro, negativo, agressivo)
    2. resumo: Um resumo curto (máx 100 caracteres) da intenção da mensagem.
    3. proxima_acao: Uma sugestão de próxima etapa (ex: "Aguardar 24h", "Ligar para o financeiro", "Enviar para protesto").

    Mensagem: "${mensagem}"

    Retorne APENAS o JSON no formato:
    {"sentimento": "...", "resumo": "...", "proxima_acao": "..."}`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente especialista em recuperação de crédito e análise de comunicação de cobrança.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    })

    const aiData = await aiResponse.json()
    const content = aiData.choices[0].message.content
    const insights = JSON.parse(content.replace(/```json|```/g, ''))

    // Update the record in Supabase
    const { error: updateError } = await supabaseClient
      .from('historico_cobranca_whatsapp')
      .update({
        ia_sentimento: insights.sentimento,
        ia_resumo: insights.resumo,
        ia_proxima_acao: insights.proxima_acao
      })
      .eq('id', id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: mensagemErro(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
