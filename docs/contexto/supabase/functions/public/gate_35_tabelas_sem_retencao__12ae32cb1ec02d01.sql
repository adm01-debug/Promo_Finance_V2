CREATE OR REPLACE FUNCTION public.gate_35_tabelas_sem_retencao()
 RETURNS TABLE(tabela text, coluna_temporal text, tamanho text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT ('public.' || c.relname)::text,
         (SELECT a.attname::text
            FROM pg_attribute a
            JOIN pg_type t ON t.oid = a.atttypid
           WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
             AND t.typname IN ('timestamptz','timestamp','date')
           ORDER BY (a.attname IN ('created_at','executed_at','dia')) DESC, a.attnum
           LIMIT 1),
         pg_size_pretty(pg_total_relation_size(c.oid))
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND NOT c.relispartition
     AND c.relname !~ '_(default|[0-9]{4}_[0-9]{2})$'
     AND c.relname ~ '(_log|_logs|logs_|_history|historico_|_snapshots|_events|_eventos|_attempts|_trail|auditoria_|_audit|telemetr|_cache|_runs|_queue)'
     AND EXISTS (
       SELECT 1 FROM pg_attribute a
        JOIN pg_type t ON t.oid = a.atttypid
       WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
         AND t.typname IN ('timestamptz','timestamp','date')
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.retencao_politicas p
        WHERE p.tabela = 'public.' || c.relname
     )
   ORDER BY pg_total_relation_size(c.oid) DESC;
$function$
