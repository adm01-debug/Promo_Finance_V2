import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { simularPresumido } from '../_shared/tributario-logic.ts';
import {
  corsHeaders,
  validatePayload,
  createErrorResponse,
  ParametrosSimulacaoSchema,
} from '../_shared/validation.ts';
import { exigirUsuario } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';

serve(
  withEdgeObservability('simular-presumido', async (req) => {
    const corsHeaders = corsHeadersPara(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
      const guard = await exigirUsuario(req);
      if (!guard.ok) return guard.resposta;

      const raw = await req.json();
      const parsed = validatePayload(ParametrosSimulacaoSchema, raw, 'simular-presumido');
      if (!parsed.success) return createErrorResponse(parsed.error, 400, parsed.details, req);
      const result = simularPresumido(parsed.data as Parameters<typeof simularPresumido>[0]);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return createErrorResponse((e as Error).message, 500, undefined, req);
    }
  })
);
