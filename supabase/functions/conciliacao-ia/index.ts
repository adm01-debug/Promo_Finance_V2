import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransacaoExtrato {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
}

interface LancamentoSistema {
  id: string;
  tipo: 'pagar' | 'receber';
  entidade: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  documento?: string;
}

interface MatchSugestaoIA {
  transacaoId: string;
  lancamentoId: string;
  lancamentoTipo: 'pagar' | 'receber';
  score: number;
  confianca: 'alta' | 'media' | 'baixa';
  motivos: Array<{
    tipo: string;
    peso: number;
    detalhe: string;
  }>;
  analiseIA?: string;
}

const SYSTEM_PROMPT = `Você é um especialista em conciliação bancária. Sua tarefa é analisar transações de extrato bancário e encontrar correspondências com lançamentos do sistema financeiro.

Para cada transação do extrato, você deve:
1. Analisar o valor, descrição, data e tipo (crédito/débito)
2. Comparar com os lançamentos disponíveis
3. Calcular um score de 0-100 baseado em:
   - Valor exato ou próximo (peso 40%)
   - Similaridade de descrição/entidade (peso 30%)
   - Proximidade de data (peso 20%)
   - Tipo compatível: débito→pagar, crédito→receber (peso 10%)

Retorne APENAS um JSON válido no formato:
{
  "matches": [
    {
      "transacaoId": "id_transacao",
      "lancamentoId": "id_lancamento",
      "score": 85,
      "motivos": [
        {"tipo": "valor_exato", "peso": 40, "detalhe": "Valores idênticos: R$ 1.500,00"},
        {"tipo": "nome_parcial", "peso": 20, "detalhe": "Fornecedor similar: ABC Ltda ~ ABC Comercial"}
      ],
      "analiseIA": "Alta probabilidade de match: valores idênticos e fornecedor similar"
    }
  ]
}

Tipos de motivos: valor_exato, valor_proximo, nome_exato, nome_parcial, data_proxima, documento, tipo_compativel

IMPORTANTE: 
- Score >= 80: confiança alta
- Score 60-79: confiança média  
- Score < 60: confiança baixa
- Ignore transações sem correspondência clara (score < 40)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transacoes, lancamentos } = await req.json() as {
      transacoes: TransacaoExtrato[];
      lancamentos: LancamentoSistema[];
    };

    if (!transacoes?.length || !lancamentos?.length) {
      return new Response(
        JSON.stringify({ matches: [], message: "Dados insuficientes para análise" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analisando ${transacoes.length} transações contra ${lancamentos.length} lançamentos`);

    // Prepare context for AI
    const transacoesResumo = transacoes.slice(0, 50).map(t => ({
      id: t.id,
      data: t.data,
      descricao: t.descricao.substring(0, 100),
      valor: t.valor,
      tipo: t.tipo
    }));

    const lancamentosResumo = lancamentos.slice(0, 100).map(l => ({
      id: l.id,
      tipo: l.tipo,
      entidade: l.entidade.substring(0, 50),
      descricao: l.descricao?.substring(0, 50) || '',
      valor: l.valor,
      dataVencimento: l.dataVencimento,
      documento: l.documento
    }));

    const userPrompt = `Analise estas transações de extrato bancário e encontre correspondências com os lançamentos do sistema:

TRANSAÇÕES DO EXTRATO:
${JSON.stringify(transacoesResumo, null, 2)}

LANÇAMENTOS DO SISTEMA:
${JSON.stringify(lancamentosResumo, null, 2)}

Encontre os melhores matches e retorne o JSON conforme especificado.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para análise de IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, parsing...");

    // Extract JSON from response
    let matches: MatchSugestaoIA[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        matches = (parsed.matches || []).map((m: any) => ({
          transacaoId: m.transacaoId,
          lancamentoId: m.lancamentoId,
          lancamentoTipo: lancamentos.find(l => l.id === m.lancamentoId)?.tipo || 'pagar',
          score: Math.min(100, Math.max(0, m.score || 0)),
          confianca: m.score >= 80 ? 'alta' : m.score >= 60 ? 'media' : 'baixa',
          motivos: m.motivos || [],
          analiseIA: m.analiseIA || ''
        }));
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw content:", content);
    }

    console.log(`Found ${matches.length} AI-suggested matches`);

    return new Response(
      JSON.stringify({ 
        matches,
        processedAt: new Date().toISOString(),
        transacoesAnalisadas: transacoes.length,
        lancamentosAnalisados: lancamentos.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Conciliação IA error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao processar análise de IA" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
