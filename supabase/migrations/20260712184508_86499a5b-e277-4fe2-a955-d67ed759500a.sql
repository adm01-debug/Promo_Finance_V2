
-- 1) Tabela de snapshots diários
CREATE TABLE IF NOT EXISTS public.bloat_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  table_name TEXT NOT NULL,
  live_rows BIGINT NOT NULL DEFAULT 0,
  dead_rows BIGINT NOT NULL DEFAULT 0,
  dead_ratio_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  total_size_pretty TEXT,
  last_autovacuum TIMESTAMPTZ,
  last_vacuum TIMESTAMPTZ,
  autovacuum_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date, table_name)
);

GRANT SELECT ON public.bloat_snapshots TO authenticated;
GRANT ALL ON public.bloat_snapshots TO service_role;

ALTER TABLE public.bloat_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem consultar snapshots de bloat"
  ON public.bloat_snapshots FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_bloat_snapshots_date_table
  ON public.bloat_snapshots (snapshot_date DESC, table_name);
CREATE INDEX IF NOT EXISTS idx_bloat_snapshots_table_date
  ON public.bloat_snapshots (table_name, snapshot_date DESC);

ALTER TABLE public.bloat_snapshots SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 1000,
  autovacuum_analyze_threshold = 500
);

-- 2) Função de snapshot (idempotente por dia via UPSERT)
CREATE OR REPLACE FUNCTION public.snapshot_table_bloat()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_deleted INTEGER := 0;
  v_alertas INTEGER := 0;
  v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
  -- Advisory lock: evita execução concorrente
  IF NOT pg_try_advisory_xact_lock(hashtext('snapshot_table_bloat')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  -- UPSERT do snapshot do dia
  WITH ins AS (
    INSERT INTO public.bloat_snapshots (
      snapshot_date, table_name, live_rows, dead_rows, dead_ratio_pct,
      total_size_bytes, total_size_pretty,
      last_autovacuum, last_vacuum, autovacuum_count
    )
    SELECT
      CURRENT_DATE,
      v.table_name::text,
      v.live_rows,
      v.dead_rows,
      v.dead_ratio_pct,
      v.total_size_bytes,
      v.total_size_pretty,
      v.last_autovacuum,
      v.last_vacuum,
      v.autovacuum_count
    FROM public.v_table_bloat v
    ON CONFLICT (snapshot_date, table_name) DO UPDATE SET
      live_rows = EXCLUDED.live_rows,
      dead_rows = EXCLUDED.dead_rows,
      dead_ratio_pct = EXCLUDED.dead_ratio_pct,
      total_size_bytes = EXCLUDED.total_size_bytes,
      total_size_pretty = EXCLUDED.total_size_pretty,
      last_autovacuum = EXCLUDED.last_autovacuum,
      last_vacuum = EXCLUDED.last_vacuum,
      autovacuum_count = EXCLUDED.autovacuum_count
    RETURNING (xmax = 0) AS was_insert
  )
  SELECT
    COUNT(*) FILTER (WHERE was_insert),
    COUNT(*) FILTER (WHERE NOT was_insert)
  INTO v_inserted, v_updated
  FROM ins;

  -- Executa também o monitor de alertas
  BEGIN
    PERFORM public.monitor_table_bloat();
    SELECT COUNT(*) INTO v_alertas
      FROM public.query_telemetry
     WHERE operation = 'bloat_monitor'
       AND created_at > v_start;
  EXCEPTION WHEN OTHERS THEN
    -- Nunca falhar o snapshot por causa do monitor
    NULL;
  END;

  -- Retenção: 90 dias de snapshots
  DELETE FROM public.bloat_snapshots
   WHERE snapshot_date < CURRENT_DATE - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Log em cron_job_logs
  INSERT INTO public.cron_job_logs (
    job_name, executed_at, completed_at, duration_ms, success, result
  ) VALUES (
    'snapshot-table-bloat-daily',
    v_start,
    now(),
    EXTRACT(MILLISECONDS FROM (now() - v_start))::integer,
    true,
    jsonb_build_object(
      'inserted', v_inserted,
      'updated', v_updated,
      'deleted_old', v_deleted,
      'alertas_gerados', v_alertas
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'inserted', v_inserted,
    'updated', v_updated,
    'deleted_old', v_deleted,
    'alertas_gerados', v_alertas,
    'duration_ms', EXTRACT(MILLISECONDS FROM (now() - v_start))::integer
  );
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_table_bloat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_table_bloat() TO service_role;

-- 3) RPC admin para leitura do histórico completo
CREATE OR REPLACE FUNCTION public.get_bloat_snapshots(
  p_days integer DEFAULT 30,
  p_table_name text DEFAULT NULL
)
RETURNS TABLE (
  snapshot_date date,
  table_name text,
  live_rows bigint,
  dead_rows bigint,
  dead_ratio_pct numeric,
  total_size_bytes bigint,
  total_size_pretty text,
  last_autovacuum timestamptz,
  autovacuum_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar snapshots de bloat.';
  END IF;

  RETURN QUERY
  SELECT s.snapshot_date, s.table_name, s.live_rows, s.dead_rows, s.dead_ratio_pct,
         s.total_size_bytes, s.total_size_pretty, s.last_autovacuum, s.autovacuum_count
  FROM public.bloat_snapshots s
  WHERE s.snapshot_date > CURRENT_DATE - make_interval(days => GREATEST(p_days, 1))
    AND (p_table_name IS NULL OR s.table_name = p_table_name)
  ORDER BY s.snapshot_date DESC, s.dead_ratio_pct DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bloat_snapshots(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bloat_snapshots(integer, text) TO authenticated;
