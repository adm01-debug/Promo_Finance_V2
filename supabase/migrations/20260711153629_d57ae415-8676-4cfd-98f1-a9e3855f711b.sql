
CREATE OR REPLACE FUNCTION public.cleanup_log_tables()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $$
DECLARE
  v_start TIMESTAMPTZ := now();
  v_result JSONB := '{}'::jsonb;
  v_count BIGINT;
  v_log_id UUID;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('cleanup_log_tables')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  INSERT INTO public.cron_job_logs (job_name, executed_at)
  VALUES ('daily-log-retention', v_start)
  RETURNING id INTO v_log_id;

  DELETE FROM public.audit_logs WHERE created_at < now() - INTERVAL '180 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('audit_logs', v_count);

  DELETE FROM public.auth_logs WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('auth_logs', v_count);

  DELETE FROM public.frontend_error_logs WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('frontend_error_logs', v_count);

  DELETE FROM public.frontend_performance_logs WHERE created_at < now() - INTERVAL '14 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('frontend_performance_logs', v_count);

  DELETE FROM public.runtime_error_logs WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('runtime_error_logs', v_count);

  DELETE FROM public.query_telemetry WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('query_telemetry', v_count);

  DELETE FROM public.rate_limit_logs WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('rate_limit_logs', v_count);

  DELETE FROM public.webhooks_log
    WHERE created_at < now() - INTERVAL '60 days'
      AND status NOT IN ('dead','retrying');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('webhooks_log', v_count);

  DELETE FROM public.sso_login_attempts WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('sso_login_attempts', v_count);

  DELETE FROM public.cron_job_logs WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('cron_job_logs', v_count);

  v_result := v_result || jsonb_build_object(
    'duration_ms', EXTRACT(MILLISECONDS FROM (now() - v_start))::integer,
    'success', true
  );

  UPDATE public.cron_job_logs
     SET completed_at = now(),
         duration_ms = (v_result->>'duration_ms')::integer,
         result = v_result,
         success = true
   WHERE id = v_log_id;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
     SET completed_at = now(),
         success = false,
         error_message = SQLERRM
   WHERE id = v_log_id;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_log_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_log_tables() TO service_role;

-- Agendar diariamente às 03:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
      FROM cron.job WHERE jobname = 'daily-log-retention';

    PERFORM cron.schedule(
      'daily-log-retention',
      '0 3 * * *',
      $cron$ SELECT public.cleanup_log_tables(); $cron$
    );
  END IF;
END $$;
