CREATE OR REPLACE FUNCTION public.run_daily_cleanup()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_tokens_deleted INTEGER;
  v_attempts_deleted INTEGER;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
BEGIN
  v_start_time := now();
  
  -- Executar limpeza de tokens expirados
  v_tokens_deleted := cleanup_expired_tokens();
  
  -- Executar limpeza de tentativas de login antigas
  v_attempts_deleted := cleanup_old_login_attempts();
  
  v_end_time := now();
  
  -- Retornar resumo da execução
  RETURN jsonb_build_object(
    'executed_at', v_start_time,
    'completed_at', v_end_time,
    'duration_ms', EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time)),
    'tokens_deleted', v_tokens_deleted,
    'login_attempts_deleted', v_attempts_deleted,
    'success', TRUE
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'executed_at', v_start_time,
    'completed_at', now(),
    'error', SQLERRM,
    'success', FALSE
  );
END;
$function$
