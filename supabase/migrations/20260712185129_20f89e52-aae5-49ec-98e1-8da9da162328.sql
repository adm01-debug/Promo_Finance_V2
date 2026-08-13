
-- 1) Baseline table
CREATE TABLE IF NOT EXISTS public.pg_stat_statements_baseline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  queryid BIGINT,
  query TEXT,
  calls BIGINT,
  total_exec_time DOUBLE PRECISION,
  mean_exec_time DOUBLE PRECISION,
  max_exec_time DOUBLE PRECISION,
  rows BIGINT,
  shared_blks_hit BIGINT,
  shared_blks_read BIGINT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pgss_baseline_label ON public.pg_stat_statements_baseline(label);
CREATE INDEX IF NOT EXISTS idx_pgss_baseline_captured_at ON public.pg_stat_statements_baseline(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_pgss_baseline_queryid ON public.pg_stat_statements_baseline(queryid);

GRANT SELECT ON public.pg_stat_statements_baseline TO authenticated;
GRANT ALL ON public.pg_stat_statements_baseline TO service_role;

ALTER TABLE public.pg_stat_statements_baseline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view baselines" ON public.pg_stat_statements_baseline;
CREATE POLICY "Admins can view baselines"
  ON public.pg_stat_statements_baseline
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Capture function
CREATE OR REPLACE FUNCTION public.capture_pg_stat_statements_baseline(p_label TEXT)
RETURNS TABLE(captured_rows BIGINT, label TEXT, captured_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_captured_at TIMESTAMPTZ := now();
  v_count BIGINT;
BEGIN
  INSERT INTO public.pg_stat_statements_baseline (
    label, queryid, query, calls, total_exec_time, mean_exec_time,
    max_exec_time, rows, shared_blks_hit, shared_blks_read, captured_at
  )
  SELECT
    p_label,
    s.queryid,
    LEFT(s.query, 2000),
    s.calls,
    s.total_exec_time,
    s.mean_exec_time,
    s.max_exec_time,
    s.rows,
    s.shared_blks_hit,
    s.shared_blks_read,
    v_captured_at
  FROM extensions.pg_stat_statements s
  WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
    AND s.query NOT ILIKE '%pg_stat_statements%';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count, p_label, v_captured_at;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_pg_stat_statements_baseline(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_pg_stat_statements_baseline(TEXT) TO service_role;

-- 3) Comparison function
CREATE OR REPLACE FUNCTION public.compare_pg_stat_baseline(p_label TEXT DEFAULT 'post-hardening-initial')
RETURNS TABLE(
  queryid BIGINT,
  query TEXT,
  baseline_calls BIGINT,
  current_calls BIGINT,
  calls_delta BIGINT,
  baseline_mean_ms DOUBLE PRECISION,
  current_mean_ms DOUBLE PRECISION,
  mean_delta_pct NUMERIC,
  baseline_total_ms DOUBLE PRECISION,
  current_total_ms DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.compare_pg_stat_baseline(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compare_pg_stat_baseline(TEXT) TO authenticated;

-- 4) Capture initial baseline THEN reset
SELECT public.capture_pg_stat_statements_baseline('post-hardening-initial');

SELECT extensions.pg_stat_statements_reset();
