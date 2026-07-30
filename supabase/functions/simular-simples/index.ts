import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { simularSimples } from '../_shared/tributario-logic.ts';
import { corsHeaders, validatePayload, createErrorResponse, SimularSimplesRpcSchema } from '../_shared/validation.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const raw = await req.json();
    const parsed = validatePayload(SimularSimplesRpcSchema, raw, 'simular-simples');
    if (!parsed.success) return createErrorResponse(parsed.error, 400, parsed.details);
    const { faturamentoAnual, rbt12, folha12m, percentualServicos } = parsed.data;
    const hoje = new Date();
    const result = simularSimples({
      faturamentoAnual,
      faturamentoMensal: rbt12 ? [{ ano: hoje.getFullYear(), mes: hoje.getMonth(), receita_bruta: rbt12 }] : [],
      folhaAnual: folha12m ?? undefined,
      percentualServicos: percentualServicos ?? undefined,
      margemLucro: 15,
    } as Parameters<typeof simularSimples>[0], hoje.getFullYear(), hoje.getMonth() + 1);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return createErrorResponse((e as Error).message, 500);
  }
});
