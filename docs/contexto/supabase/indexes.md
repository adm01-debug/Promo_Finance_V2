# Índices

Uso e tamanho em `stats.md`.

| tabela | índice | método | colunas | único | válido | predicado |
|---|---|---|---|---|---|---|
| public.acessos_suspeitos | acessos_suspeitos_pkey | btree | id | sim | sim |  |
| public.acessos_suspeitos | uq_acessos_suspeitos_janela | btree | tipo, janela_inicio | sim | sim |  |
| public.acoes_recomendadas | acoes_recomendadas_pkey | btree | id | sim | sim |  |
| public.acoes_recomendadas | idx_acoes_recomendadas_empresa_id | btree | empresa_id | não | sim |  |
| public.acordos_parcelamento | acordos_parcelamento_pkey | btree | id | sim | sim |  |
| public.acordos_parcelamento | idx_acordos_parcelamento_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.acordos_parcelamento | idx_acordos_parcelamento_created_by_fk | btree | created_by | não | sim |  |
| public.acordos_parcelamento | idx_acordos_parcelamento_empresa_id | btree | empresa_id | não | sim |  |
| public.alert_configurations | alert_configurations_alert_type_channel_key | btree | alert_type, channel | sim | sim |  |
| public.alert_configurations | alert_configurations_pkey | btree | id | sim | sim |  |
| public.alert_configurations | idx_alert_configurations_empresa_id | btree | empresa_id | não | sim |  |
| public.alertas | alertas_pkey | btree | id | sim | sim |  |
| public.alertas | idx_alertas_empresa_id | btree | empresa_id, created_at | não | sim |  |
| public.alertas_preditivos | alertas_preditivos_pkey | btree | id | sim | sim |  |
| public.alertas_tributarios | alertas_tributarios_pkey | btree | id | sim | sim |  |
| public.alertas_tributarios | idx_alertas_tributarios_empresa_id | btree | empresa_id | não | sim |  |
| public.alertas_tributarios | idx_alertas_tributarios_resolvido_por | btree | resolvido_por | não | sim |  |
| public.alertas_tributarios | idx_alertas_tributarios_user_id | btree | user_id | não | sim |  |
| public.alerts | alerts_pkey | btree | id | sim | sim |  |
| public.alerts | idx_alerts_empresa_id | btree | empresa_id | não | sim |  |
| public.alerts_sent | alerts_sent_pkey | btree | id | sim | sim |  |
| public.alerts_sent | idx_alerts_sent_alert_id_fk | btree | alert_id | não | sim |  |
| public.aliquotas_interestaduais | aliquotas_interestaduais_pkey | btree | id | sim | sim |  |
| public.aliquotas_interestaduais | aliquotas_interestaduais_unique | btree | uf_origem, uf_destino, vigente_de | sim | sim |  |
| public.aliquotas_internas_uf | aliquotas_internas_uf_pkey | btree | id | sim | sim |  |
| public.aliquotas_internas_uf | aliquotas_internas_uf_unique | btree | uf, categoria_produto, vigente_de | sim | sim |  |
| public.aliquotas_iss_municipal | aliq_iss_mun_geral_unq | btree | codigo_ibge, vigente_de | sim | sim | `(item_lista_id IS NULL)` |
| public.aliquotas_iss_municipal | aliq_iss_mun_unq | btree | codigo_ibge, item_lista_id, vigente_de | sim | sim |  |
| public.aliquotas_iss_municipal | aliquotas_iss_municipal_pkey | btree | id | sim | sim |  |
| public.aliquotas_iss_municipal | idx_aliq_iss_ibge | btree | codigo_ibge | não | sim |  |
| public.aliquotas_iss_municipal | idx_aliquotas_iss_municipal_item_lista_id_fk | btree | item_lista_id | não | sim |  |
| public.allowed_countries | allowed_countries_pkey | btree | id | sim | sim |  |
| public.allowed_ips | allowed_ips_pkey | btree | id | sim | sim |  |
| public.anexos_financeiros | anexos_financeiros_pkey | btree | id | sim | sim |  |
| public.anexos_financeiros | idx_anexos_financeiros_empresa_id | btree | empresa_id | não | sim |  |
| public.anomalia_detection_runs | anomalia_detection_runs_pkey | btree | id | sim | sim |  |
| public.anomalia_detection_runs | idx_anomalia_detection_runs_triggered_by_fk | btree | triggered_by | não | sim |  |
| public.anomalia_toast_eventos | anomalia_toast_eventos_pkey | btree | id | sim | sim |  |
| public.anomalia_toast_eventos | idx_anomalia_toast_eventos_anomalia_id_fk | btree | anomalia_id | não | sim |  |
| public.anomalia_toast_eventos | idx_anomalia_toast_eventos_centro_custo_id | btree | centro_custo_id | não | sim |  |
| public.anomalia_toast_eventos | idx_anomalia_toast_eventos_user_id_fk | btree | user_id | não | sim |  |
| public.anomalias_detectadas | anomalias_detectadas_pkey | btree | id | sim | sim |  |
| public.anomalias_detectadas | idx_anomalias_detectadas_empresa_id | btree | empresa_id | não | sim |  |
| public.anomalias_detectadas | idx_anomalias_detectadas_user_id_fk | btree | user_id | não | sim |  |
| public.api_keys | api_keys_chave_key | btree | chave | sim | sim |  |
| public.api_keys | api_keys_hash_unico | btree | key_hash | sim | sim |  |
| public.api_keys | api_keys_nome_unico_por_empresa | btree | empresa_id, name | sim | sim |  |
| public.api_keys | api_keys_pkey | btree | id | sim | sim |  |
| public.api_keys | idx_api_keys_empresa | btree | empresa_id, created_at | não | sim |  |
| public.aprovacao_comentarios | aprovacao_comentarios_pkey | btree | id | sim | sim |  |
| public.aprovacao_comentarios | idx_aprovacao_comentarios_user_id_fk | btree | user_id | não | sim |  |
| public.apuracoes_irpj_csll | apuracoes_irpj_csll_pkey | btree | id | sim | sim |  |
| public.apuracoes_irpj_csll | idx_apuracoes_irpj_csll_created_by_fk | btree | created_by | não | sim |  |
| public.apuracoes_irpj_csll | idx_apuracoes_irpj_csll_empresa_id | btree | empresa_id | não | sim |  |
| public.apuracoes_tributarias | apuracoes_tributarias_pkey | btree | id | sim | sim |  |
| public.apuracoes_tributarias | idx_apuracoes_tributarias_created_by | btree | created_by | não | sim |  |
| public.apuracoes_tributarias | idx_apuracoes_tributarias_empresa | btree | empresa_id | não | sim |  |
| public.asaas_audit_trail | asaas_audit_trail_pkey | btree | id | sim | sim |  |
| public.asaas_audit_trail | idx_asaas_audit_trail_asaas_payment_id_fk | btree | asaas_payment_id | não | sim |  |
| public.asaas_config | asaas_config_empresa_id_key | btree | empresa_id | sim | sim |  |
| public.asaas_config | asaas_config_pkey | btree | id | sim | sim |  |
| public.asaas_credit_risk_analysis | asaas_credit_risk_analysis_pkey | btree | id | sim | sim |  |
| public.asaas_credit_risk_analysis | idx_asaas_credit_risk_analysis_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.asaas_customers | asaas_customers_asaas_id_key | btree | asaas_id | sim | sim |  |
| public.asaas_customers | asaas_customers_pkey | btree | id | sim | sim |  |
| public.asaas_payment_links | asaas_payment_links_asaas_link_id_key | btree | asaas_link_id | sim | sim |  |
| public.asaas_payment_links | asaas_payment_links_pkey | btree | id | sim | sim |  |
| public.asaas_payment_links | idx_asaas_payment_links_created_by_fk | btree | created_by | não | sim |  |
| public.asaas_payment_links | idx_asaas_payment_links_empresa_id | btree | empresa_id | não | sim |  |
| public.asaas_payments | asaas_payments_asaas_id_key | btree | asaas_id | sim | sim |  |
| public.asaas_payments | asaas_payments_pkey | btree | id | sim | sim |  |
| public.asaas_payments | idx_asaas_payments_asaas_customer_id_fk | btree | asaas_customer_id | não | sim |  |
| public.asaas_reconciliation_suggestions | asaas_reconciliation_suggestions_pkey | btree | id | sim | sim |  |
| public.asaas_reconciliation_suggestions | idx_asaas_reconciliation_suggestions_contas_pagar_id_fk | btree | contas_pagar_id | não | sim |  |
| public.asaas_reconciliation_suggestions | idx_asaas_reconciliation_suggestions_contas_receber_id_fk | btree | contas_receber_id | não | sim |  |
| public.asaas_sync_queue | asaas_sync_queue_pkey | btree | id | sim | sim |  |
| public.asaas_sync_queue | idx_asaas_sync_queue_asaas_payment_id_fk | btree | asaas_payment_id | não | sim |  |
| public.asaas_transfers | asaas_transfers_asaas_id_key | btree | asaas_id | sim | sim |  |
| public.asaas_transfers | asaas_transfers_pkey | btree | id | sim | sim |  |
| public.asaas_transfers | idx_asaas_transfers_empresa_id | btree | empresa_id | não | sim |  |
| public.audit_logs | audit_logs_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs | idx_audit_logs_created_at | btree | created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_table | btree | table_name, created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_user_id | btree | user_id, created_at | não | sim |  |
| public.audit_logs_2026_01 | audit_logs_2026_01_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_02 | audit_logs_2026_02_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_03 | audit_logs_2026_03_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_04 | audit_logs_2026_04_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_05 | audit_logs_2026_05_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_06 | audit_logs_2026_06_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_07 | audit_logs_2026_07_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_08 | audit_logs_2026_08_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_09 | audit_logs_2026_09_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_2026_10 | audit_logs_2026_10_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_default | audit_logs_default_pkey | btree | id, created_at | sim | sim |  |
| public.auditoria_financeira | auditoria_financeira_pkey | btree | id | sim | sim |  |
| public.auditoria_tributaria | auditoria_tributaria_pkey | btree | id | sim | sim |  |
| public.auditoria_tributaria | idx_auditoria_trib_criado | btree | criado_em | não | sim |  |
| public.auditoria_tributaria | idx_auditoria_tributaria_empresa_id | btree | empresa_id | não | sim |  |
| public.auth_logs | auth_logs_pkey | btree | id | sim | sim |  |
| public.benchmarks_setoriais | benchmark_unico | btree | cnae_prefix, regime, vigencia_inicio | sim | sim |  |
| public.benchmarks_setoriais | benchmarks_setoriais_pkey | btree | id | sim | sim |  |
| public.beneficios_fiscais | beneficios_fiscais_codigo_key | btree | codigo | sim | sim |  |
| public.beneficios_fiscais | beneficios_fiscais_pkey | btree | id | sim | sim |  |
| public.bitrix24_activities | bitrix24_activities_pkey | btree | id | sim | sim |  |
| public.bitrix24_stage_mappings | bitrix24_stage_mappings_pkey | btree | id | sim | sim |  |
| public.bitrix24_tokens | bitrix24_tokens_pkey | btree | id | sim | sim |  |
| public.bitrix_field_mappings | bitrix_field_mappings_pkey | btree | id | sim | sim |  |
| public.bitrix_field_mappings | idx_bitrix_field_mappings_empresa_id | btree | empresa_id | não | sim |  |
| public.bitrix_oauth_tokens | bitrix_oauth_tokens_pkey | btree | id | sim | sim |  |
| public.bitrix_oauth_tokens | idx_bitrix_oauth_tokens_empresa_id | btree | empresa_id | não | sim |  |
| public.bitrix_sync_logs | bitrix_sync_logs_pkey | btree | id | sim | sim |  |
| public.bitrix_sync_logs | idx_bitrix_sync_logs_empresa_id | btree | empresa_id | não | sim |  |
| public.bitrix_webhook_events | bitrix_webhook_events_pkey | btree | id | sim | sim |  |
| public.bling_sync_logs | bling_sync_logs_pkey | btree | id | sim | sim |  |
| public.bling_sync_logs | idx_bling_sync_logs_empresa_id | btree | empresa_id | não | sim |  |
| public.bling_tokens | bling_tokens_empresa_id_key | btree | empresa_id | sim | sim |  |
| public.bling_tokens | bling_tokens_pkey | btree | id | sim | sim |  |
| public.bling_webhook_events | bling_webhook_events_pkey | btree | id | sim | sim |  |
| public.bling_webhook_events | idx_bling_webhook_events_created | btree | created_at | não | sim |  |
| public.bling_webhook_events | idx_bling_webhook_events_empresa_id | btree | empresa_id | não | sim |  |
| public.bloat_snapshots | bloat_snapshots_pkey | btree | id | sim | sim |  |
| public.bloat_snapshots | bloat_snapshots_snapshot_date_table_name_key | btree | snapshot_date, table_name | sim | sim |  |
| public.blocked_ips | blocked_ips_ip_address_key | btree | ip_address | sim | sim |  |
| public.blocked_ips | blocked_ips_pkey | btree | id | sim | sim |  |
| public.bloqueios_duplicidade | bloqueios_duplicidade_pkey | btree | id | sim | sim |  |
| public.bloqueios_duplicidade | idx_bloqueios_duplicidade_empresa_id | btree | empresa_id | não | sim |  |
| public.bloqueios_duplicidade | idx_bloqueios_duplicidade_transacao_id_fk | btree | transacao_id | não | sim |  |
| public.bloqueios_duplicidade | idx_bloqueios_duplicidade_usuario_id_fk | btree | usuario_id | não | sim |  |
| public.boletos | boletos_pkey | btree | id | sim | sim |  |
| public.boletos | idx_boletos_conta_bancaria_id | btree | conta_bancaria_id | não | sim |  |
| public.boletos | idx_boletos_conta_pagar_id | btree | conta_pagar_id | não | sim |  |
| public.boletos | idx_boletos_created_by_fk | btree | created_by | não | sim |  |
| public.boletos | idx_boletos_empresa_id | btree | empresa_id | não | sim |  |
| public.budgets | budgets_pkey | btree | id | sim | sim |  |
| public.budgets | idx_budgets_company_user | btree | company_id, user_id | não | sim |  |
| public.budgets | idx_budgets_user_id_fk | btree | user_id | não | sim |  |
| public.catalogos_fiscais_cargas | catalogos_fiscais_cargas_checksum_key | btree | checksum | sim | sim |  |
| public.catalogos_fiscais_cargas | catalogos_fiscais_cargas_pkey | btree | id | sim | sim |  |
| public.catalogos_tributarios_health_history | catalogos_health_history_dia_key | btree | dia | sim | sim |  |
| public.catalogos_tributarios_health_history | catalogos_tributarios_health_history_pkey | btree | id | sim | sim |  |
| public.categorias | categorias_empresa_tipo_nome_uq | btree | empresa_id, tipo | sim | sim |  |
| public.categorias | categorias_pkey | btree | id | sim | sim |  |
| public.categorias | idx_categorias_empresa | btree | empresa_id | não | sim |  |
| public.categorias | idx_categorias_plano_conta_id_fk | btree | plano_conta_id | não | sim |  |
| public.centros_custo | centros_custo_pkey | btree | id | sim | sim |  |
| public.centros_custo | idx_centros_custo_parent_id_fk | btree | parent_id | não | sim |  |
| public.centros_custo | idx_centros_custo_user_id_fk | btree | user_id | não | sim |  |
| public.ci_security_gate_events | ci_security_gate_events_pkey | btree | id | sim | sim |  |
| public.clientes | clientes_cpf_cnpj_key | btree | cpf_cnpj | sim | sim |  |
| public.clientes | clientes_pkey | btree | id | sim | sim |  |
| public.clientes | idx_clientes_user_id_fk | btree | user_id | não | sim |  |
| public.cnaes | cnaes_codigo_key | btree | codigo | sim | sim |  |
| public.cnaes | cnaes_pkey | btree | id | sim | sim |  |
| public.cnpja_cache | cnpja_cache_pkey | btree | cnpj | sim | sim |  |
| public.conciliacoes | conciliacoes_pkey | btree | id | sim | sim |  |
| public.conciliacoes | idx_conciliacoes_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  |
| public.conciliacoes_parciais | conciliacoes_parciais_pkey | btree | id | sim | sim |  |
| public.configuracoes_aprovacao | configuracoes_aprovacao_pkey | btree | id | sim | sim |  |
| public.configuracoes_aprovacao | idx_configuracoes_aprovacao_empresa_id | btree | empresa_id | não | sim |  |
| public.configuracoes_duplicidade | configuracoes_duplicidade_pkey | btree | id | sim | sim |  |
| public.conformidade_snapshots | conformidade_snapshots_pkey | btree | id | sim | sim |  |
| public.conformidade_snapshots | conformidade_snapshots_unica | btree | empresa_id, competencia | sim | sim |  |
| public.contas_bancarias | contas_bancarias_pkey | btree | id | sim | sim |  |
| public.contas_bancarias | idx_contas_bancarias_empresa_id_fk | btree | empresa_id | não | sim |  |
| public.contas_pagar | contas_pagar_pkey | btree | id | sim | sim |  |
| public.contas_pagar | idx_contas_pagar_aprovado_por_fk | btree | aprovado_por | não | sim |  |
| public.contas_pagar | idx_contas_pagar_categoria_id_fk | btree | categoria_id | não | sim |  |
| public.contas_pagar | idx_contas_pagar_centro_custo_id | btree | centro_custo_id | não | sim |  |
| public.contas_pagar | idx_contas_pagar_conta_bancaria_id | btree | conta_bancaria_id | não | sim |  |
| public.contas_pagar | idx_contas_pagar_data_pagamento | btree | data_pagamento | não | sim | `(data_pagamento IS NOT NULL)` |
| public.contas_pagar | idx_contas_pagar_empresa_id | btree | empresa_id | não | sim |  |
| public.contas_pagar | idx_contas_pagar_empresa_status_venc | btree | empresa_id, status, data_vencimento | não | sim |  |
| public.contas_pagar | idx_contas_pagar_fornecedor_id_fk | btree | fornecedor_id | não | sim |  |
| public.contas_pagar | idx_contas_pagar_pendentes_venc | btree | empresa_id, data_vencimento | não | sim | `((status)::text = 'pendente'::text)` |
| public.contas_pagar | idx_contas_pagar_user_created | btree | user_id, created_at | não | sim |  |
| public.contas_receber | contas_receber_pkey | btree | id | sim | sim |  |
| public.contas_receber | idx_contas_receber_categoria_id | btree | categoria_id | não | sim |  |
| public.contas_receber | idx_contas_receber_centro_custo_id | btree | centro_custo_id | não | sim |  |
| public.contas_receber | idx_contas_receber_cliente_id | btree | cliente_id | não | sim |  |
| public.contas_receber | idx_contas_receber_conta_bancaria_id | btree | conta_bancaria_id | não | sim |  |
| public.contas_receber | idx_contas_receber_data_recebimento | btree | data_recebimento | não | sim | `(data_recebimento IS NOT NULL)` |
| public.contas_receber | idx_contas_receber_empresa_id | btree | empresa_id | não | sim |  |
| public.contas_receber | idx_contas_receber_empresa_status_venc | btree | empresa_id, status, data_vencimento | não | sim |  |
| public.contas_receber | idx_contas_receber_pendentes_venc | btree | empresa_id, data_vencimento | não | sim | `((status)::text = 'pendente'::text)` |
| public.contas_receber | idx_contas_receber_user_created | btree | user_id, created_at | não | sim |  |
| public.contratos | contratos_pkey | btree | id | sim | sim |  |
| public.contratos | idx_contratos_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.contratos | idx_contratos_empresa_id | btree | empresa_id | não | sim |  |
| public.contratos | idx_contratos_fornecedor_id_fk | btree | fornecedor_id | não | sim |  |
| public.contratos | idx_contratos_user_id_fk | btree | user_id | não | sim |  |
| public.convites | convites_pkey | btree | id | sim | sim |  |
| public.convites | convites_token_key | btree | token | sim | sim |  |
| public.convites | idx_convites_organizacao_id | btree | organizacao_id | não | sim |  |
| public.convites | idx_convites_organizacao_id_fk | btree | organizacao_id | não | sim |  |
| public.convites_contador | convites_contador_pkey | btree | id | sim | sim |  |
| public.convites_contador | convites_contador_token_hash_key | btree | token_hash | sim | sim |  |
| public.convites_contador | convites_contador_token_key | btree | token | sim | sim |  |
| public.convites_contador | idx_convites_contador_empresa | btree | empresa_id, created_at | não | sim |  |
| public.convites_contador | uq_convite_contador_ativo | btree | empresa_id | sim | sim | `((revoked_at IS NULL) AND (accepted_at IS NULL))` |
| public.creditos_tributarios | creditos_tributarios_pkey | btree | id | sim | sim |  |
| public.creditos_tributarios | idx_creditos_tributarios_apuracao_id | btree | apuracao_id | não | sim |  |
| public.creditos_tributarios | idx_creditos_tributarios_empresa_id | btree | empresa_id | não | sim |  |
| public.creditos_tributarios | idx_creditos_tributarios_fornecedor_id | btree | fornecedor_id | não | sim |  |
| public.creditos_tributarios | idx_creditos_tributarios_nota_fiscal_id_fk | btree | nota_fiscal_id | não | sim |  |
| public.cron_job_logs | cron_job_logs_pkey | btree | id | sim | sim |  |
| public.cron_job_logs | idx_cron_job_logs_created_at | btree | created_at | não | sim |  |
| public.cron_job_logs | idx_cron_job_logs_job_name | btree | job_name, executed_at | não | sim |  |
| public.custom_field_definitions | custom_field_definitions_pkey | btree | id | sim | sim |  |
| public.custom_field_definitions | idx_custom_field_definitions_empresa_id | btree | empresa_id | não | sim |  |
| public.custom_field_values | custom_field_values_definition_id_entity_id_key | btree | definition_id, entity_id | sim | sim |  |
| public.custom_field_values | custom_field_values_pkey | btree | id | sim | sim |  |
| public.darfs | darfs_pkey | btree | id | sim | sim |  |
| public.darfs | idx_darfs_alerta_id_fk | btree | alerta_id | não | sim |  |
| public.darfs | idx_darfs_empresa_id | btree | empresa_id | não | sim |  |
| public.digest_envios_log | digest_envios_log_pkey | btree | id | sim | sim |  |
| public.digest_envios_log | idx_digest_envios_log_created_at | btree | created_at | não | sim |  |
| public.dispositivos_conhecidos | dispositivos_conhecidos_pkey | btree | id | sim | sim |  |
| public.dispositivos_conhecidos | idx_dispositivos_conhecidos_user_id_fk | btree | user_id | não | sim |  |
| public.divergencias_conciliacao | divergencias_conciliacao_pkey | btree | id | sim | sim |  |
| public.divergencias_conciliacao | idx_divergencias_conciliacao_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  |
| public.divergencias_conciliacao | idx_divergencias_conciliacao_resolvido_por_fk | btree | resolvido_por | não | sim |  |
| public.divergencias_conciliacao | idx_divergencias_conciliacao_transacao_id_fk | btree | transacao_id | não | sim |  |
| public.edge_function_logs | edge_function_logs_pkey | btree | id | sim | sim |  |
| public.edge_function_logs | idx_edge_logs_created | btree | created_at | não | sim |  |
| public.edge_function_logs | idx_edge_logs_function | btree | function_name, created_at | não | sim |  |
| public.elisao_alertas | elisao_alertas_pkey | btree | id | sim | sim |  |
| public.elisao_alertas | idx_elisao_alertas_empresa_id | btree | empresa_id | não | sim |  |
| public.elisao_creditos_auditoria | elisao_creditos_auditoria_pkey | btree | id | sim | sim |  |
| public.elisao_creditos_auditoria | idx_elisao_creditos_auditoria_empresa_id | btree | empresa_id | não | sim |  |
| public.elisao_creditos_auditoria | idx_elisao_creditos_auditoria_nota_fiscal_id_fk | btree | nota_fiscal_id | não | sim |  |
| public.elisao_creditos_auditoria | idx_elisao_creditos_auditoria_regra_id_fk | btree | regra_id | não | sim |  |
| public.elisao_regras_creditos | elisao_regras_creditos_codigo_key | btree | codigo | sim | sim |  |
| public.elisao_regras_creditos | elisao_regras_creditos_pkey | btree | id | sim | sim |  |
| public.elisao_simulacoes_regime | elisao_simulacoes_regime_pkey | btree | id | sim | sim |  |
| public.elisao_simulacoes_regime | idx_elisao_sim_empresa | btree | empresa_id, created_at | não | sim |  |
| public.elisao_tarefas_acionaveis | elisao_tarefas_acionaveis_pkey | btree | id | sim | sim |  |
| public.elisao_tarefas_acionaveis | idx_elisao_tarefas_acionaveis_empresa_id | btree | empresa_id | não | sim |  |
| public.email_verifications | email_verifications_pkey | btree | id | sim | sim |  |
| public.email_verifications | email_verifications_token_hash_key | btree | token_hash | sim | sim |  |
| public.empresas | empresas_pkey | btree | id | sim | sim |  |
| public.empresas | uniq_empresas_is_padrao | btree |  | sim | sim | `is_padrao` |
| public.empresas_certificados | empresas_certificados_empresa_id_cnpj_ambiente_key | btree | empresa_id, cnpj, ambiente | sim | sim |  |
| public.empresas_certificados | empresas_certificados_pkey | btree | id | sim | sim |  |
| public.empresas_certificados | idx_empresas_certificados_criado_por | btree | criado_por | não | sim | `(criado_por IS NOT NULL)` |
| public.empresas_certificados | idx_empresas_certificados_criado_por_fk | btree | criado_por | não | sim |  |
| public.entregas_obrigacoes | entregas_obrigacoes_pkey | btree | id | sim | sim |  |
| public.entregas_obrigacoes | entregas_obrigacoes_unica | btree | empresa_id, obrigacao_id, competencia | sim | sim |  |
| public.entregas_obrigacoes | idx_entregas_obrigacoes_competencia | btree | competencia | não | sim |  |
| public.entregas_obrigacoes | idx_entregas_obrigacoes_registrado_por_fk | btree | registrado_por | não | sim |  |
| public.estrategias_elisao | estrategias_elisao_codigo_key | btree | codigo | sim | sim |  |
| public.estrategias_elisao | estrategias_elisao_pkey | btree | id | sim | sim |  |
| public.estrategias_elisao_catalogo | estrategias_elisao_catalogo_codigo_key | btree | codigo | sim | sim |  |
| public.estrategias_elisao_catalogo | estrategias_elisao_catalogo_pkey | btree | id | sim | sim |  |
| public.eventos_contabilizacao_log | eventos_contabilizacao_log_pkey | btree | id | sim | sim |  |
| public.eventos_contabilizacao_log | idx_eventos_contabilizacao_log_empresa_id | btree | empresa_id | não | sim |  |
| public.eventos_contabilizacao_log | idx_eventos_contabilizacao_log_regra_id_fk | btree | regra_id | não | sim |  |
| public.eventos_contabilizacao_log | uq_eventos_contab_sucesso | btree | tipo_evento, evento_id | sim | sim | `(status = 'sucesso'::text)` |
| public.evidencias_pacotes | evidencias_pacotes_pkey | btree | id | sim | sim |  |
| public.evidencias_pacotes | idx_evidencias_pacotes_verificacao_id_fk | btree | verificacao_id | não | sim |  |
| public.execucoes_cobranca | execucoes_cobranca_pkey | btree | id | sim | sim |  |
| public.execucoes_cobranca | idx_execucoes_cobranca_empresa_id | btree | empresa_id | não | sim |  |
| public.execucoes_regua_cobranca | execucoes_regua_cobranca_pkey | btree | id | sim | sim |  |
| public.execucoes_regua_cobranca | idx_execucoes_regua_empresa | btree | empresa_id, created_at | não | sim |  |
| public.execucoes_regua_cobranca | uq_execucoes_regua_dia | btree | conta_receber_id, etapa | sim | sim | `((conta_receber_id IS NOT NULL) AND (canal IS NOT NULL))` |
| public.expert_conversations | expert_conversations_pkey | btree | id | sim | sim |  |
| public.expert_conversations | idx_expert_conversations_empresa_id | btree | empresa_id | não | sim |  |
| public.expert_conversations | idx_expert_conversations_user_id_fk | btree | user_id | não | sim |  |
| public.expert_messages | expert_messages_pkey | btree | id | sim | sim |  |
| public.expert_messages | idx_expert_messages_conversation_id_fk | btree | conversation_id | não | sim |  |
| public.extrato_bancario | extrato_bancario_hash_transacao_key | btree | hash_transacao | sim | sim |  |
| public.extrato_bancario | extrato_bancario_pkey | btree | id | sim | sim |  |
| public.extrato_bancario | idx_extrato_bancario_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  |
| public.faixas_simples_nacional | faixas_simples_anexo_faixa_key | btree | anexo, faixa, vigente_de | sim | sim |  |
| public.faixas_simples_nacional | faixas_simples_nacional_pkey | btree | id | sim | sim |  |
| public.faturamento_mensal | faturamento_mensal_pkey | btree | id | sim | sim |  |
| public.faturamento_mensal | idx_faturamento_mensal_created_by_fk | btree | created_by | não | sim |  |
| public.faturamento_mensal | ux_faturamento_mensal_empresa_ano_mes | btree | empresa_id, ano, mes | sim | sim |  |
| public.fechamentos_tributarios | fechamentos_tributarios_empresa_id_ano_mes_key | btree | empresa_id, ano, mes | sim | sim |  |
| public.fechamentos_tributarios | fechamentos_tributarios_pkey | btree | id | sim | sim |  |
| public.fechamentos_tributarios | idx_fechamentos_tributarios_fechado_por_fk | btree | fechado_por | não | sim |  |
| public.feedback_conciliacao_ia | feedback_conciliacao_ia_pkey | btree | id | sim | sim |  |
| public.feedback_conciliacao_ia | idx_feedback_conciliacao_ia_created_by_fk | btree | created_by | não | sim |  |
| public.feedback_conciliacao_ia | idx_feedback_conciliacao_ia_transacao_id_fk | btree | transacao_id | não | sim |  |
| public.feedback_conciliacao_ia | idx_feedback_conciliacao_ia_user_id_fk | btree | user_id | não | sim |  |
| public.fila_cobrancas | fila_cobrancas_pkey | btree | id | sim | sim |  |
| public.fila_cobrancas | idx_fila_cobrancas_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.fila_cobrancas | idx_fila_cobrancas_conta_receber_id_fk | btree | conta_receber_id | não | sim |  |
| public.fila_cobrancas | idx_fila_cobrancas_empresa_id | btree | empresa_id | não | sim |  |
| public.fila_cobrancas | idx_fila_cobrancas_etapa_id_fk | btree | etapa_id | não | sim |  |
| public.fluxos_aprovacao_niveis | fluxos_aprovacao_niveis_pkey | btree | id | sim | sim |  |
| public.fluxos_aprovacao_niveis | idx_fluxos_aprovacao_niveis_configuracao_id_fk | btree | configuracao_id | não | sim |  |
| public.fluxos_aprovacao_niveis | idx_fluxos_aprovacao_niveis_empresa_id | btree | empresa_id | não | sim |  |
| public.folha_pagamento | folha_pagamento_pkey | btree | id | sim | sim |  |
| public.folha_pagamento | idx_folha_pagamento_created_by_fk | btree | created_by | não | sim |  |
| public.folha_pagamento | ux_folha_pagamento_empresa_ano_mes | btree | empresa_id, ano, mes | sim | sim |  |
| public.formas_pagamento | formas_pagamento_pkey | btree | id | sim | sim |  |
| public.formas_pagamento | idx_formas_pagamento_empresa_id | btree | empresa_id | não | sim |  |
| public.fornecedores | fornecedores_cnpj_key | btree | cnpj | sim | sim |  |
| public.fornecedores | fornecedores_pkey | btree | id | sim | sim |  |
| public.fornecedores | idx_fornecedores_empresa_id | btree | empresa_id | não | sim |  |
| public.fornecedores | idx_fornecedores_user_id_fk | btree | user_id | não | sim |  |
| public.frontend_error_alert_state | frontend_error_alert_state_pkey | btree | id | sim | sim |  |
| public.frontend_error_alert_state | frontend_error_alert_state_signature_key | btree | signature | sim | sim |  |
| public.frontend_error_alert_state | uq_frontend_error_alert_state_assinatura | btree | assinatura | sim | sim |  |
| public.frontend_error_logs | frontend_error_logs_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_01 | frontend_error_logs_2026_01_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_02 | frontend_error_logs_2026_02_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_03 | frontend_error_logs_2026_03_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_04 | frontend_error_logs_2026_04_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_05 | frontend_error_logs_2026_05_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_06 | frontend_error_logs_2026_06_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_07 | frontend_error_logs_2026_07_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_08 | frontend_error_logs_2026_08_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_09 | frontend_error_logs_2026_09_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_2026_10 | frontend_error_logs_2026_10_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_logs_default | frontend_error_logs_default_pkey | btree | id, created_at | sim | sim |  |
| public.frontend_error_silence_digest_log | frontend_error_silence_digest_log_pkey | btree | id | sim | sim |  |
| public.frontend_performance_logs | frontend_performance_logs_pkey | btree | id | sim | sim |  |
| public.frontend_performance_logs | idx_frontend_performance_logs_user_id_fk | btree | user_id | não | sim |  |
| public.frontend_performance_logs | idx_performance_logs_created_at | btree | created_at | não | sim |  |
| public.geo_blocks | geo_blocks_country_code_key | btree | country_code | sim | sim |  |
| public.geo_blocks | geo_blocks_pkey | btree | id | sim | sim |  |
| public.geo_blocks | idx_geo_blocks_blocked_by_fk | btree | blocked_by | não | sim |  |
| public.glossario_tributario | glossario_tributario_pkey | btree | id | sim | sim |  |
| public.glossario_tributario | glossario_tributario_termo_key | btree | termo | sim | sim |  |
| public.health_scores_operacionais | health_scores_operacionais_pkey | btree | id | sim | sim |  |
| public.health_scores_operacionais | idx_health_scores_operacionais_empresa_id | btree | empresa_id | não | sim |  |
| public.historico_analises_preditivas | historico_analises_preditivas_pkey | btree | id | sim | sim |  |
| public.historico_analises_preditivas | idx_historico_analises_preditivas_empresa_id | btree | empresa_id | não | sim |  |
| public.historico_cobranca | historico_cobranca_pkey | btree | id | sim | sim |  |
| public.historico_cobranca | idx_historico_cobranca_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.historico_cobranca | idx_historico_cobranca_conta_receber_id_fk | btree | conta_receber_id | não | sim |  |
| public.historico_cobranca | idx_historico_cobranca_empresa_id | btree | empresa_id | não | sim |  |
| public.historico_cobranca_whatsapp | historico_cobranca_whatsapp_pkey | btree | id | sim | sim |  |
| public.historico_cobranca_whatsapp | idx_historico_cobranca_whatsapp_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.historico_cobranca_whatsapp | idx_historico_cobranca_whatsapp_empresa_id | btree | empresa_id | não | sim |  |
| public.historico_cobrancas_boletos | historico_cobrancas_boletos_pkey | btree | id | sim | sim |  |
| public.historico_conciliacao_ia | historico_conciliacao_ia_pkey | btree | id | sim | sim |  |
| public.historico_conciliacao_ia | idx_historico_conciliacao_ia_aprovado_por_fk | btree | aprovado_por | não | sim |  |
| public.historico_conciliacao_ia | idx_historico_conciliacao_ia_conta_receber_id_fk | btree | conta_receber_id | não | sim |  |
| public.historico_conciliacao_ia | idx_historico_conciliacao_ia_created_by_fk | btree | created_by | não | sim |  |
| public.historico_conciliacao_ia | idx_historico_conciliacao_ia_sessao | btree | sessao_id | não | sim |  |
| public.historico_conciliacao_ia | idx_historico_conciliacao_ia_sessao_id_fk | btree | sessao_id | não | sim |  |
| public.historico_relatorios | historico_relatorios_pkey | btree | id | sim | sim |  |
| public.historico_relatorios | idx_historico_relatorios_relatorio_agendado_id_fk | btree | relatorio_agendado_id | não | sim |  |
| public.historico_score_saude | historico_score_saude_pkey | btree | id | sim | sim |  |
| public.historico_score_saude | idx_historico_score_saude_empresa_id | btree | empresa_id | não | sim |  |
| public.incentivos_fiscais | idx_incentivos_empresa | btree | empresa_id, ativo | não | sim |  |
| public.incentivos_fiscais | incentivos_fiscais_pkey | btree | id | sim | sim |  |
| public.index_usage_snapshots | index_usage_snapshots_pkey | btree | id | sim | sim |  |
| public.index_usage_snapshots | index_usage_snapshots_unico | btree | snapshot_date, schema_name, index_name | sim | sim |  |
| public.indices_uso_excecoes | indices_uso_excecoes_index_name_key | btree | index_name | sim | sim |  |
| public.indices_uso_excecoes | indices_uso_excecoes_pkey | btree | id | sim | sim |  |
| public.integration_secrets | idx_integration_secrets_empresa_id | btree | empresa_id | não | sim |  |
| public.integration_secrets | integration_secrets_chave_key | btree | chave | sim | sim |  |
| public.integration_secrets | integration_secrets_pkey | btree | id | sim | sim |  |
| public.integrity_alerts | idx_integrity_alerts_domain | btree | domain, severity, created_at | não | sim |  |
| public.integrity_alerts | idx_integrity_alerts_open | btree | created_at | não | sim | `(resolved_at IS NULL)` |
| public.integrity_alerts | integrity_alerts_domain_invariant_alert_hour_key | btree | domain, invariant, alert_hour | sim | sim |  |
| public.integrity_alerts | integrity_alerts_pkey | btree | id | sim | sim |  |
| public.ip_whitelist | ip_whitelist_pkey | btree | id | sim | sim |  |
| public.itens_lista_iss | idx_itens_lista_iss_vigencia | btree | vigente_de, vigente_ate | não | sim |  |
| public.itens_lista_iss | itens_lista_iss_codigo_key | btree | codigo | sim | sim |  |
| public.itens_lista_iss | itens_lista_iss_pkey | btree | id | sim | sim |  |
| public.itens_pedido_compra | idx_itens_pedido_compra_pedido_id_fk | btree | pedido_id | não | sim |  |
| public.itens_pedido_compra | itens_pedido_compra_pkey | btree | id | sim | sim |  |
| public.kpis_operacionais | idx_kpis_operacionais_empresa_id | btree | empresa_id | não | sim |  |
| public.kpis_operacionais | kpis_operacionais_pkey | btree | id | sim | sim |  |
| public.kpis_operacionais | kpis_operacionais_unique | btree | user_id, nome | sim | sim |  |
| public.lancamentos_contabeis | idx_lancamentos_contabeis_empresa_user | btree | empresa_id, user_id | não | sim |  |
| public.lancamentos_contabeis | lancamentos_contabeis_empresa_data_idx | btree | empresa_id, data_lancamento | não | sim |  |
| public.lancamentos_contabeis | lancamentos_contabeis_pkey | btree | id | sim | sim |  |
| public.login_attempts | idx_login_attempts_email | btree | email | não | sim |  |
| public.login_attempts | idx_login_attempts_email_last | btree | last_attempt_at | não | sim |  |
| public.login_attempts | idx_login_attempts_locked_until | btree | locked_until | não | sim |  |
| public.login_attempts | login_attempts_pkey | btree | id | sim | sim |  |
| public.logs_baixa_automatica | logs_baixa_automatica_pkey | btree | id | sim | sim |  |
| public.logs_conciliacao_retroativa | idx_logs_conciliacao_retroativa_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  |
| public.logs_conciliacao_retroativa | idx_logs_conciliacao_retroativa_empresa_id | btree | empresa_id | não | sim |  |
| public.logs_conciliacao_retroativa | logs_conciliacao_retroativa_pkey | btree | id | sim | sim |  |
| public.metas_financeiras | idx_metas_financeiras_empresa_id | btree | empresa_id | não | sim |  |
| public.metas_financeiras | idx_metas_financeiras_user_id_fk | btree | user_id | não | sim |  |
| public.metas_financeiras | metas_financeiras_pkey | btree | id | sim | sim |  |
| public.mfa_sessions | mfa_sessions_pkey | btree | id | sim | sim |  |
| public.movimentacoes | idx_movimentacoes_categoria_id | btree | categoria_id | não | sim |  |
| public.movimentacoes | idx_movimentacoes_conta_bancaria_id | btree | conta_bancaria_id | não | sim |  |
| public.movimentacoes | idx_movimentacoes_empresa_data | btree | empresa_id, data_movimentacao | não | sim | `(deleted_at IS NULL)` |
| public.movimentacoes | idx_movimentacoes_empresa_id | btree | empresa_id | não | sim |  |
| public.movimentacoes | movimentacoes_pkey | btree | id | sim | sim |  |
| public.mv_benchmark_setorial | idx_mv_benchmark_regime | btree | regime | sim | sim |  |
| public.mv_performance_alerts_weekly | idx_mv_performance_alerts_weekly_pkey | btree | week_start, source, severity | sim | sim |  |
| public.n8n_dispatch_logs | idx_n8n_dispatch_logs_config_id | btree | config_id | não | sim | `(config_id IS NOT NULL)` |
| public.n8n_dispatch_logs | idx_n8n_dispatch_logs_config_id_fk | btree | config_id | não | sim |  |
| public.n8n_dispatch_logs | n8n_dispatch_logs_pkey | btree | id | sim | sim |  |
| public.n8n_workflow_configs | idx_n8n_workflow_configs_created_by | btree | created_by | não | sim | `(created_by IS NOT NULL)` |
| public.n8n_workflow_configs | n8n_workflow_configs_pkey | btree | id | sim | sim |  |
| public.ncms | idx_ncms_vigencia | btree | vigente_de, vigente_ate | não | sim |  |
| public.ncms | ncms_codigo_key | btree | codigo | sim | sim |  |
| public.ncms | ncms_pkey | btree | id | sim | sim |  |
| public.negativacoes | idx_negativacoes_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.negativacoes | idx_negativacoes_conta_receber_id_fk | btree | conta_receber_id | não | sim |  |
| public.negativacoes | idx_negativacoes_created_by | btree | created_by | não | sim |  |
| public.negativacoes | idx_negativacoes_empresa_id | btree | empresa_id | não | sim |  |
| public.negativacoes | negativacoes_pkey | btree | id | sim | sim |  |
| public.new_device_alerts | idx_new_device_alerts_device_id_fk | btree | device_id | não | sim |  |
| public.new_device_alerts | new_device_alerts_pkey | btree | id | sim | sim |  |
| public.nfe_eventos | idx_nfe_eventos_created_by | btree | created_by | não | sim | `(created_by IS NOT NULL)` |
| public.nfe_eventos | idx_nfe_eventos_created_by_fk | btree | created_by | não | sim |  |
| public.nfe_eventos | nfe_eventos_chave_tipo_seq_uk | btree | chave_acesso, tipo_evento, sequencial | sim | sim |  |
| public.nfe_eventos | nfe_eventos_pkey | btree | id | sim | sim |  |
| public.nfe_recebidas | idx_nfe_rec_dest | btree | cnpj_destinatario, data_emissao | não | sim |  |
| public.nfe_recebidas | idx_nfe_rec_empresa | btree | empresa_id | não | sim |  |
| public.nfe_recebidas | idx_nfe_recebidas_conta_pagar_id_fk | btree | conta_pagar_id | não | sim |  |
| public.nfe_recebidas | nfe_recebidas_chave_acesso_key | btree | chave_acesso | sim | sim |  |
| public.nfe_recebidas | nfe_recebidas_pkey | btree | id | sim | sim |  |
| public.nfe_recebidas | uq_nfe_rec_conta_pagar | btree | conta_pagar_id | sim | sim | `(conta_pagar_id IS NOT NULL)` |
| public.notas_fiscais | idx_notas_fiscais_empresa_id | btree | empresa_id | não | sim |  |
| public.notas_fiscais | notas_fiscais_chave_acesso_key | btree | chave_acesso | sim | sim |  |
| public.notas_fiscais | notas_fiscais_pkey | btree | id | sim | sim |  |
| public.notas_fiscais_ocr | idx_notas_fiscais_ocr_empresa_id | btree | empresa_id | não | sim |  |
| public.notas_fiscais_ocr | notas_fiscais_ocr_pkey | btree | id | sim | sim |  |
| public.notification_history | idx_notification_history_source | btree | source, source_ref | não | sim |  |
| public.notification_history | idx_notification_history_user_created | btree | user_id, created_at | não | sim |  |
| public.notification_history | idx_notification_history_user_unread | btree | user_id, read_at | não | sim | `(read_at IS NULL)` |
| public.notification_history | notification_history_pkey | btree | id | sim | sim |  |
| public.open_finance_consents | idx_open_finance_consents_user_id_fk | btree | user_id | não | sim |  |
| public.open_finance_consents | open_finance_consents_pkey | btree | id | sim | sim |  |
| public.operacoes_icms | idx_operacoes_icms_empresa_id | btree | empresa_id | não | sim |  |
| public.operacoes_icms | operacoes_icms_pkey | btree | id | sim | sim |  |
| public.operacoes_tributaveis | idx_operacoes_tributaveis_empresa_id | btree | empresa_id | não | sim |  |
| public.operacoes_tributaveis | operacoes_tributaveis_pkey | btree | id | sim | sim |  |
| public.oportunidades_elisao | idx_oportunidades_elisao_empresa_id | btree | empresa_id | não | sim |  |
| public.oportunidades_elisao | idx_oportunidades_elisao_estrategia_id_fk | btree | estrategia_id | não | sim |  |
| public.oportunidades_elisao | oportunidades_elisao_pkey | btree | id | sim | sim |  |
| public.organizacao_membros | organizacao_membros_pkey | btree | id | sim | sim |  |
| public.organizacao_membros | uq_org_membro | btree | organizacao_id, usuario_id | sim | sim |  |
| public.organizacoes | organizacoes_cnpj_key | btree | cnpj | sim | sim |  |
| public.organizacoes | organizacoes_pkey | btree | id | sim | sim |  |
| public.overlay_rejeicoes_auditoria | idx_overlay_rejeicoes_auditoria_empresa_id | btree | empresa_id | não | sim |  |
| public.overlay_rejeicoes_auditoria | overlay_rejeicoes_auditoria_pkey | btree | id | sim | sim |  |
| public.pagamentos_recorrentes | idx_pag_recorr_proxima | btree | proxima_geracao | não | sim | `ativo` |
| public.pagamentos_recorrentes | idx_pagamentos_recorrentes_empresa_id | btree | empresa_id | não | sim |  |
| public.pagamentos_recorrentes | pagamentos_recorrentes_pkey | btree | id | sim | sim |  |
| public.parcelas_acordo | idx_parcelas_acordo_acordo_id_fk | btree | acordo_id | não | sim |  |
| public.parcelas_acordo | parcelas_acordo_pkey | btree | id | sim | sim |  |
| public.partidas_contabeis | idx_partidas_contabeis_conta_contabil_id_fk | btree | conta_contabil_id | não | sim |  |
| public.partidas_contabeis | idx_partidas_contabeis_empresa_id | btree | empresa_id | não | sim |  |
| public.partidas_contabeis | idx_partidas_contabeis_lancamento_id | btree | lancamento_id | não | sim |  |
| public.partidas_contabeis | partidas_contabeis_pkey | btree | id | sim | sim |  |
| public.password_reset_requests | idx_password_reset_requests_reviewed_by_fk | btree | reviewed_by | não | sim |  |
| public.password_reset_requests | password_reset_requests_pkey | btree | id | sim | sim |  |
| public.password_reset_tokens | password_reset_tokens_pkey | btree | id | sim | sim |  |
| public.password_reset_tokens | password_reset_tokens_token_hash_key | btree | token_hash | sim | sim |  |
| public.pedidos_compra | idx_pedidos_compra_centro_custo_id | btree | centro_custo_id | não | sim |  |
| public.pedidos_compra | idx_pedidos_compra_empresa_id | btree | empresa_id | não | sim |  |
| public.pedidos_compra | idx_pedidos_compra_fornecedor_id_fk | btree | fornecedor_id | não | sim |  |
| public.pedidos_compra | idx_pedidos_compra_user_id | btree | user_id | não | sim |  |
| public.pedidos_compra | pedidos_compra_pkey | btree | id | sim | sim |  |
| public.per_dcomp | idx_per_dcomp_created_by_fk | btree | created_by | não | sim |  |
| public.per_dcomp | idx_per_dcomp_empresa | btree | empresa_id | não | sim |  |
| public.per_dcomp | per_dcomp_pkey | btree | id | sim | sim |  |
| public.performance_alerts | idx_perf_alerts_created_severity | btree | created_at, severity | não | sim |  |
| public.performance_alerts | performance_alerts_pkey | btree | id | sim | sim |  |
| public.performance_alerts | performance_alerts_source_alert_key_alert_hour_key | btree | source, alert_key, alert_hour | sim | sim |  |
| public.permissions | permissions_name_key | btree | name | sim | sim |  |
| public.permissions | permissions_pkey | btree | id | sim | sim |  |
| public.pg_stat_statements_baseline | idx_pgss_baseline_captured_at | btree | captured_at | não | sim |  |
| public.pg_stat_statements_baseline | idx_pgss_baseline_created_at | btree | created_at | não | sim |  |
| public.pg_stat_statements_baseline | idx_pgss_baseline_label | btree | label | não | sim |  |
| public.pg_stat_statements_baseline | idx_pgss_baseline_label_captured | btree | label, captured_at | não | sim |  |
| public.pg_stat_statements_baseline | pg_stat_statements_baseline_pkey | btree | id | sim | sim |  |
| public.pix_templates | idx_pix_templates_empresa_id | btree | empresa_id | não | sim |  |
| public.pix_templates | pix_templates_pkey | btree | id | sim | sim |  |
| public.plano_contas | idx_plano_contas_empresa_id_fk | btree | empresa_id | não | sim |  |
| public.plano_contas | idx_plano_contas_user_id_fk | btree | user_id | não | sim |  |
| public.plano_contas | plano_contas_empresa_codigo_uidx | btree | empresa_id, codigo | sim | sim | `(empresa_id IS NOT NULL)` |
| public.plano_contas | plano_contas_pkey | btree | id | sim | sim |  |
| public.planos_acao | idx_planos_acao_user | btree | user_id | não | sim |  |
| public.planos_acao | planos_acao_pkey | btree | id | sim | sim |  |
| public.portal_cliente_acessos | idx_portal_cliente_acessos_token_id_fk | btree | token_id | não | sim |  |
| public.portal_cliente_acessos | portal_cliente_acessos_pkey | btree | id | sim | sim |  |
| public.portal_cliente_tokens | portal_cliente_tokens_pkey | btree | id | sim | sim |  |
| public.portal_cliente_tokens | portal_cliente_tokens_token_key | btree | token | sim | sim |  |
| public.prejuizos_fiscais | idx_prejuizos_fiscais_created_by_fk | btree | created_by | não | sim |  |
| public.prejuizos_fiscais | idx_prejuizos_fiscais_empresa_id | btree | empresa_id | não | sim |  |
| public.prejuizos_fiscais | prejuizos_fiscais_pkey | btree | id | sim | sim |  |
| public.profiles | idx_profiles_empresa_id | btree | empresa_id | não | sim |  |
| public.profiles | profiles_pkey | btree | id | sim | sim |  |
| public.profiles | profiles_user_id_key | btree | user_id | sim | sim |  |
| public.projecoes_reforma | idx_projecoes_reforma_empresa_id | btree | empresa_id | não | sim |  |
| public.projecoes_reforma | projecoes_reforma_pkey | btree | id | sim | sim |  |
| public.protestos | idx_protestos_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.protestos | idx_protestos_conta_receber_id_fk | btree | conta_receber_id | não | sim |  |
| public.protestos | idx_protestos_created_by | btree | created_by | não | sim |  |
| public.protestos | idx_protestos_empresa_id | btree | empresa_id | não | sim |  |
| public.protestos | protestos_pkey | btree | id | sim | sim |  |
| public.protocolos_st | protocolos_st_codigo_key | btree | codigo | sim | sim |  |
| public.protocolos_st | protocolos_st_pkey | btree | id | sim | sim |  |
| public.protocolos_st_ncms | idx_protocolos_st_ncms_ncm_id_fk | btree | ncm_id | não | sim |  |
| public.protocolos_st_ncms | idx_protocolos_st_ncms_protocolo_id_fk | btree | protocolo_id | não | sim |  |
| public.protocolos_st_ncms | idx_pst_ncms_codigo | btree | ncm_codigo | não | sim |  |
| public.protocolos_st_ncms | protocolos_st_ncms_pkey | btree | id | sim | sim |  |
| public.protocolos_st_ufs | protocolos_st_ufs_pkey | btree | id | sim | sim |  |
| public.protocolos_st_ufs | protocolos_st_ufs_unique | btree | protocolo_id, uf | sim | sim |  |
| public.push_subscriptions | push_subscriptions_pkey | btree | id | sim | sim |  |
| public.push_subscriptions | push_subscriptions_unique | btree | user_id, endpoint | sim | sim |  |
| public.query_telemetry | idx_query_telemetry_created_at | btree | created_at | não | sim |  |
| public.query_telemetry | idx_query_telemetry_empresa_id | btree | empresa_id | não | sim |  |
| public.query_telemetry | idx_query_telemetry_severity | btree | severity | não | sim |  |
| public.query_telemetry | idx_query_telemetry_user_created | btree | user_id, created_at | não | sim |  |
| public.query_telemetry | query_telemetry_pkey | btree | id | sim | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_created | btree | created_at | não | sim |  |
| public.rate_limit_logs | rate_limit_logs_pkey | btree | id | sim | sim |  |
| public.recomendacoes_metas_ia | idx_recomendacoes_metas_ia_empresa_id | btree | empresa_id | não | sim |  |
| public.recomendacoes_metas_ia | recomendacoes_metas_ia_pkey | btree | id | sim | sim |  |
| public.regime_decision_cache | idx_regime_cache_exp | btree | expires_at | não | sim |  |
| public.regime_decision_cache | regime_cache_unico | btree | empresa_id, ano, mes | sim | sim |  |
| public.regime_decision_cache | regime_decision_cache_pkey | btree | id | sim | sim |  |
| public.regimes_especiais_empresa | idx_regimes_especiais_empresa_empresa_id | btree | empresa_id | não | sim |  |
| public.regimes_especiais_empresa | regimes_especiais_empresa_pkey | btree | id | sim | sim |  |
| public.regimes_simulados | idx_regimes_simulados_created_by_fk | btree | created_by | não | sim |  |
| public.regimes_simulados | idx_regimes_simulados_empresa_id | btree | empresa_id | não | sim |  |
| public.regimes_simulados | regimes_simulados_pkey | btree | id | sim | sim |  |
| public.regimes_tributarios | idx_regimes_tributarios_empresa_id | btree | empresa_id | não | sim |  |
| public.regimes_tributarios | regimes_tributarios_pkey | btree | id | sim | sim |  |
| public.regras_conciliacao | idx_regras_conciliacao_created_by_fk | btree | created_by | não | sim |  |
| public.regras_conciliacao | idx_regras_conciliacao_empresa_id | btree | empresa_id | não | sim |  |
| public.regras_conciliacao | idx_regras_conciliacao_user_id_fk | btree | user_id | não | sim |  |
| public.regras_conciliacao | regras_conciliacao_pkey | btree | id | sim | sim |  |
| public.regras_contabilizacao_automatica | regra_nome_unico_empresa | btree | empresa_id, nome | sim | sim |  |
| public.regras_contabilizacao_automatica | regras_contabilizacao_automatica_pkey | btree | id | sim | sim |  |
| public.regras_duplicidade | idx_regras_duplicidade_empresa_id | btree | empresa_id | não | sim |  |
| public.regras_duplicidade | regras_duplicidade_pkey | btree | id | sim | sim |  |
| public.regras_roteamento_financeiro | idx_regras_roteamento_financeiro_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  |
| public.regras_roteamento_financeiro | idx_regras_roteamento_financeiro_empresa_id | btree | empresa_id | não | sim |  |
| public.regras_roteamento_financeiro | regras_roteamento_financeiro_pkey | btree | id | sim | sim |  |
| public.regua_cobranca | idx_regua_cobranca_empresa_id | btree | empresa_id | não | sim |  |
| public.regua_cobranca | regua_cobranca_pkey | btree | id | sim | sim |  |
| public.regua_cobranca_etapas | idx_regua_cobranca_etapas_regua_id_fk | btree | regua_id | não | sim |  |
| public.regua_cobranca_etapas | idx_regua_cobranca_etapas_template_id_fk | btree | template_id | não | sim |  |
| public.regua_cobranca_etapas | regua_cobranca_etapas_pkey | btree | id | sim | sim |  |
| public.regua_cobranca_status | idx_regua_cobranca_status_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.regua_cobranca_status | idx_regua_cobranca_status_conta_receber_id_fk | btree | conta_receber_id | não | sim |  |
| public.regua_cobranca_status | idx_regua_cobranca_status_empresa_id | btree | empresa_id | não | sim |  |
| public.regua_cobranca_status | idx_regua_cobranca_status_titulo_id_fk | btree | titulo_id | não | sim |  |
| public.regua_cobranca_status | regua_cobranca_status_pkey | btree | id | sim | sim |  |
| public.relatorios_agendados | idx_relatorios_agendados_empresa_id | btree | empresa_id | não | sim |  |
| public.relatorios_agendados | relatorios_agendados_pkey | btree | id | sim | sim |  |
| public.relatorios_tributarios_agendados | idx_relatorios_tributarios_agendados_empresa | btree | empresa_id | não | sim |  |
| public.relatorios_tributarios_agendados | relatorios_tributarios_agendados_pkey | btree | id | sim | sim |  |
| public.resumos_executivos_semanais | idx_resumos_executivos_semanais_empresa_id | btree | empresa_id | não | sim |  |
| public.resumos_executivos_semanais | resumos_executivos_semanais_pkey | btree | id | sim | sim |  |
| public.retencao_politicas | retencao_politicas_pkey | btree | id | sim | sim |  |
| public.retencao_politicas | retencao_politicas_tabela_key | btree | tabela | sim | sim |  |
| public.retencoes_fonte | idx_retencoes_fonte_empresa_id | btree | empresa_id | não | sim |  |
| public.retencoes_fonte | retencoes_fonte_pkey | btree | id | sim | sim |  |
| public.risk_rules | idx_risk_rules_empresa_id | btree | empresa_id | não | sim |  |
| public.risk_rules | risk_rules_pkey | btree | id | sim | sim |  |
| public.role_permissions | idx_role_permissions_permission_id_fk | btree | permission_id | não | sim |  |
| public.role_permissions | role_permissions_pkey | btree | id | sim | sim |  |
| public.role_permissions | role_permissions_role_permission_id_key | btree | role, permission_id | sim | sim |  |
| public.rpc_observability_metrics | rpc_observability_metrics_pkey | btree | id | sim | sim |  |
| public.runtime_error_logs | runtime_error_logs_pkey | btree | id | sim | sim |  |
| public.saved_filter_subscriptions | saved_filter_subscriptions_filter_id_user_id_canal_key | btree | filter_id, user_id, canal | sim | sim |  |
| public.saved_filter_subscriptions | saved_filter_subscriptions_pkey | btree | id | sim | sim |  |
| public.saved_filters | idx_saved_filters_created_by_fk | btree | created_by | não | sim |  |
| public.saved_filters | idx_saved_filters_empresa | btree | empresa_id | não | sim |  |
| public.saved_filters | idx_saved_filters_user_entity | btree | user_id, entity_type | não | sim |  |
| public.saved_filters | saved_filters_pkey | btree | id | sim | sim |  |
| public.saved_filters | saved_filters_unique | btree | user_id, entity_type, name | sim | sim |  |
| public.scim_operations_log | idx_scim_operations_log_empresa_id | btree | empresa_id | não | sim |  |
| public.scim_operations_log | scim_operations_log_pkey | btree | id | sim | sim |  |
| public.scim_setup_checklist | scim_setup_checklist_pkey | btree | id | sim | sim |  |
| public.scim_tokens | idx_scim_tokens_created_by_fk | btree | created_by | não | sim |  |
| public.scim_tokens | idx_scim_tokens_empresa_id | btree | empresa_id | não | sim |  |
| public.scim_tokens | idx_scim_tokens_provider_id_fk | btree | provider_id | não | sim |  |
| public.scim_tokens | scim_tokens_pkey | btree | id | sim | sim |  |
| public.scim_tokens | scim_tokens_token_hash_key | btree | token_hash | sim | sim |  |
| public.security_alerts | idx_security_alerts_empresa_id | btree | empresa_id | não | sim |  |
| public.security_alerts | security_alerts_pkey | btree | id | sim | sim |  |
| public.security_audit_logs | idx_security_audit_logs_user_id_fk | btree | user_id | não | sim |  |
| public.security_audit_logs | security_audit_logs_pkey | btree | id | sim | sim |  |
| public.security_settings | security_settings_pkey | btree | id | sim | sim |  |
| public.sefaz_dfe_cursor | sefaz_dfe_cursor_cnpj_ambiente_key | btree | cnpj, ambiente | sim | sim |  |
| public.sefaz_dfe_cursor | sefaz_dfe_cursor_pkey | btree | id | sim | sim |  |
| public.sessoes_conciliacao | idx_sessoes_conciliacao_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  |
| public.sessoes_conciliacao | idx_sessoes_conciliacao_empresa_id | btree | empresa_id | não | sim |  |
| public.sessoes_conciliacao | sessoes_conciliacao_pkey | btree | id | sim | sim |  |
| public.simulacao_tributos_detalhados | idx_simulacao_tributos_detalhados_empresa_id | btree | empresa_id | não | sim |  |
| public.simulacao_tributos_detalhados | simulacao_tributos_detalhados_pkey | btree | id | sim | sim |  |
| public.simulacoes | idx_sim_empresa_data | btree | empresa_id, created_at | não | sim |  |
| public.simulacoes | simulacoes_pkey | btree | id | sim | sim |  |
| public.slo_metrics_diarias | slo_metrics_diarias_data_servico_key | btree | data, servico | sim | sim |  |
| public.slo_metrics_diarias | slo_metrics_diarias_pkey | btree | id | sim | sim |  |
| public.slow_query_alerts | idx_slow_query_alerts_captured_at | btree | captured_at | não | sim |  |
| public.slow_query_alerts | idx_slow_query_alerts_severity | btree | severity, captured_at | não | sim |  |
| public.slow_query_alerts | slow_query_alerts_pkey | btree | id | sim | sim |  |
| public.solicitacoes_aprovacao | idx_solicitacoes_aprovacao_aprovado_por_fk | btree | aprovado_por | não | sim |  |
| public.solicitacoes_aprovacao | idx_solicitacoes_aprovacao_conta_pagar_id_fk | btree | conta_pagar_id | não | sim |  |
| public.solicitacoes_aprovacao | idx_solicitacoes_aprovacao_solicitado_por_fk | btree | solicitado_por | não | sim |  |
| public.solicitacoes_aprovacao | solicitacoes_aprovacao_pkey | btree | id | sim | sim |  |
| public.solicitacoes_lgpd | idx_solicitacoes_lgpd_created | btree | created_at | não | sim |  |
| public.solicitacoes_lgpd | idx_solicitacoes_lgpd_empresa_id | btree | empresa_id | não | sim |  |
| public.solicitacoes_lgpd | idx_solicitacoes_lgpd_user | btree | user_id | não | sim |  |
| public.solicitacoes_lgpd | solicitacoes_lgpd_pkey | btree | id | sim | sim |  |
| public.sped_contabil_arquivos | idx_sped_contabil_arquivos_empresa_id | btree | empresa_id | não | sim |  |
| public.sped_contabil_arquivos | sped_contabil_arquivos_pkey | btree | id | sim | sim |  |
| public.split_payment_transacoes | idx_split_payment_transacoes_empresa_id | btree | empresa_id | não | sim |  |
| public.split_payment_transacoes | split_payment_transacoes_pkey | btree | id | sim | sim |  |
| public.sso_login_attempts | sso_login_attempts_pkey | btree | id | sim | sim |  |
| public.sso_providers | idx_sso_providers_empresa_id | btree | empresa_id | não | sim |  |
| public.sso_providers | sso_providers_pkey | btree | id | sim | sim |  |
| public.sso_role_mappings | idx_sso_role_mappings_empresa_id | btree | empresa_id | não | sim |  |
| public.sso_role_mappings | sso_role_mappings_pkey | btree | id | sim | sim |  |
| public.sso_role_mappings | sso_role_mappings_provider_id_provider_role_app_role_key | btree | provider_id, provider_role, app_role | sim | sim |  |
| public.sso_sandbox_runs | idx_sso_sandbox_runs_provider_id_fk | btree | provider_id | não | sim |  |
| public.sso_sandbox_runs | sso_sandbox_runs_pkey | btree | id | sim | sim |  |
| public.sso_user_groups | idx_sso_user_groups_provider_id_fk | btree | provider_id | não | sim |  |
| public.sso_user_groups | sso_user_group_unico | btree | user_id, provider_id | sim | sim |  |
| public.sso_user_groups | sso_user_groups_pkey | btree | id | sim | sim |  |
| public.sso_user_groups | sso_user_groups_user_id_provider_id_group_name_key | btree | user_id, provider_id, group_name | sim | sim |  |
| public.tax_audit_trail | idx_tax_audit_empresa | btree | empresa_id, created_at | não | sim |  |
| public.tax_audit_trail | tax_audit_trail_pkey | btree | id | sim | sim |  |
| public.templates_cobranca | idx_templates_cobranca_empresa_id | btree | empresa_id | não | sim |  |
| public.templates_cobranca | templates_cobranca_pkey | btree | id | sim | sim |  |
| public.transacoes_bancarias | idx_transacoes_bancarias_confirmado_por_fk | btree | confirmado_por | não | sim |  |
| public.transacoes_bancarias | idx_transacoes_bancarias_regra_id_fk | btree | regra_id | não | sim |  |
| public.transacoes_bancarias | transacoes_bancarias_pkey | btree | id | sim | sim |  |
| public.transferencias | idx_transferencias_conta_destino_id_fk | btree | conta_destino_id | não | sim |  |
| public.transferencias | idx_transferencias_conta_origem_id_fk | btree | conta_origem_id | não | sim |  |
| public.transferencias | idx_transferencias_empresa_id | btree | empresa_id | não | sim |  |
| public.transferencias | idx_transferencias_user_id_fk | btree | user_id | não | sim |  |
| public.transferencias | transferencias_pkey | btree | id | sim | sim |  |
| public.ufs | ufs_codigo_ibge_unq | btree | codigo_ibge | sim | sim |  |
| public.ufs | ufs_pkey | btree | id | sim | sim |  |
| public.ufs | ufs_sigla_key | btree | sigla | sim | sim |  |
| public.user_action_audit | idx_user_action_audit_user_id_fk | btree | user_id | não | sim |  |
| public.user_action_audit | user_action_audit_pkey | btree | id | sim | sim |  |
| public.user_active_filters | idx_user_active_filters_user | btree | user_id | não | sim |  |
| public.user_active_filters | user_active_filters_pkey | btree | id | sim | sim |  |
| public.user_active_filters | user_active_filters_unique | btree | user_id, entity_type | sim | sim |  |
| public.user_anomalia_preferences | user_anomalia_preferences_pkey | btree | id | sim | sim |  |
| public.user_anomalia_preferences | user_anomalia_preferences_user_id_key | btree | user_id | sim | sim |  |
| public.user_demonstrativo_preferences | user_demonstrativo_preferences_pkey | btree | id | sim | sim |  |
| public.user_demonstrativo_preferences | user_demonstrativo_preferences_user_id_key | btree | user_id | sim | sim |  |
| public.user_devices | user_devices_pkey | btree | id | sim | sim |  |
| public.user_devices | user_devices_user_id_device_fingerprint_key | btree | user_id, device_fingerprint | sim | sim |  |
| public.user_digest_preferences | user_digest_preferences_pkey | btree | id | sim | sim |  |
| public.user_digest_preferences | user_digest_preferences_user_id_key | btree | user_id | sim | sim |  |
| public.user_empresas | idx_user_empresas_empresa_ativo | btree | empresa_id, ativo | não | sim |  |
| public.user_empresas | idx_user_empresas_user_ativo_empresa | btree | user_id, ativo, empresa_id | não | sim |  |
| public.user_empresas | user_empresas_pkey | btree | id | sim | sim |  |
| public.user_empresas | user_empresas_user_id_empresa_id_key | btree | user_id, empresa_id | sim | sim |  |
| public.user_filter_presets | idx_user_filter_presets_empresa_id | btree | empresa_id | não | sim |  |
| public.user_filter_presets | idx_user_filter_presets_user_id_fk | btree | user_id | não | sim |  |
| public.user_filter_presets | user_filter_presets_pkey | btree | id | sim | sim |  |
| public.user_onboarding_progress | user_onboarding_progress_pkey | btree | id | sim | sim |  |
| public.user_onboarding_progress | user_onboarding_progress_user_id_key | btree | user_id | sim | sim |  |
| public.user_passkeys | idx_user_passkeys_user_id | btree | user_id | não | sim |  |
| public.user_passkeys | user_passkeys_credential_id_key | btree | credential_id | sim | sim |  |
| public.user_passkeys | user_passkeys_pkey | btree | id | sim | sim |  |
| public.user_roles | user_roles_pkey | btree | id | sim | sim |  |
| public.user_roles | user_roles_user_id_role_key | btree | user_id, role | sim | sim |  |
| public.user_sessions | idx_user_sessions_user_id_fk | btree | user_id | não | sim |  |
| public.user_sessions | user_sessions_pkey | btree | id | sim | sim |  |
| public.vendedores | idx_vendedores_empresa_id | btree | empresa_id | não | sim |  |
| public.vendedores | vendedores_pkey | btree | id | sim | sim |  |
| public.verificacoes_conformidade | idx_verificacoes_conformidade_empresa_id | btree | empresa_id | não | sim |  |
| public.verificacoes_conformidade | verificacoes_conformidade_pkey | btree | id | sim | sim |  |
| public.webauthn_challenges | webauthn_challenges_pkey | btree | id | sim | sim |  |
| public.webauthn_credentials | webauthn_credentials_credential_id_key | btree | credential_id | sim | sim |  |
| public.webauthn_credentials | webauthn_credentials_pkey | btree | id | sim | sim |  |
| public.webhook_dlq | webhook_dlq_pkey | btree | id | sim | sim |  |
| public.webhook_events | webhook_events_pkey | btree | id | sim | sim |  |
| public.webhook_simulation_results | idx_webhook_simulation_results_run_id_fk | btree | run_id | não | sim |  |
| public.webhook_simulation_results | webhook_simulation_results_pkey | btree | id | sim | sim |  |
| public.webhook_simulation_runs | idx_webhook_simulation_runs_created_by_fk | btree | created_by | não | sim |  |
| public.webhook_simulation_runs | webhook_simulation_runs_pkey | btree | id | sim | sim |  |
| public.webhooks_log | idx_webhooks_log_dlq_id | btree | dlq_id | não | sim | `(dlq_id IS NOT NULL)` |
| public.webhooks_log | idx_webhooks_log_dlq_id_fk | btree | dlq_id | não | sim |  |
| public.webhooks_log | ux_webhooks_log_source_external | btree | source, external_id | sim | sim | `(external_id IS NOT NULL)` |
| public.webhooks_log | webhooks_log_pkey | btree | id | sim | sim |  |
| public.whatsapp_conversas | idx_whatsapp_conversas_cliente_id_fk | btree | cliente_id | não | sim |  |
| public.whatsapp_conversas | idx_whatsapp_conversas_empresa_id | btree | empresa_id | não | sim |  |
| public.whatsapp_conversas | whatsapp_conversas_pkey | btree | id | sim | sim |  |
