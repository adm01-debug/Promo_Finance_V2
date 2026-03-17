import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dados, contexto } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

    const prompt = `Você é um CFO especialista em análise financeira para empresas de eventos. Analise os dados abaixo e forneça insights acionáveis em português brasileiro.

CONTEXTO: ${contexto || 'Análise geral do período'}

DADOS FINANCEIROS:
${JSON.stringify(dados, null, 2)}

Responda EXCLUSIVAMENTE com um JSON válido no seguinte formato (sem markdown, sem código):
{
  "resumo": "Resumo executivo em 2 frases",
  "score": 0-100 (saúde financeira),
  "insights": [
    {
      "tipo": "alerta|oportunidade|recomendacao",
      "titulo": "Título curto",
      "descricao": "Descrição detalhada com números",
      "impacto": "alto|medio|baixo",
      "acao": "Ação sugerida específica"
    }
  ],
  "comparativo": "Comparação com período anterior se disponível",
  "projecao": "Projeção para próximo período"
}

Forneça entre 3 e 5 insights ordenados por impacto. Seja específico com números e percentuais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista financeiro sênior. Responda sempre com JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione fundos em Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = {
        resumo: content.substring(0, 200),
        score: 50,
        insights: [{ tipo: 'recomendacao', titulo: 'Análise disponível', descricao: content.substring(0, 500), impacto: 'medio', acao: 'Revisar dados' }],
        comparativo: '',
        projecao: '',
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insights-relatorio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
