CREATE OR REPLACE FUNCTION public.gate_30_views_inseguras()
RETURNS TABLE(objeto text, tipo text, motivo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.relname::text,
         CASE c.relkind WHEN 'v' THEN 'view' ELSE 'matview' END,
         CASE
           WHEN c.relkind = 'v'
                AND NOT EXISTS (
                  SELECT 1 FROM unnest(coalesce(c.reloptions, '{}'::text[])) o
                  WHERE lower(o) IN ('security_invoker=on','security_invoker=true')
                )
             THEN 'view sem security_invoker: consulta roda com privilégios do owner e ignora RLS'
           WHEN c.relkind = 'm'
                AND (has_table_privilege('anon', c.oid, 'SELECT')
                  OR has_table_privilege('authenticated', c.oid, 'SELECT'))
             THEN 'matview exposta a roles do app: RLS não se aplica a visões materializadas'
         END
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v','m')
    AND (
      (c.relkind = 'v' AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(c.reloptions, '{}'::text[])) o
        WHERE lower(o) IN ('security_invoker=on','security_invoker=true')
      ))
      OR (c.relkind = 'm' AND (has_table_privilege('anon', c.oid, 'SELECT')
                            OR has_table_privilege('authenticated', c.oid, 'SELECT')))
    );
$$;

REVOKE ALL ON FUNCTION public.gate_30_views_inseguras() FROM PUBLIC, anon, authenticated;