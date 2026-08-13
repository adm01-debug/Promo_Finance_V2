CREATE OR REPLACE FUNCTION public.get_retention_history(p_days integer DEFAULT 30)
RETURNS TABLE (
  executed_at        timestamptz,
  completed_at       timestamptz,
  duration_ms        integer,
  success            boolean,
  skipped            boolean,
  error_message      text,
  total_deleted      bigint,
  partitions_dropped integer,
  per_table          jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer perfil admin'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH runs AS (
    SELECT l.executed_at, l.completed_at, l.duration_ms, l.success,
           l.error_message, COALESCE(l.result, '{}'::jsonb) AS result
      FROM public.cron_job_logs l
     WHERE l.job_name = 'daily-log-retention'
       AND l.executed_at >= now() - make_interval(days => v_days)
  ),
  expandido AS (
    SELECT r.*,
           COALESCE((
             SELECT jsonb_object_agg(kv.key, kv.value)
               FROM jsonb_each(r.result) AS kv
              WHERE jsonb_typeof(kv.value) = 'number'
                AND kv.key NOT IN ('duration_ms')
           ), '{}'::jsonb) AS tabelas
      FROM runs r
  )
  SELECT
    e.executed_at,
    e.completed_at,
    e.duration_ms,
    COALESCE(e.success, false),
    COALESCE((e.result->>'skipped')::boolean, false),
    e.error_message,
    COALESCE((
      SELECT sum((kv.value)::text::bigint) FROM jsonb_each(e.tabelas) kv
    ), 0)::bigint,
    (
      COALESCE((e.result#>>'{partitions,audit_logs_dropped,dropped_count}')::int, 0)
      + COALESCE((e.result#>>'{partitions,frontend_error_logs_dropped,dropped_count}')::int, 0)
    ),
    e.tabelas
  FROM expandido e
  ORDER BY e.executed_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_retention_history(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_retention_history(integer) TO authenticated;