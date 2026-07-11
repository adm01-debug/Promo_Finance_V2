-- =====================================================================
-- Item 19: Endurecimento final de funções admin/manutenção
-- =====================================================================

DO $$
DECLARE
  v_fn TEXT;
  v_admin_only_fns TEXT[] := ARRAY[
    -- CRÍTICO: retornava access_token/refresh_token para qualquer authenticated
    'get_active_uapi_token()',
    -- Informações operacionais de cron (admin via Edge Function)
    'get_cron_jobs()',
    'get_cron_run_history()',
    'get_cron_run_history(text,integer)',
    -- Jobs administrativos
    'export_asaas_audit_csv(uuid)',
    'processar_regua_cobranca(uuid,boolean)',
    'run_daily_cleanup_with_logging()'
  ];
BEGIN
  FOREACH v_fn IN ARRAY v_admin_only_fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', v_fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', v_fn);
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'Função não encontrada (ignorada): %', v_fn;
    END;
  END LOOP;
END $$;

COMMENT ON FUNCTION public.get_active_uapi_token() IS
  'CRÍTICO: retorna tokens Lalamove UAPI. EXECUTE restrito a service_role. Item 19.';
COMMENT ON FUNCTION public.get_cron_jobs() IS
  'Admin-only via Edge Function com verificação de role. EXECUTE restrito a service_role. Item 19.';