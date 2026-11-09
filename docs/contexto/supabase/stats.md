# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 493.6 MB |
| schema public | 89.4 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.slow_query_alerts | ~20.7k | 21.0 MB | 18.0 MB | 3.0 MB | ~4k | ~80 | ~27k | 2026-11-03 |
| public.frontend_performance_logs | ~58.7k | 19.2 MB | 14.9 MB | 4.2 MB | 0 | ~10 | ~660 | 2026-11-09 |
| public.index_usage_snapshots | ~49.6k | 14.0 MB | 7.8 MB | 6.2 MB | 0 | ~20 | ~50.7k | 2026-11-02 |
| public.query_telemetry | ~17.3k | 13.6 MB | 10.0 MB | 3.6 MB | ~1.3k | ~2k | ~64.4k | 2026-11-07 |
| public.bloat_snapshots | ~19.4k | 4.9 MB | 2.7 MB | 2.1 MB | 0 | 7 | ~23.1k | 2026-10-31 |
| public.performance_alerts | ~3.8k | 3.1 MB | 2.1 MB | 1.0 MB | ~420 | ~20 | ~164.5k | 2026-11-07 |
| public.integrity_alerts | ~1.7k | 1.6 MB | 1.1 MB | 472.0 KB | 0 | ~26.8k | ~15.3k | 2026-10-15 |
| public.login_attempts | ~1.2k | 1.6 MB | 1.1 MB | 448.0 KB | 0 | ~3.4k | ~680 | 2026-11-09 |
| public.alertas | ~1.6k | 528.0 KB | 360.0 KB | 128.0 KB | 0 | ~1.2M | ~80 | 2026-10-23 |
| public.audit_logs | ~420 | 416.0 KB | 280.0 KB | 104.0 KB | ~40 | ~30 | ~24.2k |  |
| public.pg_stat_statements_baseline | 0 | 408.0 KB | 0 B | 384.0 KB | 0 | ~20 | ~3.5k | 2026-10-18 |
| public.contas_pagar | ~20 | 192.0 KB | 24.0 KB | 128.0 KB | ~20 | ~822k | ~686.2k | 2026-07-29 |
| public.aliquotas_interestaduais | ~700 | 152.0 KB | 64.0 KB | 80.0 KB | 0 | ~2.6k | ~2.8k | 2026-07-28 |
| public.contas_receber | ~20 | 128.0 KB | 16.0 KB | 80.0 KB | ~20 | ~153.8k | ~2.9M | 2026-07-28 |
| public.cron_job_logs | ~60 | 128.0 KB | 40.0 KB | 48.0 KB | ~20 | ~60 | ~1.2k | 2026-11-04 |
| public.aliquotas_iss_municipal | ~30 | 112.0 KB | 8.0 KB | 64.0 KB | ~30 | ~2.3k | ~310 | 2026-08-25 |
| public.itens_lista_iss | ~160 | 112.0 KB | 32.0 KB | 48.0 KB | 0 | ~30 | ~3.1k | 2026-07-28 |
| public.ncms | ~130 | 112.0 KB | 24.0 KB | 48.0 KB | 0 | ~60 | ~2.2k | 2026-08-25 |
| public.nfe_recebidas | 0 | 112.0 KB | 16.0 KB | 64.0 KB | 5 | ~1.9k | ~26.7k |  |
| public.lancamentos_contabeis | ~30 | 96.0 KB | 16.0 KB | 48.0 KB | ~40 | ~590 | ~690 |  |
| public.plano_contas | ~10 | 96.0 KB | 8.0 KB | 64.0 KB | ~10 | ~190 | ~80 | 2026-07-28 |
| public.protocolos_st_ufs | ~80 | 96.0 KB | 8.0 KB | 48.0 KB | 0 | ~2.5k | ~240 | 2026-08-25 |
| public.contas_bancarias | 8 | 88.0 KB | 16.0 KB | 32.0 KB | 0 | ~992.3k | ~28.4k | 2026-10-31 |
| public.faixas_simples_nacional | ~30 | 88.0 KB | 16.0 KB | 32.0 KB | 0 | ~2.3k | ~350 | 2026-08-25 |
| public.partidas_contabeis | ~190 | 88.0 KB | 24.0 KB | 32.0 KB | 0 | ~100 | ~60 | 2026-07-28 |
| public.aliquotas_internas_uf | ~90 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~80 | ~110 |  |
| public.clientes | ~10 | 80.0 KB | 8.0 KB | 48.0 KB | 6 | ~100.3k | ~13.2k | 2026-07-28 |
| public.cnaes | ~70 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~2.4k | ~260 | 2026-07-28 |
| public.estrategias_elisao | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~40 | ~30 |  |
| public.protocolos_st_ncms | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | ~50 | ~2.3k | ~240 |  |
| public.retencao_politicas | ~60 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~80 | ~130 |  |
| public.user_empresas | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~34.4M | ~1.7M |  |
| public.budgets | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~110 | ~1.6k |  |
| public.categorias | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~30 | ~1.2k | ~34.1k | 2026-07-28 |
| public.edge_function_logs | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | ~2.5k |  |
| public.faturamento_mensal | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~1.2k | 3 |  |
| public.folha_pagamento | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~690 | 3 |  |
| public.fornecedores | 5 | 64.0 KB | 8.0 KB | 48.0 KB | ~50 | ~442.8k | ~190 |  |
| public.geo_blocks | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 4 | ~30 | ~20 |  |
| public.historico_conciliacao_ia | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 8 | ~50 | ~20 |  |
| public.regras_conciliacao | 4 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~4.5k | ~20 |  |
| public.solicitacoes_aprovacao | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~40 | ~616.6k | 6 |  |
| public.transferencias | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~40 | ~10 |  |
| public.ufs | ~30 | 64.0 KB | 8.0 KB | 48.0 KB | ~30 | ~2.3k | ~170 |  |
| public.execucoes_regua_cobranca | 0 | 56.0 KB | 8.0 KB | 40.0 KB | 2 | ~20 | 2 |  |
| public.alert_configurations | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 3 |  |
| public.api_keys | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | 2 |  |
| public.apuracoes_irpj_csll | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 3 |  |
| public.apuracoes_tributarias | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~2.5k | ~240 |  |
| public.beneficios_fiscais | 9 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~70 | 0 |  |
| public.blocked_ips | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 6 | ~170 | ~20 |  |
| public.boletos | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~52.2k | ~10 |  |
| public.catalogos_fiscais_cargas | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 2 |  |
| public.centros_custo | 8 | 48.0 KB | 8.0 KB | 32.0 KB | ~50 | ~858.9k | ~2M |  |
| public.conformidade_snapshots | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | ~380 |  |
| public.convites_contador | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 2 |  |
| public.digest_envios_log | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 2 |  |
| public.dispositivos_conhecidos | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~1.6k | ~10 |  |
| public.divergencias_conciliacao | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~30 | ~52.1k | 4 |  |
| public.elisao_regras_creditos | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~2.5k |  |
| public.empresas | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~2.6M | 1 |  |
| public.estrategias_elisao_catalogo | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~320 |  |
| public.extrato_bancario | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~30 | 0 |  |
| public.fechamentos_tributarios | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~420 | ~10 |  |
| public.formas_pagamento | 0 | 48.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~70 | 2026-07-28 |
| public.glossario_tributario | ~30 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | ~60 |  |
| public.incentivos_fiscais | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 6 |  |
| public.integration_secrets | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~60 | ~7.8k |  |
| public.metas_financeiras | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 6 | ~1.7k | ~20 |  |
| public.movimentacoes | ~30 | 48.0 KB | 8.0 KB | 16.0 KB | 0 | ~70 | 0 | 2026-07-28 |
| public.notas_fiscais | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~60 | ~40 |  |
| public.permissions | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~60 | ~110.3k |  |
| public.planos_acao | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 2 |  |
| public.profiles | 2 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~530.8k | ~13.2k |  |
| public.protocolos_st | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~30 | ~49.2k |  |
| public.rate_limit_logs | 6 | 48.0 KB | 8.0 KB | 32.0 KB | ~40 | ~180 | ~580 |  |
| public.regimes_simulados | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 2 | ~1.1k | ~10 |  |
| public.relatorios_tributarios_agendados | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~10.2k | ~10 |  |
| public.sefaz_dfe_cursor | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~15.2k | 0 |  |
| public.transacoes_bancarias | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~6.9k | 4 |  |
| public.user_anomalia_preferences | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~246.7k | 6 |  |
| public.user_filter_presets | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 7 |  |
| public.user_onboarding_progress | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~87.3k | ~20 |  |
| public.user_roles | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~55.3M | 4 |  |
| public.user_sessions | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~30 | ~10 |  |
| public.webhook_simulation_runs | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 7 |  |
| public.role_permissions | 0 | 40.0 KB | 8.0 KB | 32.0 KB | ~10 | ~30 | ~110.3k |  |
| public.saved_filters | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~20.7k |  |
| public.alertas_preditivos | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~1.7k | ~10 |  |
| public.alertas_tributarios | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~2.7k | ~10 |  |
| public.allowed_ips | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~30 | 0 |  |
| public.audit_logs_2026_05 | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 6 |  |
| public.audit_logs_2026_07 | ~20 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~20 |  |
| public.auditoria_tributaria | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 3 |  |
| public.bloqueios_duplicidade | 6 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~52.1k | 0 |  |
| public.conciliacoes | ~10 | 32.0 KB | 8.0 KB | 16.0 KB | ~30 | ~60 | 0 |  |
| public.conciliacoes_parciais | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~20 | 0 |  |
| public.configuracoes_aprovacao | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~137.8k | ~30 |  |
| public.creditos_tributarios | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~4.2k | ~10 |  |
| public.elisao_alertas | 5 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~650 | 0 |  |
| public.elisao_creditos_auditoria | 4 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~640 | 0 |  |
| public.elisao_tarefas_acionaveis | 5 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~650 | 0 |  |
| public.entregas_obrigacoes | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.execucoes_cobranca | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~30 | ~20 |  |
| public.feedback_conciliacao_ia | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | 6 |  |
| public.frontend_error_alert_state | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.health_scores_operacionais | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~40 | 9 |  |
| public.historico_analises_preditivas | 4 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~30 | 9 |  |
| public.historico_cobranca | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~20 | ~20 |  |
| public.historico_cobrancas_boletos | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 9 | ~20 | ~20 |  |
| public.historico_score_saude | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~1.7k | ~10 |  |
| public.ip_whitelist | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~10 | 8 |  |
| public.itens_pedido_compra | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 8 | ~20 | 0 |  |
| public.new_device_alerts | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 9 | ~20 | 1 |  |
| public.notas_fiscais_ocr | 3 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~2.4k | ~90 |  |
| public.operacoes_tributaveis | 8 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~2.1k | 0 |  |
| public.oportunidades_elisao | 4 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~650 | 0 |  |
| public.pedidos_compra | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 3 | ~40 | 6 |  |
| public.recomendacoes_metas_ia | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~1.7k | 9 |  |
| public.regime_decision_cache | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~5k |  |
| public.regimes_tributarios | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~20 | ~10 |  |
| public.regras_duplicidade | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~20 | ~20 |  |
| public.regras_roteamento_financeiro | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~255.4k | 7 |  |
| public.regua_cobranca | 2 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~120 | 0 |  |
| public.regua_cobranca_status | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~30 | ~20 |  |
| public.retencoes_fonte | ~10 | 32.0 KB | 8.0 KB | 16.0 KB | 3 | ~30 | 1 |  |
| public.scim_tokens | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 3 |  |
| public.sessoes_conciliacao | 4 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~40 | 7 |  |
| public.solicitacoes_lgpd | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~1.9k |  |
| public.split_payment_transacoes | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~70 | 1 |  |
| public.sso_providers | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~5.3k | 0 |  |
| public.sso_user_groups | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.templates_cobranca | 6 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~30 | ~10 |  |
| public.user_active_filters | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.user_passkeys | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 3 |  |
| public.vendedores | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~1.8k | 0 |  |
| public.webhook_dlq | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 2 | ~20 | 0 |  |
| public.webhook_events | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~20 | 0 |  |
| public.webhook_simulation_results | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.acessos_suspeitos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~1.5k |  |
| public.acordos_parcelamento | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 5 |  |
| public.anomalia_detection_runs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 3 |  |
| public.anomalia_toast_eventos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 3 |  |
| public.anomalias_detectadas | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~120.4k | 3 |  |
| public.aprovacao_comentarios | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 3 |  |
| public.asaas_config | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 0 |  |
| public.asaas_customers | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 1 |  |
| public.asaas_payment_links | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 7 | 0 |  |
| public.asaas_payments | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~120 | 0 |  |
| public.asaas_transfers | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 0 |  |
| public.benchmarks_setoriais | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.bling_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.bling_webhook_events | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| public.catalogos_tributarios_health_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.contratos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 4 |  |
| public.convites | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.custom_field_values | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.elisao_simulacoes_regime | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 2 |  |
| public.email_verifications | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.empresas_certificados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 0 |  |
| public.eventos_contabilizacao_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.expert_conversations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 3 |  |
| public.indices_uso_excecoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.kpis_operacionais | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.n8n_workflow_configs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 1 |  |
| public.nfe_eventos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.open_finance_consents | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 3 |  |
| public.organizacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.pagamentos_recorrentes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | ~60 |  |
| public.password_reset_requests | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~2.3k | 3 |  |
| public.password_reset_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~320 | 0 |  |
| public.per_dcomp | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 4 |  |
| public.portal_cliente_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.prejuizos_fiscais | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 3 |  |
| public.push_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~250 |  |
| public.regras_contabilizacao_automatica | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.regua_cobranca_etapas | 0 | 24.0 KB | 8.0 KB | 16.0 KB | 9 | ~20 | ~20 |  |
| public.relatorios_agendados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.saved_filter_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~20.7k |  |
| public.security_audit_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 3 |  |
| public.simulacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 2 |  |
| public.slo_metrics_diarias | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | ~710 |  |
| public.sso_role_mappings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.tax_audit_trail | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 2 |  |
| public.user_action_audit | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 3 |  |
| public.user_demonstrativo_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 4 |  |
| public.user_devices | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.user_digest_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~10 |  |
| public.webauthn_credentials | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.webhooks_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~120 | 0 |  |
| public.acoes_recomendadas | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.3k | 1 |  |
| public.alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 2 |  |
| public.alerts_sent | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.allowed_countries | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.anexos_financeiros | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.asaas_audit_trail | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.asaas_credit_risk_analysis | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.asaas_reconciliation_suggestions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~50 | 1 |  |
| public.asaas_sync_queue | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_2026_01 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_2026_02 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.audit_logs_2026_03 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_2026_04 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_2026_06 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_2026_08 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_2026_09 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_2026_10 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.audit_logs_default | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.auditoria_financeira | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.auth_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~100 | 0 |  |
| public.bitrix24_activities | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix24_stage_mappings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix24_tokens | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_field_mappings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.bitrix_oauth_tokens | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_sync_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.bitrix_webhook_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bling_sync_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.ci_security_gate_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.cnpja_cache | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.configuracoes_duplicidade | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.custom_field_definitions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.darfs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.evidencias_pacotes | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.expert_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.fila_cobrancas | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.fluxos_aprovacao_niveis | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 2 |  |
| public.frontend_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~100 | 0 |  |
| public.frontend_error_logs_2026_01 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.frontend_error_logs_2026_02 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_03 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_04 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_05 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_06 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_07 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_08 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.frontend_error_logs_2026_09 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_10 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.frontend_error_logs_default | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_silence_digest_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.historico_cobranca_whatsapp | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~496.9k | 1 |  |
| public.historico_relatorios | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.logs_baixa_automatica | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.logs_conciliacao_retroativa | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.mfa_sessions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.n8n_dispatch_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.negativacoes | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.notification_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.operacoes_icms | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.organizacao_membros | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.overlay_rejeicoes_auditoria | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.parcelas_acordo | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.pix_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.portal_cliente_acessos | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.projecoes_reforma | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.protestos | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.regimes_especiais_empresa | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.resumos_executivos_semanais | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.risk_rules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.rpc_observability_metrics | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~100 | 0 |  |
| public.runtime_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~100 | 0 |  |
| public.scim_operations_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.scim_setup_checklist | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.security_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.security_settings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.simulacao_tributos_detalhados | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.sped_contabil_arquivos | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.sso_login_attempts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~90 | 1 |  |
| public.sso_sandbox_runs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.verificacoes_conformidade | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~430 | 0 |  |
| public.webauthn_challenges | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.whatsapp_conversas | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |


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
| postgres | ~1.8k | ~2.8M | 1562.06 | `SELECT public.watch_cron_failures($1,$2)` |
| postgres | ~19.8k | ~2.4M | 121.80 | `SELECT public.detect_query_regressions()` |
| authenticated | ~244.4k | ~1.6M | 6.74 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" ORDER BY "public"."alertas"."created_at" DESC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_` |
| postgres | ~87.5k | ~1.3M | 14.88 | `SELECT net.http_post( url := $1, headers := jsonb_build_object($2,$3,$4, public.internal_job_secret()), body := jsonb_build_object($5,$6,$7, now()) ) AS request_id` |
| postgres | ~87.5k | ~1.2M | 14.01 | `SELECT net.http_post( url := $1, headers := jsonb_build_object($2,$3,$4, public.internal_job_secret()), body := jsonb_build_object($5,$6,$7,$8) ) AS request_id` |
| authenticated | ~273.6k | ~1.2M | 4.32 | `WITH pgrst_source AS ( SELECT "public"."vw_contas_pagar_painel".* FROM "public"."vw_contas_pagar_painel" ORDER BY "public"."vw_contas_pagar_painel"."data_vencimento" ASC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_re` |
| postgres | ~6.7k | ~1M | 151.96 | `SELECT public.capture_slow_queries()` |
| postgres | ~5.4k | ~957.8k | 177.97 | `SELECT table_schema AS schema, table_name AS "table", column_name AS "column", grantee, string_agg(privilege_type, $2 ORDER BY privilege_type) AS privileges FROM information_schema.column_privileges cp WHERE grantee NOT ` |
| authenticator | ~2.5k | ~776.2k | 306.20 | `SELECT name FROM pg_timezone_names` |
| postgres | ~60 | ~614.5k | 9454.02 | `SELECT jobid, runid, status, start_time, end_time, EXTRACT($2 FROM (end_time - start_time))::numeric(10,2) AS seconds, left(return_message, $3) AS return_message FROM (SELECT *, row_number() OVER (PARTITION BY jobid ORDE` |
| authenticated | ~101.8k | ~611.5k | 6.01 | `WITH pgrst_source AS ( SELECT "public"."contas_pagar".* FROM "public"."contas_pagar" LIMIT $1 OFFSET $2 ) , pgrst_source_count AS (SELECT $3 FROM "public"."contas_pagar") SELECT (SELECT pg_catalog.count(*) FROM pgrst_sou` |
| authenticated | ~72k | ~413.5k | 5.74 | `WITH pgrst_source AS ( SELECT "public"."vw_contas_receber_painel".* FROM "public"."vw_contas_receber_painel" ORDER BY "public"."vw_contas_receber_painel"."data_vencimento" ASC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS to` |
| authenticated | ~94.6k | ~402.8k | 4.26 | `WITH pgrst_source AS ( SELECT "public"."contas_receber"."id", "public"."contas_receber"."data_vencimento", "public"."contas_receber"."data_recebimento", "public"."contas_receber"."cliente_nome", "public"."contas_receber"` |
| authenticator | ~2.5k | ~385.6k | 152.12 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $2), oid) AS base_type FROM pg_type UNIO` |
| authenticated | ~9.5M | ~367.9k | 0.04 | `select set_config('?', $1, true), set_config($2, $3, true), set_config($4, $5, true), set_config($6, $7, true), set_config('?', $8, true), set_config('?', $9, true), set_config('request.meth` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 14 |
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
      "node": "realtime@2600:1f18:67fc:ac00:1b73:fa1a:af98:a453",
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
