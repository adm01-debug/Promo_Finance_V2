CREATE OR REPLACE FUNCTION public.compare_pg_stat_baseline(p_label text DEFAULT 'post-hardening-initial'::text)
 RETURNS TABLE(queryid bigint, query text, baseline_calls bigint, current_calls bigint, calls_delta bigint, baseline_mean_ms double precision, current_mean_ms double precision, mean_delta_pct numeric, baseline_total_ms double precision, current_total_ms double precision)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  WITH base AS (
    SELECT DISTINCT ON (b.queryid)
      b.queryid, b.query, b.calls, b.mean_exec_time, b.total_exec_time
    FROM public.pg_stat_statements_baseline b
    WHERE b.label = p_label
    ORDER BY b.queryid, b.captured_at DESC
  ),
  curr AS (
    SELECT s.queryid, s.calls, s.mean_exec_time, s.total_exec_time, s.query
    FROM extensions.pg_stat_statements s
    WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  )
  SELECT
    COALESCE(base.queryid, curr.queryid) AS queryid,
    COALESCE(base.query, curr.query) AS query,
    COALESCE(base.calls, 0) AS baseline_calls,
    COALESCE(curr.calls, 0) AS current_calls,
    COALESCE(curr.calls, 0) - COALESCE(base.calls, 0) AS calls_delta,
    COALESCE(base.mean_exec_time, 0) AS baseline_mean_ms,
    COALESCE(curr.mean_exec_time, 0) AS current_mean_ms,
    CASE
      WHEN COALESCE(base.mean_exec_time, 0) > 0
        THEN ROUND(((COALESCE(curr.mean_exec_time, 0) - base.mean_exec_time) / base.mean_exec_time * 100)::NUMERIC, 2)
      ELSE NULL
    END AS mean_delta_pct,
    COALESCE(base.total_exec_time, 0) AS baseline_total_ms,
    COALESCE(curr.total_exec_time, 0) AS current_total_ms
  FROM base
  FULL OUTER JOIN curr ON curr.queryid = base.queryid
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY COALESCE(curr.total_exec_time, 0) DESC
  LIMIT 200;
$function$
