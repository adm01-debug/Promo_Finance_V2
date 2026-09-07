-- E09: REVOKE EXECUTE de authenticated em 103 funções
-- Funções usadas pelo front (41 RPC) → PRESERVADAS
-- Gerado: 2026-08-25T23:23:38.358Z

BEGIN;

DO $r001$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.audit_trigger_generic() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r001$;
DO $r002$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.auto_vincular_empresa_padrao() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r002$;
DO $r200$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.backfill_empresa_id(_dry_run boolean) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r200$;
DO $r004$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.capture_index_usage_snapshot() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r004$;
DO $r201$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.capture_pg_stat_statements_baseline(p_label text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r201$;
DO $r202$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.capture_slow_queries(threshold_ms numeric) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r202$;
DO $r007$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.check_catalogos_tributarios_invariants() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r007$;
DO $r008$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.check_integrity_invariants() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r008$;
DO $r009$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.check_nfe_xml_path_invariants() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r009$;
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
DO $r010$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.cleanup_log_tables() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r010$;
DO $r203$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.cleanup_pgss_baseline(p_days integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r203$;
DO $r012$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.cleanup_rpc_observability_metrics() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r012$;
DO $r204$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(p_email text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r204$;
DO $r205$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.compare_pg_stat_baseline(p_label text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r205$;
DO $r206$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r206$;
DO $r207$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r207$;
DO $r208$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid, p_user_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r208$;
DO $r209$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r209$;
DO $r019$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.detect_query_regressions() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r019$;
DO $r210$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id uuid, p_tabela text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r210$;
DO $r211$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.drop_old_partitions(p_schema text, p_keep_months integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r211$;
DO $r022$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.empresas_unica_padrao() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r022$;
DO $r212$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.enqueue_webhook_retry(p_log_id uuid, p_source text, p_event_type text, p_external_id text, p_payload jsonb, p_error text, p_headers jsonb) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r212$;
DO $r213$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.ensure_monthly_partitions(p_table text, p_months_back integer, p_months_forward integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r213$;
DO $r214$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.export_asaas_audit_csv(p_empresa_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r214$;
DO $r026$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.frontend_error_logs_sanitize() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r026$;
DO $r027$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_25_policies_sem_tenant() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r027$;
DO $r028$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_27_secdef_sem_search_path() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r028$;
DO $r029$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_29_rpc_sem_escopo_empresa() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r029$;
DO $r030$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_30_views_inseguras() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r030$;
DO $r031$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_31_tenant_sem_indice() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r031$;
DO $r032$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_32_pii_sem_mascara() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r032$;
DO $r033$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_33_indices_redundantes() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r033$;
DO $r034$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gate_35_tabelas_sem_retencao() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r034$;
DO $r215$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r215$;
DO $r036$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.gerar_alertas_vencimento() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r036$;
DO $r216$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_asaas_payment_stats(p_empresa_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r216$;
DO $r217$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_bloat_snapshots(p_days integer, p_table_name text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r217$;
DO $r039$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r039$;
DO $r218$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.has_permission(_user_id uuid, _permission_name text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r218$;
DO $r041$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.internal_job_secret() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r041$;
DO $r219$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_country_allowed_for_login(_country text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r219$;
DO $r220$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_country_blocked(_country_code text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r220$;
DO $r221$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_ip_allowed_for_login(_ip inet) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r221$;
DO $r222$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_ip_blocked(p_ip_address inet) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r222$;
DO $r223$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_ip_whitelisted(_ip_address inet) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r223$;
DO $r224$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_known_device(_user_id uuid, _fingerprint text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r224$;
DO $r225$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_token_valid(p_token_hash text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r225$;
DO $r049$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.lancamento_contabil_before_insert() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r049$;
DO $r050$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.lancamento_contabil_before_update() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r050$;
DO $r226$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.log_rpc_observability_call(_function_name text, _duration_ms numeric, _success boolean, _error_sqlstate text, _error_message text, _meta jsonb) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r226$;
DO $r052$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.maintain_monthly_partitions() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r052$;
DO $r053$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.monitor_table_bloat() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r053$;
DO $r227$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.nfe_apply_manifestacao(p_chave text, p_tipo_evento text, p_codigo_evento text, p_sequencial integer, p_data_evento timestamp with time zone, p_protocolo text, p_justificativa text, p_status_retorno text, p_motivo_retorno text, p_novo_status nfe_manifestacao_status, p_raw jsonb) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r227$;
DO $r228$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r228$;
DO $r229$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r229$;
DO $r230$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r230$;
DO $r231$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r231$;
DO $r059$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.normalizar_tipo_partida() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r059$;
DO $r060$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.notify_performance_alert_trigger() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r060$;
DO $r061$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.pix_template_sync_legacy() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r061$;
DO $r062$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r062$;
DO $r232$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.profile_sensitive_fields_unchanged(_profile_id uuid, _user_id uuid, _role text, _empresa_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r232$;
DO $r233$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.provisionar_usuario(_user_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r233$;
DO $r234$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.purge_old_rows(p_table text, p_column text, p_days integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r234$;
DO $r235$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.purge_old_rows(p_table regclass, p_column text, p_days integer, p_where text, p_batch integer, p_max_batches integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r235$;
DO $r236$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.recarregar_seeds_fiscais(p_motivo text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r236$;
DO $r237$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.record_failed_login(p_email text, p_ip_address inet) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r237$;
DO $r238$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.record_failed_login_v2(p_email text, p_ip_address inet, p_user_agent text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r238$;
DO $r070$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.refresh_performance_alerts_weekly() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r070$;
DO $r239$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.registrar_evento_cobranca(p_conta_id uuid, p_evento text, p_mensagem text, p_canal text, p_destinatario text, p_metadata jsonb) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r239$;
DO $r240$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.reprocess_dlq(p_dlq_id uuid, p_notes text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r240$;
DO $r073$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.run_integrity_cycle() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r073$;
DO $r241$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.run_observability_rpc(_function_name text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r241$;
DO $r242$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.sefaz_cursor_advance(p_cnpj text, p_ambiente sefaz_ambiente, p_novo_nsu bigint, p_max_nsu bigint, p_status text, p_erro text) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r242$;
DO $r243$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.sefaz_detect_nsu_gaps(p_max_gap bigint) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r243$;
DO $r077$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.sefaz_detect_stuck_cursors() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r077$;
DO $r244$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.sefaz_process_batch(p_cnpj text, p_ambiente text, p_empresa_id uuid, p_novo_nsu bigint, p_max_nsu bigint, p_status text, p_erro text, p_docs jsonb) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r244$;
DO $r079$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.sefaz_run_observability_checks() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r079$;
DO $r080$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.set_empresa_id_default() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r080$;
DO $r081$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.set_empresa_id_from_profile() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r081$;
DO $r082$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.snapshot_table_bloat() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r082$;
DO $r083$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.sync_regime_tributario_empresa() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r083$;
DO $r084$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.trigger_bitrix24_sync() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r084$;
DO $r085$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r085$;
DO $r245$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.use_reset_token(p_token_hash text, p_ip_address inet) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r245$;
DO $r087$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.validar_catalogos_tributarios() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r087$;
DO $r088$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.validar_partidas_dobradas() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r088$;
DO $r089$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.watch_cron_failures() FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r089$;
DO $r246$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.watch_cron_failures(p_lookback_minutes integer, p_stale_hours integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r246$;
DO $r247$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.webhook_claim(p_source text, p_external_id text, p_event_type text, p_payload jsonb, p_max_attempts integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r247$;
DO $r248$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.webhook_dequeue_retries(p_limit integer) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r248$;
DO $r249$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.webhook_mark_failure(p_id uuid, p_error text, p_retryable boolean) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r249$;
DO $r250$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.webhook_mark_success(p_id uuid, p_response jsonb) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r250$;
DO $r251$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.webhook_replay(p_id uuid) FROM authenticated;
EXCEPTION WHEN undefined_function OR undefined_object THEN NULL;
END $r251$;

COMMIT;
