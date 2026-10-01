import { corsHeadersPara } from '../_shared/cors.ts';

/**
 * Liveness probe público e mínimo.
 *
 * Antes este endpoint instanciava um client com SERVICE_ROLE_KEY e devolvia
 * versão do runtime, estado de tabelas internas e status de APIs externas —
 * reconhecimento gratuito para qualquer visitante. Agora ele só prova que o
 * edge runtime está de pé (o que um uptime monitor precisa saber). O check
 * profundo de dependências fica nas rotas autenticadas de observabilidade.
 */
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersPara(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
