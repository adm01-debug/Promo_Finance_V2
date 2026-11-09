# Matriz edge function x tabela

> Gerado por `node scripts/ci/gerar-matriz-edge-tabela.mjs` — não editar à mão.
> Fonte: chamadas `.from('tabela')` em `supabase/functions/<funcao>/**/*.ts` (sem testes e sem `_shared`).
>
> Não cobre: tabelas acessadas por `.rpc()` (chamada de função, não de tabela), por nome em variável
> (`from(nome)`) nem por SQL cru. Chamadas `storage.from('bucket')` são bucket de storage, não tabela, e ficam de fora.

**106 edge functions · 112 tabelas citadas · 25 funções sem `.from()` literal.**

## Por função

| Função | Tabelas |
|---|---|
| `aceitar-convite` | `convites`, `organizacao_membros`, `organizacoes` |
| `analise-fluxo-ia` | — |
| `analise-preditiva` | `clientes`, `contas_pagar`, `contas_receber`, `transacoes_bancarias` |
| `analyze-document` | — |
| `api-keys-manage` | `api_keys`, `user_empresas` |
| `asaas-proxy` | `asaas_audit_trail`, `asaas_config`, `asaas_credit_risk_analysis`, `asaas_customers`, `asaas_payment_links`, `asaas_payments`, `asaas_reconciliation_suggestions`, `asaas_sync_queue`, `asaas_transfers`, `clientes`, `contas_receber`, `user_empresas`, `user_roles` |
| `asaas-webhook` | `asaas_audit_trail`, `asaas_payments`, `asaas_transfers` |
| `benchmarking-setorial` | — |
| `bitrix24-sync` | `bitrix_field_mappings`, `bitrix_oauth_tokens`, `bitrix_sync_logs`, `clientes`, `contas_receber`, `elisao_tarefas_acionaveis`, `empresas` |
| `bitrix24-webhook` | — |
| `bling-proxy` | `bling_tokens`, `user_roles` |
| `bling-webhook` | `alertas` |
| `calcular-health-score-operacional` | `alertas`, `apuracoes_tributarias`, `contas_bancarias`, `contas_receber`, `empresas`, `health_scores_operacionais`, `solicitacoes_lgpd`, `transacoes_bancarias`, `user_empresas` |
| `calcular-slo-metrics-diario` | `slo_metrics_diarias`, `vw_edge_health` |
| `calculo-iva` | — |
| `categorizar-despesa` | — |
| `ci-security-gate-log` | `ci_security_gate_events` |
| `cnpja-lookup` | `cnpja_cache` |
| `comparar-benchmark-setorial` | `empresas`, `faturamento_mensal`, `user_empresas` |
| `compare-schemas` | — |
| `conciliacao-ia` | — |
| `conciliacao-proxy` | — |
| `consulta-tributaria` | `aliquotas_interestaduais`, `aliquotas_internas_uf`, `aliquotas_iss_municipal`, `beneficios_fiscais`, `cnaes`, `ncms`, `protocolos_st_ncms`, `protocolos_st_ufs` |
| `contabilizar-evento` | `eventos_contabilizacao_log`, `lancamentos_contabeis`, `partidas_contabeis`, `regras_contabilizacao_automatica`, `user_empresas`, `user_roles` |
| `convidar-contador` | `convites_contador`, `user_empresas` |
| `convidar-usuario` | `profiles`, `user_roles` |
| `copilot-global` | `acoes_recomendadas`, `alertas`, `contas_bancarias`, `contas_pagar`, `contas_receber`, `health_scores_operacionais`, `user_roles` |
| `copilot-tributario` | `empresas`, `user_roles` |
| `decidir-regime` | `empresas`, `faturamento_mensal`, `folha_pagamento`, `regime_decision_cache`, `tax_audit_trail` |
| `detectar-anomalias-financeiras` | `anomalia_detection_runs`, `anomalias_detectadas`, `contas_pagar`, `empresas`, `movimentacoes`, `regime_decision_cache`, `transacoes_bancarias` |
| `digest-silenciamentos-erro` | `profiles`, `user_roles` |
| `enviar-alerta-email` | `alertas` |
| `enviar-bitrix24-tributario` | `user_empresas` |
| `enviar-convite-organizacao` | `convites`, `organizacao_membros`, `organizacoes` |
| `enviar-digest-conformidade` | `alertas_tributarios`, `digest_envios_log`, `empresas`, `integration_secrets`, `profiles`, `user_digest_preferences`, `user_roles` |
| `enviar-relatorios-tributarios-agendados` | `empresas`, `relatorios_tributarios_agendados` |
| `executar-analise-preditiva` | `alertas_preditivos`, `clientes`, `contas_pagar`, `contas_receber`, `empresas`, `historico_analises_preditivas`, `historico_score_saude`, `metas_financeiras`, `recomendacoes_metas_ia`, `transacoes_bancarias`, `user_empresas` |
| `executar-fechamento-tributario` | `apuracoes_tributarias`, `empresas`, `fechamentos_tributarios`, `regime_decision_cache`, `relatorios_tributarios`, `transacoes_bancarias`, `user_roles`, `verificacoes_conformidade` |
| `executar-regua-cobranca` | `contas_receber`, `execucoes_regua_cobranca`, `regua_cobranca` |
| `executar-relatorios` | `contas_bancarias`, `contas_pagar`, `contas_receber`, `historico_relatorios`, `relatorios_agendados`, `user_empresas` |
| `expert-agent` | — |
| `exportar-sped-contribuicoes` | `apuracoes_tributarias`, `empresas`, `user_empresas`, `user_roles` |
| `external-data` | `companies`, `query_telemetry`, `user_empresas` |
| `gerar-acoes-recomendadas` | `acoes_recomendadas`, `alertas_tributarios`, `anomalias_detectadas`, `apuracoes_tributarias`, `empresas`, `health_scores_operacionais`, `solicitacoes_lgpd` |
| `gerar-alertas` | `alertas`, `contas_pagar`, `contas_receber`, `metas_financeiras` |
| `gerar-alertas-dispatcher` | — |
| `gerar-alertas-tributarios` | `alertas_tributarios`, `apuracoes_tributarias`, `benchmarks_setoriais`, `edge_function_logs`, `empresas`, `faturamento_mensal`, `folha_pagamento`, `movimentacoes` |
| `gerar-dre-tributaria` | `empresas`, `faturamento_mensal`, `user_empresas` |
| `gerar-heatmap-tributario` | `faturamento_mensal`, `user_empresas` |
| `gerar-pacote-evidencias` | `evidencias_pacotes`, `user_empresas`, `user_roles` |
| `gerar-pdf-tributario` | `empresas`, `user_empresas` |
| `gerar-relatorio-anual` | `alertas_tributarios`, `empresas`, `user_empresas`, `user_roles`, `vw_tributario_dashboard` |
| `gerar-resumo-executivo-semanal` | `alertas_tributarios`, `contas_pagar`, `contas_receber`, `empresas`, `relatorios_tributarios_agendados`, `resumos_executivos_semanais` |
| `gerar-resumo-financeiro-diario` | `asaas_config`, `asaas_payments`, `asaas_sync_queue`, `empresas` |
| `gerar-snapshots-conformidade` | `alertas_tributarios`, `conformidade_snapshots`, `empresas`, `entregas_obrigacoes`, `integration_secrets` |
| `gerar-sped-ecd` | `empresas`, `lancamentos_contabeis`, `plano_contas`, `sped_contabil_arquivos`, `user_empresas`, `user_roles` |
| `gerar-sped-ecf` | `empresas`, `lancamentos_contabeis`, `plano_contas`, `sped_contabil_arquivos`, `user_empresas`, `user_roles` |
| `get-mapbox-token` | — |
| `get-vapid-key` | — |
| `health` | `asaas_config` |
| `insights-relatorio` | — |
| `log-sped-bitrix24` | `audit_logs` |
| `mcp-query` | — |
| `monitor-health` | `alertas`, `webhooks_log` |
| `monitorar-erros-frontend` | `profiles`, `user_roles` |
| `n8n-callback` | — |
| `n8n-dispatch` | `n8n_dispatch_logs`, `n8n_workflow_configs` |
| `nfe-upload-certificado` | `sefaz_dfe_cursor` |
| `nfe-vinculo-proxy` | — |
| `notify-performance-alert` | `query_telemetry` |
| `notify-saved-filter` | `notification_history` |
| `open-finance` | `contas_bancarias`, `open_finance_consents`, `transacoes_bancarias` |
| `overlay-rejeicoes-auditoria` | `overlay_rejeicoes_auditoria` |
| `prever-carga-tributaria` | `faturamento_mensal`, `user_empresas` |
| `processar-fila-cobrancas` | `execucoes_cobranca`, `fila_cobrancas` |
| `processar-nf-ocr` | `notas_fiscais_ocr` |
| `processar-solicitacao-lgpd` | `alertas`, `audit_logs`, `auditoria_tributaria`, `profiles`, `solicitacoes_lgpd` |
| `projecao-reforma` | — |
| `relatorio-diario-anomalias` | `alertas`, `anomalias_detectadas`, `profiles`, `user_roles` |
| `scim-server` | `profiles`, `scim_operations_log`, `scim_tokens`, `sso_providers`, `sso_role_mappings`, `user_empresas`, `user_roles` |
| `sefaz-dfe-dispatcher` | `cron_job_logs`, `empresas_certificados`, `sefaz_dfe_cursor` |
| `sefaz-dfe-puxar` | `empresas_certificados`, `query_telemetry`, `sefaz_dfe_cursor` |
| `sefaz-manifestar` | `empresas_certificados`, `nfe_eventos`, `nfe_recebidas`, `user_empresas` |
| `send-device-alert` | — |
| `send-push-notification` | `alertas`, `push_subscriptions` |
| `simular-presumido` | — |
| `simular-real` | — |
| `simular-simples` | — |
| `sincronizar-anomalia-bitrix24` | `anomalias_detectadas` |
| `sso-callback` | `audit_logs`, `profiles`, `sso_login_attempts`, `sso_providers`, `sso_role_mappings`, `sso_user_groups`, `user_empresas`, `user_roles` |
| `sso-generate-metadata` | — |
| `sso-initiate` | `sso_login_attempts`, `sso_providers` |
| `sso-logout` | `audit_logs`, `sso_login_attempts`, `sso_providers` |
| `sso-test-login` | `sso_providers`, `sso_role_mappings`, `user_roles` |
| `sso-validate-config` | — |
| `sync-profile-to-bitrix` | `audit_logs`, `bitrix_oauth_tokens`, `profiles` |
| `upload-anexo` | `anexos_financeiros`, `user_empresas` |
| `validar-token-contador` | `convites_contador`, `empresas` |
| `validate-ip-geo` | `auth_logs` |
| `verificar-conformidade-fiscal` | `alertas_tributarios`, `apuracoes_tributarias`, `contas_pagar`, `empresas`, `regime_decision_cache`, `relatorios_tributarios_agendados`, `user_empresas`, `user_roles`, `verificacoes_conformidade` |
| `webhook-replay` | `webhooks_log` |
| `webhook-retry-worker` | — |
| `webhook-simulator` | `webhook_simulation_results`, `webhook_simulation_runs` |
| `whatsapp-ai-analyzer` | `historico_cobranca_whatsapp` |
| `whatsapp-ia-proativo` | `clientes`, `contas_receber`, `historico_cobranca_whatsapp`, `user_empresas` |
| `whatsapp-webhook` | `asaas_audit_trail`, `execucoes_cobranca` |

