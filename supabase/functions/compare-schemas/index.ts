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
    const extDbUrl = Deno.env.get('EXTERNAL_DB_URL');
    if (!localDbUrl) throw new Error('SUPABASE_DB_URL not set');
    if (!extDbUrl) throw new Error('EXTERNAL_DB_URL not set');

    const local = postgres(localDbUrl, { max: 2 });
    const ext = postgres(extDbUrl, { max: 2 });

    const gaps: Record<string, unknown> = {};

    // 1. TABLES & COLUMNS
    const colQuery = `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position`;
    const [localCols, extCols] = await Promise.all([local.unsafe(colQuery), ext.unsafe(colQuery)]);

    const localColMap: Record<string, Set<string>> = {};
    const extColMap: Record<string, Record<string, any>> = {};
    for (const c of localCols) {
      if (!localColMap[c.table_name]) localColMap[c.table_name] = new Set();
      localColMap[c.table_name].add(c.column_name);
    }
    for (const c of extCols) {
      if (!extColMap[c.table_name]) extColMap[c.table_name] = {};
      extColMap[c.table_name][c.column_name] = c;
    }

    const missingTables: string[] = [];
    const missingColumns: Record<string, string[]> = {};
    for (const [tbl, cols] of Object.entries(extColMap)) {
      if (!localColMap[tbl]) {
        missingTables.push(tbl);
        continue;
      }
      for (const col of Object.keys(cols)) {
        if (!localColMap[tbl].has(col)) {
          if (!missingColumns[tbl]) missingColumns[tbl] = [];
          missingColumns[tbl].push(col);
        }
      }
    }
    gaps.missing_tables = missingTables;
    gaps.missing_columns = missingColumns;
    gaps.missing_columns_total = Object.values(missingColumns).reduce((a, b) => a + b.length, 0);

    // 2. ENUMS
    const enumQuery = `
      SELECT t.typname AS enum_name, e.enumlabel AS enum_value
      FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder`;
    const [localEnums, extEnums] = await Promise.all([local.unsafe(enumQuery), ext.unsafe(enumQuery)]);

    const localEnumMap: Record<string, Set<string>> = {};
    const extEnumMap: Record<string, Set<string>> = {};
    for (const e of localEnums) {
      if (!localEnumMap[e.enum_name]) localEnumMap[e.enum_name] = new Set();
      localEnumMap[e.enum_name].add(e.enum_value);
    }
    for (const e of extEnums) {
      if (!extEnumMap[e.enum_name]) extEnumMap[e.enum_name] = new Set();
      extEnumMap[e.enum_name].add(e.enum_value);
    }

    const missingEnums: string[] = [];
    const missingEnumValues: Record<string, string[]> = {};
    for (const [name, vals] of Object.entries(extEnumMap)) {
      if (!localEnumMap[name]) { missingEnums.push(name); continue; }
      const missing = [...vals].filter(v => !localEnumMap[name].has(v));
      if (missing.length) missingEnumValues[name] = missing;
    }
    gaps.missing_enums = missingEnums;
    gaps.missing_enum_values = missingEnumValues;

    // 3. FUNCTIONS/RPCs
    const fnQuery = `
      SELECT p.proname AS func_name,
             pg_get_function_identity_arguments(p.oid) AS args,
             pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY p.proname`;
    const [localFns, extFns] = await Promise.all([local.unsafe(fnQuery), ext.unsafe(fnQuery)]);

    const localFnSet = new Set(localFns.map((f: any) => `${f.func_name}(${f.args})`));
    const missingFunctions: string[] = [];
    const diffFunctions: string[] = [];

    for (const ef of extFns) {
      const sig = `${ef.func_name}(${ef.args})`;
      if (!localFnSet.has(sig)) {
        missingFunctions.push(sig);
      } else {
        const lf = localFns.find((l: any) => `${l.func_name}(${l.args})` === sig);
        if (lf && lf.definition?.trim() !== ef.definition?.trim()) {
          diffFunctions.push(sig);
        }
      }
    }
    gaps.missing_functions = missingFunctions;
    gaps.different_functions = diffFunctions;

    // 4. TRIGGERS
    const trigQuery = `
      SELECT trigger_name, event_manipulation, event_object_table,
             action_statement, action_timing, action_orientation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name`;
    const [localTrigs, extTrigs] = await Promise.all([local.unsafe(trigQuery), ext.unsafe(trigQuery)]);

    const localTrigSet = new Set(localTrigs.map((t: any) => `${t.event_object_table}.${t.trigger_name}.${t.event_manipulation}`));
    const missingTriggers: any[] = [];
    for (const t of extTrigs) {
      const key = `${t.event_object_table}.${t.trigger_name}.${t.event_manipulation}`;
      if (!localTrigSet.has(key)) {
        missingTriggers.push({
          table: t.event_object_table,
          trigger: t.trigger_name,
          event: t.event_manipulation,
          timing: t.action_timing,
          statement: t.action_statement,
        });
      }
    }
    gaps.missing_triggers = missingTriggers;

    // 5. INDEXES
    const idxQuery = `
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname`;
    const [localIdx, extIdx] = await Promise.all([local.unsafe(idxQuery), ext.unsafe(idxQuery)]);

    const localIdxSet = new Set(localIdx.map((i: any) => i.indexname));
    const missingIndexes: any[] = [];
    for (const i of extIdx) {
      if (!localIdxSet.has(i.indexname)) {
        missingIndexes.push({ name: i.indexname, table: i.tablename, def: i.indexdef });
      }
    }
    gaps.missing_indexes = missingIndexes;

    // 6. VIEWS
    const viewQuery = `
      SELECT viewname, definition
      FROM pg_views
      WHERE schemaname = 'public'
      ORDER BY viewname`;
    const [localViews, extViews] = await Promise.all([local.unsafe(viewQuery), ext.unsafe(viewQuery)]);

    const localViewSet = new Set(localViews.map((v: any) => v.viewname));
    const missingViews: string[] = [];
    const diffViews: string[] = [];
    for (const v of extViews) {
      if (!localViewSet.has(v.viewname)) {
        missingViews.push(v.viewname);
      } else {
        const lv = localViews.find((l: any) => l.viewname === v.viewname);
        if (lv && lv.definition?.trim() !== v.definition?.trim()) {
          diffViews.push(v.viewname);
        }
      }
    }
    gaps.missing_views = missingViews;
    gaps.different_views = diffViews;

    // 7. RLS POLICIES
    const rlsQuery = `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname`;
    const [localRls, extRls] = await Promise.all([local.unsafe(rlsQuery), ext.unsafe(rlsQuery)]);

    const localRlsSet = new Set(localRls.map((r: any) => `${r.tablename}::${r.policyname}`));
    const missingPolicies: any[] = [];
    for (const r of extRls) {
      const key = `${r.tablename}::${r.policyname}`;
      if (!localRlsSet.has(key)) {
        missingPolicies.push({
          table: r.tablename,
          policy: r.policyname,
          cmd: r.cmd,
          roles: r.roles,
          qual: r.qual,
          with_check: r.with_check,
        });
      }
    }
    gaps.missing_rls_policies = missingPolicies;

    // 8. FOREIGN KEYS
    const fkQuery = `
      SELECT tc.constraint_name, tc.table_name, kcu.column_name,
             ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name`;
    const [localFks, extFks] = await Promise.all([local.unsafe(fkQuery), ext.unsafe(fkQuery)]);

    const localFkSet = new Set(localFks.map((f: any) => f.constraint_name));
    const missingFks: any[] = [];
    for (const f of extFks) {
      if (!localFkSet.has(f.constraint_name)) {
        missingFks.push({
          constraint: f.constraint_name,
          table: f.table_name,
          column: f.column_name,
          references: `${f.foreign_table}(${f.foreign_column})`,
        });
      }
    }
    gaps.missing_foreign_keys = missingFks;

    // 9. RLS ENABLED STATUS
    const rlsEnabledQuery = `
      SELECT relname AS table_name, relrowsecurity AS rls_enabled
      FROM pg_class
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE pg_namespace.nspname = 'public' AND relkind = 'r'
      ORDER BY relname`;
    const [localRlsStatus, extRlsStatus] = await Promise.all([local.unsafe(rlsEnabledQuery), ext.unsafe(rlsEnabledQuery)]);

    const localRlsMap: Record<string, boolean> = {};
    for (const r of localRlsStatus) localRlsMap[r.table_name] = r.rls_enabled;

    const rlsMismatches: any[] = [];
    for (const r of extRlsStatus) {
      if (localRlsMap[r.table_name] !== undefined && localRlsMap[r.table_name] !== r.rls_enabled) {
        rlsMismatches.push({ table: r.table_name, local: localRlsMap[r.table_name], external: r.rls_enabled });
      }
    }
    gaps.rls_status_mismatches = rlsMismatches;

    // 10. UNIQUE CONSTRAINTS
    const uqQuery = `
      SELECT tc.constraint_name, tc.table_name, string_agg(kcu.column_name, ', ') AS columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
      GROUP BY tc.constraint_name, tc.table_name
      ORDER BY tc.table_name`;
    const [localUq, extUq] = await Promise.all([local.unsafe(uqQuery), ext.unsafe(uqQuery)]);

    const localUqSet = new Set(localUq.map((u: any) => u.constraint_name));
    const missingUniqueConstraints: any[] = [];
    for (const u of extUq) {
      if (!localUqSet.has(u.constraint_name)) {
        missingUniqueConstraints.push({ constraint: u.constraint_name, table: u.table_name, columns: u.columns });
      }
    }
    gaps.missing_unique_constraints = missingUniqueConstraints;

    // SUMMARY
    gaps.summary = {
      missing_tables: missingTables.length,
      missing_columns: Object.values(missingColumns).reduce((a, b) => a + b.length, 0),
      missing_enums: missingEnums.length,
      missing_enum_values: Object.values(missingEnumValues).reduce((a, b) => a + b.length, 0),
      missing_functions: missingFunctions.length,
      different_functions: diffFunctions.length,
      missing_triggers: missingTriggers.length,
      missing_indexes: missingIndexes.length,
      missing_views: missingViews.length,
      different_views: diffViews.length,
      missing_rls_policies: missingPolicies.length,
      missing_foreign_keys: missingFks.length,
      rls_status_mismatches: rlsMismatches.length,
      missing_unique_constraints: missingUniqueConstraints.length,
    };

    await Promise.all([local.end(), ext.end()]);

    return new Response(JSON.stringify(gaps, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message, stack: (error as Error).stack }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
