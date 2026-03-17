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
    const { metricas, setor } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

    const prompt = `Você é um consultor financeiro especialista no setor de "${setor || 'Eventos e Produção'}".

Analise as métricas da empresa abaixo e compare com benchmarks do setor. Forneça uma análise completa.

MÉTRICAS DA EMPRESA:
${JSON.stringify(metricas, null, 2)}

Responda EXCLUSIVAMENTE com JSON válido (sem markdown):
{
  "score_geral": 0-100,
  "posicao_mercado": "acima_media|na_media|abaixo_media",
  "benchmarks": [
    {
      "metrica": "Nome da métrica",
      "valor_empresa": "valor formatado",
      "media_setor": "valor médio do setor",
      "melhor_setor": "top 25% do setor",
      "posicao": "acima|na_media|abaixo",
      "diferenca_percentual": numero,
      "recomendacao": "Ação específica para melhorar"
    }
  ],
  "pontos_fortes": ["lista de 2-3 pontos fortes"],
  "pontos_fracos": ["lista de 2-3 pontos de melhoria"],
  "oportunidades": [
    {
      "titulo": "Oportunidade identificada",
      "descricao": "Detalhes com números",
      "impacto_estimado": "R$ estimativa ou % melhoria",
      "prazo": "curto|medio|longo"
    }
  ],
  "tendencias_setor": ["2-3 tendências relevantes do setor de eventos"],
  "resumo_executivo": "Parágrafo com análise consolidada"
}

Use referências reais do mercado brasileiro de eventos. Métricas importantes:
- Margem operacional (média setor eventos: 12-18%)
- Índice de inadimplência (aceitável: até 5%)
- Prazo médio recebimento vs pagamento
- Custos fixos vs variáveis
- Taxa de recorrência de clientes
- Ticket médio por evento`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista financeiro sênior especializado em benchmarking setorial. Responda sempre com JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = { score_geral: 50, resumo_executivo: content.substring(0, 500), benchmarks: [], pontos_fortes: [], pontos_fracos: [], oportunidades: [], tendencias_setor: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("benchmarking error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
