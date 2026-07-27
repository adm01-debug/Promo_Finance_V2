
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createLogger } from '../_shared/observability.ts';
import { 
  simularSimples, 
  simularPresumido, 
  simularReal, 
  ParametrosSimulacao, 
  RegimeTributario,
  FaturamentoMes,
  FolhaMes
} from '../_shared/tributario-logic.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function decidirRegimeInternal(p: ParametrosSimulacao, ano: number, mes: number, regimeAtual?: RegimeTributario) {
  const cenarios = [simularSimples(p, ano, mes), simularPresumido(p), simularReal(p)];
  const elegiveis = cenarios.filter((c) => c.elegivel).sort((a, b) => a.totalTributos - b.totalTributos);
  const recomendado = elegiveis[0] || cenarios[2];
  const segundoLugar = elegiveis[1];
  let economia: number | undefined;
  if (regimeAtual) {
    const atual = cenarios.find((c) => c.regime === regimeAtual);
    if (atual?.elegivel) economia = atual.totalTributos - recomendado.totalTributos;
  }
  const alertas: string[] = [];
  if (segundoLugar) {
    const diff = ((segundoLugar.totalTributos - recomendado.totalTributos) / recomendado.totalTributos) * 100;
    if (diff < 5) alertas.push(`Diferença pequena (${diff.toFixed(1)}%) entre ${recomendado.nome} e ${segundoLugar.nome}.`);
  }
  const justificativa = `${recomendado.nome} apresenta a menor carga: R$ ${recomendado.totalTributos.toFixed(0)} (${recomendado.cargaEfetiva.toFixed(2)}%).`;
  return { cenarios, recomendado, segundoLugar, economiaAnualVsAtual: economia, alertas, justificativa };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const logger = createLogger('decidir-regime');
  const t0 = Date.now();
  
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cliente vinculado ao JWT do chamador: valida a identidade de verdade.
    const sbUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await sbUser.auth.getUser();
    const userId = userData?.user?.id;
    if (userError || !userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const raw = await req.json().catch(() => ({}));
    const { z } = await import('https://deno.land/x/zod@v3.22.4/mod.ts');
    const { validatePayload, createErrorResponse } = await import('../_shared/validation.ts');
    const DecidirBodySchema = z.object({
      empresaId: z.string().uuid(),
      anoReferencia: z.number().int().optional().nullable(),
      mesReferencia: z.number().int().min(1).max(12).optional().nullable(),
      parametrosOverride: z.record(z.any()).optional().nullable(),
      regimeAtual: z.enum(['simples_nacional', 'lucro_presumido', 'lucro_real']).optional().nullable(),
      persist: z.boolean().optional(),
    }).passthrough();
    const parsed = validatePayload(DecidirBodySchema, raw, 'decidir-regime');
    if (!parsed.success) return createErrorResponse(parsed.error, 400, parsed.details);
    const { empresaId, anoReferencia, mesReferencia, parametrosOverride, regimeAtual, persist = true } = parsed.data as Record<string, any>;

    // Autorização multi-tenant: a leitura passa pelo RLS do próprio usuário.
    const { data: empresaPermitida } = await sbUser
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .maybeSingle();
    if (!empresaPermitida) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hoje = new Date();
    const ano = anoReferencia ?? hoje.getFullYear();
    const mes = mesReferencia ?? hoje.getMonth() + 1;

    // Buscar dados reais da empresa para a simulação
    const [{ data: faturamento }, { data: folha }] = await Promise.all([
      sb.from('faturamento_mensal').select('*').eq('empresa_id', empresaId).order('ano', { ascending: false }).order('mes', { ascending: false }).limit(24),
      sb.from('folha_pagamento').select('*').eq('empresa_id', empresaId).order('ano', { ascending: false }).order('mes', { ascending: false }).limit(24),
    ]);

    const faturamentoMensal: FaturamentoMes[] = (faturamento || []).map((f) => ({
      ano: f.ano, mes: f.mes, receita_bruta: Number(f.receita_bruta) || 0,
    }));
    const folhaMensal: FolhaMes[] = (folha || []).map((f) => ({
      ano: f.ano, mes: f.mes,
      salarios: Number(f.salarios) || 0,
      pro_labore: Number(f.pro_labore) || 0,
      encargos: Number(f.encargos) || 0,
      total_folha: Number(f.total_folha ?? (Number(f.salarios) || 0) + (Number(f.encargos) || 0)) || 0,
    }));

    const faturamentoAnual = faturamentoMensal
      .filter((f) => f.ano === ano)
      .reduce((a, f) => a + f.receita_bruta, 0)
      || faturamentoMensal.slice(0, 12).reduce((a, f) => a + f.receita_bruta, 0);
    const folhaAnual = folhaMensal
      .filter((f) => f.ano === ano)
      .reduce((a, f) => a + f.total_falha_placeholder ?? 0, 0);

    const params: ParametrosSimulacao = {
      ...normalizarOverride(parametrosOverride),
      faturamentoAnual: numeroFinito(parametrosOverride?.faturamentoAnual) ?? faturamentoAnual,
      faturamentoMensal,
      folhaMensal,
      folhaAnual: numeroFinito(parametrosOverride?.folhaAnual) ?? folhaAnualCalculado(folhaMensal, ano),
      margemLucro: numeroFinito(parametrosOverride?.margemLucro) ?? 15,
      percentualServicos: numeroFinito(parametrosOverride?.percentualServicos) ?? 50,
      comprasComCredito: numeroFinito(parametrosOverride?.comprasComCredito) ?? 0,
      despesasOperacionais: numeroFinito(parametrosOverride?.despesasOperacionais) ?? 0,
    };


    // CACHE LOOKUP
    const cacheable = !parametrosOverride || Object.keys(parametrosOverride).length === 0;
    if (cacheable) {
      const { data: cached } = await sb
        .from('regime_decision_cache')
        .select('decisao, expires_at')
        .eq('empresa_id', empresaId)
        .eq('ano', ano)
        .eq('mes', mes)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (cached?.decisao) {
        // Log cache hit in audit trail
        await sb.from('tax_audit_trail').insert({
          user_id: claims.claims.sub,
          empresa_id: empresaId,
          ano, mes,
          action: 'cache_hit',
          parameters: params
        });

        return new Response(JSON.stringify({ ...(cached.decisao as object), params, fromCache: true }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const resultado = decidirRegimeInternal(params, ano, mes, regimeAtual);

    // AI Justification logic kept...
    let justificativaIA = null;
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        const prompt = `Analise os cenários tributários abaixo e forneça uma recomendação executiva curta (máx 3 frases) em português:
        ${JSON.stringify(resultado.cenarios)}
        
        Regime Recomendado: ${resultado.recomendado.nome}
        Economia Estimada: R$ ${resultado.economiaAnualVsAtual || 0}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp",
            messages: [
              { role: "system", content: "Você é um consultor tributário sênior." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          justificativaIA = aiData.choices?.[0]?.message?.content;
        }
      }
    } catch (e) {
      console.error('AI error:', e);
    }

    const finalResponse = { ...resultado, justificativaIA, params };

    // Log simulation in audit trail
    await sb.from('tax_audit_trail').insert({
      user_id: claims.claims.sub,
      empresa_id: empresaId,
      ano, mes,
      action: 'simulated',
      parameters: params,
      prompt: justificativaIA ? 'AI justification prompt' : null,
      response: justificativaIA,
      is_ai_justified: !!justificativaIA
    });

    if (cacheable) {
      await sb.from('regime_decision_cache').upsert({
        empresa_id: empresaId,
        ano, mes,
        decisao: finalResponse,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return new Response(JSON.stringify(finalResponse), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
