
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Tabelas e Lógica (Espelhada do lib/tributario)
const ANEXOS: Record<string, Array<{ faixa: number; ate: number; aliq: number; pd: number }>> = {
  I: [
    { faixa: 1, ate: 180000, aliq: 0.04, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.073, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.095, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.107, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.143, pd: 87300 },
    { faixa: 6, ate: 4800000, aliq: 0.19, pd: 378000 },
  ],
  II: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.078, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.10, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.112, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.147, pd: 85500 },
    { faixa: 6, ate: 4800000, aliq: 0.30, pd: 720000 },
  ],
  III: [
    { faixa: 1, ate: 180000, aliq: 0.06, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.112, pd: 9360 },
    { faixa: 3, ate: 720000, aliq: 0.135, pd: 17640 },
    { faixa: 4, ate: 1800000, aliq: 0.16, pd: 35640 },
    { faixa: 5, ate: 3600000, aliq: 0.21, pd: 125640 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 648000 },
  ],
  IV: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.09, pd: 8100 },
    { faixa: 3, ate: 720000, aliq: 0.102, pd: 12420 },
    { faixa: 4, ate: 1800000, aliq: 0.14, pd: 39780 },
    { faixa: 5, ate: 3600000, aliq: 0.22, pd: 183780 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 828000 },
  ],
  V: [
    { faixa: 1, ate: 180000, aliq: 0.155, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.18, pd: 4500 },
    { faixa: 3, ate: 720000, aliq: 0.195, pd: 9900 },
    { faixa: 4, ate: 1800000, aliq: 0.205, pd: 17100 },
    { faixa: 5, ate: 3600000, aliq: 0.23, pd: 62100 },
    { faixa: 6, ate: 4800000, aliq: 0.305, pd: 540000 },
  ],
};

const DISTRIBUICAO: Record<string, any> = {
  I:   { irpj: 0.055, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.415, icms: 0.34,  iss: 0 },
  II:  { irpj: 0.055, csll: 0.035, cofins: 0.1182, pis: 0.0278, cpp: 0.415, icms: 0.32,  iss: 0,  },
  III: { irpj: 0.04,  csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0,    iss: 0.335 },
  IV:  { irpj: 0.185, csll: 0.15,  cofins: 0.1603, pis: 0.0347, cpp: 0,     icms: 0,    iss: 0.47 },
  V:   { irpj: 0.25,  csll: 0.15,  cofins: 0.1428, pis: 0.0309, cpp: 0.2885, icms: 0,    iss: 0.137 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { faturamentoAnual, rbt12, folha12m, percentualServicos, anexoForcado } = await req.json();

    let anexo = anexoForcado;
    const fatorR = rbt12 > 0 ? (folha12m / rbt12) : 0;

    if (!anexo) {
      if (percentualServicos > 50) {
        anexo = fatorR >= 0.28 ? 'III' : 'V';
      } else {
        anexo = 'I';
      }
    }

    const faixa = ANEXOS[anexo].find(f => rbt12 <= f.ate) || ANEXOS[anexo][5];
    const aliqEfetiva = rbt12 > 0 ? Math.max(0, ((rbt12 * faixa.aliq) - faixa.pd) / rbt12) : faixa.aliq;
    const dasTotal = faturamentoAnual * aliqEfetiva;

    const dist = DISTRIBUICAO[anexo];
    
    return new Response(JSON.stringify({
      regime: 'simples_nacional',
      nome: 'Simples Nacional',
      elegivel: rbt12 <= 4800000,
      irpj: dasTotal * dist.irpj,
      csll: dasTotal * dist.csll,
      pis: dasTotal * dist.pis,
      cofins: dasTotal * dist.cofins,
      cpp: dasTotal * dist.cpp,
      icms: dasTotal * dist.icms,
      iss: dasTotal * dist.iss,
      totalTributos: dasTotal,
      cargaEfetiva: (dasTotal / faturamentoAnual) * 100,
      fatorR,
      anexoAplicavel: anexo,
      faixaAplicavel: faixa.faixa,
      aliquotaNominal: faixa.aliq * 100,
      aliquotaEfetiva: aliqEfetiva * 100
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
