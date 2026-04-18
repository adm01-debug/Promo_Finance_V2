// ============================================
// EDGE FUNCTION: gerar-relatorio-anual
// Agrega dados anuais para Relatório Tributário PDF (P6)
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReqBody {
  empresa_id: string;
  ano: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('gerar-relatorio-anual');
  const t0 = Date.now();
  logger.info('fn_start');

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } =
      await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub as string;
    const admin = createClient(supabaseUrl, serviceKey);

    // RBAC — admin/financeiro/contador_readonly
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const allowedRoles = new Set(['admin', 'financeiro', 'contador_readonly']);
    const hasAccess = (roles ?? []).some((r) =>
      allowedRoles.has(String(r.role))
    );
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ReqBody = await req.json();
    if (!body.empresa_id || !body.ano) {
      return new Response(
        JSON.stringify({ error: 'empresa_id e ano obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Empresa
    const { data: empresa } = await admin
      .from('empresas')
      .select('razao_social, cnpj, regime_tributario')
      .eq('id', body.empresa_id)
      .maybeSingle();

    // Série anual (12 meses) via vw_tributario_dashboard
    const { data: serieRaw } = await admin
      .from('vw_tributario_dashboard')
      .select('*')
      .eq('empresa_id', body.empresa_id)
      .eq('ano', body.ano)
      .order('mes', { ascending: true });

    const serie = serieRaw ?? [];

    // Alertas resolvidos no ano
    const inicio = `${body.ano}-01-01`;
    const fim = `${body.ano}-12-31`;
    const { data: alertasResolvidos } = await admin
      .from('alertas_tributarios')
      .select('id, tipo, titulo, prioridade, resolvido_em')
      .eq('empresa_id', body.empresa_id)
      .eq('resolvido', true)
      .gte('resolvido_em', inicio)
      .lte('resolvido_em', fim);

    // Decidir regime (mês 12 de referência)
    let decisao: Record<string, unknown> | null = null;
    try {
      const decRes = await fetch(`${supabaseUrl}/functions/v1/decidir-regime`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresaId: body.empresa_id,
          anoReferencia: body.ano,
          mesReferencia: 12,
        }),
      });
      if (decRes.ok) decisao = await decRes.json();
    } catch (e) {
      logger.warn('decidir_regime_fallback', {
        error_message: e instanceof Error ? e.message : String(e),
      });
    }

    // Totais anuais
    const sum = (k: string) =>
      serie.reduce(
        (acc: number, s: Record<string, number>) => acc + Number(s[k] ?? 0),
        0
      );
    const faturamentoAnual = sum('faturamento');
    const tributosAnuais = sum('total_tributos');
    const cargaEfetiva =
      faturamentoAnual > 0 ? (tributosAnuais / faturamentoAnual) * 100 : 0;

    logger.info('data_aggregated', {
      context: {
        empresa_id: body.empresa_id,
        ano: body.ano,
        meses: serie.length,
      },
    });

    const payload = {
      empresa: {
        razao_social: empresa?.razao_social ?? 'Empresa',
        cnpj: empresa?.cnpj ?? '—',
        regime_atual: empresa?.regime_tributario ?? '—',
      },
      ano: body.ano,
      kpis: {
        faturamento_anual: faturamentoAnual,
        tributos_anuais: tributosAnuais,
        carga_efetiva: cargaEfetiva,
        meses_apurados: serie.length,
      },
      apuracao_mensal: serie,
      decisao_regime: decisao,
      alertas_resolvidos: alertasResolvidos ?? [],
      gerado_em: new Date().toISOString(),
    };

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
    });
    await logger.flush();

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error('fn_failure', {
      duration_ms: Date.now() - t0,
      status_code: 500,
      error_message: msg,
    });
    await logger.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
