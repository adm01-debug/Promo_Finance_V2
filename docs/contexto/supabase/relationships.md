# Relacionamentos (chaves estrangeiras)


| de | colunas | para | colunas | on delete | on update |
|---|---|---|---|---|---|
| public.acoes_recomendadas | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.acordos_parcelamento | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.acordos_parcelamento | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.acordos_parcelamento | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.alert_configurations | empresa_id | public.empresas | id | RESTRICT | NO ACTION |
| public.alertas | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.alertas_tributarios | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.alertas_tributarios | resolvido_por | auth.users | id | SET NULL | NO ACTION |
| public.alertas_tributarios | user_id | auth.users | id | SET NULL | NO ACTION |
| public.alerts | empresa_id | public.empresas | id | RESTRICT | NO ACTION |
| public.alerts_sent | alert_id | public.alerts | id | CASCADE | NO ACTION |
| public.aliquotas_iss_municipal | item_lista_id | public.itens_lista_iss | id | NO ACTION | NO ACTION |
| public.anomalia_detection_runs | triggered_by | auth.users | id | NO ACTION | NO ACTION |
| public.anomalia_toast_eventos | anomalia_id | public.anomalias_detectadas | id | CASCADE | NO ACTION |
| public.anomalia_toast_eventos | centro_custo_id | public.centros_custo | id | SET NULL | NO ACTION |
| public.anomalia_toast_eventos | user_id | auth.users | id | CASCADE | NO ACTION |
| public.anomalias_detectadas | user_id | auth.users | id | CASCADE | NO ACTION |
| public.api_keys | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.aprovacao_comentarios | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.apuracoes_irpj_csll | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.apuracoes_irpj_csll | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.apuracoes_tributarias | created_by | auth.users | id | SET NULL | NO ACTION |
| public.apuracoes_tributarias | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.asaas_audit_trail | asaas_payment_id | public.asaas_payments | id | CASCADE | NO ACTION |
| public.asaas_credit_risk_analysis | cliente_id | public.clientes | id | CASCADE | NO ACTION |
| public.asaas_payment_links | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.asaas_payment_links | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.asaas_payments | asaas_customer_id | public.asaas_customers | id | SET NULL | NO ACTION |
| public.asaas_reconciliation_suggestions | contas_pagar_id | public.contas_pagar | id | NO ACTION | NO ACTION |
| public.asaas_reconciliation_suggestions | contas_receber_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.asaas_sync_queue | asaas_payment_id | public.asaas_payments | id | CASCADE | NO ACTION |
| public.auditoria_tributaria | empresa_id | public.empresas | id | SET NULL | NO ACTION |
| public.bitrix_field_mappings | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.bitrix_sync_logs | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.bloqueios_duplicidade | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.bloqueios_duplicidade | transacao_id | public.transacoes_bancarias | id | SET NULL | NO ACTION |
| public.bloqueios_duplicidade | usuario_id | public.profiles | id | SET NULL | NO ACTION |
| public.boletos | conta_bancaria_id | public.contas_bancarias | id | NO ACTION | NO ACTION |
| public.boletos | conta_pagar_id | public.contas_pagar | id | NO ACTION | NO ACTION |
| public.boletos | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.boletos | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.budgets | company_id | public.empresas | id | NO ACTION | NO ACTION |
| public.budgets | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.categorias | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.categorias | plano_conta_id | public.plano_contas | id | NO ACTION | NO ACTION |
| public.centros_custo | parent_id | public.centros_custo | id | SET NULL | NO ACTION |
| public.centros_custo | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.clientes | user_id | auth.users | id | CASCADE | NO ACTION |
| public.conciliacoes | conta_bancaria_id | public.contas_bancarias | id | NO ACTION | NO ACTION |
| public.configuracoes_aprovacao | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.conformidade_snapshots | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.contas_bancarias | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.contas_pagar | aprovado_por | auth.users | id | NO ACTION | NO ACTION |
| public.contas_pagar | categoria_id | public.categorias | id | SET NULL | NO ACTION |
| public.contas_pagar | centro_custo_id | public.centros_custo | id | SET NULL | NO ACTION |
| public.contas_pagar | conta_bancaria_id | public.contas_bancarias | id | SET NULL | NO ACTION |
| public.contas_pagar | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.contas_pagar | fornecedor_id | public.fornecedores | id | SET NULL | NO ACTION |
| public.contas_pagar | user_id | auth.users | id | CASCADE | NO ACTION |
| public.contas_receber | categoria_id | public.categorias | id | SET NULL | NO ACTION |
| public.contas_receber | centro_custo_id | public.centros_custo | id | SET NULL | NO ACTION |
| public.contas_receber | cliente_id | public.clientes | id | SET NULL | NO ACTION |
| public.contas_receber | conta_bancaria_id | public.contas_bancarias | id | SET NULL | NO ACTION |
| public.contas_receber | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.contas_receber | user_id | auth.users | id | CASCADE | NO ACTION |
| public.contratos | cliente_id | public.clientes | id | SET NULL | NO ACTION |
| public.contratos | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.contratos | fornecedor_id | public.fornecedores | id | SET NULL | NO ACTION |
| public.contratos | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.convites | organizacao_id | public.organizacoes | id | CASCADE | NO ACTION |
| public.convites_contador | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.creditos_tributarios | apuracao_id | public.apuracoes_tributarias | id | SET NULL | NO ACTION |
| public.creditos_tributarios | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.creditos_tributarios | fornecedor_id | public.fornecedores | id | SET NULL | NO ACTION |
| public.creditos_tributarios | nota_fiscal_id | public.notas_fiscais | id | NO ACTION | NO ACTION |
| public.custom_field_definitions | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.custom_field_values | definition_id | public.custom_field_definitions | id | CASCADE | NO ACTION |
| public.darfs | alerta_id | public.alertas_tributarios | id | NO ACTION | NO ACTION |
| public.darfs | empresa_id | public.empresas | id | SET NULL | NO ACTION |
| public.dispositivos_conhecidos | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.divergencias_conciliacao | conta_bancaria_id | public.contas_bancarias | id | SET NULL | NO ACTION |
| public.divergencias_conciliacao | resolvido_por | auth.users | id | NO ACTION | NO ACTION |
| public.divergencias_conciliacao | transacao_id | public.transacoes_bancarias | id | NO ACTION | NO ACTION |
| public.elisao_alertas | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.elisao_creditos_auditoria | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.elisao_creditos_auditoria | nota_fiscal_id | public.notas_fiscais_ocr | id | SET NULL | NO ACTION |
| public.elisao_creditos_auditoria | regra_id | public.elisao_regras_creditos | id | SET NULL | NO ACTION |
| public.elisao_simulacoes_regime | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.elisao_tarefas_acionaveis | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.empresas_certificados | criado_por | auth.users | id | NO ACTION | NO ACTION |
| public.empresas_certificados | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.entregas_obrigacoes | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.entregas_obrigacoes | registrado_por | public.profiles | id | SET NULL | NO ACTION |
| public.eventos_contabilizacao_log | regra_id | public.regras_contabilizacao_automatica | id | SET NULL | NO ACTION |
| public.evidencias_pacotes | verificacao_id | public.verificacoes_conformidade | id | NO ACTION | NO ACTION |
| public.execucoes_cobranca | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.execucoes_regua_cobranca | conta_receber_id | public.contas_receber | id | CASCADE | NO ACTION |
| public.execucoes_regua_cobranca | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.expert_conversations | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.expert_conversations | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.expert_messages | conversation_id | public.expert_conversations | id | CASCADE | NO ACTION |
| public.extrato_bancario | conta_bancaria_id | public.contas_bancarias | id | CASCADE | NO ACTION |
| public.faturamento_mensal | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.faturamento_mensal | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.fechamentos_tributarios | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.fechamentos_tributarios | fechado_por | auth.users | id | NO ACTION | NO ACTION |
| public.feedback_conciliacao_ia | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.feedback_conciliacao_ia | transacao_id | public.transacoes_bancarias | id | NO ACTION | NO ACTION |
| public.feedback_conciliacao_ia | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.fila_cobrancas | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.fila_cobrancas | conta_receber_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.fila_cobrancas | etapa_id | public.regua_cobranca_etapas | id | NO ACTION | NO ACTION |
| public.fluxos_aprovacao_niveis | configuracao_id | public.configuracoes_aprovacao | id | NO ACTION | NO ACTION |
| public.fluxos_aprovacao_niveis | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.folha_pagamento | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.folha_pagamento | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.formas_pagamento | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.fornecedores | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.fornecedores | user_id | auth.users | id | CASCADE | NO ACTION |
| public.frontend_performance_logs | user_id | auth.users | id | SET NULL | NO ACTION |
| public.geo_blocks | blocked_by | auth.users | id | NO ACTION | NO ACTION |
| public.health_scores_operacionais | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.historico_cobranca | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.historico_cobranca | conta_receber_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.historico_cobranca | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.historico_cobranca_whatsapp | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.historico_cobranca_whatsapp | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.historico_conciliacao_ia | aprovado_por | auth.users | id | NO ACTION | NO ACTION |
| public.historico_conciliacao_ia | conta_receber_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.historico_conciliacao_ia | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.historico_conciliacao_ia | sessao_id | public.sessoes_conciliacao | id | NO ACTION | NO ACTION |
| public.historico_relatorios | relatorio_agendado_id | public.relatorios_agendados | id | CASCADE | NO ACTION |
| public.historico_score_saude | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.incentivos_fiscais | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.itens_pedido_compra | pedido_id | public.pedidos_compra | id | CASCADE | NO ACTION |
| public.kpis_operacionais | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.logs_conciliacao_retroativa | conta_bancaria_id | public.contas_bancarias | id | CASCADE | NO ACTION |
| public.metas_financeiras | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.metas_financeiras | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.movimentacoes | categoria_id | public.categorias | id | SET NULL | NO ACTION |
| public.movimentacoes | conta_bancaria_id | public.contas_bancarias | id | NO ACTION | NO ACTION |
| public.movimentacoes | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.n8n_dispatch_logs | config_id | public.n8n_workflow_configs | id | SET NULL | NO ACTION |
| public.n8n_workflow_configs | created_by | auth.users | id | SET NULL | NO ACTION |
| public.negativacoes | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.negativacoes | conta_receber_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.negativacoes | created_by | auth.users | id | SET NULL | NO ACTION |
| public.new_device_alerts | device_id | public.user_devices | id | CASCADE | NO ACTION |
| public.nfe_eventos | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.nfe_recebidas | conta_pagar_id | public.contas_pagar | id | SET NULL | NO ACTION |
| public.nfe_recebidas | empresa_id | public.empresas | id | SET NULL | NO ACTION |
| public.notas_fiscais | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.notas_fiscais_ocr | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.open_finance_consents | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.operacoes_icms | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.operacoes_tributaveis | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.oportunidades_elisao | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.oportunidades_elisao | estrategia_id | public.estrategias_elisao_catalogo | id | NO ACTION | NO ACTION |
| public.organizacao_membros | organizacao_id | public.organizacoes | id | CASCADE | NO ACTION |
| public.pagamentos_recorrentes | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.parcelas_acordo | acordo_id | public.acordos_parcelamento | id | CASCADE | NO ACTION |
| public.partidas_contabeis | conta_contabil_id | public.plano_contas | id | RESTRICT | NO ACTION |
| public.partidas_contabeis | lancamento_id | public.lancamentos_contabeis | id | CASCADE | NO ACTION |
| public.password_reset_requests | reviewed_by | auth.users | id | NO ACTION | NO ACTION |
| public.pedidos_compra | centro_custo_id | public.centros_custo | id | SET NULL | NO ACTION |
| public.pedidos_compra | fornecedor_id | public.fornecedores | id | NO ACTION | NO ACTION |
| public.pedidos_compra | user_id | auth.users | id | SET NULL | NO ACTION |
| public.per_dcomp | created_by | public.profiles | id | SET NULL | NO ACTION |
| public.per_dcomp | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.plano_contas | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.plano_contas | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.portal_cliente_acessos | token_id | public.portal_cliente_tokens | id | SET NULL | NO ACTION |
| public.prejuizos_fiscais | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.prejuizos_fiscais | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.profiles | id | auth.users | id | CASCADE | NO ACTION |
| public.projecoes_reforma | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.protestos | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.protestos | conta_receber_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.protestos | created_by | auth.users | id | SET NULL | NO ACTION |
| public.protocolos_st_ncms | ncm_id | public.ncms | id | NO ACTION | NO ACTION |
| public.protocolos_st_ncms | protocolo_id | public.protocolos_st | id | CASCADE | NO ACTION |
| public.protocolos_st_ufs | protocolo_id | public.protocolos_st | id | CASCADE | NO ACTION |
| public.query_telemetry | empresa_id | public.empresas | id | SET NULL | NO ACTION |
| public.recomendacoes_metas_ia | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.regime_decision_cache | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.regimes_especiais_empresa | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.regimes_simulados | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.regimes_simulados | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.regimes_tributarios | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.regras_conciliacao | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.regras_conciliacao | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.regras_duplicidade | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.regras_roteamento_financeiro | conta_bancaria_id | public.contas_bancarias | id | NO ACTION | NO ACTION |
| public.regras_roteamento_financeiro | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.regua_cobranca_etapas | regua_id | public.regua_cobranca | id | CASCADE | NO ACTION |
| public.regua_cobranca_etapas | template_id | public.templates_cobranca | id | NO ACTION | NO ACTION |
| public.regua_cobranca_status | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.regua_cobranca_status | conta_receber_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.regua_cobranca_status | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.regua_cobranca_status | titulo_id | public.contas_receber | id | NO ACTION | NO ACTION |
| public.relatorios_agendados | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.relatorios_tributarios_agendados | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.resumos_executivos_semanais | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.retencoes_fonte | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.risk_rules | empresa_id | public.empresas | id | RESTRICT | NO ACTION |
| public.role_permissions | permission_id | public.permissions | id | CASCADE | NO ACTION |
| public.saved_filters | created_by | public.profiles | id | SET NULL | NO ACTION |
| public.saved_filters | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.saved_filters | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.scim_tokens | created_by | auth.users | id | SET NULL | NO ACTION |
| public.scim_tokens | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.scim_tokens | provider_id | public.sso_providers | id | CASCADE | NO ACTION |
| public.security_audit_logs | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.sessoes_conciliacao | conta_bancaria_id | public.contas_bancarias | id | NO ACTION | NO ACTION |
| public.simulacoes | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.solicitacoes_aprovacao | aprovado_por | auth.users | id | NO ACTION | NO ACTION |
| public.solicitacoes_aprovacao | conta_pagar_id | public.contas_pagar | id | NO ACTION | NO ACTION |
| public.solicitacoes_aprovacao | solicitado_por | auth.users | id | NO ACTION | NO ACTION |
| public.solicitacoes_lgpd | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.solicitacoes_lgpd | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.sped_contabil_arquivos | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.split_payment_transacoes | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.sso_providers | empresa_id | public.empresas | id | SET NULL | NO ACTION |
| public.sso_role_mappings | provider_id | public.sso_providers | id | CASCADE | NO ACTION |
| public.sso_sandbox_runs | provider_id | public.sso_providers | id | SET NULL | NO ACTION |
| public.sso_user_groups | provider_id | public.sso_providers | id | CASCADE | NO ACTION |
| public.tax_audit_trail | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.transacoes_bancarias | confirmado_por | auth.users | id | NO ACTION | NO ACTION |
| public.transacoes_bancarias | regra_id | public.regras_conciliacao | id | NO ACTION | NO ACTION |
| public.transferencias | conta_destino_id | public.contas_bancarias | id | NO ACTION | NO ACTION |
| public.transferencias | conta_origem_id | public.contas_bancarias | id | NO ACTION | NO ACTION |
| public.transferencias | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.transferencias | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.user_action_audit | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.user_active_filters | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.user_anomalia_preferences | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_demonstrativo_preferences | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_digest_preferences | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_empresas | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.user_empresas | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_filter_presets | empresa_id | public.empresas | id | CASCADE | NO ACTION |
| public.user_filter_presets | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.user_onboarding_progress | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_passkeys | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_roles | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_sessions | user_id | auth.users | id | CASCADE | NO ACTION |
| public.vendedores | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.verificacoes_conformidade | empresa_id | public.empresas | id | NO ACTION | NO ACTION |
| public.webhook_simulation_results | run_id | public.webhook_simulation_runs | id | CASCADE | NO ACTION |
| public.webhook_simulation_runs | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.webhooks_log | dlq_id | public.webhook_dlq | id | SET NULL | NO ACTION |
| public.whatsapp_conversas | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.whatsapp_conversas | empresa_id | public.empresas | id | NO ACTION | NO ACTION |


_Diagrama omitido: mais de 120 tabelas._
