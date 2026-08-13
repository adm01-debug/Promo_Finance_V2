
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CalculoIvaSchema, corsHeaders, validatePayload, createErrorResponse } from "../_shared/validation.ts";


// Alíquotas de transição da Reforma Tributária (P7)
const CRONOGRAMA = [
  { ano: 2026, cbs: 0.9, ibs: 0.1, residual: 100 },
  { ano: 2027, cbs: 8.8, ibs: 0.1, residual: 100 },
  { ano: 2028, cbs: 8.8, ibs: 0.1, residual: 100 },
  { ano: 2029, cbs: 8.8, ibs: 1.77, residual: 90 },
  { ano: 2030, cbs: 8.8, ibs: 3.54, residual: 80 },
  { ano: 2031, cbs: 8.8, ibs: 5.31, residual: 70 },
  { ano: 2032, cbs: 8.8, ibs: 7.08, residual: 60 },
  { ano: 2033, cbs: 8.8, ibs: 17.7, residual: 0 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.json();
    const validation = validatePayload(CalculoIvaSchema, rawBody, "calculo-iva");
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details);
    }
    const { faturamentoAnual, ano, setor = 'geral' } = validation.data;


    const config = CRONOGRAMA.find(c => c.ano === (ano || 2026)) || CRONOGRAMA[0];
    
    // Redutores setoriais (exemplo simplificado)
    let redutor = 1.0;
    if (['saude', 'educacao', 'servicos_limpeza'].includes(setor)) redutor = 0.4;
    if (['agro'].includes(setor)) redutor = 0.0; // Isento ou alíquota zero dependendo do caso

    const cbs = (faturamentoAnual * (config.cbs / 100)) * redutor;
    const ibs = (faturamentoAnual * (config.ibs / 100)) * redutor;
    const totalIVA = cbs + ibs;

    return new Response(JSON.stringify({
      ano: config.ano,
      cbs,
      ibs,
      totalIVA,
      cargaEfetiva: (totalIVA / faturamentoAnual) * 100,
      config: {
        aliq_cbs: config.cbs * redutor,
        aliq_ibs: config.ibs * redutor,
        redutor_setorial: (1 - redutor) * 100
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
