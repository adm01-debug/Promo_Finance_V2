// Edge: comparar-benchmark-setorial — empresa vs mediana do regime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const log = createLogger('comparar-benchmark-setorial');
  const t0 = Date.now();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supaUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const empresaId: string | undefined = body?.empresa_id;
    if (!empresaId) {
      return new Response(JSON.stringify({ error: 'empresa_id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supaUrl, serviceKey);

    const { data: empresa } = await admin
      .from('empresas')
      .select('id, razao_social, regime_tributario')
      .eq('id', empresaId)
      .maybeSingle();

    if (!empresa) {
      return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const regime = empresa.regime_tributario ?? 'nao_informado';

    // Carga últimos 12m da empresa
    const hoje = new Date();
    const corteAno = hoje.getFullYear();
    const corteMes = hoje.getMonth() + 1;
    const limiteOrdinal = corteAno * 12 + corteMes - 12;

    const { data: serie } = await admin
      .from('vw_tributario_dashboard')
      .select('total_tributos, ano, mes')
      .eq('empresa_id', empresaId);

    const total12m = (serie ?? [])
      .filter((r) => r.ano * 12 + r.mes >= limiteOrdinal)
      .reduce((acc, r) => acc + Number(r.total_tributos || 0), 0);

    const { data: bench } = await admin
      .from('mv_benchmark_setorial')
      .select('regime, amostra, p25, mediana, p75, media')
      .eq('regime', regime)
      .maybeSingle();

    let posicao: 'abaixo_p25' | 'mediana' | 'acima_p75' = 'mediana';
    let percentil = 50;
    let diferencaMediana = 0;
    const insights: string[] = [];

    if (bench && bench.mediana) {
      const med = Number(bench.mediana);
      const p25 = Number(bench.p25);
      const p75 = Number(bench.p75);
      diferencaMediana = total12m - med;

      if (total12m <= p25) {
        posicao = 'abaixo_p25';
        percentil = 20;
        insights.push(`✅ Sua carga tributária (R$ ${total12m.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) está entre as 25% mais eficientes do regime ${regime}.`);
      } else if (total12m >= p75) {
        posicao = 'acima_p75';
        percentil = 80;
        insights.push(`⚠️ Sua carga tributária está entre as 25% mais altas do regime ${regime}. Há espaço para otimização.`);
      } else {
        posicao = 'mediana';
        percentil = total12m < med ? 40 : 60;
        insights.push(`📊 Sua carga está alinhada com a mediana do regime ${regime}.`);
      }

      if (diferencaMediana > 0) {
        insights.push(`💡 Para alcançar a mediana setorial, seria necessário reduzir R$ ${Math.abs(diferencaMediana).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em tributos.`);
      } else {
        insights.push(`🎯 Você economiza R$ ${Math.abs(diferencaMediana).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em relação à mediana setorial.`);
      }

      insights.push(`📈 Amostra do benchmark: ${bench.amostra} empresas no regime ${regime}.`);
    } else {
      insights.push('Sem dados de benchmark suficientes para esse regime ainda.');
    }

    log.info('benchmark_calculado', { duration_ms: Date.now() - t0, context: { empresaId, regime, posicao } });
    await log.flush();

    return new Response(
      JSON.stringify({
        empresa: { id: empresa.id, razao_social: empresa.razao_social, regime },
        carga_empresa_12m: total12m,
        benchmark: bench ?? null,
        posicao,
        percentil,
        diferenca_mediana: diferencaMediana,
        insights,
        atualizado_em: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    log.error('exception', { error_message: e instanceof Error ? e.message : String(e) });
    await log.flush();
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
