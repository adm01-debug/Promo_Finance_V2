import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import { z } from '../_shared/zod.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('analise-fluxo-ia');

const Schema = z.object({
  empresa_id: z.string().uuid(),
  periodo_meses: z.number().int().min(1).max(24).optional().default(3),
});

Deno.serve(
  withEdgeObservability('analise-fluxo-ia', async (req) => {
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
      const parsed = Schema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Payload inválido', details: parsed.error.flatten() }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { empresa_id, periodo_meses } = parsed.data;

      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - periodo_meses);

      const [{ data: receber }, { data: pagar }] = await Promise.all([
        supabase
          .from('contas_receber')
          .select('valor, data_vencimento, status')
          .eq('empresa_id', empresa_id)
          .gte('data_vencimento', dataInicio.toISOString().slice(0, 10)),
        supabase
          .from('contas_pagar')
          .select('valor, data_vencimento, status')
          .eq('empresa_id', empresa_id)
          .gte('data_vencimento', dataInicio.toISOString().slice(0, 10)),
      ]);

      const totalReceber = (receber ?? []).reduce((s: number, r: { valor: number }) => s + Number(r.valor), 0);
      const totalPagar = (pagar ?? []).reduce((s: number, p: { valor: number }) => s + Number(p.valor), 0);
      const saldoProjetado = totalReceber - totalPagar;

      return new Response(
        JSON.stringify({
          empresa_id,
          periodo_meses,
          total_receber: totalReceber,
          total_pagar: totalPagar,
          saldo_projetado: saldoProjetado,
          saude: saldoProjetado >= 0 ? 'positivo' : 'negativo',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      log.info('request', { duration_ms: Date.now() - _t0 });
      await log.flush();
    }
  })
);
