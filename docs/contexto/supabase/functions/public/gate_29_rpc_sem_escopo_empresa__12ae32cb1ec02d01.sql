CREATE OR REPLACE FUNCTION public.gate_29_rpc_sem_escopo_empresa()
 RETURNS TABLE(funcao text, tabelas text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH tenant_tabs AS (
    SELECT c.relname::text AS relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'empresa_id' AND a.attnum > 0
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  ), secdef AS (
    SELECT p.oid, p.proname::text AS fn, p.prosrc
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )
  SELECT s.fn, string_agg(DISTINCT t.relname, ',')
  FROM secdef s
  JOIN tenant_tabs t ON s.prosrc ~ ('\mpublic\.' || t.relname || '\M')
  WHERE s.prosrc !~* '(empresa_acessivel|empresa_membro_ativo|empresa_id\s*=|empresa_padrao_id)'
    AND s.fn NOT IN ('resolve_sso_providers_for_domain')
  GROUP BY s.fn;
$function$
