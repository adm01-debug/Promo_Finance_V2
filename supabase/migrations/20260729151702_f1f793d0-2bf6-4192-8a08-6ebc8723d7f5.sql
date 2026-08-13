CREATE OR REPLACE FUNCTION public.gate_27_secdef_sem_search_path()
RETURNS TABLE(funcao text, argumentos text, motivo text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.proname::text,
    pg_get_function_identity_arguments(p.oid)::text,
    CASE
      WHEN sp.cfg IS NULL THEN 'sem SET search_path'
      ELSE 'search_path inseguro: ' || sp.cfg
    END
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN LATERAL (
    SELECT c AS cfg
    FROM unnest(COALESCE(p.proconfig, '{}'::text[])) c
    WHERE c LIKE 'search_path=%'
    LIMIT 1
  ) sp ON true
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND p.prokind = 'f'
    AND (
      sp.cfg IS NULL
      OR sp.cfg ~* '(^|[=,[:space:]])"?\$user"?([,[:space:]]|$)'
    )
  ORDER BY 1;
$function$;

REVOKE ALL ON FUNCTION public.gate_27_secdef_sem_search_path() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gate_27_secdef_sem_search_path() TO service_role;