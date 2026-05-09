
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { faturamentoAnual, percentualServicos, folhaAnual } = await req.json();

    const ps = percentualServicos / 100;
    const pc = 1 - ps;
    const rs = faturamentoAnual * ps;
    const rc = faturamentoAnual * pc;

    // IRPJ: 32% sobre serviços, 8% sobre comércio
    const baseIrpj = rs * 0.32 + rc * 0.08;
    const irpjNormal = baseIrpj * 0.15;
    const irpjAdicional = baseIrpj > 240000 ? (baseIrpj - 240000) * 0.10 : 0;
    const irpj = irpjNormal + irpjAdicional;

    // CSLL: 32% sobre serviços, 12% sobre comércio
    const baseCsll = rs * 0.32 + rc * 0.12;
    const csll = baseCsll * 0.09;

    // PIS/COFINS Cumulativo
    const pis = faturamentoAnual * 0.0065;
    const cofins = faturamentoAnual * 0.03;

    // ICMS/ISS Estimado
    const icms = rc * 0.18;
    const iss = rs * 0.05;

    // CPP: 20% sobre a folha
    const cpp = (folhaAnual || 0) * 0.20;

    const total = irpj + csll + pis + cofins + icms + iss + cpp;

    return new Response(JSON.stringify({
      regime: 'lucro_presumido',
      nome: 'Lucro Presumido',
      elegivel: faturamentoAnual <= 78000000,
      irpj,
      csll,
      pis,
      cofins,
      cpp,
      icms,
      iss,
      totalTributos: total,
      cargaEfetiva: faturamentoAnual > 0 ? (total / faturamentoAnual) * 100 : 0,
      observacoes: [
        'Presunção de 32% para serviços e 8% para comércio (IRPJ).',
        'Alíquota de 15% IRPJ + 10% adicional sobre base > R$ 240k.',
        'PIS/COFINS pelo regime cumulativo (0,65% e 3%).'
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
