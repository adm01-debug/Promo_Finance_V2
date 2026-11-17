# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 305.0 MB |
| schema public | 148.5 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.edge_function_logs | ~129.9k | 39.0 MB | 20.8 MB | 18.2 MB | 0 | 0 | ~100 |  |
| public.frontend_performance_logs | ~83.1k | 31.0 MB | 24.0 MB | 6.9 MB | ~550 | ~10 | 4 |  |
| public.slow_query_alerts | ~17.1k | 21.0 MB | 18.0 MB | 3.0 MB | ~460 | 0 | ~110 |  |
| public.index_usage_snapshots | ~49.6k | 15.0 MB | 8.4 MB | 6.6 MB | 0 | 0 | 3 |  |
| public.query_telemetry | ~13.8k | 13.7 MB | 10.0 MB | 3.6 MB | ~670 | 0 | ~250 |  |
| public.bloat_snapshots | ~21.6k | 5.5 MB | 3.0 MB | 2.4 MB | 0 | 0 | ~280 |  |
| public.login_attempts | ~2.1k | 4.0 MB | 3.0 MB | 1000.0 KB | 0 | ~540 | ~250 | 2026-11-17 |
| public.performance_alerts | ~4.4k | 3.6 MB | 2.5 MB | 1.1 MB | ~80 | 0 | ~70 |  |
| public.integrity_alerts | ~1.9k | 1.7 MB | 1.2 MB | 512.0 KB | 0 | ~1.3k | ~660 |  |
| public.alertas | ~1.8k | 584.0 KB | 408.0 KB | 136.0 KB | 0 | ~68.5k | 3 |  |
| public.audit_logs | ~420 | 424.0 KB | 288.0 KB | 104.0 KB | 0 | 3 | ~280 |  |
| public.rate_limit_logs | ~660 | 424.0 KB | 288.0 KB | 104.0 KB | ~40 | 6 | ~1.7k |  |
| public.pg_stat_statements_baseline | 0 | 408.0 KB | 0 B | 384.0 KB | 0 | 3 | 0 |  |
| public.cron_job_logs | ~450 | 376.0 KB | 192.0 KB | 144.0 KB | 3 | 3 | ~180 |  |
| public.auth_logs | ~660 | 272.0 KB | 184.0 KB | 56.0 KB | 0 | 4 | 0 |  |
| public.contas_pagar | ~20 | 240.0 KB | 24.0 KB | 176.0 KB | 8 | ~39.8k | ~30.1k |  |
| public.contas_receber | ~20 | 208.0 KB | 16.0 KB | 160.0 KB | ~20 | ~9.4k | ~125.1k |  |
| public.aliquotas_interestaduais | ~700 | 184.0 KB | 72.0 KB | 80.0 KB | 2 | ~110 | 0 |  |
| public.nfe_recebidas | ~30 | 144.0 KB | 16.0 KB | 96.0 KB | 6 | ~30 | ~1.3k |  |
| public.partidas_contabeis | ~100 | 144.0 KB | 40.0 KB | 64.0 KB | 0 | ~20 | ~60 | 2026-11-16 |
| public.aliquotas_iss_municipal | ~30 | 128.0 KB | 8.0 KB | 80.0 KB | 0 | ~110 | 0 |  |
| public.movimentacoes | ~40 | 128.0 KB | 8.0 KB | 80.0 KB | 4 | ~20 | 0 |  |
| public.eventos_contabilizacao_log | ~30 | 120.0 KB | 16.0 KB | 64.0 KB | 9 | 8 | 9 |  |
| public.categorias | 7 | 112.0 KB | 8.0 KB | 64.0 KB | 0 | 8 | ~1.5k |  |
| public.historico_conciliacao_ia | 4 | 112.0 KB | 8.0 KB | 96.0 KB | 0 | ~20 | 0 |  |
| public.itens_lista_iss | ~160 | 112.0 KB | 32.0 KB | 48.0 KB | 0 | 3 | ~100 |  |
| public.ncms | ~130 | 112.0 KB | 24.0 KB | 48.0 KB | 0 | 4 | ~110 |  |
| public.protocolos_st_ncms | ~20 | 112.0 KB | 16.0 KB | 64.0 KB | 0 | ~120 | 0 |  |
| public.lancamentos_contabeis | ~50 | 104.0 KB | 16.0 KB | 48.0 KB | ~20 | ~60 | ~80 |  |
| public.boletos | 6 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~2.7k | 0 |  |
| public.centros_custo | 8 | 96.0 KB | 8.0 KB | 48.0 KB | 0 | ~22.3k | ~119.4k |  |
| public.creditos_tributarios | ~10 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~180 | 0 |  |
| public.pedidos_compra | 6 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | 8 | 0 |  |
| public.plano_contas | ~10 | 96.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.protocolos_st_ufs | ~80 | 96.0 KB | 8.0 KB | 48.0 KB | 0 | ~110 | 0 |  |
| public.regua_cobranca_status | ~10 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~20 | 0 |  |
| public.transferencias | 6 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~20 | 0 |  |
| public.contas_bancarias | 8 | 88.0 KB | 16.0 KB | 32.0 KB | 3 | ~29.8k | ~17.2k |  |
| public.faixas_simples_nacional | ~30 | 88.0 KB | 16.0 KB | 32.0 KB | 0 | ~110 | 0 |  |
| public.alertas_tributarios | 6 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~130 | 0 |  |
| public.aliquotas_internas_uf | ~90 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | 7 | 2 |  |
| public.bloqueios_duplicidade | 6 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~3.6k | 0 |  |
| public.clientes | ~10 | 80.0 KB | 8.0 KB | 48.0 KB | 0 | ~3.6k | ~560 |  |
| public.cnaes | ~70 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~110 | 0 |  |
| public.contratos | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.divergencias_conciliacao | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~2.7k | 0 |  |
| public.elisao_creditos_auditoria | 4 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.estrategias_elisao | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | 4 | 0 |  |
| public.fornecedores | 5 | 80.0 KB | 8.0 KB | 64.0 KB | 2 | ~16.8k | 0 |  |
| public.historico_cobranca | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | 0 |  |
| public.negativacoes | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | 0 |  |
| public.protestos | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | 0 |  |
| public.regras_conciliacao | 4 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~190 | 0 |  |
| public.retencao_politicas | ~60 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.solicitacoes_aprovacao | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~33k | 0 |  |
| public.user_empresas | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~1.7M | ~80.3k |  |
| public.anomalia_toast_eventos | 0 | 72.0 KB | 8.0 KB | 56.0 KB | 0 | ~10 | 0 |  |
| public.alert_configurations | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 5 | 0 |  |
| public.apuracoes_irpj_csll | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 8 | 0 |  |
| public.apuracoes_tributarias | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~90 | ~20 |  |
| public.budgets | 8 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~10 | ~70 |  |
| public.extrato_bancario | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 9 | 0 |  |
| public.faturamento_mensal | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~40 | 0 |  |
| public.fechamentos_tributarios | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.folha_pagamento | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.formas_pagamento | ~10 | 64.0 KB | 8.0 KB | 32.0 KB | 0 | 4 | 0 |  |
| public.geo_blocks | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 8 | 0 |  |
| public.integration_secrets | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~1.5k | 0 |  |
| public.metas_financeiras | 6 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~80 | 0 |  |
| public.notas_fiscais | 5 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 3 | 0 |  |
| public.oportunidades_elisao | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.profiles | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~12.2k | ~11.7k |  |
| public.regimes_simulados | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~50 | 0 |  |
| public.regras_roteamento_financeiro | 6 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~11.6k | 0 |  |
| public.sessoes_conciliacao | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 9 | 0 |  |
| public.transacoes_bancarias | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~270 | 0 |  |
| public.ufs | ~30 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~110 | 0 |  |
| public.user_filter_presets | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 8 | 0 |  |
| public.execucoes_regua_cobranca | 0 | 56.0 KB | 8.0 KB | 40.0 KB | 0 | 4 | 0 |  |
| public.regua_cobranca_etapas | 6 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | 0 |  |
| public.role_permissions | 1 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | ~4.5k | 0 |  |
| public.api_keys | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | 3 | 0 |  |
| public.beneficios_fiscais | 9 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.blocked_ips | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~420 | 0 |  |
| public.catalogos_fiscais_cargas | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 6 | 0 |  |
| public.conciliacoes | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 9 | 0 |  |
| public.configuracoes_aprovacao | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~5.2k | 0 |  |
| public.conformidade_snapshots | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | ~20 |  |
| public.convites_contador | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | 3 | 0 |  |
| public.digest_envios_log | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.dispositivos_conhecidos | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~30 | ~260 | 0 |  |
| public.elisao_alertas | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.elisao_regras_creditos | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | ~80 |  |
| public.elisao_tarefas_acionaveis | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.empresas | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~121.4k | 0 |  |
| public.estrategias_elisao_catalogo | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 8 | ~50 |  |
| public.execucoes_cobranca | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 5 | 0 |  |
| public.fila_cobrancas | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.glossario_tributario | ~30 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.health_scores_operacionais | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.historico_analises_preditivas | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.historico_score_saude | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~70 | 0 |  |
| public.incentivos_fiscais | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.itens_pedido_compra | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 8 | 0 |  |
| public.notas_fiscais_ocr | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~90 | 0 |  |
| public.operacoes_tributaveis | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~90 | 0 |  |
| public.permissions | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~4.5k | 0 |  |
| public.pix_templates | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.planos_acao | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 7 | 1 |  |
| public.protocolos_st | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | ~2.1k |  |
| public.recomendacoes_metas_ia | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~70 | 0 |  |
| public.regimes_tributarios | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 6 | 0 |  |
| public.regras_contabilizacao_automatica | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 8 | ~10 | ~20 |  |
| public.regras_duplicidade | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 6 | 0 |  |
| public.regua_cobranca | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~10 | 0 |  |
| public.relatorios_tributarios_agendados | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~390 | 0 |  |
| public.retencoes_fonte | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 6 | 0 |  |
| public.saved_filters | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | ~880 |  |
| public.scim_tokens | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 0 |  |
| public.security_alerts | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 3 | 0 |  |
| public.sefaz_dfe_cursor | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~650 | 0 |  |
| public.split_payment_transacoes | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 7 | 0 |  |
| public.sso_providers | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~540 | 0 |  |
| public.templates_cobranca | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 7 | 0 |  |
| public.user_anomalia_preferences | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~13.6k | 0 |  |
| public.user_onboarding_progress | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~4.7k | 0 |  |
| public.user_roles | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~5.7M | 0 |  |
| public.user_sessions | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 8 | 0 |  |
| public.vendedores | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~70 | 0 |  |
| public.webhook_simulation_results | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 8 | 0 |  |
| public.webhook_simulation_runs | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 8 | 0 |  |
| public.acordos_parcelamento | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.asaas_payment_links | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 8 | 0 |  |
| public.convites | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 8 | 0 |  |
| public.empresas_certificados | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~60 | 0 |  |
| public.entregas_obrigacoes | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 8 | 0 |  |
| public.feedback_conciliacao_ia | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.new_device_alerts | 0 | 40.0 KB | 8.0 KB | 24.0 KB | 0 | 8 | 0 |  |
| public.nfe_eventos | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 8 | 0 |  |
| public.notification_history | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 3 | 0 |  |
| public.solicitacoes_lgpd | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 3 | ~90 |  |
| public.sso_user_groups | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 8 | 0 |  |
| public.webhooks_log | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~820 | 0 |  |
| public.alertas_preditivos | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~70 | 0 |  |
| public.allowed_ips | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~420 | 0 |  |
| public.anomalias_detectadas | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~5.3k | 0 |  |
| public.asaas_payments | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 9 | 0 |  |
| public.asaas_reconciliation_suggestions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.asaas_transfers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_05 | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_07 | ~20 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.auditoria_tributaria | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | 0 |  |
| public.bling_webhook_events | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | 0 |  |
| public.ci_security_gate_events | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.conciliacoes_parciais | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.darfs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 9 | 0 |  |
| public.expert_conversations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 8 | 0 |  |
| public.fluxos_aprovacao_niveis | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~100 | 0 |  |
| public.frontend_error_alert_state | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | 0 |  |
| public.historico_cobranca_whatsapp | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~27.6k | 0 |  |
| public.historico_cobrancas_boletos | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.ip_whitelist | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.kpis_operacionais | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 4 | 0 |  |
| public.logs_conciliacao_retroativa | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 8 | 0 |  |
| public.n8n_dispatch_logs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.pagamentos_recorrentes | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 4 | 0 |  |
| public.per_dcomp | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.prejuizos_fiscais | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 8 | 0 |  |
| public.regime_decision_cache | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | ~180 |  |
| public.scim_setup_checklist | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.sso_role_mappings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | 0 |  |
| public.user_active_filters | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | 0 |  |
| public.user_passkeys | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 6 | 0 |  |
| public.webhook_dlq | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 5 | 0 |  |
| public.webhook_events | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 3 | 0 |  |
| public.whatsapp_conversas | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 8 | 0 |  |
| public.acessos_suspeitos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | ~10 |  |
| public.acoes_recomendadas | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~140 | 0 |  |
| public.alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.alerts_sent | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 9 | 0 |  |
| public.anexos_financeiros | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.anomalia_detection_runs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.aprovacao_comentarios | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.asaas_audit_trail | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.asaas_config | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.asaas_credit_risk_analysis | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.asaas_customers | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.asaas_sync_queue | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.benchmarks_setoriais | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 7 | 0 |  |
| public.bitrix_field_mappings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.bitrix_oauth_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.bitrix_sync_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.bling_sync_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.bling_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.catalogos_tributarios_health_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.custom_field_definitions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 0 |  |
| public.custom_field_values | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 0 |  |
| public.elisao_simulacoes_regime | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.email_verifications | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.evidencias_pacotes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.expert_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.historico_relatorios | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.indices_uso_excecoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.n8n_workflow_configs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.open_finance_consents | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.operacoes_icms | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.organizacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.overlay_rejeicoes_auditoria | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.parcelas_acordo | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.password_reset_requests | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~100 | 0 |  |
| public.password_reset_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 0 |  |
| public.portal_cliente_acessos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.portal_cliente_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.projecoes_reforma | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.push_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.regimes_especiais_empresa | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.relatorios_agendados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.resumos_executivos_semanais | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.risk_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.saved_filter_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | ~880 |  |
| public.scim_operations_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.security_audit_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 9 | 0 |  |
| public.simulacao_tributos_detalhados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.simulacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.slo_metrics_diarias | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | ~40 |  |
| public.sped_contabil_arquivos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.sso_sandbox_runs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.tax_audit_trail | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.user_action_audit | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.user_demonstrativo_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.user_devices | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 4 | 0 |  |
| public.user_digest_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.verificacoes_conformidade | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.webauthn_credentials | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 6 | 0 |  |
| public.allowed_countries | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~420 | 0 |  |
| public.audit_logs_2026_01 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_02 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_03 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_04 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_06 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_08 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_09 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_2026_10 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.audit_logs_default | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.auditoria_financeira | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.bitrix24_activities | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.bitrix24_stage_mappings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.bitrix24_tokens | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.bitrix_webhook_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 5 | 0 |  |
| public.cnpja_cache | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.configuracoes_duplicidade | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.frontend_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.frontend_error_logs_2026_01 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_02 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_03 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_04 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_05 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_06 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_07 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_08 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_09 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_2026_10 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_logs_default | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.frontend_error_silence_digest_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.logs_baixa_automatica | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.mfa_sessions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.organizacao_membros | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | 3 | 0 |  |
| public.rpc_observability_metrics | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.runtime_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.security_settings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.sso_login_attempts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.webauthn_challenges | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 5 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_cron_job_logs_job_name | public.cron_job_logs | 72.0 KB |
| idx_edge_logs_function | public.edge_function_logs | 8.6 MB |
| idx_query_telemetry_severity | public.query_telemetry | 336.0 KB |
| idx_slow_query_alerts_severity | public.slow_query_alerts | 1.1 MB |


