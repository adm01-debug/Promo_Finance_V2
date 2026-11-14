# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 549.6 MB |
| schema public | 120.7 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.frontend_performance_logs | ~86.5k | 29.3 MB | 22.6 MB | 6.6 MB | 0 | ~20 | ~710 | 2026-11-14 |
| public.slow_query_alerts | ~15.2k | 21.0 MB | 18.0 MB | 3.0 MB | ~70 | ~80 | ~27.6k | 2026-11-14 |
| public.edge_function_logs | ~58.5k | 17.5 MB | 9.0 MB | 8.5 MB | 0 | ~90 | ~3.6k | 2026-11-13 |
| public.index_usage_snapshots | ~49.6k | 14.5 MB | 8.1 MB | 6.4 MB | 0 | ~20 | ~52.7k | 2026-11-02 |
| public.query_telemetry | ~14.6k | 13.6 MB | 10.0 MB | 3.6 MB | ~680 | ~2k | ~65.5k | 2026-11-12 |
| public.bloat_snapshots | ~21.6k | 5.3 MB | 2.9 MB | 2.3 MB | 0 | 9 | ~24.5k | 2026-10-31 |
| public.performance_alerts | ~4.3k | 3.6 MB | 2.5 MB | 1.1 MB | ~900 | ~30 | ~166.7k | 2026-11-11 |
| public.login_attempts | ~1.8k | 2.0 MB | 1.3 MB | 640.0 KB | 0 | ~5.3k | ~1.4k | 2026-11-14 |
| public.integrity_alerts | ~1.7k | 1.7 MB | 1.2 MB | 496.0 KB | 0 | ~38.7k | ~21.5k | 2026-10-15 |
| public.alertas | ~1.6k | 544.0 KB | 376.0 KB | 128.0 KB | 5 | ~1.9M | ~100 | 2026-10-23 |
| public.audit_logs | ~420 | 416.0 KB | 280.0 KB | 104.0 KB | ~40 | ~50 | ~26.3k |  |
| public.pg_stat_statements_baseline | 0 | 408.0 KB | 0 B | 384.0 KB | 0 | ~30 | ~3.5k | 2026-10-18 |
| public.contas_pagar | ~20 | 240.0 KB | 24.0 KB | 176.0 KB | ~50 | ~1.2M | ~971.4k | 2026-07-29 |
| public.cron_job_logs | ~220 | 224.0 KB | 88.0 KB | 96.0 KB | ~20 | ~70 | ~1.5k | 2026-11-04 |
| public.contas_receber | ~20 | 208.0 KB | 16.0 KB | 160.0 KB | ~40 | ~242.3k | ~4.1M | 2026-07-28 |
| public.aliquotas_interestaduais | ~700 | 152.0 KB | 64.0 KB | 80.0 KB | 1 | ~4.5k | ~2.8k | 2026-07-28 |
| public.movimentacoes | ~40 | 128.0 KB | 8.0 KB | 80.0 KB | ~10 | ~200 | 0 | 2026-11-13 |
| public.partidas_contabeis | ~100 | 120.0 KB | 32.0 KB | 48.0 KB | ~30 | ~160 | ~580 | 2026-11-13 |
| public.aliquotas_iss_municipal | ~30 | 112.0 KB | 8.0 KB | 64.0 KB | ~30 | ~4.3k | ~310 | 2026-08-25 |
| public.itens_lista_iss | ~160 | 112.0 KB | 32.0 KB | 48.0 KB | 1 | ~50 | ~5.1k | 2026-07-28 |
| public.ncms | ~130 | 112.0 KB | 24.0 KB | 48.0 KB | 0 | ~80 | ~4.1k | 2026-08-25 |
| public.nfe_recebidas | 0 | 112.0 KB | 16.0 KB | 64.0 KB | 5 | ~2k | ~38.7k |  |
| public.eventos_contabilizacao_log | ~30 | 104.0 KB | 16.0 KB | 48.0 KB | ~30 | ~70 | ~20 | 2026-11-13 |
| public.lancamentos_contabeis | ~50 | 104.0 KB | 16.0 KB | 48.0 KB | ~40 | ~1.1k | ~1.3k | 2026-11-13 |
| public.boletos | 6 | 96.0 KB | 8.0 KB | 80.0 KB | 3 | ~73.4k | ~10 |  |
| public.categorias | 7 | 96.0 KB | 8.0 KB | 48.0 KB | 0 | ~1.3k | ~48.9k | 2026-11-13 |
| public.plano_contas | ~10 | 96.0 KB | 8.0 KB | 64.0 KB | ~10 | ~580 | ~190 | 2026-07-28 |
| public.protocolos_st_ufs | ~80 | 96.0 KB | 8.0 KB | 48.0 KB | 0 | ~4.5k | ~240 | 2026-08-25 |
| public.contas_bancarias | 8 | 88.0 KB | 16.0 KB | 32.0 KB | ~40 | ~1.4M | ~49.4k | 2026-10-31 |
| public.faixas_simples_nacional | ~30 | 88.0 KB | 16.0 KB | 32.0 KB | 1 | ~4.3k | ~360 | 2026-08-25 |
| public.alertas_tributarios | 6 | 80.0 KB | 8.0 KB | 64.0 KB | ~10 | ~3.9k | ~10 |  |
| public.aliquotas_internas_uf | ~90 | 80.0 KB | 16.0 KB | 32.0 KB | 1 | ~90 | ~110 |  |
| public.centros_custo | 8 | 80.0 KB | 8.0 KB | 32.0 KB | 0 | ~1.2M | ~2.9M | 2026-11-13 |
| public.clientes | ~10 | 80.0 KB | 8.0 KB | 48.0 KB | 6 | ~132.1k | ~26.4k | 2026-07-28 |
| public.cnaes | ~70 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~3.4k | ~260 | 2026-07-28 |
| public.creditos_tributarios | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 8 | ~6.1k | ~10 |  |
| public.estrategias_elisao | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | 1 | ~60 | ~30 |  |
| public.pedidos_compra | 6 | 80.0 KB | 8.0 KB | 64.0 KB | ~10 | ~90 | 6 |  |
| public.protocolos_st_ncms | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | ~50 | ~4.3k | ~250 |  |
| public.regras_conciliacao | 4 | 80.0 KB | 8.0 KB | 64.0 KB | ~10 | ~6.4k | ~20 |  |
| public.retencao_politicas | ~60 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~100 | ~130 |  |
| public.transferencias | 6 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~70 | ~10 |  |
| public.user_empresas | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~50.2M | ~2.4M |  |
| public.alert_configurations | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~60 | 3 |  |
| public.anomalia_toast_eventos | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~50 | 3 |  |
| public.apuracoes_irpj_csll | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~50 | 3 |  |
| public.apuracoes_tributarias | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 4 | ~3.5k | ~470 |  |
| public.budgets | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~120 | ~3.3k |  |
| public.contratos | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~60 | 4 |  |
| public.faturamento_mensal | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~1.6k | 3 |  |
| public.folha_pagamento | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~940 | 3 |  |
| public.formas_pagamento | ~10 | 64.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | ~70 | 2026-07-28 |
| public.fornecedores | 5 | 64.0 KB | 8.0 KB | 48.0 KB | ~50 | ~613k | ~190 |  |
| public.geo_blocks | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 4 | ~50 | ~20 |  |
| public.historico_conciliacao_ia | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 8 | ~70 | ~20 |  |
| public.integration_secrets | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~880 | ~9.8k |  |
| public.metas_financeiras | 6 | 64.0 KB | 8.0 KB | 48.0 KB | 6 | ~3.4k | ~20 |  |
| public.negativacoes | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~40 | 0 |  |
| public.notas_fiscais | 5 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~80 | ~40 |  |
| public.profiles | 3 | 64.0 KB | 8.0 KB | 48.0 KB | ~20 | ~743.6k | ~26.5k |  |
| public.protestos | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~40 | 0 |  |
| public.regimes_simulados | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~1.5k | ~10 |  |
| public.solicitacoes_aprovacao | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~40 | ~921.9k | 6 |  |
| public.ufs | ~30 | 64.0 KB | 8.0 KB | 48.0 KB | ~30 | ~4.3k | ~180 |  |
| public.user_filter_presets | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~50 | 7 |  |
| public.execucoes_regua_cobranca | 0 | 56.0 KB | 8.0 KB | 40.0 KB | 2 | ~40 | 2 |  |
| public.api_keys | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | 2 |  |
| public.beneficios_fiscais | 9 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~90 | 0 |  |
| public.blocked_ips | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 6 | ~200 | ~20 |  |
| public.bloqueios_duplicidade | 6 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~73.3k | 0 |  |
| public.catalogos_fiscais_cargas | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 2 |  |
| public.configuracoes_aprovacao | 6 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~194.5k | ~30 |  |
| public.conformidade_snapshots | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | ~540 |  |
| public.convites_contador | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | 2 |  |
| public.digest_envios_log | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~50 | 2 |  |
| public.dispositivos_conhecidos | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~2.1k | ~10 |  |
| public.divergencias_conciliacao | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~30 | ~73.3k | 4 |  |
| public.elisao_alertas | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~900 | 0 |  |
| public.elisao_creditos_auditoria | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~900 | 0 |  |
| public.elisao_regras_creditos | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | ~3.4k |  |
| public.elisao_tarefas_acionaveis | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~900 | 0 |  |
| public.empresas | 1 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~3.7M | 1 |  |
| public.estrategias_elisao_catalogo | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | ~650 |  |
| public.execucoes_cobranca | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~50 | ~20 |  |
| public.extrato_bancario | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | 0 |  |
| public.fechamentos_tributarios | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~600 | ~10 |  |
| public.glossario_tributario | ~30 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~50 | ~60 |  |
| public.health_scores_operacionais | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~60 | 9 |  |
| public.historico_analises_preditivas | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~50 | 9 |  |
| public.historico_cobranca | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~50 | ~20 |  |
| public.historico_score_saude | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 6 | ~3.4k | ~10 |  |
| public.incentivos_fiscais | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~50 | 6 |  |
| public.notas_fiscais_ocr | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~3.4k | ~90 |  |
| public.operacoes_tributaveis | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~3k | 0 |  |
| public.oportunidades_elisao | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 2 | ~920 | 0 |  |
| public.permissions | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~80 | ~155.2k |  |
| public.pix_templates | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 2 | ~40 | 0 |  |
| public.planos_acao | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~50 | 2 |  |
| public.protocolos_st | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | ~88.7k |  |
| public.rate_limit_logs | 6 | 48.0 KB | 8.0 KB | 32.0 KB | ~40 | ~200 | ~770 |  |
| public.recomendacoes_metas_ia | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~3.4k | 9 |  |
| public.regimes_tributarios | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~40 | ~10 |  |
| public.regras_contabilizacao_automatica | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 6 | ~100 | ~220 |  |
| public.regras_duplicidade | 4 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~30 | ~20 |  |
| public.regras_roteamento_financeiro | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~363.9k | 7 |  |
| public.regua_cobranca | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~140 | 0 |  |
| public.regua_cobranca_status | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~40 | ~20 |  |
| public.relatorios_tributarios_agendados | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~13.9k | ~10 |  |
| public.retencoes_fonte | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~50 | 1 |  |
| public.security_alerts | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 2 | ~40 | 0 |  |
| public.sefaz_dfe_cursor | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~21.3k | 1 |  |
| public.sessoes_conciliacao | 4 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | 7 |  |
| public.split_payment_transacoes | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~90 | 1 |  |
| public.sso_providers | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~7.1k | 0 |  |
| public.templates_cobranca | 6 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | ~10 |  |
| public.transacoes_bancarias | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~40 | ~9.8k | ~10 |  |
| public.user_anomalia_preferences | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~372k | 6 |  |
| public.user_onboarding_progress | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~130.5k | ~20 |  |
| public.user_roles | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~97.2M | 4 |  |
| public.user_sessions | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~50 | ~10 |  |
| public.vendedores | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~3.5k | 0 |  |
| public.webhook_simulation_runs | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~60 | 7 |  |
| public.notification_history | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | 1 |  |
| public.role_permissions | 0 | 40.0 KB | 8.0 KB | 32.0 KB | ~10 | ~40 | ~155.2k |  |
| public.saved_filters | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~29.5k |  |
| public.scim_tokens | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~60 | 3 |  |
| public.solicitacoes_lgpd | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~2.8k |  |
| public.acordos_parcelamento | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~60 | 5 |  |
| public.alertas_preditivos | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~3.4k | ~10 |  |
| public.allowed_ips | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~40 | 0 |  |
| public.anomalias_detectadas | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~170.9k | 3 |  |
| public.asaas_payment_links | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.asaas_transfers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~80 | 0 |  |
| public.audit_logs_2026_05 | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~40 | 8 |  |
| public.audit_logs_2026_07 | ~20 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~40 | ~30 |  |
| public.auditoria_tributaria | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 3 |  |
| public.bling_webhook_events | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 1 |  |
| public.conciliacoes | ~10 | 32.0 KB | 8.0 KB | 16.0 KB | ~30 | ~80 | 0 |  |
| public.conciliacoes_parciais | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~30 | 0 |  |
| public.entregas_obrigacoes | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 4 |  |
| public.expert_conversations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~60 | 3 |  |
| public.feedback_conciliacao_ia | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~70 | 6 |  |
| public.frontend_error_alert_state | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | 0 |  |
| public.historico_cobrancas_boletos | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 9 | ~30 | ~20 |  |
| public.ip_whitelist | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~30 | 8 |  |
| public.itens_pedido_compra | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~50 | ~50 | 0 |  |
| public.kpis_operacionais | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 0 |  |
| public.new_device_alerts | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~30 | 1 |  |
| public.pagamentos_recorrentes | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~70 | ~60 |  |
| public.prejuizos_fiscais | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | 3 |  |
| public.regime_decision_cache | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | ~6.9k |  |
| public.scim_setup_checklist | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~40 | 1 |  |
| public.sso_role_mappings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 0 |  |
| public.sso_user_groups | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 0 |  |
| public.user_active_filters | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | ~10 |  |
| public.user_passkeys | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 3 |  |
| public.webhook_dlq | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 2 | ~40 | 0 |  |
| public.webhook_events | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~40 | 0 |  |
| public.webhook_simulation_results | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | 0 |  |
| public.acessos_suspeitos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~1.6k |  |
| public.acoes_recomendadas | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~6.6k | 1 |  |
| public.alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 2 |  |
| public.anexos_financeiros | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.anomalia_detection_runs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 3 |  |
| public.aprovacao_comentarios | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 3 |  |
| public.asaas_config | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~70 | 0 |  |
| public.asaas_customers | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 1 |  |
| public.asaas_payments | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~150 | 0 |  |
| public.benchmarks_setoriais | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.bitrix_field_mappings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 1 |  |
| public.bitrix_oauth_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.bitrix_sync_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 1 |  |
| public.bling_sync_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.bling_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.catalogos_tributarios_health_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.convites | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.custom_field_definitions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.custom_field_values | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.darfs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.elisao_simulacoes_regime | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 2 |  |
| public.email_verifications | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.empresas_certificados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~260 | 0 |  |
| public.fila_cobrancas | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.fluxos_aprovacao_niveis | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.3k | 2 |  |
| public.historico_cobranca_whatsapp | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~748.9k | 1 |  |
| public.indices_uso_excecoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.logs_conciliacao_retroativa | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.n8n_workflow_configs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 1 |  |
| public.nfe_eventos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 0 |  |
| public.open_finance_consents | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 3 |  |
| public.operacoes_icms | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.organizacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.overlay_rejeicoes_auditoria | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.password_reset_requests | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.4k | 3 |  |
| public.password_reset_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~360 | 0 |  |
| public.per_dcomp | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 4 |  |
| public.portal_cliente_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.projecoes_reforma | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.push_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~340 |  |
| public.regimes_especiais_empresa | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.regua_cobranca_etapas | 0 | 24.0 KB | 8.0 KB | 16.0 KB | 9 | ~30 | ~20 |  |
| public.relatorios_agendados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 2 |  |
| public.resumos_executivos_semanais | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.risk_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.saved_filter_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~29.5k |  |
| public.scim_operations_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.security_audit_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 3 |  |
| public.simulacao_tributos_detalhados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.simulacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 2 |  |
| public.slo_metrics_diarias | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~1k |  |
| public.sped_contabil_arquivos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| public.tax_audit_trail | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 2 |  |
| public.user_action_audit | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 3 |  |
| public.user_demonstrativo_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 4 |  |
| public.user_devices | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.user_digest_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~10 |  |
| public.verificacoes_conformidade | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~610 | 0 |  |
| public.webauthn_credentials | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.webhooks_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| public.whatsapp_conversas | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.alerts_sent | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.allowed_countries | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.asaas_audit_trail | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.asaas_credit_risk_analysis | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.asaas_reconciliation_suggestions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~60 | 1 |  |
| public.asaas_sync_queue | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_2026_01 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_2026_02 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.audit_logs_2026_03 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_2026_04 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_2026_06 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_2026_08 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_2026_09 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_2026_10 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.audit_logs_default | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.auditoria_financeira | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.auth_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~120 | 0 |  |
| public.bitrix24_activities | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.bitrix24_stage_mappings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.bitrix24_tokens | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.bitrix_webhook_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.ci_security_gate_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.cnpja_cache | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.configuracoes_duplicidade | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.evidencias_pacotes | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 1 |  |
| public.expert_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.frontend_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~200 | 0 |  |
| public.frontend_error_logs_2026_01 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 1 |  |
| public.frontend_error_logs_2026_02 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.frontend_error_logs_2026_03 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.frontend_error_logs_2026_04 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.frontend_error_logs_2026_05 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.frontend_error_logs_2026_06 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.frontend_error_logs_2026_07 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.frontend_error_logs_2026_08 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.frontend_error_logs_2026_09 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.frontend_error_logs_2026_10 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.frontend_error_logs_default | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.frontend_error_silence_digest_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.historico_relatorios | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.logs_baixa_automatica | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.mfa_sessions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.n8n_dispatch_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.organizacao_membros | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.parcelas_acordo | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.portal_cliente_acessos | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 1 |  |
| public.rpc_observability_metrics | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~120 | 0 |  |
| public.runtime_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~120 | 0 |  |
| public.security_settings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.sso_login_attempts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~120 | 1 |  |
| public.sso_sandbox_runs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.webauthn_challenges | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

