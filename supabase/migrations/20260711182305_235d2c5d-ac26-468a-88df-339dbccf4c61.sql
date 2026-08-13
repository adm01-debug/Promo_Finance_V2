-- =====================================================================
-- Item 18: Revogar EXECUTE de funções SECURITY DEFINER internas
-- Menor privilégio: apenas service_role (Edge Functions) + postgres (cron)
-- =====================================================================

DO $$
DECLARE
  v_fn TEXT;
  v_internal_fns TEXT[] := ARRAY[
    -- Triggers (não deveriam ser invocáveis externamente)
    'sanitize_auth_log_metadata()',
    'set_token_expiration()',
    'invalidate_old_tokens()',
    'trigger_bitrix24_sync()',
    'prevent_profile_privilege_escalation()',
    'handle_updated_at()',
    'update_updated_at_column()',
    -- Manutenção (rodam via pg_cron)
    'capture_slow_queries(numeric)',
    'cleanup_expired_tokens()',
    'cleanup_log_tables()',
    'cleanup_old_cron_logs()',
    'cleanup_old_login_attempts()',
    'ensure_monthly_partitions(text,integer,integer)',
    'maintain_monthly_partitions()',
    'run_daily_cleanup()',
    -- Helpers server-side (chamados por Edge Functions com service_role)
    'record_failed_login(text,inet)',
    'record_failed_login_v2(text,inet,text)',
    'check_login_lockout(text)',
    'check_login_lockout_v2(text,inet)',
    'increment_failed_attempts(text)',
    'clear_login_attempts(text)',
    'reset_failed_attempts(text)',
    'is_ip_blocked(inet)',
    'is_ip_whitelisted(inet)',
    'is_country_blocked(text)',
    'is_ip_allowed_for_login(inet)',
    'is_country_allowed_for_login(text)',
    'is_known_device(uuid,text)',
    'log_audit(text,uuid,text,text,jsonb,jsonb)',
    'log_sso_onboarding_event(text,text,text,jsonb,boolean,text,text)',
    'enqueue_webhook_retry(uuid,text,text,text,jsonb,text,jsonb)',
    'get_lockout_details(text)',
    'is_token_valid(text)',
    'invalidate_old_tokens()'
  ];
BEGIN
  FOREACH v_fn IN ARRAY v_internal_fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', v_fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', v_fn);
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'Função não encontrada (ignorada): %', v_fn;
      WHEN OTHERS THEN
        RAISE NOTICE 'Erro em %: %', v_fn, SQLERRM;
    END;
  END LOOP;
END $$;

-- Comentários de auditoria
COMMENT ON FUNCTION public.cleanup_log_tables() IS
  'Manutenção via pg_cron. EXECUTE restrito a service_role. Item 18 - menor privilégio.';
COMMENT ON FUNCTION public.capture_slow_queries(numeric) IS
  'Manutenção via pg_cron. EXECUTE restrito a service_role. Item 18 - menor privilégio.';
COMMENT ON FUNCTION public.enqueue_webhook_retry(uuid,text,text,text,jsonb,text,jsonb) IS
  'Chamada apenas por Edge Functions com service_role. Item 18 - menor privilégio.';