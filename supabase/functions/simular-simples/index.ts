import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { simularSimples } from '../_shared/tributario-logic.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { faturamentoAnual, rbt12, folha12m, percentualServicos, anexoForcado } = await req.json();
    const hoje = new Date();
    const result = simularSimples({
      faturamentoAnual,
      faturamentoMensal: rbt12 ? [{ ano: hoje.getFullYear(), mes: hoje.getMonth(), receita_bruta: rbt12 }] : [],
      folhaAnual: folha12m,
      percentualServicos,
      margemLucro: 15 // Default
    }, hoje.getFullYear(), hoje.getMonth() + 1);

    if (anexoForcado) {
      // Small adjustment if forced
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
