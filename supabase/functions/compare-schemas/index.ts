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
    if (!EXTERNAL_SERVICE_KEY) throw new Error('EXTERNAL_DB_URL not configured');

    const externalUrl = 'https://xyykivpcdbfukaongpbw.supabase.co';

    const fetchExt = async (path: string, hdrs?: Record<string,string>) => {
      const res = await fetch(`${externalUrl}${path}`, {
        headers: {
          'apikey': EXTERNAL_SERVICE_KEY,
          'Authorization': `Bearer ${EXTERNAL_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          ...(hdrs || {}),
        },
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, json, ok: res.ok };
    };

    // Get OpenAPI spec
    const specRes = await fetchExt('/rest/v1/');
    const spec = specRes.json;

    // Extract ponto_* table definitions
    const pontoSchemas: Record<string, unknown> = {};
    if (spec?.definitions) {
      for (const [name, def] of Object.entries(spec.definitions)) {
        if (name.startsWith('ponto_')) {
          pontoSchemas[name] = (def as any)?.properties || def;
        }
      }
    }

    // Extract all RPC functions
    const rpcFunctions: string[] = [];
    if (spec?.paths) {
      for (const path of Object.keys(spec.paths)) {
        if (path.startsWith('/rpc/')) {
          rpcFunctions.push(path.replace('/rpc/', ''));
        }
      }
    }

    // Get sample data counts
    const pontoData: Record<string, unknown> = {};
    for (const table of ['ponto_departamentos', 'ponto_funcionarios', 'ponto_registros', 'ponto_sync_log']) {
      const res = await fetchExt(`/rest/v1/${table}?select=*&limit=2`);
      pontoData[table] = { rows: res.json, count: Array.isArray(res.json) ? res.json.length : 0 };
    }

    // Get view definitions by checking columns via OpenAPI
    const viewSchemas: Record<string, unknown> = {};
    const views = ['vw_contas_pagar_painel', 'vw_contas_receber_painel', 'vw_dre_mensal', 'vw_dso_aging', 
      'vw_fluxo_caixa', 'vw_fluxo_caixa_diario', 'vw_gastos_centro_custo', 'vw_metricas_cobranca', 
      'vw_saldos_contas', 'vw_transferencias_painel', 'vw_webhooks_recentes'];
    
    if (spec?.definitions) {
      for (const vw of views) {
        if (spec.definitions[vw]) {
          viewSchemas[vw] = (spec.definitions[vw] as any)?.properties || spec.definitions[vw];
        }
      }
    }

    return new Response(JSON.stringify({
      ponto_table_schemas: pontoSchemas,
      ponto_sample_data: pontoData,
      rpc_functions_in_external: rpcFunctions.sort(),
      rpc_count: rpcFunctions.length,
      external_view_schemas: viewSchemas,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
