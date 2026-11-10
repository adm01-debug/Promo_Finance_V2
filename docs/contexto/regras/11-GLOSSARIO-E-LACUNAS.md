# 11 · GLOSSÁRIO, DADOS DE REFERÊNCIA E LACUNAS

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `8f43c3f89f` · branch `main` · 2026-11-10 21:51 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Glossário do domínio (entidades do sistema)

| Termo | Significado / valores | Tamanho | Origem |
|---|---|---|---|
| `_rep` | _(sem COMMENT ON TABLE — significado não documentado)_ | 3 colunas | migration |
| `account_lockouts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `acessos_suspeitos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `acoes_recomendadas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `acordos_parcelamento` | _(sem COMMENT ON TABLE — significado não documentado)_ | 20 colunas | migration |
| `alert_configurations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `alertas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `alertas_preditivos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `alertas_tributarios` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `aliquotas_interestaduais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `aliquotas_internas_uf` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `aliquotas_iss_municipal` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `allowed_countries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `allowed_ips` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `anexos_financeiros` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `anomalia_detection_runs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `anomalia_toast_eventos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `anomalias_detectadas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `api_keys` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `aprovacao_comentarios` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `apuracoes_irpj_csll` | _(sem COMMENT ON TABLE — significado não documentado)_ | 31 colunas | migration |
| `apuracoes_tributarias` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `asaas_audit_trail` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `asaas_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `asaas_credit_risk_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `asaas_customers` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `asaas_payment_links` | Espelho local de paymentLinks criados via asaas-proxy, com empresa_id — permite a listar_links_pagamento filtrar por empresa, já que a API do Asaas não amarra paymentLinks a empresa. | 8 colunas | migration |
| `asaas_payments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `asaas_reconciliation_suggestions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `asaas_scheduled_transfers` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `asaas_sync_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `asaas_transfers` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `audit_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `auditoria_configuracoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `auditoria_financeira` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `auditoria_tributaria` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `benchmarks_setoriais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `beneficios_fiscais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `bitrix24_activities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 0 colunas | migration |
| `bitrix24_stage_mappings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `bitrix_field_mappings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `bitrix_oauth_tokens` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `bitrix_sync_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `bitrix_webhook_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `bling_sync_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `bling_tokens` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `bling_webhook_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `bloat_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `blocked_ips` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `bloqueios_duplicidade` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `boleto_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `boletos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `budgets` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `catalogos_fiscais_cargas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `catalogos_tributarios_health_history` | Série diária das invariantes violadas nos catálogos tributários (UF, NCM, CNAE, Simples, ISS, ST). Alimentada por check_catalogos_tributarios_invariants(). | 10 colunas | migration |
| `categorias` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `centros_custo` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ci_security_gate_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `clientes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `cnaes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `cnpja_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `cnpja_rate_limit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 3 colunas | migration |
| `conciliacao_sugestoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `conciliacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `conciliacoes_parciais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `configuracoes_aprovacao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `configuracoes_duplicidade` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `configuracoes_receber` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `conformidade_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `contas_bancarias` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `contas_pagar` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `contas_receber` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `contatos_financeiros` | _(sem COMMENT ON TABLE — significado não documentado)_ | 30 colunas | migration |
| `contratos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `convites` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `convites_contador` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `creditos_tributarios` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `custom_field_definitions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `custom_field_values` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `darfs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `digest_envios_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `dispositivos_conhecidos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `divergencias_conciliacao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `edge_function_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `elisao_alertas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `elisao_analise_gap` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `elisao_creditos_auditoria` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `elisao_regras_creditos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `elisao_simulacoes_regime` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `elisao_tarefas_acionaveis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `empresas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `empresas_certificados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `entity_versions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `entregas_obrigacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `estrategias_elisao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `estrategias_elisao_catalogo` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `eventos_contabilizacao_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `evidencias_pacotes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `execucoes_cobranca` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `execucoes_regua_cobranca` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `expert_conversations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `expert_messages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `extrato_bancario` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `extratos_bancarios_importados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `faixas_simples_nacional` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `faturamento_mensal` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `fechamentos_tributarios` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `feedback_conciliacao_ia` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `fila_cobrancas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `fluxos_aprovacao_niveis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `folha_pagamento` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `formas_pagamento` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `fornecedores` | _(sem COMMENT ON TABLE — significado não documentado)_ | 20 colunas | migration |
| `frontend_error_alert_state` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `frontend_error_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `frontend_error_logs_2026_05` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `frontend_error_logs_2026_06` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `frontend_error_logs_2026_07` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `frontend_error_logs_2026_08` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `frontend_error_logs_2026_09` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `frontend_error_logs_2026_10` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `frontend_error_logs_default` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `frontend_error_silence_digest_log` | Gap #28: trilha dos digests de silenciamento enviados. Serve de trava de idempotência para o agendador semanal. | 6 colunas | migration |
| `frontend_performance_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `glossario_tributario` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `health_scores_operacionais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `historico_analises_preditivas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `historico_cobranca` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `historico_cobranca_whatsapp` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `historico_cobrancas_boletos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `historico_conciliacao_ia` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `historico_relatorios` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `historico_score_saude` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `incentivos_fiscais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `index_usage_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `indices_uso_excecoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `integration_secrets` | Segredos de integracao. Acesso exclusivo de service_role (edge functions). Clientes anon/authenticated bloqueados por RLS restritiva e ausencia de GRANT. | 7 colunas | migration |
| `integrity_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `itens_lista_iss` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `itens_pedido_compra` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `known_devices` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `kpis_operacionais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `lalur_lancamentos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `lancamentos_contabeis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `login_attempts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `logs_baixa_automatica` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `logs_conciliacao_retroativa` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `metas_financeiras` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `movimentacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `n8n_dispatch_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `n8n_workflow_configs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `ncms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `negativacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `new_device_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `nfe_eventos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `nfe_recebidas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 28 colunas | migration |
| `notas_fiscais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `notas_fiscais_ocr` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `notification_history` | Histórico unificado de notificações enviadas ao usuário (in-app/push/e-mail), com status e metadata para auditoria e UI de "central de notificações" | 11 colunas | migration |
| `obrigacoes_acessorias` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `open_finance_consents` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `operacoes_icms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `operacoes_tributaveis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `oportunidades_elisao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 23 colunas | migration |
| `organizacao_membros` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `organizacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `overlay_rejeicoes_auditoria` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `pagamentos_recorrentes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `parcelas_acordo` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `partidas_contabeis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `password_reset_requests` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `pedidos_compra` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `per_dcomp` | _(sem COMMENT ON TABLE — significado não documentado)_ | 25 colunas | migration |
| `performance_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `permissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `pg_stat_statements_baseline` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `pix_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `plano_contas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `planos_acao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `ponto_departamentos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `ponto_funcionarios` | _(sem COMMENT ON TABLE — significado não documentado)_ | 20 colunas | migration |
| `ponto_registros` | _(sem COMMENT ON TABLE — significado não documentado)_ | 27 colunas | migration |
| `ponto_sync_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `portal_cliente_acessos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `portal_cliente_tokens` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `prejuizos_fiscais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `profiles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `projecoes_reforma` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `protestos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `protocolos_st` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `protocolos_st_ncms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `protocolos_st_ufs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `push_subscriptions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `query_telemetry` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `rate_limit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `recomendacoes_metas_ia` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `regime_decision_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `regimes_especiais_empresa` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `regimes_simulados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `regimes_tributarios` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `registro_duplicidade` | Log de auditoria para tentativas de inserção de pagamentos duplicados e rastreio de integridade. | 6 colunas | migration |
| `regras_conciliacao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `regras_contabilizacao_automatica` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `regras_duplicidade` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `regras_roteamento_financeiro` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `regua_cobranca` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `regua_cobranca_etapas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `regua_cobranca_status` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `relatorios_agendados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `relatorios_tributarios_agendados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `resumos_executivos_semanais` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `retencao_politicas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `retencoes_fonte` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `risk_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `role_permissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `rpc_observability_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `saved_filter_subscriptions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `saved_filters` | Filtros salvos por usuários para diferentes entidades | 12 colunas | migration |
| `scim_operations_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `scim_setup_checklist` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `scim_tokens` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `security_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `security_audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `security_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `sefaz_dfe_cursor` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `sessoes_conciliacao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `simulacao_tributos_detalhados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `simulacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `slo_metrics_diarias` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `slow_query_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `solicitacoes_aprovacao` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `solicitacoes_lgpd` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `sped_contabil_arquivos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `split_payment_transacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `sso_login_attempts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `sso_providers` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `sso_role_mappings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `sso_sandbox_runs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `sso_user_groups` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `tax_audit_trail` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `templates_cobranca` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `transacoes_bancarias` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `transferencias` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `ufs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `user_action_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `user_active_filters` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `user_anomalia_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `user_demonstrativo_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `user_digest_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `user_empresas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `user_filter_presets` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `user_onboarding_progress` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `user_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `user_roles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `user_sessions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `vendedores` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `verificacoes_conformidade` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `webauthn_credentials` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `webhook_dlq` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `webhook_simulation_results` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `webhook_simulation_runs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `webhooks_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `whatsapp_conversas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `app_role` (enum) | admin, financeiro, operacional, visualizador |  | banco |
| `status_pagamento` (enum) | pago, pendente, vencido, parcial, cancelado, atrasado |  | banco |
| `tipo_transacao` (enum) | receita, despesa |  | banco |
| `tipo_cobranca` (enum) | boleto, pix, cartao, transferencia, dinheiro |  | banco |
| `prioridade_alerta` (enum) | baixa, media, alta, critica |  | banco |
| `etapa_cobranca` (enum) | preventiva, lembrete, cobranca, negociacao, juridico |  | banco |
| `status_nfe` (enum) | autorizada, pendente, cancelada, denegada, inutilizada |  | banco |
| `audit_action` (enum) | INSERT, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, APPROVE, REJECT |  | banco |
| `tipo_solicitacao_lgpd` (enum) | acesso, portabilidade, exclusao, retificacao, anonimizacao |  | banco |
| `status_solicitacao_lgpd` (enum) | aberta, em_analise, atendida, rejeitada |  | banco |
| `tipo_anomalia` (enum) | movimentacao_outlier, pagamento_duplicado, conta_pagar_alta, conciliacao_atrasada, mudanca_regime_brusca |  | banco |
| `severidade_anomalia` (enum) | baixa, media, alta, critica |  | banco |
| `status_anomalia` (enum) | nova, investigando, falso_positivo, confirmada |  | banco |
| `TIPOS` (TS) | { value: 'movimentacao_outlier', label: 'Movimentação atípica' }, { value: 'pagamento_duplicado', label: 'Pagamento duplicado' }, { value: 'conta_pagar_alta', label: 'Conta a pagar alta' }, { value: 'conciliacao_atrasada', label: 'Conciliação atrasada' }, { value: 'mudanca_regime_brusca', label: 'Va … |  | `src/components/admin/anomalia-preferences/constants.ts` |
| `SeveridadeBadgeVariant` (TS) | destructive \| secondary \| outline |  | `src/components/admin/anomalias-review-queue/helpers.ts` |
| `SEVERIDADES` (TS) | 'critica', 'alta', 'media', 'baixa' |  | `src/components/admin/anomalias-review-queue/types.ts` |
| `SandboxOutcome` (TS) | bloqueado \| seria_jit \| usuario_existente \| sem_email |  | `src/components/admin/sso/sandbox/outcome.ts` |
| `FocusClaim` (TS) | all \| email \| name \| groups \| domain |  | `src/components/admin/sso/sandbox/types.ts` |
| `MappingFilter` (TS) | all \| matched \| skipped \| no_match |  | `src/components/admin/sso/sandbox/types.ts` |
| `SeverityFilter` (TS) | all \| critical \| warning \| info |  | `src/components/admin/telemetry/performance-alerts-deeplink.ts` |
| `TipoEvento` (TS) | conta_pagar \| conta_receber \| movimentacao |  | `src/components/contabilidade/contabilizacao-automatica/types.ts` |
| `EVENTOS` (TS) | { value: 'conta_pagar', label: 'Pagamento (Conta a Pagar)' }, { value: 'conta_receber', label: 'Recebimento (Conta a Receber)' }, { value: 'movimentacao', label: 'Movimentação Bancária' }, |  | `src/components/contabilidade/contabilizacao-automatica/types.ts` |
| `ModoDemonstrativo` (TS) | dre \| balanco |  | `src/components/contabilidade/dre-balanco/types.ts` |
| `DatePreset` (TS) | all \| today \| last7 \| last30 \| mes \| ano \| custom |  | `src/components/contabilidade/razao-diario/types.ts` |
| `StatusFilter` (TS) | all \| liberada \| bloqueada \| transmitida |  | `src/components/contabilidade/sped-contabil/types.ts` |
| `ValidacaoFilter` (TS) | all \| com_erros \| com_avisos \| sem_alertas |  | `src/components/contabilidade/sped-contabil/types.ts` |
| `ExportStatus` (TS) | idle \| queued \| processing \| done \| error |  | `src/components/contabilidade/sped-contabil/types.ts` |
| `StatusFilter` (TS) | all \| liberada \| bloqueada \| transmitida |  | `src/components/contabilidade/sped-ecf-historico/HistoricoFilters.tsx` |
| `ValidacaoFilter` (TS) | all \| com_erros \| com_avisos \| sem_alertas |  | `src/components/contabilidade/sped-ecf-historico/HistoricoFilters.tsx` |
| `DivergTone` (TS) | success \| warning \| destructive \| info |  | `src/components/contabilidade/sped-ecf-wizard/types.ts` |
| `TransitionName` (TS) | fade \| blur-rise \| slide-left \| slide-right \| slide-up \| slide-down \| zoom-in \| zoom-out \| flip-x \| flip-y \| parallax \| scale \| none |  | `src/components/layout/transitions/types.ts` |
| `EasingPreset` (TS) | anticipate \| easeOut \| easeInOut \| spring |  | `src/components/layout/transitions/types.ts` |
| `TipoCobranca` (TS) | boleto \| pix \| transferencia \| cartao \| dinheiro |  | `src/components/pagamentos-recorrentes/pagamento-recorrente-model.ts` |
| `SeverityKey` (TS) | critica \| alta \| media \| baixa |  | `src/components/shared/AdvancedSearchPopover.tsx` |
| `Theme` (TS) | light \| dark \| system |  | `src/components/theme/ThemeContext.ts` |
| … +196 linhas — lista completa em `context.json` | | | |

## Dados de referência (seed — planos, categorias, perfis fixos)

| Tabela | Colunas | Valores | Origem |
|---|---|---|---|
| `categorias` | `nome, tipo, cor, icone, user_id` | `('Aluguel', 'despesa', '#ef4444', 'home', p_user_id), ('Água', 'despesa', '#3b82f6', 'droplet', p_user_id), ('Luz', 'despesa', '#eab308', 'zap', p_user_id), ('Internet', 'despesa', '#8b5cf6', 'wifi', p_user_id), ('Telefone', 'despesa', '#06b6d4', 'phone', p_user_id), ('Salários', 'despesa', '#22c55e', 'users', p_user_id), ('Fornecedores', 'despesa', '#f97316', 'truck', p_user_id), ('Material de Es …` | `supabase/migrations/003_seed_data.sql` |
| `categorias` | `nome, tipo, cor, icone, user_id` | `('Vendas', 'receita', '#22c55e', 'shopping-cart', p_user_id), ('Serviços', 'receita', '#3b82f6', 'briefcase', p_user_id), ('Consultoria', 'receita', '#8b5cf6', 'users', p_user_id), ('Comissões', 'receita', '#f97316', 'percent', p_user_id), ('Rendimentos', 'receita', '#06b6d4', 'trending-up', p_user_id), ('Reembolsos', 'receita', '#64748b', 'refresh-cw', p_user_id), ('Outras Receitas', 'receita', ' …` | `supabase/migrations/003_seed_data.sql` |
| `user_preferences` | `user_id, theme, language, currency` | `(NEW.id, 'system', 'pt-BR', 'BRL') ON CONFLICT (user_id) DO NOTHING` | `supabase/migrations/003_seed_data.sql` |

## Auditoria de consistência (código × schema) — trate como NÃO VERIFICADO

> `status`: inclui estados só de UI/realtime (ex.: `uploading`, `SUBSCRIBED`) que nunca vão ao banco — confira o arquivo antes de concluir que falta valor no enum.

| Tipo | Problema | Onde |
|---|---|---|
| status | valor `todas` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/AnomaliasDetectadasPanel.tsx`<br>`compara:src/hooks/saved-filter-alerts/matchers.ts` |
| status | valor `succeeded` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/AutomacoesTab.tsx`<br>`compara:src/components/admin/CronJobsStatus.tsx`<br>`compara:supabase/functions/calcular-slo-metrics-diario/index.ts` |
| status | valor `pending` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/ui/file-upload.tsx`<br>`compara:src/components/ui/ux-validator/ReportModal.tsx`<br>`escreve:src/components/admin/WebhookSimulator.tsx`<br>`escreve:src/components/ui/file-upload.tsx` |
| status | valor `completed` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/WebhookSimulator.tsx`<br>`compara:src/hooks/useAnomaliaDetectionRun.ts`<br>`escreve:supabase/functions/asaas-proxy/index.ts`<br>`escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `SUBSCRIBED` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/telemetry/PerformanceAlertsPanel.tsx` |
| status | valor `melhor` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/analytics/BenchmarkingSetorial.tsx`<br>`escreve:src/components/analytics/BenchmarkingSetorial.tsx` |
| status | valor `igual` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/analytics/BenchmarkingSetorial.tsx` |
| status | valor `pior` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/analytics/BenchmarkingSetorial.tsx` |
| status | valor `completo` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/aprovacoes/WorkflowVisualizer.tsx`<br>`escreve:src/components/aprovacoes/AprovacoesPendentes.tsx`<br>`escreve:src/components/aprovacoes/WorkflowVisualizer.tsx` |
| status | valor `atual` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/aprovacoes/WorkflowVisualizer.tsx`<br>`escreve:src/components/aprovacoes/AprovacoesPendentes.tsx` |
| status | valor `ACTIVE` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/asaas/AssinaturasListPanel.tsx` |
| status | valor `DONE` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/asaas/TransferenciaPixHistoryPanel.tsx` |
| status | valor `FAILED` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/asaas/TransferenciaPixHistoryPanel.tsx`<br>`escreve:supabase/functions/asaas-proxy/index.ts`<br>`filtra:supabase/functions/asaas-proxy/index.ts` |
| status | valor `PROCESSING` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/asaas/TransferenciaPixHistoryPanel.tsx` |
| status | valor `verified` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/auth/MFASettings.tsx`<br>`compara:src/hooks/useMFA.ts`<br>`escreve:src/hooks/useMFA.ts` |
| status | valor `incluido` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/cobranca/NegativacoesProtestosPanel.tsx`<br>`escreve:src/components/cobranca/NegativacoesProtestosPanel.tsx` |
| status | valor `excluido` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/cobranca/NegativacoesProtestosPanel.tsx` |
| status | valor `protocolado` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/cobranca/NegativacoesProtestosPanel.tsx` |
| status | valor `extra` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/compliance/verificar-integridade/LinhaResultado.tsx`<br>`escreve:src/components/compliance/verificar-integridade/types.ts`<br>`escreve:src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts` |
| status | valor `pendente_aprovacao` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/lib/compras/pedidos.ts`<br>`compara:src/pages/Compras.tsx`<br>`escreve:src/components/compras/PedidoCompraForm.tsx` |
| status | valor `uploading` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/comprovantes/ComprovanteOCR.tsx`<br>`compara:src/components/expert/DocumentAnalyzer.tsx`<br>`compara:src/components/ui/file-upload.tsx`<br>`escreve:src/components/comprovantes/ComprovanteOCR.tsx` |
| status | valor `analyzing` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/comprovantes/ComprovanteOCR.tsx`<br>`compara:src/components/expert/DocumentAnalyzer.tsx`<br>`escreve:src/components/comprovantes/ComprovanteOCR.tsx`<br>`escreve:src/components/expert/DocumentAnalyzer.tsx` |
| status | valor `complete` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/comprovantes/ComprovanteOCR.tsx`<br>`compara:src/components/expert/DocumentAnalyzer.tsx`<br>`escreve:src/components/comprovantes/ComprovanteOCR.tsx`<br>`escreve:src/components/expert/DocumentAnalyzer.tsx` |
| status | valor `aceito` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/conciliacao/DivergenciasConciliacaoPanel.tsx`<br>`escreve:src/components/conciliacao/DivergenciasConciliacaoPanel.tsx`<br>`escreve:src/hooks/useDivergenciasConciliacao.ts`<br>`filtra:src/components/conciliacao/ConciliacaoAuditPanel.tsx` |
| status | valor `conciliada` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/conciliacao/ConciliacaoExport.tsx` |
| status | valor `corrigido` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/conciliacao/DivergenciasConciliacaoPanel.tsx` |
| status | valor `confirmado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/contabilidade/LancamentosTab.tsx`<br>`escreve:src/components/contas-receber/BaixaAutomaticaDialog.tsx`<br>`escreve:src/components/contas-receber/RegistrarRecebimentoDialog.tsx`<br>`escreve:supabase/functions/contabilizar-evento/index.ts` |
| status | valor `warn` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/contabilidade/SpedChecklistRow.tsx`<br>`compara:src/components/contabilidade/SpedEcdPreviewDialog.tsx`<br>`compara:supabase/functions/gerar-sped-ecd/index.ts`<br>`compara:supabase/functions/gerar-sped-ecf/index.ts` |
| status | valor `assinado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/documentos/AssinaturaDigital.tsx` |
| status | valor `realizado` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/financeiro/TransferenciaDialog.tsx`<br>`escreve:src/hooks/useFinancialOperations.ts` |
| status | valor `active` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/integracoes/open-finance/OpenFinanceConnectDialog.tsx`<br>`escreve:supabase/functions/open-finance/index.ts` |
| status | valor `authorized` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/integracoes/open-finance/OpenFinanceConsentList.tsx`<br>`filtra:supabase/functions/open-finance/index.ts` |
| status | valor `awaiting_authorization` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/integracoes/open-finance/OpenFinanceConsentList.tsx`<br>`escreve:supabase/functions/open-finance/index.ts` |
| status | valor `revoked` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/integracoes/open-finance/OpenFinanceConsentList.tsx`<br>`escreve:supabase/functions/open-finance/index.ts` |
| status | valor `transmitindo` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/nfe/contingencia/ContingenciaPendingList.tsx`<br>`escreve:src/components/nfe/ContingenciaNFe.tsx` |
| status | valor `estouro` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/orcamento/OrcamentoCardsView.tsx`<br>`compara:src/pages/OrcamentoEvento.tsx` |
| status | valor `calculado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/reforma-tributaria/ApuracaoMensal.tsx`<br>`escreve:src/hooks/useApuracoesTributarias.ts`<br>`escreve:src/hooks/useIRPJCSLL.ts` |
| status | valor `revisado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/reforma-tributaria/ApuracaoMensal.tsx` |
| status | valor `retificado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/reforma-tributaria/ApuracaoMensal.tsx` |
| status | valor `importado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/reforma-tributaria/ImportacaoXMLPanel.tsx`<br>`escreve:src/hooks/useImportacaoXMLNFe.ts` |
| status | valor `Conciliado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/relatorios/RelatoriosDetalhado.tsx` |
| status | valor `online` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/ui/badge.tsx` |
| status | valor `quitado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useAcordosParcelamento.ts`<br>`escreve:src/hooks/useAcordosParcelamento.ts` |
| status | valor `resolvido` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useAuditoriaCompliance.ts`<br>`escreve:src/hooks/useAuditoriaCompliance.ts` |
| status | valor `fulfilled` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useConciliacaoIgnorarActions.ts` |
| status | valor `justificado` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/useConciliacaoTributaria.ts` |
| status | valor `rejected` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/lib/adaptive-chunk.ts`<br>`compara:supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| status | valor `gap` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/lib/pdf-generator/benchmarking.ts`<br>`compara:src/pages/benchmarking/BenchmarkingConcorrentes.tsx`<br>`escreve:src/pages/benchmarking/BenchmarkingConcorrentes.tsx` |
| status | valor `configurando` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/pages/Integracoes.tsx` |
| status | valor `operational` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/StatusPage.tsx`<br>`escreve:src/pages/StatusPage.tsx`<br>`escreve:supabase/functions/health/index.ts` |
| status | valor `degraded` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/StatusPage.tsx` |
| status | valor `outage` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/StatusPage.tsx`<br>`compara:supabase/functions/health/index.ts` |
| status | valor `partial` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/benchmarking/BenchmarkingConcorrentes.tsx`<br>`escreve:src/pages/benchmarking/BenchmarkingConcorrentes.tsx` |
| status | valor `CLOSED` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/_shared/resilience.ts` |
| status | valor `OPEN` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/_shared/resilience.ts` |
| status | valor `COMPLETED` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/asaas-proxy/index.ts`<br>`escreve:supabase/functions/open-finance/index.ts` |
| status | valor `ACCEPTED` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/asaas-proxy/index.ts` |
| status | valor `finalizado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/calcular-health-score-operacional/index.ts` |
| status | valor `cancelled` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `retrying` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/monitor-health/index.ts` |
| status | valor `dead` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/monitor-health/index.ts` |
| status | valor `contact_not_found` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/sync-profile-to-bitrix/index.ts` |
| status | valor `fechada` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/verificar-conformidade-fiscal/index.ts` |
| status | valor `string` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/webhook-replay/index.ts` |
| status | valor `read` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/whatsapp-webhook/index.ts` |
| status | valor `delivered` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/whatsapp-webhook/index.ts` |
| status | valor `intro` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/auth/TwoFactorSetup.tsx` |
| status | valor `qr` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/auth/TwoFactorSetup.tsx` |
| status | valor `verify` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/auth/TwoFactorSetup.tsx` |
| status | valor `preview` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/conciliacao/ImportarExtratoDialog.tsx`<br>`compara:src/components/contabilidade/ImportLancamentosCSVDialog.tsx`<br>`compara:src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| status | valor `upload` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/conciliacao/ImportarExtratoDialog.tsx`<br>`compara:src/components/contabilidade/ImportLancamentosCSVDialog.tsx`<br>`compara:src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| status | valor `open-finance-loading` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/conciliacao/ImportarExtratoDialog.tsx` |
| status | valor `result` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/contabilidade/ImportLancamentosCSVDialog.tsx` |
| status | valor `expanded` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/ui/sidebar.tsx` |
| status | valor `collapsed` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/ui/sidebar.tsx` |
| status | valor `object` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/lib/navigation-intent.ts` |
| status | valor `suspended` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/lib/sound-feedback.ts` |
| status | valor `solicitado_ao_auth` para `email_status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/usuarios/ConviteUsuarioDialog.tsx`<br>`escreve:supabase/functions/convidar-usuario/index.ts` |
| status | valor `object` para `situacao` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useBlingNFe.ts` |
| status | valor `abertas` para `situacao` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useOverlayRejeicoesAuditoria.ts` |
| status | valor `resolvidas` para `situacao` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useOverlayRejeicoesAuditoria.ts` |
| status | valor `supabase-read` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/useManagedFilters.ts` |
| status | valor `localStorage-read` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/useManagedFilters.ts` |
| status | valor `welcome` para `last_step` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/useOnboardingProgress.ts` |
| status | valor `iniciando` para `current_step` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `detector_outlier` para `current_step` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `detector_duplicado` para `current_step` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `detector_p95` para `current_step` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `detector_conciliacao` para `current_step` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `detector_regime` para `current_step` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| status | valor `persistindo` para `current_step` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/detectar-anomalias-financeiras/index.ts` |
| coluna | coluna `centro_custo_id` usada no código não existe no schema de `anomalias_detectadas` |  |
| coluna | coluna `detectada_em` usada no código não existe no schema de `anomalias_detectadas` |  |
| coluna | coluna `resolvida_em` usada no código não existe no schema de `anomalias_detectadas` |  |
| coluna | coluna `acoes_disponiveis` usada no código não existe no schema de `anomalia_toast_eventos` |  |
| coluna | coluna `centro_custo_nome` usada no código não existe no schema de `anomalia_toast_eventos` |  |
| coluna | coluna `descricao` usada no código não existe no schema de `anomalia_toast_eventos` |  |
| coluna | coluna `duracao_segundos` usada no código não existe no schema de `anomalia_toast_eventos` |  |
| coluna | coluna `titulo` usada no código não existe no schema de `anomalia_toast_eventos` |  |
| coluna | coluna `telefone` usada no código não existe no schema de `profiles` |  |
| coluna | coluna `centro_custo_id` usada no código não existe no schema de `contas_receber` |  |
| coluna | coluna `metadata` usada no código não existe no schema de `contas_receber` |  |
| coluna | coluna `vendedor_id` usada no código não existe no schema de `contas_receber` |  |
| coluna | coluna `centro_custo_id` usada no código não existe no schema de `contas_pagar` |  |
| coluna | coluna `ativo` usada no código não existe no schema de `clientes` |  |
| coluna | coluna `bitrix_id` usada no código não existe no schema de `clientes` |  |
| coluna | coluna `empresa_id` usada no código não existe no schema de `clientes` |  |
| coluna | coluna `limite_credito` usada no código não existe no schema de `clientes` |  |
| coluna | coluna `nome_fantasia` usada no código não existe no schema de `clientes` |  |
| coluna | coluna `ramo_atividade` usada no código não existe no schema de `clientes` |  |
| coluna | coluna `score` usada no código não existe no schema de `clientes` |  |
| coluna | coluna `conta` usada no código não existe no schema de `contas_bancarias` |  |
| coluna | coluna `saldo_disponivel` usada no código não existe no schema de `contas_bancarias` |  |
| coluna | coluna `compensacao_aceita_em` usada no código não existe no schema de `transacoes_bancarias` |  |
| coluna | coluna `compensacao_aceita_por` usada no código não existe no schema de `transacoes_bancarias` |  |
| coluna | coluna `compensacao_classificacao` usada no código não existe no schema de `transacoes_bancarias` |  |
| coluna | coluna `compensacao_evidencia_url` usada no código não existe no schema de `transacoes_bancarias` |  |
| coluna | coluna `compensacao_motivo` usada no código não existe no schema de `transacoes_bancarias` |  |
| coluna | coluna `compensacao_regra` usada no código não existe no schema de `transacoes_bancarias` |  |
| coluna | coluna `empresa_id` usada no código não existe no schema de `transacoes_bancarias` |  |
| coluna | coluna `resolvido` usada no código não existe no schema de `divergencias_conciliacao` |  |
| coluna | coluna `resolvido_em` usada no código não existe no schema de `divergencias_conciliacao` |  |
| coluna | coluna `resolvido_por` usada no código não existe no schema de `divergencias_conciliacao` |  |
| coluna | coluna `motivo_rejeicao` usada no código não existe no schema de `feedback_conciliacao_ia` |  |
| coluna | coluna `score_original` usada no código não existe no schema de `feedback_conciliacao_ia` |  |
| coluna | coluna `categoria` usada no código não existe no schema de `regras_conciliacao` |  |
| coluna | coluna `ativa` usada no código não existe no schema de `empresas` |  |
| coluna | coluna `inscricao_municipal` usada no código não existe no schema de `empresas` |  |
| coluna | coluna `observacoes` usada no código não existe no schema de `solicitacoes_aprovacao` |  |
| coluna | coluna `solicitado_por` usada no código não existe no schema de `solicitacoes_aprovacao` |  |
| coluna | coluna `provider_message_id` usada no código não existe no schema de `execucoes_cobranca` |  |
| coluna | coluna `contas_receber_ids` usada no código não existe no schema de `acordos_parcelamento` |  |
| coluna | coluna `empresa_id` usada no código não existe no schema de `boletos` |  |
| coluna | coluna `eventos_pagamento` usada no código não existe no schema de `boletos` |  |
| coluna | coluna `rastreio_status` usada no código não existe no schema de `boletos` |  |
| coluna | coluna `expires_at` usada no código não existe no schema de `user_roles` |  |
| coluna | coluna `is_active` usada no código não existe no schema de `user_roles` |  |
| coluna | coluna `descricao` usada no código não existe no schema de `alertas_tributarios` |  |
| coluna | coluna `lido` usada no código não existe no schema de `alertas_tributarios` |  |
| coluna | coluna `resolvido_em` usada no código não existe no schema de `alertas_tributarios` |  |
| coluna | coluna `status` usada no código não existe no schema de `alertas_tributarios` |  |
| coluna | coluna `valor` usada no código não existe no schema de `alertas_tributarios` |  |
| coluna | coluna `centro_custo_id` usada no código não existe no schema de `movimentacoes` |  |
| coluna | coluna `started_at` usada no código não existe no schema de `anomalia_detection_runs` |  |
| coluna | coluna `cbs_a_compensar` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `cbs_a_pagar` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `cofins_residual` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `ibs_a_compensar` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `ibs_a_pagar` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `is_a_pagar` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `iss_residual` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `mes` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `pis_residual` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `total_geral` usada no código não existe no schema de `apuracoes_tributarias` |  |
| coluna | coluna `base_calculo` usada no código não existe no schema de `operacoes_tributaveis` |  |
| coluna | coluna `cbs_credito` usada no código não existe no schema de `operacoes_tributaveis` |  |
| coluna | coluna `cofins_valor` usada no código não existe no schema de `operacoes_tributaveis` |  |
| coluna | coluna `ibs_credito` usada no código não existe no schema de `operacoes_tributaveis` |  |
| coluna | coluna `icms_valor` usada no código não existe no schema de `operacoes_tributaveis` |  |
| coluna | coluna `iss_valor` usada no código não existe no schema de `operacoes_tributaveis` |  |
| coluna | coluna `valor_operacao` usada no código não existe no schema de `operacoes_tributaveis` |  |
| coluna | coluna `alert_email_address` usada no código não existe no schema de `asaas_config` |  |
| coluna | coluna `count` usada no código não existe no schema de `asaas_config` |  |
| coluna | coluna `ativo` usada no código não existe no schema de `bitrix_field_mappings` |  |
| coluna | coluna `entidade` usada no código não existe no schema de `bitrix_field_mappings` |  |
| coluna | coluna `period` usada no código não existe no schema de `budgets` |  |
| coluna | coluna `encargos` usada no código não existe no schema de `folha_pagamento` |  |
| coluna | coluna `mes` usada no código não existe no schema de `folha_pagamento` |  |
| coluna | coluna `salarios` usada no código não existe no schema de `folha_pagamento` |  |
| coluna | coluna `pfx_storage_path` usada no código não existe no schema de `empresas_certificados` |  |
| coluna | coluna `last_seen_at` usada no código não existe no schema de `dispositivos_conhecidos` |  |
| coluna | coluna `mes` usada no código não existe no schema de `faturamento_mensal` |  |
| coluna | coluna `receita_bruta` usada no código não existe no schema de `faturamento_mensal` |  |
| coluna | coluna `total_tributos` usada no código não existe no schema de `faturamento_mensal` |  |
| coluna | coluna `status` usada no código não existe no schema de `prejuizos_fiscais` |  |
| coluna | coluna `ativo` usada no código não existe no schema de `vendedores` |  |
| coluna | coluna `confianca` usada no código não existe no schema de `historico_conciliacao_ia` |  |
| coluna | coluna `auto_executar` usada no código não existe no schema de `regua_cobranca` |  |
| coluna | coluna `canais` usada no código não existe no schema de `regua_cobranca` |  |
| coluna | coluna `allowed_domains` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `auto_provision_users` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `claim_mapping` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `client_id` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `default_role` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `discovery_url` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `empresa_id` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `slo_url` usada no código não existe no schema de `sso_providers` |  |
| coluna | coluna `vigente_ate` usada no código não existe no schema de `ufs` |  |
| coluna | coluna `vigente_ate` usada no código não existe no schema de `ncms` |  |
| coluna | coluna `vigente_ate` usada no código não existe no schema de `itens_lista_iss` |  |
| coluna | coluna `vigente_ate` usada no código não existe no schema de `protocolos_st_ncms` |  |
| coluna | coluna `payment_id` usada no código não existe no schema de `asaas_sync_queue` |  |
| coluna | coluna `score_total` usada no código não existe no schema de `health_scores_operacionais` |  |
| coluna | coluna `carga_pct` usada no código não existe no schema de `regime_decision_cache` |  |
| coluna | coluna `regime_recomendado` usada no código não existe no schema de `regime_decision_cache` |  |
| coluna | coluna `circuit_open` usada no código não existe no schema de `sefaz_dfe_cursor` |  |
| coluna | coluna `next_run_at` usada no código não existe no schema de `sefaz_dfe_cursor` |  |
| coluna | coluna `state` usada no código não existe no schema de `sso_login_attempts` |  |
| tabela | tabela `auth_logs` usada no código não existe nas migrations/types do repo | `supabase/functions/validate-ip-geo/index.ts` |
| tabela | tabela `companies` usada no código não existe nas migrations/types do repo | `supabase/functions/external-data/index.ts` |
| tabela | tabela `cron_job_logs` usada no código não existe nas migrations/types do repo | `supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| rls | `operacoes_tributaveis`: front faz INSERT mas nenhuma política RLS permite INSERT → vai falhar/retornar vazio para usuários | `src/hooks/useOperacoesTributaveis.ts` |
| rls | `operacoes_tributaveis`: front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/hooks/useOperacoesTributaveis.ts` |
| dinheiro | `pg_stat_statements_baseline.total_exec_time` guarda dinheiro em `DOUBLE PRECISION` (ponto flutuante) — arredondamento imprevisível; padrão é numeric |  |
| rpc | RPC `exec_sql` chamada mas não definida nas migrations/types | `supabase/functions/monitor-health/index.ts` |
| rpc | RPC `pg_try_advisory_lock` chamada mas não definida nas migrations/types | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `eslint-rules/no-floating-supabase-write.js` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/components/relatorios/RelatorioDrillDown.tsx` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/useAnomaliaDetalhe.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/useBulkActions.ts` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/lib/optimistic-lock.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/_shared/validation.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/_shared/nfe/xml-storage.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/gerar-pacote-evidencias/index.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/n8n-callback/index.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/upload-anexo/index.ts` |
| segurança | função `trigger_log_receber_status_change` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260508114336_c960aea0-385e-4f66-863e-e47093fb9341.sql` |
| segurança | função `handle_conciliacao_retroativa_error` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260508130002_cfb2c801-331a-4fbe-b9e8-cdf17f93277a.sql` |
| segurança | função `check_asaas_queue_failures` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260508180618_16cffdc0-06f0-436d-863d-2191485e652b.sql` |
| segurança | função `validar_duplicidade_financeira` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260508200043_a00525d1-736f-4bbc-96fd-0d7171d610fe.sql` |
| segurança | função `validar_duplicidade_avancada` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260508200327_cb379296-ba4d-4201-9f04-d175b2535749.sql` |
| segurança | função `notificar_bloqueio_duplicidade` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260509105046_1e9ee222-6d3a-4fda-a164-1b989b8fa091.sql` |
| segurança | função `audit_trigger_function` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260509132729_3a9718e5-502c-4c7e-b15a-33ff2f016fb5.sql` |
| segurança | função `handle_asaas_payment_settlement` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260509132829_55841dda-6108-4acd-88b5-07d9eced49ae.sql` |
| segurança | função `gerar_lancamento_contabil_automatico` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20261027120000_transferencias_movimentacao_bilateral.sql` |
| segurança | função `gerar_alerta_falha_processamento` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260509154202_d99d3b8f-f6aa-4431-af7a-28130c913911.sql` |
| segurança | função `gerar_alerta_falha_regua` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260509154202_d99d3b8f-f6aa-4431-af7a-28130c913911.sql` |
| webhook | edge function `conciliacao-proxy` processa eventos de webhook sem sinal de idempotência (evento duplicado = efeito duplicado) | `supabase/functions/conciliacao-proxy/index.ts` |
| webhook | edge function `scim-server` processa eventos de webhook sem sinal de idempotência (evento duplicado = efeito duplicado) | `supabase/functions/scim-server/index.ts` |

## Lacunas — o que este contexto NÃO consegue responder (perguntas para o dono do negócio)

- Nenhuma regra manual em `manual/`: prazos, limites, exceções comerciais, quem aprova o quê — só o negócio sabe.
- `fornecedores.estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `contas_receber.etapa_cobranca` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `empresas.estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `transacoes_bancarias.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `notas_fiscais.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `solicitacoes_aprovacao.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `bitrix_sync_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `boletos.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `historico_cobranca.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `historico_cobranca.etapa` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `alertas_preditivos.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `open_finance_consents.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `regua_cobranca.etapa` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `historico_cobranca_whatsapp.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `acordos_parcelamento.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `parcelas_acordo.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `apuracoes_tributarias.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `creditos_tributarios.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `operacoes_tributaveis.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `split_payment_transacoes.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `apuracoes_irpj_csll.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `darfs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `asaas_payments.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `contatos_financeiros.estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `transferencias.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `conciliacoes.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `webhooks_log.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `templates_cobranca.etapa` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `fila_cobrancas.etapa` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `fila_cobrancas.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `execucoes_cobranca.etapa` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `execucoes_cobranca.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `negativacoes.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `protestos.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `ponto_funcionarios.situacao` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `ponto_sync_log.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `cnpja_cache.situacao_cadastral` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `verificacoes_conformidade.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `anomalias_detectadas.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `acoes_recomendadas.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `user_onboarding_progress.last_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `lancamentos_contabeis.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `anomalia_detection_runs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `anomalia_toast_eventos.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `user_demonstrativo_preferences.drill_down_estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `execucoes_regua_cobranca.etapa` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `logs_conciliacao_retroativa.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `divergencias_conciliacao.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `elisao_analise_gap.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `regua_cobranca_status.status_cobranca` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `conciliacao_sugestoes.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `boleto_events.status_before` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `boleto_events.status_after` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `asaas_sync_queue.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `asaas_transfers.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `asaas_reconciliation_suggestions.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `asaas_scheduled_transfers.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `budgets.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `pedidos_compra.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `whatsapp_conversas.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sessoes_conciliacao.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `contratos.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `webhook_simulation_runs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `webhook_simulation_results.response_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `n8n_dispatch_logs.response_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sefaz_dfe_cursor.ultimo_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nfe_recebidas.manifestacao_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nfe_recebidas.situacao_nfe` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nfe_eventos.status_retorno` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `ci_security_gate_events.expected_state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `ci_security_gate_events.observed_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `oportunidades_elisao.status_alterado_em` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `oportunidades_elisao.status_alterado_por` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `bitrix24_stage_mappings.lalamove_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- 258/265 tabelas sem `COMMENT ON TABLE` — o significado de negócio não está no schema: `clientes`, `fornecedores`, `contas_pagar`, `contas_receber`, `categorias`, `user_preferences`, `audit_log`, `entity_versions`, `profiles`, `user_roles`, `empresas`, `contas_bancarias` …
- Há tabelas usadas no código sem migration no repo — o schema real pode ter sido alterado pelo painel.

## Regras manuais presentes

_nenhuma — copie `manual/TEMPLATE-regras-de-negocio.md`_
