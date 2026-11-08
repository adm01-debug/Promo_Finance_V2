CREATE OR REPLACE FUNCTION public.snapshot_table_bloat()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$ DECLARE
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
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

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
$function$
