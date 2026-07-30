
-- 1) Tabela de alertas
CREATE TABLE IF NOT EXISTS public.slow_query_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queryid BIGINT NOT NULL,
  query_normalized TEXT NOT NULL,
  calls BIGINT NOT NULL DEFAULT 0,
  mean_exec_ms NUMERIC(12,3) NOT NULL DEFAULT 0,
  total_exec_ms NUMERIC(14,3) NOT NULL DEFAULT 0,
  max_exec_ms NUMERIC(12,3) NOT NULL DEFAULT 0,
  rows_returned BIGINT NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.slow_query_alerts TO authenticated;
GRANT ALL ON public.slow_query_alerts TO service_role;

ALTER TABLE public.slow_query_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem visualizar slow_query_alerts" ON public.slow_query_alerts;
CREATE POLICY "Admins podem visualizar slow_query_alerts"
ON public.slow_query_alerts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_slow_query_alerts_captured_at
  ON public.slow_query_alerts (captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_alerts_queryid_captured
  ON public.slow_query_alerts (queryid, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_alerts_severity
  ON public.slow_query_alerts (severity, captured_at DESC);

-- 2) Função de captura
CREATE OR REPLACE FUNCTION public.capture_slow_queries(threshold_ms NUMERIC DEFAULT 500)
RETURNS TABLE(captured INTEGER, deleted_old INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog','extensions'
AS $$
DECLARE
  v_captured INTEGER := 0;
  v_deleted INTEGER := 0;
  v_has_pgss BOOLEAN;
BEGIN
  -- Advisory lock para evitar execução concorrente
  IF NOT pg_try_advisory_xact_lock(hashtext('capture_slow_queries')) THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
    INTO v_has_pgss;

  IF NOT v_has_pgss THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  -- Retenção: 30 dias
  DELETE FROM public.slow_query_alerts
   WHERE captured_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Captura top 20 queries lentas acima do threshold
  WITH slow AS (
    SELECT
      s.queryid,
      LEFT(regexp_replace(s.query, '\s+', ' ', 'g'), 2000) AS query_normalized,
      s.calls,
      ROUND(s.mean_exec_time::numeric, 3) AS mean_exec_ms,
      ROUND(s.total_exec_time::numeric, 3) AS total_exec_ms,
      ROUND(s.max_exec_time::numeric, 3) AS max_exec_ms,
      s.rows AS rows_returned,
      CASE
        WHEN s.mean_exec_time >= 2000 THEN 'critical'
        WHEN s.mean_exec_time >= 1000 THEN 'warning'
        ELSE 'info'
      END AS severity
    FROM extensions.pg_stat_statements s
    WHERE s.mean_exec_time >= threshold_ms
      AND s.query !~* '^\s*(EXPLAIN|SET|SHOW|BEGIN|COMMIT|ROLLBACK|DEALLOCATE)'
      AND s.query !~* 'pg_stat_statements|capture_slow_queries'
    ORDER BY s.mean_exec_time DESC
    LIMIT 20
  ), ins AS (
    INSERT INTO public.slow_query_alerts (
      queryid, query_normalized, calls, mean_exec_ms,
      total_exec_ms, max_exec_ms, rows_returned, severity
    )
    SELECT queryid, query_normalized, calls, mean_exec_ms,
           total_exec_ms, max_exec_ms, rows_returned, severity
    FROM slow
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_captured FROM ins;

  -- Espelha em query_telemetry para dashboard unificado
  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  SELECT 'slow_query_capture',
         'pg_stat_statements',
         LEAST(mean_exec_ms::integer, 2147483647),
         severity,
         LEFT(query_normalized, 500),
         now()
  FROM public.slow_query_alerts
  WHERE captured_at > now() - INTERVAL '1 minute'
    AND severity IN ('warning','critical');

  RETURN QUERY SELECT v_captured, v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_slow_queries(NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_slow_queries(NUMERIC) TO service_role;

-- 3) Agendar via pg_cron (a cada 15 minutos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
      FROM cron.job WHERE jobname = 'capture-slow-queries';

    PERFORM cron.schedule(
      'capture-slow-queries',
      '*/15 * * * *',
      $cron$ SELECT public.capture_slow_queries(500); $cron$
    );
  END IF;
END $$;
