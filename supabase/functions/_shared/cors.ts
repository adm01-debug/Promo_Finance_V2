/**
 * Cabeçalhos CORS canônicos das Edge Functions.
 *
 * Por que este arquivo existe: diversas funções importavam `corsHeaders` de
 * `npm:@supabase/supabase-js@2.49.4/cors`, um subpath que NÃO existe no pacote — o que
 * derruba a função com erro de módulo já no boot. Aqui centralizamos a lista de
 * headers permitidos, incluindo os `x-supabase-client-*` que o cliente JS envia.
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-request-id, x-correlation-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/** Resposta padrão para o preflight `OPTIONS`. */
export function respostaPreflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Helper para respostas JSON já com CORS aplicado. */
export function jsonComCors(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
