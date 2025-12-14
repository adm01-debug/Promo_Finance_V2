import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados financeiros para análise
    const [contasReceber, contasPagar, clientes] = await Promise.all([
      supabase.from('contas_receber').select('*').order('data_vencimento'),
      supabase.from('contas_pagar').select('*').order('data_vencimento'),
      supabase.from('clientes').select('*'),
    ]);

    if (contasReceber.error) throw contasReceber.error;
    if (contasPagar.error) throw contasPagar.error;
    if (clientes.error) throw clientes.error;

    // Preparar contexto para a IA
    const hoje = new Date().toISOString().split('T')[0];
    
    const recebiveisData = contasReceber.data.map(cr => ({
      cliente: cr.cliente_nome,
      valor: cr.valor,
      vencimento: cr.data_vencimento,
      status: cr.status,
      etapa_cobranca: cr.etapa_cobranca,
      valor_recebido: cr.valor_recebido || 0,
    }));

    const pagaveisData = contasPagar.data.map(cp => ({
      fornecedor: cp.fornecedor_nome,
      valor: cp.valor,
      vencimento: cp.data_vencimento,
      status: cp.status,
      valor_pago: cp.valor_pago || 0,
    }));

    const clientesData = clientes.data.map(c => ({
      nome: c.razao_social,
      score: c.score,
      limite_credito: c.limite_credito,
    }));

    const prompt = `Você é um analista financeiro especializado em análise preditiva. Analise os seguintes dados financeiros e forneça insights detalhados.

DATA ATUAL: ${hoje}

CONTAS A RECEBER (${recebiveisData.length} registros):
${JSON.stringify(recebiveisData, null, 2)}

CONTAS A PAGAR (${pagaveisData.length} registros):
${JSON.stringify(pagaveisData, null, 2)}

CLIENTES E SCORES (${clientesData.length} registros):
${JSON.stringify(clientesData, null, 2)}

Por favor, forneça uma análise estruturada no seguinte formato JSON:
{
  "resumo_executivo": "Breve resumo da situação financeira",
  "analise_inadimplencia": {
    "taxa_atual": "porcentagem estimada",
    "tendencia": "crescente/estável/decrescente",
    "clientes_risco": ["lista de clientes com maior risco"],
    "valor_em_risco": "valor total em risco de inadimplência"
  },
  "projecao_fluxo_caixa": {
    "proximos_7_dias": {
      "entradas_previstas": "valor",
      "saidas_previstas": "valor",
      "saldo_projetado": "valor"
    },
    "proximos_30_dias": {
      "entradas_previstas": "valor",
      "saidas_previstas": "valor",
      "saldo_projetado": "valor"
    },
    "proximos_90_dias": {
      "entradas_previstas": "valor",
      "saidas_previstas": "valor",
      "saldo_projetado": "valor"
    }
  },
  "alertas": [
    {
      "tipo": "critico/alto/medio/baixo",
      "mensagem": "descrição do alerta",
      "acao_recomendada": "o que fazer"
    }
  ],
  "recomendacoes": [
    "lista de recomendações estratégicas"
  ],
  "score_saude_financeira": "0-100"
}

Responda APENAS com o JSON, sem texto adicional.`;

    console.log("Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Você é um analista financeiro expert. Sempre responda em JSON válido. Seja preciso com números e datas. Considere sazonalidade e padrões históricos quando disponíveis." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse o JSON da resposta
    let analise;
    try {
      // Remove possíveis marcadores de código markdown
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analise = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid JSON response from AI");
    }

    console.log("Analysis completed successfully");

    return new Response(JSON.stringify({ 
      analise,
      gerado_em: new Date().toISOString(),
      dados_analisados: {
        contas_receber: recebiveisData.length,
        contas_pagar: pagaveisData.length,
        clientes: clientesData.length,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analise-preditiva function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
