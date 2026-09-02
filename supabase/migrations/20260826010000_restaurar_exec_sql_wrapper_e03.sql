-- E03: Restaurar public.exec_sql wrapper
-- Necessário para o worker MCP do destino (supabase-promofinance-mcp)
-- A wave1 moveu exec_sql para private.exec_sql; PostgREST só expõe public.
DO $$
BEGIN
  IF to_regprocedure('private.exec_sql(text)') IS NULL THEN
    RAISE NOTICE 'private.exec_sql(text) ausente; wrapper public.exec_sql não será criado nesta réplica.';
  ELSE
    EXECUTE $ddl$
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS jsonb
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = private, pg_catalog
      AS $function$ SELECT private.exec_sql(sql) $function$;
    $ddl$;

    REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
  END IF;
END
$$;

-- Verificação: has_function_privilege('authenticated','public.exec_sql(text)','EXECUTE') = false
