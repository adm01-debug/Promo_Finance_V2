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

    // Local DB via direct connection
    const localDbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!localDbUrl) throw new Error('SUPABASE_DB_URL not set');

    // External DB via OpenAPI (service_role)
    const extRef = 'xyykivpcdbfukaongpbw';
    const extKey = Deno.env.get('EXTERNAL_DB_URL') || ''; // Actually the service_role key
    const extUrl = `https://${extRef}.supabase.co`;

    const local = postgres(localDbUrl, { max: 2 });
    const gaps: Record<string, unknown> = {};

    // ===== LOCAL: Get everything via direct SQL =====
    const [localCols, localEnums, localFns, localTrigs, localIdx, localViews, localRls, localFks, localRlsStatus, localUq] = await Promise.all([
      local`SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`,
      local`SELECT t.typname AS enum_name, e.enumlabel AS enum_value FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname, e.enumsortorder`,
      local`SELECT p.proname AS func_name, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY p.proname`,
      local`SELECT trigger_name, event_manipulation, event_object_table, action_statement, action_timing FROM information_schema.triggers WHERE trigger_schema='public' ORDER BY event_object_table, trigger_name`,
      local`SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname`,
      local`SELECT viewname, definition FROM pg_views WHERE schemaname='public' ORDER BY viewname`,
      local`SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname`,
      local`SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' ORDER BY tc.table_name`,
      local`SELECT relname AS table_name, relrowsecurity AS rls_enabled FROM pg_class JOIN pg_namespace ON pg_namespace.oid=pg_class.relnamespace WHERE pg_namespace.nspname='public' AND relkind='r' ORDER BY relname`,
      local`SELECT tc.constraint_name, tc.table_name, string_agg(kcu.column_name, ', ') AS columns FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema WHERE tc.constraint_type='UNIQUE' AND tc.table_schema='public' GROUP BY tc.constraint_name, tc.table_name ORDER BY tc.table_name`,
    ]);

    await local.end();

    // ===== EXTERNAL: Get columns via OpenAPI =====
    const openApiRes = await fetch(`${extUrl}/rest/v1/?apikey=${extKey}`, {
      headers: { 'Authorization': `Bearer ${extKey}` },
    });
    const openApiText = await openApiRes.text();

    // Also get RPC list
    const rpcRes = await fetch(`${extUrl}/rest/v1/rpc/?apikey=${extKey}`, {
      headers: { 'Authorization': `Bearer ${extKey}` },
    });
    await rpcRes.text();

    // Parse OpenAPI for table+column info
    let openApi: any;
    try { openApi = JSON.parse(openApiText); } catch { openApi = {}; }

    const extDefs = openApi.definitions || {};

    // Build local column map
    const localColMap: Record<string, Set<string>> = {};
    for (const c of localCols) {
      if (!localColMap[c.table_name]) localColMap[c.table_name] = new Set();
      localColMap[c.table_name].add(c.column_name);
    }

    // Compare tables and columns (from OpenAPI)
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
    gaps.missing_tables = missingTables;
    gaps.missing_columns = missingColumns;
    gaps.missing_columns_total = Object.values(missingColumns).reduce((a, b) => a + b.length, 0);

    // ===== Now try to use RPC to query external DB metadata =====
    // We can call custom RPCs if they exist, but for a generic approach
    // let's query via PostgREST's built-in pg_catalog access... which doesn't exist.
    // So we do what we CAN: compare what we see from OpenAPI.

    // Local-only analysis (things we have locally but want to check)
    const localEnumMap: Record<string, string[]> = {};
    for (const e of localEnums) {
      if (!localEnumMap[e.enum_name]) localEnumMap[e.enum_name] = [];
      localEnumMap[e.enum_name].push(e.enum_value);
    }
    gaps.local_enums = localEnumMap;

    const localFnList = localFns.map((f: any) => `${f.func_name}(${f.args})`);
    gaps.local_functions_count = localFnList.length;

    const localTrigList = localTrigs.map((t: any) => `${t.event_object_table}.${t.trigger_name}.${t.event_manipulation}`);
    gaps.local_triggers_count = localTrigList.length;
    gaps.local_triggers = localTrigs.map((t: any) => ({
      table: t.event_object_table,
      trigger: t.trigger_name,
      event: t.event_manipulation,
      timing: t.action_timing,
      statement: t.action_statement,
    }));

    gaps.local_indexes_count = localIdx.length;
    gaps.local_views = localViews.map((v: any) => v.viewname);
    gaps.local_rls_policies_count = localRls.length;
    gaps.local_rls_policies = localRls.map((r: any) => ({
      table: r.tablename,
      policy: r.policyname,
      cmd: r.cmd,
      roles: r.roles,
    }));

    gaps.local_foreign_keys_count = localFks.length;
    gaps.local_unique_constraints_count = localUq.length;

    // RLS status
    const rlsDisabled = localRlsStatus.filter((r: any) => !r.rls_enabled).map((r: any) => r.table_name);
    gaps.tables_without_rls = rlsDisabled;

    // External tables from OpenAPI that exist in local
    const extTableNames = Object.keys(extDefs);
    const localTableNames = Object.keys(localColMap);
    gaps.extra_local_tables = localTableNames.filter(t => !extTableNames.includes(t));
    gaps.external_table_count = extTableNames.length;
    gaps.local_table_count = localTableNames.length;

    // Summary
    gaps.summary = {
      missing_tables: missingTables.length,
      missing_columns_total: Object.values(missingColumns).reduce((a, b) => a + b.length, 0),
      tables_without_rls: rlsDisabled.length,
      local_triggers: localTrigList.length,
      local_functions: localFnList.length,
      local_indexes: localIdx.length,
      local_views: localViews.length,
      local_rls_policies: localRls.length,
      local_fks: localFks.length,
      local_unique_constraints: localUq.length,
      external_tables_via_openapi: extTableNames.length,
      local_tables: localTableNames.length,
      note: 'External triggers/indexes/RLS/functions require PostgreSQL connection string for comparison. OpenAPI only provides table+column data.',
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