## Por tabela

| Tabela | Funções |
|---|---|
| `acoes_recomendadas` | `copilot-global`, `gerar-acoes-recomendadas` |
| `alertas` | `bling-webhook`, `calcular-health-score-operacional`, `copilot-global`, `enviar-alerta-email`, `gerar-alertas`, `monitor-health`, `processar-solicitacao-lgpd`, `relatorio-diario-anomalias`, `send-push-notification` |
| `alertas_preditivos` | `executar-analise-preditiva` |
| `alertas_tributarios` | `enviar-digest-conformidade`, `gerar-acoes-recomendadas`, `gerar-alertas-tributarios`, `gerar-relatorio-anual`, `gerar-resumo-executivo-semanal`, `gerar-snapshots-conformidade`, `verificar-conformidade-fiscal` |
| `aliquotas_interestaduais` | `consulta-tributaria` |
| `aliquotas_internas_uf` | `consulta-tributaria` |
| `aliquotas_iss_municipal` | `consulta-tributaria` |
| `anexos_financeiros` | `upload-anexo` |
| `anomalia_detection_runs` | `detectar-anomalias-financeiras` |
| `anomalias_detectadas` | `detectar-anomalias-financeiras`, `gerar-acoes-recomendadas`, `relatorio-diario-anomalias`, `sincronizar-anomalia-bitrix24` |
| `api_keys` | `api-keys-manage` |
| `apuracoes_tributarias` | `calcular-health-score-operacional`, `executar-fechamento-tributario`, `exportar-sped-contribuicoes`, `gerar-acoes-recomendadas`, `gerar-alertas-tributarios`, `verificar-conformidade-fiscal` |
| `asaas_audit_trail` | `asaas-proxy`, `asaas-webhook`, `whatsapp-webhook` |
| `asaas_config` | `asaas-proxy`, `gerar-resumo-financeiro-diario`, `health` |
| `asaas_credit_risk_analysis` | `asaas-proxy` |
| `asaas_customers` | `asaas-proxy` |
| `asaas_payment_links` | `asaas-proxy` |
| `asaas_payments` | `asaas-proxy`, `asaas-webhook`, `gerar-resumo-financeiro-diario` |
| `asaas_reconciliation_suggestions` | `asaas-proxy` |
| `asaas_sync_queue` | `asaas-proxy`, `gerar-resumo-financeiro-diario` |
| `asaas_transfers` | `asaas-proxy`, `asaas-webhook` |
| `audit_logs` | `log-sped-bitrix24`, `processar-solicitacao-lgpd`, `sso-callback`, `sso-logout`, `sync-profile-to-bitrix` |
| `auditoria_tributaria` | `processar-solicitacao-lgpd` |
| `auth_logs` | `validate-ip-geo` |
| `benchmarks_setoriais` | `gerar-alertas-tributarios` |
| `beneficios_fiscais` | `consulta-tributaria` |
| `bitrix_field_mappings` | `bitrix24-sync` |
| `bitrix_oauth_tokens` | `bitrix24-sync`, `sync-profile-to-bitrix` |
| `bitrix_sync_logs` | `bitrix24-sync` |
| `bling_tokens` | `bling-proxy` |
| `ci_security_gate_events` | `ci-security-gate-log` |
| `clientes` | `analise-preditiva`, `asaas-proxy`, `bitrix24-sync`, `executar-analise-preditiva`, `whatsapp-ia-proativo` |
| `cnaes` | `consulta-tributaria` |
| `cnpja_cache` | `cnpja-lookup` |
| `companies` | `external-data` |
| `conformidade_snapshots` | `gerar-snapshots-conformidade` |
| `contas_bancarias` | `calcular-health-score-operacional`, `copilot-global`, `executar-relatorios`, `open-finance` |
| `contas_pagar` | `analise-preditiva`, `copilot-global`, `detectar-anomalias-financeiras`, `executar-analise-preditiva`, `executar-relatorios`, `gerar-alertas`, `gerar-resumo-executivo-semanal`, `verificar-conformidade-fiscal` |
| `contas_receber` | `analise-preditiva`, `asaas-proxy`, `bitrix24-sync`, `calcular-health-score-operacional`, `copilot-global`, `executar-analise-preditiva`, `executar-regua-cobranca`, `executar-relatorios`, `gerar-alertas`, `gerar-resumo-executivo-semanal`, `whatsapp-ia-proativo` |
| `convites` | `aceitar-convite`, `enviar-convite-organizacao` |
| `convites_contador` | `convidar-contador`, `validar-token-contador` |
| `cron_job_logs` | `sefaz-dfe-dispatcher` |
| `digest_envios_log` | `enviar-digest-conformidade` |
| `edge_function_logs` | `gerar-alertas-tributarios` |
| `elisao_tarefas_acionaveis` | `bitrix24-sync` |
| `empresas` | `bitrix24-sync`, `calcular-health-score-operacional`, `comparar-benchmark-setorial`, `copilot-tributario`, `decidir-regime`, `detectar-anomalias-financeiras`, `enviar-digest-conformidade`, `enviar-relatorios-tributarios-agendados`, `executar-analise-preditiva`, `executar-fechamento-tributario`, `exportar-sped-contribuicoes`, `gerar-acoes-recomendadas`, `gerar-alertas-tributarios`, `gerar-dre-tributaria`, `gerar-pdf-tributario`, `gerar-relatorio-anual`, `gerar-resumo-executivo-semanal`, `gerar-resumo-financeiro-diario`, `gerar-snapshots-conformidade`, `gerar-sped-ecd`, `gerar-sped-ecf`, `validar-token-contador`, `verificar-conformidade-fiscal` |
| `empresas_certificados` | `sefaz-dfe-dispatcher`, `sefaz-dfe-puxar`, `sefaz-manifestar` |
| `entregas_obrigacoes` | `gerar-snapshots-conformidade` |
| `eventos_contabilizacao_log` | `contabilizar-evento` |
| `evidencias_pacotes` | `gerar-pacote-evidencias` |
| `execucoes_cobranca` | `processar-fila-cobrancas`, `whatsapp-webhook` |
| `execucoes_regua_cobranca` | `executar-regua-cobranca` |
| `faturamento_mensal` | `comparar-benchmark-setorial`, `decidir-regime`, `gerar-alertas-tributarios`, `gerar-dre-tributaria`, `gerar-heatmap-tributario`, `prever-carga-tributaria` |
| `fechamentos_tributarios` | `executar-fechamento-tributario` |
| `fila_cobrancas` | `processar-fila-cobrancas` |
| `folha_pagamento` | `decidir-regime`, `gerar-alertas-tributarios` |
| `health_scores_operacionais` | `calcular-health-score-operacional`, `copilot-global`, `gerar-acoes-recomendadas` |
| `historico_analises_preditivas` | `executar-analise-preditiva` |
| `historico_cobranca_whatsapp` | `whatsapp-ai-analyzer`, `whatsapp-ia-proativo` |
| `historico_relatorios` | `executar-relatorios` |
| `historico_score_saude` | `executar-analise-preditiva` |
| `integration_secrets` | `enviar-digest-conformidade`, `gerar-snapshots-conformidade` |
| `lancamentos_contabeis` | `contabilizar-evento`, `gerar-sped-ecd`, `gerar-sped-ecf` |
| `metas_financeiras` | `executar-analise-preditiva`, `gerar-alertas` |
| `movimentacoes` | `detectar-anomalias-financeiras`, `gerar-alertas-tributarios` |
| `n8n_dispatch_logs` | `n8n-dispatch` |
| `n8n_workflow_configs` | `n8n-dispatch` |
| `ncms` | `consulta-tributaria` |
| `nfe_eventos` | `sefaz-manifestar` |
| `nfe_recebidas` | `sefaz-manifestar` |
| `notas_fiscais_ocr` | `processar-nf-ocr` |
| `notification_history` | `notify-saved-filter` |
| `open_finance_consents` | `open-finance` |
| `organizacao_membros` | `aceitar-convite`, `enviar-convite-organizacao` |
| `organizacoes` | `aceitar-convite`, `enviar-convite-organizacao` |
| `overlay_rejeicoes_auditoria` | `overlay-rejeicoes-auditoria` |
| `partidas_contabeis` | `contabilizar-evento` |
| `plano_contas` | `gerar-sped-ecd`, `gerar-sped-ecf` |
| `profiles` | `convidar-usuario`, `digest-silenciamentos-erro`, `enviar-digest-conformidade`, `monitorar-erros-frontend`, `processar-solicitacao-lgpd`, `relatorio-diario-anomalias`, `scim-server`, `sso-callback`, `sync-profile-to-bitrix` |
| `protocolos_st_ncms` | `consulta-tributaria` |
| `protocolos_st_ufs` | `consulta-tributaria` |
| `push_subscriptions` | `send-push-notification` |
| `query_telemetry` | `external-data`, `notify-performance-alert`, `sefaz-dfe-puxar` |
| `recomendacoes_metas_ia` | `executar-analise-preditiva` |
| `regime_decision_cache` | `decidir-regime`, `detectar-anomalias-financeiras`, `executar-fechamento-tributario`, `verificar-conformidade-fiscal` |
| `regras_contabilizacao_automatica` | `contabilizar-evento` |
| `regua_cobranca` | `executar-regua-cobranca` |
| `relatorios_agendados` | `executar-relatorios` |
| `relatorios_tributarios` | `executar-fechamento-tributario` |
| `relatorios_tributarios_agendados` | `enviar-relatorios-tributarios-agendados`, `gerar-resumo-executivo-semanal`, `verificar-conformidade-fiscal` |
| `resumos_executivos_semanais` | `gerar-resumo-executivo-semanal` |
| `scim_operations_log` | `scim-server` |
| `scim_tokens` | `scim-server` |
| `sefaz_dfe_cursor` | `nfe-upload-certificado`, `sefaz-dfe-dispatcher`, `sefaz-dfe-puxar` |
| `slo_metrics_diarias` | `calcular-slo-metrics-diario` |
| `solicitacoes_lgpd` | `calcular-health-score-operacional`, `gerar-acoes-recomendadas`, `processar-solicitacao-lgpd` |
| `sped_contabil_arquivos` | `gerar-sped-ecd`, `gerar-sped-ecf` |
| `sso_login_attempts` | `sso-callback`, `sso-initiate`, `sso-logout` |
| `sso_providers` | `scim-server`, `sso-callback`, `sso-initiate`, `sso-logout`, `sso-test-login` |
| `sso_role_mappings` | `scim-server`, `sso-callback`, `sso-test-login` |
| `sso_user_groups` | `sso-callback` |
| `tax_audit_trail` | `decidir-regime` |
| `transacoes_bancarias` | `analise-preditiva`, `calcular-health-score-operacional`, `detectar-anomalias-financeiras`, `executar-analise-preditiva`, `executar-fechamento-tributario`, `open-finance` |
| `user_digest_preferences` | `enviar-digest-conformidade` |
| `user_empresas` | `api-keys-manage`, `asaas-proxy`, `calcular-health-score-operacional`, `comparar-benchmark-setorial`, `contabilizar-evento`, `convidar-contador`, `enviar-bitrix24-tributario`, `executar-analise-preditiva`, `executar-relatorios`, `exportar-sped-contribuicoes`, `external-data`, `gerar-dre-tributaria`, `gerar-heatmap-tributario`, `gerar-pacote-evidencias`, `gerar-pdf-tributario`, `gerar-relatorio-anual`, `gerar-sped-ecd`, `gerar-sped-ecf`, `prever-carga-tributaria`, `scim-server`, `sefaz-manifestar`, `sso-callback`, `upload-anexo`, `verificar-conformidade-fiscal`, `whatsapp-ia-proativo` |
| `user_roles` | `asaas-proxy`, `bling-proxy`, `contabilizar-evento`, `convidar-usuario`, `copilot-global`, `copilot-tributario`, `digest-silenciamentos-erro`, `enviar-digest-conformidade`, `executar-fechamento-tributario`, `exportar-sped-contribuicoes`, `gerar-pacote-evidencias`, `gerar-relatorio-anual`, `gerar-sped-ecd`, `gerar-sped-ecf`, `monitorar-erros-frontend`, `relatorio-diario-anomalias`, `scim-server`, `sso-callback`, `sso-test-login`, `verificar-conformidade-fiscal` |
| `verificacoes_conformidade` | `executar-fechamento-tributario`, `verificar-conformidade-fiscal` |
| `vw_edge_health` | `calcular-slo-metrics-diario` |
| `vw_tributario_dashboard` | `gerar-relatorio-anual` |
| `webhook_simulation_results` | `webhook-simulator` |
| `webhook_simulation_runs` | `webhook-simulator` |
| `webhooks_log` | `monitor-health`, `webhook-replay` |
