import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import {
  CategorizarDespesaSchema,
  corsHeaders,
  validatePayload,
  createErrorResponse,
} from '../_shared/validation.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { exigirUsuario } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('categorizar-despesa');

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

export const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = corsHeadersPara(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const guard = await exigirUsuario(req);
  if (!guard.ok) return guard.resposta;

  try {
    const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && serviceRoleKey) {
      const supa = createClient(supabaseUrl, serviceRoleKey);
      const rl = await checkRateLimit(supa, { endpoint: 'categorizar-despesa', ip, limit: 30, windowSeconds: 60, userAgent: req.headers.get('user-agent') });
      if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);
    }

    const rawBody = await req.json();
    const validation = validatePayload(CategorizarDespesaSchema, rawBody, 'categorizar-despesa');
    if (!validation.success) return createErrorResponse(validation.error, 400, validation.details, req);
    const { despesas } = validation.data;

    if (!despesas || despesas.length === 0) return new Response(JSON.stringify({ error: 'Nenhuma despesa fornecida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

    const despesasTexto = despesas.map((d, i) => `${i + 1}. Descrição: "${d.descricao}", Valor: R$ ${d.valor.toFixed(2)}, Fornecedor: "${d.fornecedor_nome || 'Não informado'}"`).join('\n');

    const systemPrompt = `Você é um especialista em categorização de despesas empresariais no Brasil.\nSua tarefa é analisar despesas e categorizá-las de forma precisa.\n\nCategorias disponíveis:\n1. Pessoal: Salários, benefícios, encargos, treinamentos\n2. Operacional: Aluguel, energia, água, internet, telefone, manutenção\n3. Materiais: Matéria-prima, material de escritório, limpeza\n4. Marketing: Publicidade, brindes, eventos, comissões\n5. Impostos: Federais, estaduais, municipais, taxas bancárias\n6. Financeiro: Juros, multas, tarifas, IOF\n7. TI: Software, hardware, serviços de TI, cloud\n8. Jurídico: Honorários, taxas cartoriais, certidões\n9. Transporte: Combustível, frete, pedágios, manutenção veicular\n10. Outros: Diversos\n\nPara cada despesa, retorne um objeto JSON com:\n- categoria: nome da categoria\n- subcategoria: subcategoria específica\n- confianca: número de 0 a 1 indicando certeza\n- centro_custo_sugerido: sugestão de centro de custo\n- tags: array de tags relevantes\n- descricao_padronizada: versão padronizada da descrição`;

    const userPrompt = `Categorize as seguintes despesas e retorne APENAS um array JSON válido com as categorizações:\n\n${despesasTexto}\n\nResponda APENAS com o array JSON, sem texto adicional.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.3 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Erro na API de IA:', { error_message: mensagemErro(errorText), context: contextoErro(errorText) });
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    let categorias: CategoriaDetectada[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) categorias = JSON.parse(jsonMatch[0]);
      else categorias = JSON.parse(content);
    } catch (parseError) {
      log.error('Erro ao parsear resposta da IA:', { error_message: mensagemErro(parseError), context: contextoErro(parseError) });
      categorias = despesas.map((d) => ({ categoria: 'Outros', subcategoria: 'Diversos', confianca: 0.5, tags: [], descricao_padronizada: d.descricao }));
    }

    return new Response(JSON.stringify({ categorias, success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    log.error('Erro ao categorizar despesas:', { error_message: mensagemErro(error), context: contextoErro(error) });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
};

if (import.meta.main) {
  serve(withEdgeObservability('categorizar-despesa', async (req) => {
    const _t0 = Date.now();
    try { return await handler(req); }
    finally { log.info('request', { duration_ms: Date.now() - _t0 }); await log.flush(); }
  }));
}
