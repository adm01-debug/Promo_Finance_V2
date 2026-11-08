CREATE OR REPLACE FUNCTION public.run_daily_cleanup_with_logging()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_result JSONB;
  v_log_id UUID;
BEGIN
  -- Inserir registro inicial
  INSERT INTO public.cron_job_logs (job_name, executed_at)
  VALUES ('daily_cleanup', now())
  RETURNING id INTO v_log_id;
  
  -- Executar limpeza
  v_result := run_daily_cleanup();
  
  -- Atualizar registro com resultado
  UPDATE public.cron_job_logs
  SET 
    completed_at = now(),
    duration_ms = (v_result->>'duration_ms')::INTEGER,
    result = v_result,
    success = (v_result->>'success')::BOOLEAN,
    error_message = v_result->>'error'
  WHERE id = v_log_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, registrar
  UPDATE public.cron_job_logs
  SET 
    completed_at = now(),
    success = FALSE,
    error_message = SQLERRM
  WHERE id = v_log_id;
END;
$function$
