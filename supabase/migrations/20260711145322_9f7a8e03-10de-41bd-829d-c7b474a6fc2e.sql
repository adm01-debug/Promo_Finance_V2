-- Menor privilégio: revogar EXECUTE de anon em funções administrativas/limpeza
-- que jamais devem ser invocadas por usuários não autenticados.
-- Funções usadas por RLS (has_role, is_ip_blocked, has_permission, etc.)
-- permanecem intocadas — são invocadas via SECURITY DEFINER pelas policies.
-- Guard: 42883 — functions may not exist yet on preview branch

DO $$
BEGIN
  BEGIN REVOKE EXECUTE ON FUNCTION public.run_daily_cleanup() FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.run_daily_cleanup_with_logging() FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tokens() FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.cleanup_old_cron_logs() FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.get_cron_jobs() FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.get_cron_run_history() FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.get_cron_run_history(text, integer) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(text) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.reset_failed_attempts(text) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.increment_failed_attempts(text) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.registrar_auditoria_config(text, uuid, jsonb) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.log_audit(text, uuid, text, text, jsonb, jsonb) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.export_asaas_audit_csv(uuid) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, numeric) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(uuid) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.confirmar_envio_cobranca(uuid, text, text, boolean, text) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.get_retencoes_pendentes_count(uuid) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.processar_regua_cobranca(uuid, boolean) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
  BEGIN REVOKE EXECUTE ON FUNCTION public.get_asaas_payment_stats(uuid) FROM anon; EXCEPTION WHEN undefined_function OR undefined_object THEN NULL; END;
END $$;

-- Log de conformidade
-- Guard: 42P01 — table may not exist yet on preview branch
DO $$
BEGIN
  INSERT INTO public.audit_logs (table_name, action, details, created_at)
  VALUES ('pg_proc', 'revoke_execute_anon', 'Menor privilégio: revogado EXECUTE de anon em 20 funções admin/cleanup', now());
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;