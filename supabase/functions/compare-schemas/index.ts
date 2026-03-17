const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EXTERNAL_SERVICE_KEY = Deno.env.get('EXTERNAL_DB_URL');
    if (!EXTERNAL_SERVICE_KEY) {
      throw new Error('EXTERNAL_DB_URL not configured');
    }

    const externalUrl = 'https://xyykivpcdbfukaongpbw.supabase.co';

    const fetchExt = async (path: string, options?: RequestInit) => {
      const res = await fetch(`${externalUrl}${path}`, {
        ...options,
        headers: {
          'apikey': EXTERNAL_SERVICE_KEY,
          'Authorization': `Bearer ${EXTERNAL_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, text, json, ok: res.ok };
    };

    // Get full OpenAPI spec for column details of ponto_* tables
    const specRes = await fetchExt('/rest/v1/');
    const spec = specRes.json;
    
    const pontoTables: Record<string, unknown> = {};
    if (spec?.definitions) {
      for (const [name, def] of Object.entries(spec.definitions)) {
        if (name.startsWith('ponto_')) {
          pontoTables[name] = def;
        }
      }
    }

    // Also get RPC functions from paths
    const rpcFunctions: string[] = [];
    if (spec?.paths) {
      for (const path of Object.keys(spec.paths)) {
        if (path.startsWith('/rpc/')) {
          rpcFunctions.push(path.replace('/rpc/', ''));
        }
      }
    }

    // Get sample data from ponto tables
    const pontoData: Record<string, unknown> = {};
    for (const table of ['ponto_departamentos', 'ponto_funcionarios', 'ponto_registros', 'ponto_sync_log']) {
      const res = await fetchExt(`/rest/v1/${table}?limit=3`);
      pontoData[table] = { status: res.status, sample: res.json, count: Array.isArray(res.json) ? res.json.length : 0 };
    }

    return new Response(JSON.stringify({
      ponto_table_schemas: pontoTables,
      ponto_sample_data: pontoData,
      rpc_functions: rpcFunctions.sort(),
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