_nenhum_


## Storage

_nenhum_


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | 4 |
| confirmados (~) | 3 |
| criados últimos 30d (~) | 1 |

| provider | usuários (~) |
|---|---|
| email | 4 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| postgres | ~51.9k | ~8.9M | 171.59 | `SELECT table_schema AS schema, table_name AS "table", column_name AS "column", grantee, string_agg(privilege_type, $2 ORDER BY privilege_type) AS privileges FROM information_schema.column_privileges cp WHERE grantee NOT ` |
| postgres | ~1.9k | ~3.5M | 1834.26 | `SELECT public.watch_cron_failures($1,$2)` |
| authenticated | ~354.6k | ~2.7M | 7.73 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" ORDER BY "public"."alertas"."created_at" DESC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_` |
| postgres | ~20k | ~2.5M | 125.05 | `SELECT public.detect_query_regressions()` |
| postgres | ~460 | ~2.4M | 5103.76 | `SELECT jobid, runid, status, start_time, end_time, EXTRACT($2 FROM (end_time - start_time))::numeric(10,2) AS seconds, left(return_message, $3) AS return_message FROM (SELECT *, row_number() OVER (PARTITION BY jobid ORDE` |
| authenticated | ~391.9k | ~1.8M | 4.50 | `WITH pgrst_source AS ( SELECT "public"."vw_contas_pagar_painel".* FROM "public"."vw_contas_pagar_painel" ORDER BY "public"."vw_contas_pagar_painel"."data_vencimento" ASC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_re` |
| postgres | ~91.2k | ~1.4M | 15.00 | `SELECT net.http_post( url := $1, headers := jsonb_build_object($2,$3,$4, public.internal_job_secret()), body := jsonb_build_object($5,$6,$7, now()) ) AS request_id` |
| postgres | ~91.3k | ~1.3M | 14.14 | `SELECT net.http_post( url := $1, headers := jsonb_build_object($2,$3,$4, public.internal_job_secret()), body := jsonb_build_object($5,$6,$7,$8) ) AS request_id` |
| postgres | ~6.8k | ~1.1M | 156.04 | `SELECT public.capture_slow_queries()` |
| authenticator | ~2.8k | ~943.3k | 339.93 | `SELECT name FROM pg_timezone_names` |
| authenticated | ~140.8k | ~867.8k | 6.16 | `WITH pgrst_source AS ( SELECT "public"."contas_pagar".* FROM "public"."contas_pagar" LIMIT $1 OFFSET $2 ) , pgrst_source_count AS (SELECT $3 FROM "public"."contas_pagar") SELECT (SELECT pg_catalog.count(*) FROM pgrst_sou` |
| authenticated | ~102k | ~646.2k | 6.34 | `WITH pgrst_source AS ( SELECT "public"."vw_contas_receber_painel".* FROM "public"."vw_contas_receber_painel" ORDER BY "public"."vw_contas_receber_painel"."data_vencimento" ASC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS to` |
| authenticated | ~14.2k | ~637.5k | 44.84 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" WHERE "public"."alertas"."lido" = $1 LIMIT $2 OFFSET $3 ) , pgrst_source_count AS (SELECT $5 FROM "public"."alertas" WHERE "public"."alertas"."li` |
| authenticated | ~136.9k | ~622k | 4.54 | `WITH pgrst_source AS ( SELECT "public"."contas_receber"."id", "public"."contas_receber"."data_vencimento", "public"."contas_receber"."data_recebimento", "public"."contas_receber"."cliente_nome", "public"."contas_receber"` |
| authenticated | ~19.3k | ~603.4k | 31.22 | `WITH pgrst_source AS ( SELECT "public"."v_sefaz_observability".* FROM "public"."v_sefaz_observability" ORDER BY "public"."v_sefaz_observability"."seconds_since_last" DESC NULLS FIRST LIMIT $1 OFFSET $2 ) SELECT $3::bigin` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 19 |
| pgbouncer | idle | 1 |
| postgres | active | 1 |
| supabase_admin | active | 1 |
| supabase_admin | idle | 8 |
| supabase_admin |  | 2 |
| supabase_auth_admin | idle | 1 |


## Saúde dos serviços
```json
[
  {
    "healthy": true,
    "info": {
      "description": "GoTrue is a user registration and authentication API",
      "name": "GoTrue",
      "version": "v2.197.0"
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
      "node": "realtime@2600:1f18:67fc:ac01:5e:cc43:a683:4bd",
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
