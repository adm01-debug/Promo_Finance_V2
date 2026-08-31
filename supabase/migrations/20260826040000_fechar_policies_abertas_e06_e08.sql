-- E06-E08: Fechar 91 policies abertas só no DST
-- Estratégia: DROP policies wave1 genéricas + CREATE as da SRC onde aplicável
-- Gerado: 2026-08-25T23:22:25.559Z
-- Sem toque nas 21 policies legítimas da SRC (catálogos fiscais, service_role)

BEGIN;

-- ========== DROPS ==========
DROP POLICY IF EXISTS "acessos_suspeitos_select_auth" ON public."acessos_suspeitos";
DROP POLICY IF EXISTS "acessos_suspeitos_service_all" ON public."acessos_suspeitos";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."aliquotas_interestaduais";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."aliquotas_internas_uf";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."aliquotas_iss_municipal";
DROP POLICY IF EXISTS "admins_all_api_keys" ON public."api_keys";
DROP POLICY IF EXISTS "auditoria_tributaria_select_auth" ON public."auditoria_tributaria";
DROP POLICY IF EXISTS "auditoria_tributaria_service_all" ON public."auditoria_tributaria";
DROP POLICY IF EXISTS "benchmarks_setoriais_select_auth" ON public."benchmarks_setoriais";
DROP POLICY IF EXISTS "benchmarks_setoriais_service_all" ON public."benchmarks_setoriais";
DROP POLICY IF EXISTS "beneficios_fiscais_select_auth" ON public."beneficios_fiscais";
DROP POLICY IF EXISTS "beneficios_fiscais_service_all" ON public."beneficios_fiscais";
DROP POLICY IF EXISTS "read_authenticated_beneficios" ON public."beneficios_fiscais";
DROP POLICY IF EXISTS "bitrix_oauth_tokens_select_auth" ON public."bitrix_oauth_tokens";
DROP POLICY IF EXISTS "bitrix_oauth_tokens_service_all" ON public."bitrix_oauth_tokens";
DROP POLICY IF EXISTS "bling_sync_logs_select_auth" ON public."bling_sync_logs";
DROP POLICY IF EXISTS "bling_sync_logs_service_all" ON public."bling_sync_logs";
DROP POLICY IF EXISTS "bling_tokens_select_auth" ON public."bling_tokens";
DROP POLICY IF EXISTS "bling_tokens_service_all" ON public."bling_tokens";
DROP POLICY IF EXISTS "bling_webhook_events_select_auth" ON public."bling_webhook_events";
DROP POLICY IF EXISTS "bling_webhook_events_service_all" ON public."bling_webhook_events";
DROP POLICY IF EXISTS "catalogos_tributarios_health_history_select_auth" ON public."catalogos_tributarios_health_history";
DROP POLICY IF EXISTS "catalogos_tributarios_health_history_service_all" ON public."catalogos_tributarios_health_history";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."cnaes";
DROP POLICY IF EXISTS "cnpja_cache_select_auth" ON public."cnpja_cache";
DROP POLICY IF EXISTS "cnpja_cache_service_all" ON public."cnpja_cache";
DROP POLICY IF EXISTS "conformidade_snapshots_all" ON public."conformidade_snapshots";
DROP POLICY IF EXISTS "convites_contador_select_auth" ON public."convites_contador";
DROP POLICY IF EXISTS "convites_contador_service_all" ON public."convites_contador";
DROP POLICY IF EXISTS "elisao_alertas_all" ON public."elisao_alertas";
DROP POLICY IF EXISTS "elisao_creditos_auditoria_all" ON public."elisao_creditos_auditoria";
DROP POLICY IF EXISTS "elisao_regras_creditos_select_all" ON public."elisao_regras_creditos";
DROP POLICY IF EXISTS "elisao_simulacoes_regime_select_auth" ON public."elisao_simulacoes_regime";
DROP POLICY IF EXISTS "elisao_simulacoes_regime_service_all" ON public."elisao_simulacoes_regime";
DROP POLICY IF EXISTS "elisao_tarefas_acionaveis_all" ON public."elisao_tarefas_acionaveis";
DROP POLICY IF EXISTS "entregas_obrigacoes_select_all" ON public."entregas_obrigacoes";
DROP POLICY IF EXISTS "estrategias_elisao_catalogo_all" ON public."estrategias_elisao_catalogo";
DROP POLICY IF EXISTS "eventos_contabilizacao_log_select_auth" ON public."eventos_contabilizacao_log";
DROP POLICY IF EXISTS "eventos_contabilizacao_log_service_all" ON public."eventos_contabilizacao_log";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."faixas_simples_nacional";
DROP POLICY IF EXISTS "frontend_error_alert_state_select_auth" ON public."frontend_error_alert_state";
DROP POLICY IF EXISTS "frontend_error_alert_state_service_all" ON public."frontend_error_alert_state";
DROP POLICY IF EXISTS "frontend_error_silence_digest_log_select_auth" ON public."frontend_error_silence_digest_log";
DROP POLICY IF EXISTS "frontend_error_silence_digest_log_service_all" ON public."frontend_error_silence_digest_log";
DROP POLICY IF EXISTS "index_usage_snapshots_select_auth" ON public."index_usage_snapshots";
DROP POLICY IF EXISTS "index_usage_snapshots_service_all" ON public."index_usage_snapshots";
DROP POLICY IF EXISTS "indices_uso_excecoes_select_auth" ON public."indices_uso_excecoes";
DROP POLICY IF EXISTS "indices_uso_excecoes_service_all" ON public."indices_uso_excecoes";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."itens_lista_iss";
DROP POLICY IF EXISTS "admins_all_kpis_operacionais" ON public."kpis_operacionais";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."ncms";
DROP POLICY IF EXISTS "operacoes_icms_select_auth" ON public."operacoes_icms";
DROP POLICY IF EXISTS "operacoes_icms_service_all" ON public."operacoes_icms";
DROP POLICY IF EXISTS "oportunidades_elisao_all" ON public."oportunidades_elisao";
DROP POLICY IF EXISTS "admins_all_organizacoes" ON public."organizacoes";
DROP POLICY IF EXISTS "overlay_rejeicoes_auditoria_select_auth" ON public."overlay_rejeicoes_auditoria";
DROP POLICY IF EXISTS "overlay_rejeicoes_auditoria_service_all" ON public."overlay_rejeicoes_auditoria";
DROP POLICY IF EXISTS "admins_all_pagamentos_recorrentes" ON public."pagamentos_recorrentes";
DROP POLICY IF EXISTS "per_dcomp_select_all" ON public."per_dcomp";
DROP POLICY IF EXISTS "authenticated_full_access_planos_acao" ON public."planos_acao";
DROP POLICY IF EXISTS "projecoes_reforma_select_auth" ON public."projecoes_reforma";
DROP POLICY IF EXISTS "projecoes_reforma_service_all" ON public."projecoes_reforma";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."protocolos_st";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."protocolos_st_ncms";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."protocolos_st_ufs";
DROP POLICY IF EXISTS "admins_all_regimes_simulados" ON public."regimes_simulados";
DROP POLICY IF EXISTS "regras_contabilizacao_automatica_select_auth" ON public."regras_contabilizacao_automatica";
DROP POLICY IF EXISTS "regras_contabilizacao_automatica_service_all" ON public."regras_contabilizacao_automatica";
DROP POLICY IF EXISTS "admins_all_resumos_executivos_semanais" ON public."resumos_executivos_semanais";
DROP POLICY IF EXISTS "admins_all_retencoes_fonte" ON public."retencoes_fonte";
DROP POLICY IF EXISTS "saved_filter_subscriptions_select_auth" ON public."saved_filter_subscriptions";
DROP POLICY IF EXISTS "saved_filter_subscriptions_service_all" ON public."saved_filter_subscriptions";
DROP POLICY IF EXISTS "scim_operations_log_select_auth" ON public."scim_operations_log";
DROP POLICY IF EXISTS "scim_operations_log_service_all" ON public."scim_operations_log";
DROP POLICY IF EXISTS "admins_all_scim_setup_checklist" ON public."scim_setup_checklist";
DROP POLICY IF EXISTS "security_alerts_select_auth" ON public."security_alerts";
DROP POLICY IF EXISTS "security_alerts_service_all" ON public."security_alerts";
DROP POLICY IF EXISTS "simulacao_tributos_detalhados_select_auth" ON public."simulacao_tributos_detalhados";
DROP POLICY IF EXISTS "simulacao_tributos_detalhados_service_all" ON public."simulacao_tributos_detalhados";
DROP POLICY IF EXISTS "simulacoes_select_auth" ON public."simulacoes";
DROP POLICY IF EXISTS "simulacoes_service_all" ON public."simulacoes";
DROP POLICY IF EXISTS "slo_metrics_diarias_select_auth" ON public."slo_metrics_diarias";
DROP POLICY IF EXISTS "slo_metrics_diarias_service_all" ON public."slo_metrics_diarias";
DROP POLICY IF EXISTS "admins_all_sped_contabil_arquivos" ON public."sped_contabil_arquivos";
DROP POLICY IF EXISTS "sso_role_mappings_select_auth" ON public."sso_role_mappings";
DROP POLICY IF EXISTS "sso_role_mappings_service_all" ON public."sso_role_mappings";
DROP POLICY IF EXISTS "sso_sandbox_runs_select_auth" ON public."sso_sandbox_runs";
DROP POLICY IF EXISTS "sso_sandbox_runs_service_all" ON public."sso_sandbox_runs";
DROP POLICY IF EXISTS "sso_user_groups_select_auth" ON public."sso_user_groups";
DROP POLICY IF EXISTS "sso_user_groups_service_all" ON public."sso_user_groups";
DROP POLICY IF EXISTS "read_for_authenticated" ON public."ufs";

