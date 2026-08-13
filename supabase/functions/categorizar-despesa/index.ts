import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { CategorizarDespesaSchema, corsHeaders, validatePayload, createErrorResponse } from "../_shared/validation.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";


interface Despesa {
  id?: string;
  descricao: string;
  valor: number;
  fornecedor_nome?: string;
  data_vencimento?: string;
}

interface CategoriaDetectada {
  categoria: string;
  subcategoria?: string;
  confianca: number;
  centro_custo_sugerido?: string;
  tags?: string[];
  descricao_padronizada?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit: 30 req/min por IP (endpoint de IA com custo)
    const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && serviceRoleKey) {
      const supa = createClient(supabaseUrl, serviceRoleKey);
      const rl = await checkRateLimit(supa, {
        endpoint: 'categorizar-despesa', ip, limit: 30, windowSeconds: 60,
        userAgent: req.headers.get('user-agent'),
      });
      if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);
    }

    const rawBody = await req.json();
    const validation = validatePayload(CategorizarDespesaSchema, rawBody, "categorizar-despesa");
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details);
    }
    const { despesas } = validation.data;


    if (!despesas || despesas.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma despesa fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Preparar prompt para categorização
    const despesasTexto = despesas.map((d, i) => 
      `${i + 1}. Descrição: "${d.descricao}", Valor: R$ ${d.valor.toFixed(2)}, Fornecedor: "${d.fornecedor_nome || 'Não informado'}"`
    ).join('\n');

    const systemPrompt = `Você é um especialista em categorização de despesas empresariais no Brasil.
Sua tarefa é analisar despesas e categorizá-las de forma precisa.

Categorias disponíveis:
1. Pessoal: Salários, benefícios, encargos, treinamentos
2. Operacional: Aluguel, energia, água, internet, telefone, manutenção
3. Materiais: Matéria-prima, material de escritório, limpeza
4. Marketing: Publicidade, brindes, eventos, comissões
5. Impostos: Federais, estaduais, municipais, taxas bancárias
6. Financeiro: Juros, multas, tarifas, IOF
7. TI: Software, hardware, serviços de TI, cloud
8. Jurídico: Honorários, taxas cartoriais, certidões
9. Transporte: Combustível, frete, pedágios, manutenção veicular
10. Outros: Diversos

Para cada despesa, retorne um objeto JSON com:
- categoria: nome da categoria
- subcategoria: subcategoria específica
- confianca: número de 0 a 1 indicando certeza
- centro_custo_sugerido: sugestão de centro de custo
- tags: array de tags relevantes
- descricao_padronizada: versão padronizada da descrição`;

    const userPrompt = `Categorize as seguintes despesas e retorne APENAS um array JSON válido com as categorizações:

${despesasTexto}

Responda APENAS com o array JSON, sem texto adicional.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API de IA:', errorText);
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    console.log('Resposta da IA:', content);

    // Extrair JSON da resposta
    let categorias: CategoriaDetectada[] = [];
    
    try {
      // Tentar extrair JSON do conteúdo
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categorias = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: tentar parse direto
        categorias = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      // Fallback: categorização básica
      categorias = despesas.map(d => ({
        categoria: 'Outros',
        subcategoria: 'Diversos',
        confianca: 0.5,
        tags: [],
        descricao_padronizada: d.descricao,
      }));
    }

    return new Response(
      JSON.stringify({ categorias, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao categorizar despesas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
