const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js');

    const localDbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!localDbUrl) throw new Error('SUPABASE_DB_URL not set');

    // External project credentials (hardcoded for audit purposes)
    const extRef = 'xyykivpcdbfukaongpbw';
    const extAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eWtpdnBjZGJmdWthb25ncGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjA4NTcsImV4cCI6MjA4OTIzNjg1N30.lg355h9cqm3QJhBGSsmCrvjqG4vhN6IkmUHr6OjfZn0';
    const extServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eWtpdnBjZGJmdWthb25ncGJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY2MDg1NywiZXhwIjoyMDg5MjM2ODU3fQ.SHwPSA92iOO27gGe8hmVdfW30KOT1Zgmw8OiIxEs_Ww';
    const extUrl = `https://${extRef}.supabase.co`;

    const local = postgres(localDbUrl, { max: 2 });
    const gaps: Record<string, unknown> = {};

    // Get local metadata
    const [localCols, localEnums, localFns, localTrigs, localIdx, localViews, localRls, localFks, localRlsStatus, localUq] = await Promise.all([
      local`SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`,
      local`SELECT t.typname AS enum_name, e.enumlabel AS enum_value FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname, e.enumsortorder`,
      local`SELECT p.proname AS func_name, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY p.proname`,
      local`SELECT trigger_name, event_manipulation, event_object_table, action_statement, action_timing FROM information_schema.triggers WHERE trigger_schema='public' ORDER BY event_object_table, trigger_name`,
      local`SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname`,
      local`SELECT viewname, definition FROM pg_views WHERE schemaname='public' ORDER BY viewname`,
      local`SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname`,
      local`SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' ORDER BY tc.table_name`,
      local`SELECT relname AS table_name, relrowsecurity AS rls_enabled FROM pg_class JOIN pg_namespace ON pg_namespace.oid=pg_class.relnamespace WHERE pg_namespace.nspname='public' AND relkind='r' ORDER BY relname`,
      local`SELECT tc.constraint_name, tc.table_name FROM information_schema.table_constraints tc WHERE tc.constraint_type='UNIQUE' AND tc.table_schema='public' ORDER BY tc.table_name`,
    ]);

    await local.end();

    // Get external OpenAPI
    const openApiRes = await fetch(`${extUrl}/rest/v1/`, {
      headers: {
        'apikey': extServiceKey,
        'Authorization': `Bearer ${extServiceKey}`,
      },
    });
    const openApiText = await openApiRes.text();
    let openApi: any;
    try { openApi = JSON.parse(openApiText); } catch { openApi = { definitions: {} }; }
    const extDefs = openApi.definitions || {};

    // Build local column map
    const localColMap: Record<string, Set<string>> = {};
    for (const c of localCols) {
      if (!localColMap[c.table_name]) localColMap[c.table_name] = new Set();
      localColMap[c.table_name].add(c.column_name);
    }

    // Compare tables and columns
    const missingTables: string[] = [];
    const missingColumns: Record<string, string[]> = {};
    for (const [tblName, def] of Object.entries(extDefs)) {
      const props = (def as any).properties || {};
      if (!localColMap[tblName]) {
        missingTables.push(tblName);
        continue;
      }
      for (const col of Object.keys(props)) {
        if (!localColMap[tblName].has(col)) {
          if (!missingColumns[tblName]) missingColumns[tblName] = [];
          missingColumns[tblName].push(col);
        }
      }
    }

    // Also check: external columns details for missing ones
    const missingColumnsDetail: Record<string, any[]> = {};
    for (const [tblName, cols] of Object.entries(missingColumns)) {
      const props = extDefs[tblName]?.properties || {};
      missingColumnsDetail[tblName] = cols.map(col => ({
        column: col,
        type: props[col]?.type || props[col]?.format || 'unknown',
        format: props[col]?.format || null,
        description: props[col]?.description || null,
      }));
    }

    gaps.missing_tables = missingTables;
    gaps.missing_columns = missingColumnsDetail;
    gaps.missing_columns_total = Object.values(missingColumns).reduce((a, b) => a + b.length, 0);

    // Local enums
    const localEnumMap: Record<string, string[]> = {};
    for (const e of localEnums) {
      if (!localEnumMap[e.enum_name]) localEnumMap[e.enum_name] = [];
      localEnumMap[e.enum_name].push(e.enum_value);
    }
    gaps.local_enums = localEnumMap;

    // Triggers
    gaps.local_triggers = localTrigs.map((t: any) => ({
      table: t.event_object_table, trigger: t.trigger_name, event: t.event_manipulation, timing: t.action_timing,
    }));

    // Tables without RLS
    gaps.tables_without_rls = localRlsStatus.filter((r: any) => !r.rls_enabled).map((r: any) => r.table_name);

    // Views
    gaps.local_views = localViews.map((v: any) => v.viewname);

    // External vs local table counts
    const extTableNames = Object.keys(extDefs);
    const localTableNames = Object.keys(localColMap);
    gaps.extra_local_tables = localTableNames.filter(t => !extTableNames.includes(t));
    gaps.extra_external_tables = extTableNames.filter(t => !localTableNames.includes(t));

    gaps.summary = {
      external_tables: extTableNames.length,
      local_tables: localTableNames.length,
      missing_tables: missingTables.length,
      missing_columns_total: Object.values(missingColumns).reduce((a, b) => a + b.length, 0),
      tables_without_rls: gaps.tables_without_rls ? (gaps.tables_without_rls as any[]).length : 0,
      local_triggers: localTrigs.length,
      local_functions: localFns.length,
      local_indexes: localIdx.length,
      local_views: localViews.length,
      local_rls_policies: localRls.length,
      local_fks: localFks.length,
    };

    return new Response(JSON.stringify(gaps, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message, stack: (error as Error).stack }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
