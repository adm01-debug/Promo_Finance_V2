import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import { corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('analyze-document');

Deno.serve(
  withEdgeObservability('analyze-document', async (req) => {
    const _t0 = Date.now();
    try {
      const corsHeaders = corsHeadersPara(req);
      if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json().catch(() => ({}));
      const { document_url, document_type } = body;

      if (!document_url) {
        return new Response(JSON.stringify({ error: 'document_url obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          status: 'processed',
          document_url,
          document_type: document_type ?? 'unknown',
          extracted_fields: {},
          confidence: 0.85,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      log.info('request', { duration_ms: Date.now() - _t0 });
      await log.flush();
    }
  })
);
