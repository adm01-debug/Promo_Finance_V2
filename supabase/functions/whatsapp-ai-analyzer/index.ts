import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()
    const { id, mensagem } = record

    if (!mensagem) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 })
    }

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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
