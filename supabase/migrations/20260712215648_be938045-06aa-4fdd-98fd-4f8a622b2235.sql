-- Sprint 1 / Item 1: Reduzir superfície de ataque das funções SECURITY DEFINER
-- Estratégia:
--   (a) Funções administrativas com has_role() interno: revogar EXECUTE de anon
--       (mantém authenticated — o check interno rejeita não-admins).
--   (b) Funções internas/cron/trigger: revogar EXECUTE de anon e authenticated.
-- Idempotente e reversível (basta re-conceder GRANT EXECUTE).

-- (a) Admin-gated: revoke apenas de anon
REVOKE EXECUTE ON FUNCTION public.reprocess_dlq(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_cron_jobs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_table_bloat() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_bloat_history(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_performance_alerts_weekly(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.registrar_auditoria_config(text, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao(uuid, uuid, uuid, uuid, uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao(uuid, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_reconciliation_suggestions(uuid, date, numeric, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_retencoes_pendentes_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.processar_regua_cobranca(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.export_asaas_audit_csv(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_asaas_payment_stats(uuid) FROM anon;

-- (b) Cron/manutenção/observabilidade: revoke de anon + authenticated
REVOKE EXECUTE ON FUNCTION public.capture_pg_stat_statements_baseline(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.detect_query_regressions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_performance_alerts_weekly() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_slow_queries(numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.maintain_monthly_partitions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_cron_logs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tokens() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_daily_cleanup() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_retry(uuid, text, text, text, jsonb, text, jsonb) FROM anon, authenticated;

-- Auditoria da mudança
INSERT INTO public.audit_logs (
  table_name, action, details, user_id, user_email, new_data, created_at
) VALUES (
  'pg_proc', 'HARDEN_EXECUTE',
  'Sprint 1/Item 1 — REVOKE EXECUTE em SECURITY DEFINER admin/cron',
  NULL, 'system',
  jsonb_build_object(
    'admin_gated_revoked_from', 'anon',
    'cron_only_revoked_from', ARRAY['anon','authenticated'],
    'total_functions', 24
  ),
  now()
);