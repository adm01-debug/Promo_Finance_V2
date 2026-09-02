-- E09: REVOKE EXECUTE de authenticated em 103 funções
-- Funções usadas pelo front (41 RPC) → PRESERVADAS
-- Gerado: 2026-08-25T23:23:38.358Z

BEGIN;

REVOKE EXECUTE ON FUNCTION public.audit_trigger_generic() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_vincular_empresa_padrao() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.backfill_empresa_id(_dry_run boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_index_usage_snapshot() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_pg_stat_statements_baseline(p_label text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_slow_queries(threshold_ms numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_catalogos_tributarios_invariants() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_integrity_invariants() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_nfe_xml_path_invariants() FROM authenticated;
DO $$
BEGIN
  IF to_regprocedure('public.cleanup_expired_tokens()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tokens() FROM authenticated';
  END IF;
  IF to_regprocedure('public.cleanup_old_cron_logs()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.cleanup_old_cron_logs() FROM authenticated';
  END IF;
  IF to_regprocedure('public.cleanup_old_login_attempts()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts() FROM authenticated';
  END IF;
  IF to_regprocedure('public.invalidate_old_tokens()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.invalidate_old_tokens() FROM authenticated';
  END IF;
  IF to_regprocedure('public.run_daily_cleanup()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.run_daily_cleanup() FROM authenticated';
  END IF;
  IF to_regprocedure('public.run_daily_cleanup_with_logging()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.run_daily_cleanup_with_logging() FROM authenticated';
  END IF;
  IF to_regprocedure('public.sanitize_auth_log_metadata()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.sanitize_auth_log_metadata() FROM authenticated';
  END IF;
  IF to_regprocedure('public.set_token_expiration()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_token_expiration() FROM authenticated';
  END IF;
END
$$;
REVOKE EXECUTE ON FUNCTION public.cleanup_log_tables() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_pgss_baseline(p_days integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_rpc_observability_metrics() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(p_email text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.compare_pg_stat_baseline(p_label text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid, p_user_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.detect_query_regressions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id uuid, p_tabela text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.drop_old_partitions(p_schema text, p_keep_months integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.empresas_unica_padrao() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_retry(p_log_id uuid, p_source text, p_event_type text, p_external_id text, p_payload jsonb, p_error text, p_headers jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_monthly_partitions(p_table text, p_months_back integer, p_months_forward integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.export_asaas_audit_csv(p_empresa_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.frontend_error_logs_sanitize() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_25_policies_sem_tenant() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_27_secdef_sem_search_path() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_29_rpc_sem_escopo_empresa() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_30_views_inseguras() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_31_tenant_sem_indice() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_32_pii_sem_mascara() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_33_indices_redundantes() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gate_35_tabelas_sem_retencao() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.gerar_alertas_vencimento() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_asaas_payment_stats(p_empresa_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_bloat_snapshots(p_days integer, p_table_name text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(_user_id uuid, _permission_name text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.internal_job_secret() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_country_allowed_for_login(_country text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_country_blocked(_country_code text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_ip_allowed_for_login(_ip inet) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_ip_blocked(p_ip_address inet) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_ip_whitelisted(_ip_address inet) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_known_device(_user_id uuid, _fingerprint text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_token_valid(p_token_hash text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_contabil_before_insert() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_contabil_before_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_rpc_observability_call(_function_name text, _duration_ms numeric, _success boolean, _error_sqlstate text, _error_message text, _meta jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.maintain_monthly_partitions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.monitor_table_bloat() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_apply_manifestacao(p_chave text, p_tipo_evento text, p_codigo_evento text, p_sequencial integer, p_data_evento timestamp with time zone, p_protocolo text, p_justificativa text, p_status_retorno text, p_motivo_retorno text, p_novo_status nfe_manifestacao_status, p_raw jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.normalizar_tipo_partida() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_performance_alert_trigger() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.pix_template_sync_legacy() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.profile_sensitive_fields_unchanged(_profile_id uuid, _user_id uuid, _role text, _empresa_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.provisionar_usuario(_user_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_old_rows(p_table text, p_column text, p_days integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_old_rows(p_table regclass, p_column text, p_days integer, p_where text, p_batch integer, p_max_batches integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.recarregar_seeds_fiscais(p_motivo text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_failed_login(p_email text, p_ip_address inet) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_failed_login_v2(p_email text, p_ip_address inet, p_user_agent text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_performance_alerts_weekly() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_cobranca(p_conta_id uuid, p_evento text, p_mensagem text, p_canal text, p_destinatario text, p_metadata jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reprocess_dlq(p_dlq_id uuid, p_notes text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.run_integrity_cycle() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.run_observability_rpc(_function_name text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sefaz_cursor_advance(p_cnpj text, p_ambiente sefaz_ambiente, p_novo_nsu bigint, p_max_nsu bigint, p_status text, p_erro text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sefaz_detect_nsu_gaps(p_max_gap bigint) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sefaz_detect_stuck_cursors() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sefaz_process_batch(p_cnpj text, p_ambiente text, p_empresa_id uuid, p_novo_nsu bigint, p_max_nsu bigint, p_status text, p_erro text, p_docs jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sefaz_run_observability_checks() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_empresa_id_default() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_empresa_id_from_profile() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_table_bloat() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_regime_tributario_empresa() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_bitrix24_sync() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.use_reset_token(p_token_hash text, p_ip_address inet) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validar_catalogos_tributarios() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validar_partidas_dobradas() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.watch_cron_failures() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.watch_cron_failures(p_lookback_minutes integer, p_stale_hours integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.webhook_claim(p_source text, p_external_id text, p_event_type text, p_payload jsonb, p_max_attempts integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.webhook_dequeue_retries(p_limit integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.webhook_mark_failure(p_id uuid, p_error text, p_retryable boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.webhook_mark_success(p_id uuid, p_response jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.webhook_replay(p_id uuid) FROM authenticated;

COMMIT;
