import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const localSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await localSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const url = new URL(req.url);
    const tabela = url.searchParams.get('tabela');
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    if (!tabela || !['clientes', 'fornecedores'].includes(tabela)) {
      return new Response(JSON.stringify({ error: 'Parâmetro "tabela" inválido. Use: clientes ou fornecedores' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Connect to external DB
    const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')?.trim();
    const extKeyRaw = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY')?.trim();
    if (!extUrl || !extKeyRaw) {
      return new Response(JSON.stringify({ error: 'External DB not configured', extUrl: !!extUrl, extKey: !!extKeyRaw }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize: keep only valid ASCII printable characters and extract just the JWT token
    let extKey = extKeyRaw.replace(/[^\x20-\x7E]/g, '').trim();
    
    // If the key was pasted multiple times or has extra content, try to extract the JWT
    const jwtMatch = extKey.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (jwtMatch) {
      extKey = jwtMatch[0];
    }

    console.log(`[external-data] Connecting to external DB: url_starts=${extUrl.substring(0, 20)}, key_len_raw=${extKeyRaw.length}, key_len_clean=${extKey.length}`);

    const extSupabase = createClient(extUrl, extKey);

    // Build query
    let query = extSupabase.from(tabela).select('*', { count: 'exact' });

    if (search) {
      if (tabela === 'clientes') {
        query = query.or(`razao_social.ilike.%${search}%,nome_fantasia.ilike.%${search}%,cnpj_cpf.ilike.%${search}%`);
      } else {
        query = query.or(`razao_social.ilike.%${search}%,nome_fantasia.ilike.%${search}%,cnpj_cpf.ilike.%${search}%`);
      }
    }

    query = query.order('razao_social', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(`[external-data] Error querying ${tabela}:`, error);
      return new Response(JSON.stringify({ error: error.message, details: error }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      data,
      total: count,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[external-data] Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
