import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createLogger, mensagemErro } from '../_shared/observability.ts';
const log = createLogger('get-vapid-key');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPublicKey) {
      log.error('[get-vapid-key] VAPID_PUBLIC_KEY not configured');
      return new Response(JSON.stringify({ error: 'VAPID key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    log.info('[get-vapid-key] Returning VAPID public key');

    return new Response(JSON.stringify({ vapidPublicKey }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    log.error('[get-vapid-key] Erro:', { error_message: mensagemErro(errorMessage) });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