-- ========== CREATES (recriar policies da SRC) ==========
-- acessos_suspeitos_tenant_select ON acessos_suspeitos: já existe no DST
-- aliq_inter_select_authenticated ON aliquotas_interestaduais: já existe no DST
-- aliq_inter_write_admin ON aliquotas_interestaduais: já existe no DST
-- aliq_internas_select_authenticated ON aliquotas_internas_uf: já existe no DST
-- aliq_internas_write_admin ON aliquotas_internas_uf: já existe no DST
-- aliq_iss_select_authenticated ON aliquotas_iss_municipal: já existe no DST
-- aliq_iss_write_admin ON aliquotas_iss_municipal: já existe no DST
-- api_keys_delete ON api_keys: já existe no DST
-- api_keys_select ON api_keys: já existe no DST
-- auditoria_trib_select_tenant ON auditoria_tributaria: já existe no DST
-- benchmarks_admin_write ON benchmarks_setoriais: já existe no DST
-- benchmarks_select ON benchmarks_setoriais: já existe no DST
-- beneficios_select_authenticated ON beneficios_fiscais: já existe no DST
-- beneficios_write_admin ON beneficios_fiscais: já existe no DST
-- bitrix_oauth_tokens_service_role_only ON bitrix_oauth_tokens: já existe no DST
-- bling_sync_logs_insert ON bling_sync_logs: já existe no DST
-- bling_sync_logs_select ON bling_sync_logs: já existe no DST
-- bling_tokens_service_role_only ON bling_tokens: já existe no DST
-- bling_webhook_events_admin_select ON bling_webhook_events: já existe no DST
-- admins leem historico saude fiscal ON catalogos_tributarios_health_history: já existe no DST
-- cnaes_select_authenticated ON cnaes: já existe no DST
-- cnaes_write_admin ON cnaes: já existe no DST
-- cnpja_cache_service_role_only ON cnpja_cache: já existe no DST
-- conformidade_snapshots_empresa_insert ON conformidade_snapshots: já existe no DST
-- conformidade_snapshots_empresa_select ON conformidade_snapshots: já existe no DST
-- conformidade_snapshots_empresa_update ON conformidade_snapshots: já existe no DST
-- conformidade_snapshots_tenant_rw ON conformidade_snapshots: já existe no DST
-- convites_contador_revogar ON convites_contador: já existe no DST
-- convites_contador_select ON convites_contador: já existe no DST
-- elisao_alertas_acesso ON elisao_alertas: já existe no DST
-- creditos_auditoria_delete_admin ON elisao_creditos_auditoria: já existe no DST
-- creditos_auditoria_insert ON elisao_creditos_auditoria: já existe no DST
-- creditos_auditoria_select ON elisao_creditos_auditoria: já existe no DST
-- regras_creditos_admin ON elisao_regras_creditos: já existe no DST
-- regras_creditos_leitura ON elisao_regras_creditos: já existe no DST
-- elisao_sim_regime_acesso ON elisao_simulacoes_regime: já existe no DST
-- tarefas_elisao_acesso ON elisao_tarefas_acionaveis: já existe no DST
-- entregas_obrigacoes_empresa_insert ON entregas_obrigacoes: já existe no DST
-- entregas_obrigacoes_empresa_select ON entregas_obrigacoes: já existe no DST
-- entregas_obrigacoes_empresa_update ON entregas_obrigacoes: já existe no DST
-- entregas_obrigacoes_tenant_rw ON entregas_obrigacoes: já existe no DST
-- estrategias_elisao_catalogo: sem policy na SRC — DROP foi suficiente
-- eventos_contab_select ON eventos_contabilizacao_log: já existe no DST
-- faixas_simples_select_authenticated ON faixas_simples_nacional: já existe no DST
-- faixas_simples_write_admin ON faixas_simples_nacional: já existe no DST
-- fe_alert_state_admin_select ON frontend_error_alert_state: já existe no DST
-- fe_silence_digest_admin_select ON frontend_error_silence_digest_log: já existe no DST
-- Somente admins leem snapshots de índices ON index_usage_snapshots: já existe no DST
-- Somente admins gerenciam exceções de índice ON indices_uso_excecoes: já existe no DST
-- itens_iss_select_authenticated ON itens_lista_iss: já existe no DST
-- itens_iss_write_admin ON itens_lista_iss: já existe no DST
CREATE POLICY "kpis_operacionais_owner" ON public."kpis_operacionais" FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
-- ncms_select_authenticated ON ncms: já existe no DST
-- ncms_write_admin ON ncms: já existe no DST
-- operacoes_icms_acesso ON operacoes_icms: já existe no DST
-- oportunidades_elisao_acesso ON oportunidades_elisao: já existe no DST
-- organizacoes_delete_responsavel ON organizacoes: já existe no DST
-- organizacoes_insert_proprio ON organizacoes: já existe no DST
-- organizacoes_select_membro_ou_admin ON organizacoes: já existe no DST
-- organizacoes_update_responsavel ON organizacoes: já existe no DST
-- Gestores atualizam auditoria de overlay ON overlay_rejeicoes_auditoria: já existe no DST
-- Gestores inserem auditoria de overlay ON overlay_rejeicoes_auditoria: já existe no DST
-- Gestores leem auditoria de overlay ON overlay_rejeicoes_auditoria: já existe no DST
-- Gestores removem auditoria de overlay ON overlay_rejeicoes_auditoria: já existe no DST
-- pagamentos_recorrentes_acesso ON pagamentos_recorrentes: já existe no DST
-- per_dcomp_acesso ON per_dcomp: já existe no DST
-- planos_acao_owner ON planos_acao: já existe no DST
-- projecoes_reforma_acesso ON projecoes_reforma: já existe no DST
-- protocolos_st_select_authenticated ON protocolos_st: já existe no DST
-- protocolos_st_write_admin ON protocolos_st: já existe no DST
-- protocolos_st_ncms_select_authenticated ON protocolos_st_ncms: já existe no DST
-- protocolos_st_ncms_write_admin ON protocolos_st_ncms: já existe no DST
-- protocolos_st_ufs_select_authenticated ON protocolos_st_ufs: já existe no DST
-- protocolos_st_ufs_write_admin ON protocolos_st_ufs: já existe no DST
-- regimes_simulados_empresa_insert ON regimes_simulados: já existe no DST
-- regimes_simulados_empresa_select ON regimes_simulados: já existe no DST
-- regras_contab_select ON regras_contabilizacao_automatica: já existe no DST
-- regras_contab_write ON regras_contabilizacao_automatica: já existe no DST
-- Empresa-based access ON resumos_executivos_semanais: já existe no DST
-- Empresa-based access ON retencoes_fonte: já existe no DST
-- saved_filter_subscriptions_owner ON saved_filter_subscriptions: já existe no DST
-- scim_operations_log_admin_select ON scim_operations_log: já existe no DST
CREATE POLICY "scim_checklist_own" ON public."scim_setup_checklist" FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
-- security_alerts_admin_all ON security_alerts: já existe no DST
CREATE POLICY "sim_trib_acesso" ON public."simulacao_tributos_detalhados" FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM simulacoes s
  WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empresa_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM simulacoes s
  WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empresa_id)))));
-- simulacoes_acesso ON simulacoes: já existe no DST
-- slo_metrics_admin_select ON slo_metrics_diarias: já existe no DST
-- sped_arquivos_delete_admin ON sped_contabil_arquivos: já existe no DST
-- sped_arquivos_insert ON sped_contabil_arquivos: já existe no DST
-- sped_arquivos_select ON sped_contabil_arquivos: já existe no DST
-- sped_arquivos_update_admin ON sped_contabil_arquivos: já existe no DST
-- sso_role_mappings_admin ON sso_role_mappings: já existe no DST
CREATE POLICY "sso_sandbox_runs_admin" ON public."sso_sandbox_runs" FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid())));
-- sso_user_groups_select ON sso_user_groups: já existe no DST
-- ufs_select_authenticated ON ufs: já existe no DST
-- ufs_write_admin ON ufs: já existe no DST

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260826040000','fechar_policies_abertas_e06_e08')
ON CONFLICT (version) DO NOTHING;
