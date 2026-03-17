const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SERVICE_KEY = Deno.env.get('EXTERNAL_DB_URL');
    if (!SERVICE_KEY) throw new Error('EXTERNAL_DB_URL not configured');

    const externalUrl = 'https://xyykivpcdbfukaongpbw.supabase.co';

    const fetchExt = async (path: string, hdrs?: Record<string,string>) => {
      const res = await fetch(`${externalUrl}${path}`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          ...(hdrs || {}),
        },
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, json, ok: res.ok };
    };

    // 1. Get full OpenAPI spec from external
    const specRes = await fetchExt('/rest/v1/');
    const spec = specRes.json;

    if (!spec?.definitions) {
      return new Response(JSON.stringify({ error: 'Could not read external OpenAPI spec', raw: spec }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Extract ALL table/view definitions with full column details
    const externalSchemas: Record<string, Record<string, { type: string; format?: string; description?: string }>> = {};
    for (const [name, def] of Object.entries(spec.definitions)) {
      const props = (def as any)?.properties;
      if (props) {
        const columns: Record<string, any> = {};
        for (const [col, colDef] of Object.entries(props)) {
          columns[col] = {
            type: (colDef as any)?.type || 'unknown',
            format: (colDef as any)?.format || null,
            description: (colDef as any)?.description || null,
          };
        }
        externalSchemas[name] = columns;
      }
    }

    // 3. Get local OpenAPI spec
    const localUrl = Deno.env.get('SUPABASE_URL') || '';
    const localKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const localSpecRes = await fetch(`${localUrl}/rest/v1/`, {
      headers: {
        'apikey': localKey,
        'Authorization': `Bearer ${localKey}`,
        'Content-Type': 'application/json',
      },
    });
    const localSpec = await localSpecRes.json();

    const localSchemas: Record<string, Record<string, any>> = {};
    if (localSpec?.definitions) {
      for (const [name, def] of Object.entries(localSpec.definitions)) {
        const props = (def as any)?.properties;
        if (props) {
          const columns: Record<string, any> = {};
          for (const [col, colDef] of Object.entries(props)) {
            columns[col] = {
              type: (colDef as any)?.type || 'unknown',
              format: (colDef as any)?.format || null,
              description: (colDef as any)?.description || null,
            };
          }
          localSchemas[name] = columns;
        }
      }
    }

    // 4. Compare: find missing tables, missing columns, type mismatches
    const missingTables: string[] = [];
    const missingColumns: Record<string, string[]> = {};
    const typeMismatches: Record<string, Record<string, { external: any; local: any }>> = {};
    const extraLocalTables: string[] = [];

    for (const [table, extCols] of Object.entries(externalSchemas)) {
      if (!localSchemas[table]) {
        missingTables.push(table);
        continue;
      }
      const localCols = localSchemas[table];
      for (const [col, extDef] of Object.entries(extCols)) {
        if (!localCols[col]) {
          if (!missingColumns[table]) missingColumns[table] = [];
          missingColumns[table].push(col);
        } else {
          // Check type match
          if (localCols[col].type !== (extDef as any).type || localCols[col].format !== (extDef as any).format) {
            if (!typeMismatches[table]) typeMismatches[table] = {};
            typeMismatches[table][col] = {
              external: extDef,
              local: localCols[col],
            };
          }
        }
      }
    }

    for (const table of Object.keys(localSchemas)) {
      if (!externalSchemas[table]) {
        extraLocalTables.push(table);
      }
    }

    // 5. Compare RPCs
    const extRpcs: string[] = [];
    const localRpcs: string[] = [];
    if (spec?.paths) {
      for (const p of Object.keys(spec.paths)) {
        if (p.startsWith('/rpc/')) extRpcs.push(p.replace('/rpc/', ''));
      }
    }
    if (localSpec?.paths) {
      for (const p of Object.keys(localSpec.paths)) {
        if (p.startsWith('/rpc/')) localRpcs.push(p.replace('/rpc/', ''));
      }
    }
    const missingRpcs = extRpcs.filter(r => !localRpcs.includes(r));
    const extraLocalRpcs = localRpcs.filter(r => !extRpcs.includes(r));

    // 6. Summary
    const totalExtTables = Object.keys(externalSchemas).length;
    const totalLocalTables = Object.keys(localSchemas).length;
    const totalMissingCols = Object.values(missingColumns).reduce((a, b) => a + b.length, 0);
    const totalMismatches = Object.values(typeMismatches).reduce((a, b) => a + Object.keys(b).length, 0);

    const isPerfect = missingTables.length === 0 && totalMissingCols === 0 && missingRpcs.length === 0;

    return new Response(JSON.stringify({
      summary: {
        status: isPerfect ? '✅ 100% PARITY - NADA SE PERDE' : '⚠️ DIVERGÊNCIAS ENCONTRADAS',
        external_tables: totalExtTables,
        local_tables: totalLocalTables,
        missing_tables: missingTables.length,
        missing_columns: totalMissingCols,
        type_mismatches: totalMismatches,
        missing_rpcs: missingRpcs.length,
        extra_local_tables: extraLocalTables.length,
        extra_local_rpcs: extraLocalRpcs.length,
      },
      details: {
        missing_tables: missingTables,
        missing_columns: missingColumns,
        type_mismatches: typeMismatches,
        missing_rpcs: missingRpcs,
        extra_local_tables: extraLocalTables.sort(),
        extra_local_rpcs: extraLocalRpcs.sort(),
      },
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
