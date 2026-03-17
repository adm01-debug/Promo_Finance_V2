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

    // Get full OpenAPI spec from external
    const specRes = await fetchExt('/rest/v1/');
    const spec = specRes.json;

    if (!spec?.definitions) {
      return new Response(JSON.stringify({ error: 'Could not read external OpenAPI spec' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get local OpenAPI spec
    const localUrl = Deno.env.get('SUPABASE_URL') || '';
    const localKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const localSpecRes = await fetch(`${localUrl}/rest/v1/`, {
      headers: { 'apikey': localKey, 'Authorization': `Bearer ${localKey}`, 'Content-Type': 'application/json' },
    });
    const localSpec = await localSpecRes.json();

    // Build local columns map
    const localCols: Record<string, Set<string>> = {};
    if (localSpec?.definitions) {
      for (const [name, def] of Object.entries(localSpec.definitions)) {
        const props = (def as any)?.properties;
        if (props) localCols[name] = new Set(Object.keys(props));
      }
    }

    // For each missing column, get the full definition from external
    const migrationLines: string[] = [];
    const formatMap: Record<string, string> = {
      'uuid': 'UUID',
      'text': 'TEXT',
      'character varying': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'BIGINT',
      'smallint': 'SMALLINT',
      'numeric': 'NUMERIC',
      'double precision': 'DOUBLE PRECISION',
      'real': 'REAL',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'timestamp with time zone': 'TIMESTAMPTZ',
      'timestamp without time zone': 'TIMESTAMP',
      'jsonb': 'JSONB',
      'json': 'JSON',
      'ARRAY': 'TEXT[]',
    };

    const tablesMissing: Record<string, Array<{col: string; pgType: string; format: string; jsType: string}>> = {};

    for (const [table, def] of Object.entries(spec.definitions)) {
      const props = (def as any)?.properties;
      if (!props || !localCols[table]) continue;

      for (const [col, colDef] of Object.entries(props)) {
        if (localCols[table].has(col)) continue;
        
        const cd = colDef as any;
        const format = cd.format || '';
        const jsType = cd.type || 'string';
        
        let pgType = 'TEXT';
        if (format && formatMap[format]) {
          pgType = formatMap[format];
        } else if (jsType === 'integer') {
          pgType = 'INTEGER';
        } else if (jsType === 'number') {
          pgType = 'NUMERIC';
        } else if (jsType === 'boolean') {
          pgType = 'BOOLEAN';
        } else if (jsType === 'array') {
          const itemsFormat = cd.items?.format || cd.items?.type || 'text';
          if (itemsFormat === 'uuid') pgType = 'UUID[]';
          else pgType = 'TEXT[]';
        } else if (format === 'jsonb' || jsType === 'object') {
          pgType = 'JSONB';
        }

        if (!tablesMissing[table]) tablesMissing[table] = [];
        tablesMissing[table].push({ col, pgType, format, jsType });
      }
    }

    // Generate SQL migration
    for (const [table, cols] of Object.entries(tablesMissing)) {
      // Skip views
      if (table.startsWith('vw_')) continue;
      for (const c of cols) {
        migrationLines.push(`ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${c.col} ${c.pgType};`);
      }
    }

    return new Response(JSON.stringify({
      total_missing_columns: Object.values(tablesMissing).reduce((a, b) => a + b.length, 0),
      tables_affected: Object.keys(tablesMissing).length,
      tables_detail: tablesMissing,
      migration_sql: migrationLines.join('\n'),
      views_needing_update: Object.keys(tablesMissing).filter(t => t.startsWith('vw_')),
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