## Storage

_nenhum_


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | 4 |
| confirmados (~) | 3 |
| criados últimos 30d (~) | 0 |

| provider | usuários (~) |
|---|---|
| email | 4 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| authenticated | ~13.8k | ~653.4k | 47.38 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" WHERE "public"."alertas"."lido" = $1 LIMIT $2 OFFSET $3 ) , pgrst_source_count AS (SELECT $5 FROM "public"."alertas" WHERE "public"."alertas"."li` |
| authenticated | ~13.3k | ~387.8k | 29.12 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" ORDER BY "public"."alertas"."created_at" DESC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_` |
| postgres | ~1.5k | ~264.2k | 170.75 | `SELECT table_schema AS schema, table_name AS "table", column_name AS "column", grantee, string_agg(privilege_type, $2 ORDER BY privilege_type) AS privileges FROM information_schema.column_privileges cp WHERE grantee NOT ` |
| authenticated | ~13.8k | ~55.1k | 4.00 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" WHERE "public"."alertas"."tipo" = ANY ($1) AND "public"."alertas"."lido" = $2 LIMIT $3 OFFSET $4 ) , pgrst_source_count AS (SELECT $7 FROM "publi` |
| authenticated | ~12.5k | ~55k | 4.41 | `WITH pgrst_source AS ( SELECT "public"."vw_contas_pagar_painel".* FROM "public"."vw_contas_pagar_painel" ORDER BY "public"."vw_contas_pagar_painel"."data_vencimento" ASC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_re` |
| authenticator | ~100 | ~50.9k | 509.43 | `SELECT name FROM pg_timezone_names` |
| service_role | ~510 | ~33.6k | 65.84 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "sql" FROM json_to_record(pgrst_payload.json_data) AS _("sql" text) LIMIT $4) pgrst_body , LATERAL (SELECT` |
| authenticated | ~3.6k | ~33.1k | 9.26 | `WITH pgrst_source AS ( SELECT "public"."vw_contas_receber_painel".* FROM "public"."vw_contas_receber_painel" ORDER BY "public"."vw_contas_receber_painel"."data_vencimento" ASC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS to` |
| authenticated | ~4.5k | ~32.8k | 7.31 | `WITH pgrst_source AS ( SELECT "public"."contas_pagar".* FROM "public"."contas_pagar" LIMIT $1 OFFSET $2 ) , pgrst_source_count AS (SELECT $3 FROM "public"."contas_pagar") SELECT (SELECT pg_catalog.count(*) FROM pgrst_sou` |
| authenticated | ~90 | ~28.7k | 308.68 | `WITH pgrst_source AS ( SELECT "public"."vw_edge_health".* FROM "public"."vw_edge_health" LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_total, coalesce(json_agg(_postgr` |
| authenticated | ~640 | ~25.3k | 39.71 | `WITH pgrst_source AS ( SELECT "public"."v_sefaz_observability".* FROM "public"."v_sefaz_observability" ORDER BY "public"."v_sefaz_observability"."seconds_since_last" DESC NULLS FIRST LIMIT $1 OFFSET $2 ) SELECT $3::bigin` |
| postgres | ~10 | ~24.1k | 1852.28 | `SELECT public.watch_cron_failures($1,$2)` |
| authenticated | ~4.7k | ~23.9k | 5.12 | `WITH pgrst_source AS ( SELECT "public"."contas_receber"."id", "public"."contas_receber"."data_vencimento", "public"."contas_receber"."data_recebimento", "public"."contas_receber"."cliente_nome", "public"."contas_receber"` |
| authenticated | ~3.6k | ~23.4k | 6.46 | `WITH pgrst_source AS (SELECT "pgrst_call".* FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "p_empresa_id", "p_centro_custo_id" FROM json_to_record(pgrst_payload.json_data) AS _("p_empresa_id" uuid, "p_centr` |
| authenticated | ~3.6k | ~23.3k | 6.41 | `WITH pgrst_source AS (SELECT "pgrst_call".* FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "p_empresa_id", "p_centro_custo_id" FROM json_to_record(pgrst_payload.json_data) AS _("p_empresa_id" uuid, "p_centr` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 17 |
| pgbouncer | idle | 1 |
| postgres | active | 1 |
| supabase_admin | active | 1 |
| supabase_admin | idle | 7 |
| supabase_admin |  | 2 |


## Saúde dos serviços
```json
[
  {
    "healthy": true,
    "info": {
      "description": "GoTrue is a user registration and authentication API",
      "name": "GoTrue",
      "version": "v2.198.0"
    },
    "name": "auth",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "db",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "pooler",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "info": {
      "connected_cluster": 0,
      "db_connected": true,
      "healthy": true,
      "node": "realtime@2600:1f18:67fc:ac01:9a68:d3ee:1adf:26bb",
      "region": "us-east-1",
      "replication_connected": true
    },
    "name": "realtime",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "info": {
      "db_schema": "public,graphql_public"
    },
    "name": "rest",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "storage",
    "status": "ACTIVE_HEALTHY"
  }
]
```
