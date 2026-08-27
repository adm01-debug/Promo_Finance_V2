import { corsHeadersComSegredo, exigirPapel } from '../_shared/auth-guard.ts';

/** Auditoria administrativa: exige admin e obtém toda credencial do ambiente. */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersComSegredo });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { ...corsHeadersComSegredo, 'Content-Type': 'application/json' } });

  const auth = await exigirPapel(req, ['admin']);
  if (!auth.ok) return auth.resposta;

  const localDbUrl = Deno.env.get('SUPABASE_DB_URL');
  const externalUrl = Deno.env.get('SCHEMA_COMPARE_EXTERNAL_URL')?.replace(/\/$/, '');
  const externalKey = Deno.env.get('SCHEMA_COMPARE_EXTERNAL_SERVICE_ROLE_KEY');
  if (!localDbUrl || !externalUrl || !externalKey) {
    return new Response(JSON.stringify({ error: 'comparacao_externa_nao_configurada' }), { status: 503, headers: { ...corsHeadersComSegredo, 'Content-Type': 'application/json' } });
  }

  try {
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js');
    const local = postgres(localDbUrl, { max: 2 });
    const [columns, enums, functions, triggers, indexes, views, policies, foreignKeys, rls] = await Promise.all([
      local`SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`,
      local`SELECT t.typname AS enum_name, e.enumlabel AS enum_value FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname, e.enumsortorder`,
      local`SELECT p.proname AS func_name, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY p.proname`,
      local`SELECT trigger_name, event_manipulation, event_object_table, action_timing FROM information_schema.triggers WHERE trigger_schema='public' ORDER BY event_object_table, trigger_name`,
      local`SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname`,
      local`SELECT viewname FROM pg_views WHERE schemaname='public' ORDER BY viewname`,
      local`SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname`,
      local`SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name AND tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' ORDER BY tc.table_name`,
      local`SELECT relname AS table_name, relrowsecurity AS rls_enabled FROM pg_class JOIN pg_namespace ON pg_namespace.oid=pg_class.relnamespace WHERE pg_namespace.nspname='public' AND relkind='r' ORDER BY relname`,
    ]);
    await local.end();

    const response = await fetch(`${externalUrl}/rest/v1/`, { headers: { apikey: externalKey, Authorization: `Bearer ${externalKey}` } });
    if (!response.ok) throw new Error(`OpenAPI externo indisponível (${response.status})`);
    const openApi = await response.json() as { definitions?: Record<string, { properties?: Record<string, unknown> }> };
    const definitions = openApi.definitions ?? {};
    const localMap = new Map<string, Set<string>>();
    for (const column of columns) {
      const table = String(column.table_name);
      const set = localMap.get(table) ?? new Set<string>();
      set.add(String(column.column_name));
      localMap.set(table, set);
    }

    const missingTables: string[] = [];
    const missingColumns: Record<string, string[]> = {};
    for (const [table, definition] of Object.entries(definitions)) {
      const localColumns = localMap.get(table);
      if (!localColumns) { missingTables.push(table); continue; }
      const missing = Object.keys(definition.properties ?? {}).filter((column) => !localColumns.has(column));
      if (missing.length) missingColumns[table] = missing;
    }

    return new Response(JSON.stringify({
      missing_tables: missingTables,
      missing_columns: missingColumns,
      extra_local_tables: [...localMap.keys()].filter((table) => !(table in definitions)),
      local_enums: enums, local_functions: functions, local_triggers: triggers,
      local_indexes: indexes, local_views: views, local_policies: policies,
      local_foreign_keys: foreignKeys,
      tables_without_rls: (rls as Array<{ table_name: string; rls_enabled: boolean }>).filter((row) => !row.rls_enabled).map((row) => row.table_name),
      summary: { external_tables: Object.keys(definitions).length, local_tables: localMap.size, missing_tables: missingTables.length, missing_columns: Object.values(missingColumns).reduce((total, entries) => total + entries.length, 0) },
    }), { headers: { ...corsHeadersComSegredo, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[compare-schemas] falha na comparação', error);
    return new Response(JSON.stringify({ error: 'falha_na_comparacao' }), { status: 500, headers: { ...corsHeadersComSegredo, 'Content-Type': 'application/json' } });
  }
});
