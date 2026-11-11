# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

## 2026-11-11 18:25 UTC

- **constraints** alterado (22): `public.aliquotas_interestaduais.aliquotas_interestaduais_vigencia_chk`, `public.aliquotas_internas_uf.aliquotas_internas_uf_vigencia_chk`, `public.aliquotas_iss_municipal.aliq_iss_mun_vigencia_chk`, `public.benchmarks_setoriais.benchmark_vigencia_valida`, `public.beneficios_fiscais.beneficios_fiscais_vigencia_chk`, `public.bling_sync_logs.bling_sync_periodo_valido`, `public.convites_contador.convite_revogado_nao_aceito`, `public.faixas_simples_nacional.faixas_simples_intervalo_chk`, `public.faixas_simples_nacional.faixas_simples_vigencia_chk`, `public.incentivos_fiscais.chk_ano`, `public.incentivos_fiscais.incentivo_periodo_valido`, `public.index_usage_snapshots.index_usage_snapshots_unico`, `public.itens_lista_iss.itens_lista_iss_vigencia_coerente`, `public.kpis_operacionais.kpis_operacionais_unique`, `public.ncms.ncms_vigencia_coerente`, `public.pagamentos_recorrentes.pag_recorrente_periodo`, `public.protocolos_st.protocolos_st_vigencia_chk`, `public.protocolos_st_ncms.protocolos_st_ncms_vigencia_coerente`, `public.retencao_politicas.retencao_politicas_coerencia`, `public.simulacoes.simulacoes_periodo_chk`, `public.sped_contabil_arquivos.sped_periodo_valido`, `public.ufs.ufs_vigencia_coerente`
- **lints** adicionado (2): `fk_without_index:public.execucoes_regua_cobranca.execucoes_regua_cobranca_conta_receber_id_fkey`, `fk_without_index:public.n8n_workflow_configs.n8n_workflow_configs_created_by_fkey`

## 2026-11-11 17:07 UTC

- **functions** alterado (29): `public.cleanup_expired_tokens()`, `public.cleanup_old_cron_logs()`, `public.cleanup_old_login_attempts()`, `public.clear_login_attempts(p_email text)`, `public.empresa_acessivel(_empresa_id uuid)`, `public.fn_norm_conta_codigo(p_codigo text)`, `public.gerar_numero_acordo()`, `public.get_bloat_history(p_days integer)`, `public.get_catalogos_tributarios_health()`, `public.get_cron_jobs()`, `public.get_cron_run_history(p_job_name text, p_limit integer)`, `public.get_performance_alerts_weekly(p_weeks integer)`, `public.get_retencoes_pendentes_count(p_empresa_id uuid)`, `public.get_retention_history(p_days integer)`, `public.get_table_bloat()`, `public.get_user_permissions(user_id uuid)`, `public.get_user_roles(user_id uuid)`, `public.has_role(_user_id uuid, _role app_role)`, `public.invalidate_old_tokens()`, `public.log_sso_onboarding_event(_email text, _event_type text, _provider_id text, _context jsonb, _success boolean, _error_code text, _error_message text)`, `public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid, _detalhes jsonb)`, `public.registrar_evento_pagar(p_conta_id uuid, p_tipo text, p_mensagem text, p_metadata jsonb)`, `public.registrar_evento_receber(p_conta_id uuid, p_evento text, p_detalhes jsonb)`, `public.registrar_evento_receber(p_conta_id uuid, p_evento text, p_detalhes jsonb, p_tipo text, p_mensagem text, p_metadata jsonb)`, `public.resolve_sso_providers_for_domain(p_domain text)`, `public.run_daily_cleanup()`, `public.run_daily_cleanup_with_logging()`, `public.sanitize_auth_log_metadata()`, `public.set_token_expiration()`

## 2026-11-11 16:59 UTC

- **functions** alterado (1): `public.empresa_acessivel(_empresa_id uuid)`

## 2026-11-11 14:16 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_07`

## 2026-11-11 13:30 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_14`

## 2026-11-10 20:35 UTC

- **functions** alterado (1): `public.has_role(_user_id uuid, _role app_role)`

## 2026-11-10 00:51 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_13`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_06`

## 2026-11-09 03:45 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_05`

## 2026-11-09 01:50 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_12`

## 2026-11-08 21:58 UTC

- **grants** adicionado (603): `public.acessos_suspeitos:authenticated`, `public.acessos_suspeitos:service_role`, `public.acoes_recomendadas:authenticated`, `public.acoes_recomendadas:service_role`, `public.acordos_parcelamento:authenticated`, `public.acordos_parcelamento:service_role`, `public.alert_configurations:authenticated`, `public.alert_configurations:service_role`, `public.alertas:authenticated`, `public.alertas:service_role`, `public.alertas_preditivos:authenticated`, `public.alertas_preditivos:service_role`, `public.alertas_tributarios:authenticated`, `public.alertas_tributarios:service_role`, `public.alerts:authenticated`, `public.alerts:service_role`, `public.alerts_sent:authenticated`, `public.alerts_sent:service_role`, `public.aliquotas_interestaduais:authenticated`, `public.aliquotas_interestaduais:service_role`, `public.aliquotas_internas_uf:authenticated`, `public.aliquotas_internas_uf:service_role`, `public.aliquotas_iss_municipal:authenticated`, `public.aliquotas_iss_municipal:service_role`, `public.allowed_countries:authenticated`, `public.allowed_countries:service_role`, `public.allowed_ips:authenticated`, `public.allowed_ips:service_role`, `public.anexos_financeiros:authenticated`, `public.anexos_financeiros:service_role`, `public.anomalia_detection_runs:authenticated`, `public.anomalia_detection_runs:service_role`, `public.anomalia_toast_eventos:authenticated`, `public.anomalia_toast_eventos:service_role`, `public.anomalias_detectadas:authenticated`, `public.anomalias_detectadas:service_role`, `public.api_keys:authenticated`, `public.api_keys:service_role`, `public.aprovacao_comentarios:authenticated`, `public.aprovacao_comentarios:service_role` … (+563)

## 2026-11-08 18:17 UTC

- Snapshot inicial.

