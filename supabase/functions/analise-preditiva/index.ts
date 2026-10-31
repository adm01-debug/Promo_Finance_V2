import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import { corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('analise-preditiva');

Deno.serve(
  withEdgeObservability('analise-preditiva', async (req) => {
    const _t0 = Date.now();
    try {
      const corsHeaders = corsHeadersPara(req);
      if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const body = await req.json().catch(() => ({}));
      const { empresa_id } = body;

      if (!empresa_id) {
        return new Response(JSON.stringify({ error: 'empresa_id obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: historico } = await supabase
        .from('contas_receber')
        .select('valor, data_vencimento')
        .eq('empresa_id', empresa_id)
        .eq('status', 'pago')
        .order('data_vencimento', { ascending: true })
        .limit(90);

      const total = (historico ?? []).reduce((s: number, r: { valor: number }) => s + Number(r.valor), 0);
      const media = historico && historico.length > 0 ? total / historico.length : 0;

      return new Response(
        JSON.stringify({
          empresa_id,
          registros_analisados: historico?.length ?? 0,
          media_recebimento: media,
          previsao_proximo_mes: media * 30,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      log.info('request', { duration_ms: Date.now() - _t0 });
      await log.flush();
    }
  })
);
