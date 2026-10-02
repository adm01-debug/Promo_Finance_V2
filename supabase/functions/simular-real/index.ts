import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { simularReal } from '../_shared/tributario-logic.ts';
import {
  corsHeaders,
  validatePayload,
  createErrorResponse,
  ParametrosSimulacaoSchema,
} from '../_shared/validation.ts';
import { exigirUsuario } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = corsHeadersPara(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const guard = await exigirUsuario(req);
    if (!guard.ok) return guard.resposta;

    const raw = await req.json();
    const parsed = validatePayload(ParametrosSimulacaoSchema, raw, 'simular-real');
    if (!parsed.success) return createErrorResponse(parsed.error, 400, parsed.details, req);
    const result = simularReal(parsed.data as Parameters<typeof simularReal>[0]);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return createErrorResponse((e as Error).message, 500, undefined, req);
  }
});
