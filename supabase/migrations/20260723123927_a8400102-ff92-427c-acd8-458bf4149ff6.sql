
-- 1) Metrics table
CREATE TABLE IF NOT EXISTS public.rpc_observability_metrics (
  id BIGSERIAL PRIMARY KEY,
  function_name TEXT NOT NULL,
  caller_user_id UUID,
  caller_role TEXT,
  duration_ms NUMERIC NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_sqlstate TEXT,
  error_message TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  called_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rpc_obs_metrics_fn_time
  ON public.rpc_observability_metrics (function_name, called_at DESC);
CREATE INDEX IF NOT EXISTS idx_rpc_obs_metrics_time
  ON public.rpc_observability_metrics (called_at DESC);
CREATE INDEX IF NOT EXISTS idx_rpc_obs_metrics_slow
  ON public.rpc_observability_metrics (duration_ms DESC) WHERE success;

GRANT SELECT ON public.rpc_observability_metrics TO authenticated;
GRANT ALL ON public.rpc_observability_metrics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rpc_observability_metrics_id_seq TO service_role;

ALTER TABLE public.rpc_observability_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_rpc_metrics" ON public.rpc_observability_metrics;
CREATE POLICY "admin_read_rpc_metrics"
  ON public.rpc_observability_metrics
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Logger
CREATE OR REPLACE FUNCTION public.log_rpc_observability_call(
  _function_name TEXT,
  _duration_ms NUMERIC,
  _success BOOLEAN,
  _error_sqlstate TEXT DEFAULT NULL,
  _error_message TEXT DEFAULT NULL,
  _meta JSONB DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _role TEXT := current_setting('request.jwt.claim.role', true);
BEGIN
  INSERT INTO public.rpc_observability_metrics(
    function_name, caller_user_id, caller_role,
    duration_ms, success, error_sqlstate, error_message, meta
  ) VALUES (
    _function_name, _uid, COALESCE(_role, current_user::text),
    _duration_ms, _success, _error_sqlstate, _error_message, COALESCE(_meta,'{}'::jsonb)
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_rpc_observability_call(TEXT,NUMERIC,BOOLEAN,TEXT,TEXT,JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_rpc_observability_call(TEXT,NUMERIC,BOOLEAN,TEXT,TEXT,JSONB) TO authenticated, service_role;

-- 3) Aggregation views
DROP VIEW IF EXISTS public.vw_rpc_hotspots;
CREATE VIEW public.vw_rpc_hotspots
WITH (security_invoker = true) AS
SELECT
  function_name,
  date_trunc('hour', called_at) AS bucket_hour,
  count(*)                       AS calls,
  count(*) FILTER (WHERE NOT success) AS errors,
  round(avg(duration_ms)::numeric, 2) AS avg_ms,
  round((percentile_cont(0.5)  WITHIN GROUP (ORDER BY duration_ms))::numeric, 2) AS p50_ms,
  round((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 2) AS p95_ms,
  round((percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms))::numeric, 2) AS p99_ms,
  max(duration_ms) AS max_ms
FROM public.rpc_observability_metrics
WHERE called_at >= now() - interval '7 days'
GROUP BY function_name, date_trunc('hour', called_at);

GRANT SELECT ON public.vw_rpc_hotspots TO authenticated;

DROP VIEW IF EXISTS public.vw_rpc_slow_calls;
CREATE VIEW public.vw_rpc_slow_calls
WITH (security_invoker = true) AS
SELECT id, function_name, caller_user_id, caller_role,
       duration_ms, success, error_sqlstate, error_message, meta, called_at
FROM public.rpc_observability_metrics
WHERE called_at >= now() - interval '24 hours'
ORDER BY duration_ms DESC
LIMIT 200;

GRANT SELECT ON public.vw_rpc_slow_calls TO authenticated;

-- 4) Generic wrapper helper (non-invasive; does not change existing function signatures)
CREATE OR REPLACE FUNCTION public.run_observability_rpc(_function_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t0 TIMESTAMPTZ := clock_timestamp();
  _dur NUMERIC;
  _allowed TEXT[] := ARRAY[
    'monitor_table_bloat',
    'snapshot_table_bloat',
    'refresh_performance_alerts_weekly',
    'sefaz_run_observability_checks',
    'capture_pg_stat_statements_baseline',
    'capture_slow_queries'
  ];
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT (_function_name = ANY(_allowed)) THEN
    RAISE EXCEPTION 'function % not allowed', _function_name;
  END IF;

  EXECUTE format('SELECT public.%I()', _function_name);

  _dur := EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000;
  PERFORM public.log_rpc_observability_call(
    _function_name, _dur, true, NULL, NULL, jsonb_build_object('via','run_observability_rpc'));
EXCEPTION WHEN OTHERS THEN
  _dur := EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000;
  PERFORM public.log_rpc_observability_call(
    _function_name, _dur, false, SQLSTATE, SQLERRM, jsonb_build_object('via','run_observability_rpc'));
  RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_observability_rpc(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.run_observability_rpc(TEXT) TO authenticated, service_role;

-- 5) Retention cleanup
CREATE OR REPLACE FUNCTION public.cleanup_rpc_observability_metrics()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _deleted INTEGER;
BEGIN
  DELETE FROM public.rpc_observability_metrics
   WHERE called_at < now() - interval '30 days';
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cleanup_rpc_observability_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_rpc_observability_metrics() TO service_role;

-- 6) Schedule daily cleanup and reroute existing cron jobs through the logged wrapper
DO $cron$
DECLARE
  _r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    -- daily cleanup
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname='cleanup-rpc-obs-metrics-daily';
    PERFORM cron.schedule(
      'cleanup-rpc-obs-metrics-daily',
      '17 3 * * *',
      'SELECT public.cleanup_rpc_observability_metrics();'
    );

    -- reroute known observability cron jobs to use run_observability_rpc for automatic timing
    FOR _r IN
      SELECT jobid, jobname, schedule, command FROM cron.job
      WHERE command ~* '(monitor_table_bloat|snapshot_table_bloat|refresh_performance_alerts_weekly|sefaz_run_observability_checks|capture_pg_stat_statements_baseline|capture_slow_queries)\s*\('
        AND command !~* 'run_observability_rpc'
    LOOP
      -- best-effort: replace the direct call with the wrapper for the first match
      DECLARE
        _new_cmd TEXT := _r.command;
        _fn TEXT;
      BEGIN
        FOREACH _fn IN ARRAY ARRAY[
          'monitor_table_bloat','snapshot_table_bloat','refresh_performance_alerts_weekly',
          'sefaz_run_observability_checks','capture_pg_stat_statements_baseline','capture_slow_queries'
        ] LOOP
          IF _new_cmd ~* ('public\.' || _fn || '\s*\(\s*\)') OR _new_cmd ~* ('(^|\s|;)' || _fn || '\s*\(\s*\)') THEN
            _new_cmd := regexp_replace(
              _new_cmd,
              '(public\.)?' || _fn || '\s*\(\s*\)',
              'public.run_observability_rpc(''' || _fn || ''')',
              'gi'
            );
          END IF;
        END LOOP;

        IF _new_cmd <> _r.command THEN
          PERFORM cron.unschedule(_r.jobid);
          PERFORM cron.schedule(_r.jobname, _r.schedule, _new_cmd);
        END IF;
      END;
    END LOOP;
  END IF;
END
$cron$;
