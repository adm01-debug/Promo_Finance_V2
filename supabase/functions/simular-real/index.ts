import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { faturamentoAnual, margemLucro, comprasComCredito, despesasOperacionais, folhaAnual, percentualServicos } = await req.json();

    const lucro = faturamentoAnual * (margemLucro / 100);
    
    // IRPJ/CSLL sobre o lucro real
    const irpj = Math.max(0, lucro * 0.15 + (lucro > 240000 ? (lucro - 240000) * 0.10 : 0));
    const csll = Math.max(0, lucro * 0.09);

    // PIS/COFINS Não-Cumulativo (estimado)
    const baseCredito = (comprasComCredito || 0) + (despesasOperacionais || 0);
    const pis = Math.max(0, (faturamentoAnual * 0.0165) - (baseCredito * 0.0165));
    const cofins = Math.max(0, (faturamentoAnual * 0.076) - (baseCredito * 0.076));

    const rs = faturamentoAnual * (percentualServicos / 100);
    const rc = faturamentoAnual * (1 - (percentualServicos / 100));

    // ICMS/ISS
    const icms = Math.max(0, (rc * 0.18) - ((comprasComCredito || 0) * 0.18));
    const iss = rs * 0.05;

    // CPP
    const cpp = (folhaAnual || 0) * 0.20;

    const total = irpj + csll + pis + cofins + icms + iss + cpp;

    // Log auditoria se persistir não for falso
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    return new Response(JSON.stringify({
      regime: 'lucro_real',
      nome: 'Lucro Real',
      elegivel: true,
      irpj,
      csll,
      pis,
      cofins,
      cpp,
      icms,
      iss,
      totalTributos: total,
      cargaEfetiva: (total / faturamentoAnual) * 100,
      observacoes: [
        'Cálculo baseado no lucro líquido real da operação.',
        'PIS/COFINS pelo regime não-cumulativo (créditos sobre compras/despesas).',
        'Vantajoso para empresas com margens baixas ou altos custos operacionais.'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
