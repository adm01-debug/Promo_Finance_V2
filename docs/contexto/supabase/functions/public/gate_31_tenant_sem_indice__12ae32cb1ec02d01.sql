CREATE OR REPLACE FUNCTION public.gate_31_tenant_sem_indice()
 RETURNS TABLE(tabela text, motivo text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.relname::text,
         'tabela com RLS por empresa_id sem índice liderado por empresa_id: policies forçam seq scan por tenant'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'empresa_id' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.oid AND i.indkey[0] = a.attnum
    )
  ORDER BY 1;
$function$
