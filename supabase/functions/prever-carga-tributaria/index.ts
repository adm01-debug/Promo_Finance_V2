// Edge: prever-carga-tributaria — Lovable AI Gateway (gemini-2.5-flash)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SerieRow {
  competencia: string;
  ano: number;
  mes: number;
  total_tributos: number | null;
  cbs: number | null;
  ibs: number | null;
  imposto_seletivo: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const logger = createLogger('prever-carga-tributaria');
  const t0 = Date.now();
  logger.info('fn_start');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      logger.error('missing_lovable_api_key', { status_code: 500 });
      await logger.flush();
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // JWT manual + RBAC
    const auth = req.headers.get('Authorization');
    if (!auth) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    const allowed = ['admin', 'financeiro', 'visualizador'];
    const userRoles = (roles ?? []).map((r) => r.role);
    if (!userRoles.some((r) => allowed.includes(r))) {
      logger.warn('forbidden', { context: { user_id: userData.user.id, roles: userRoles } });
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const empresa_id = body.empresa_id as string | undefined;
    const meses_historico = Math.min(Math.max(Number(body.meses_historico ?? 12), 3), 24);

    if (!empresa_id) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'empresa_id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar série histórica
    const { data: serieRaw, error: serieErr } = await admin
      .from('vw_tributario_dashboard')
      .select('competencia, ano, mes, total_tributos, cbs, ibs, imposto_seletivo')
      .eq('empresa_id', empresa_id)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .limit(meses_historico);

    if (serieErr) throw serieErr;
    const serie = ((serieRaw ?? []) as SerieRow[]).reverse();

    if (serie.length < 3) {
      await logger.flush();
      return new Response(
        JSON.stringify({
          error: 'Histórico insuficiente. Mínimo 3 meses de apuração.',
          historico_disponivel: serie.length,
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prompt estruturado
    const systemPrompt = `Você é um analista tributário brasileiro especialista em Reforma Tributária (CBS/IBS/IS).
Analise a série histórica de tributos e gere previsões realistas para os próximos 3 meses.
Seja conservador. Considere sazonalidade, tendência e variabilidade.
Retorne SOMENTE via tool call estruturado.`;

    const userPrompt = `Série histórica (${serie.length} meses) — empresa_id ${empresa_id}:
${JSON.stringify(serie, null, 2)}

Gere:
1. Previsão dos próximos 3 meses (cenário base)
2. Cenário conservador (pior caso, +15% sobre base)
3. Cenário agressivo (melhor caso, -10% via otimizações)
4. 3 ações recomendadas com impacto estimado em R$`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'gerar_previsao_tributaria',
              description: 'Gera previsão tributária estruturada',
              parameters: {
                type: 'object',
                properties: {
                  previsao_base: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        mes_offset: { type: 'integer', description: '1, 2 ou 3 meses à frente' },
                        total_tributos: { type: 'number' },
                        cbs: { type: 'number' },
                        ibs: { type: 'number' },
                        imposto_seletivo: { type: 'number' },
                        confianca_pct: { type: 'number', description: '0-100' },
                      },
                      required: ['mes_offset', 'total_tributos', 'cbs', 'ibs', 'imposto_seletivo', 'confianca_pct'],
                    },
                  },
                  cenario_conservador_total: { type: 'number' },
                  cenario_agressivo_total: { type: 'number' },
                  acoes_recomendadas: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        titulo: { type: 'string' },
                        descricao: { type: 'string' },
                        impacto_estimado_brl: { type: 'number' },
                        prioridade: { type: 'string', enum: ['alta', 'media', 'baixa'] },
                      },
                      required: ['titulo', 'descricao', 'impacto_estimado_brl', 'prioridade'],
                    },
                  },
                  resumo_executivo: { type: 'string' },
                },
                required: ['previsao_base', 'cenario_conservador_total', 'cenario_agressivo_total', 'acoes_recomendadas', 'resumo_executivo'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'gerar_previsao_tributaria' } },
      }),
    });

    if (!aiResponse.ok) {
      const txt = await aiResponse.text();
      logger.error('ai_gateway_error', { status_code: aiResponse.status, error_message: txt.slice(0, 500) });
      await logger.flush();
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições. Tente em alguns instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos esgotados. Adicione créditos em Settings > Workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Falha no gateway de IA' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      logger.error('no_tool_call', { context: { aiJson: JSON.stringify(aiJson).slice(0, 300) } });
      await logger.flush();
      return new Response(JSON.stringify({ error: 'IA não retornou previsão estruturada' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const previsao = JSON.parse(toolCall.function.arguments);

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { empresa_id, meses_historico, num_acoes: previsao.acoes_recomendadas?.length },
    });
    await logger.flush();

    return new Response(
      JSON.stringify({
        empresa_id,
        gerado_em: new Date().toISOString(),
        historico_meses: serie.length,
        ...previsao,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('fn_failure', { duration_ms: Date.now() - t0, status_code: 500, error_message: msg });
    await logger.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
