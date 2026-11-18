# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 332.7 MB |
| schema public | 168.7 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.edge_function_logs | ~172.5k | 52.0 MB | 25.4 MB | 26.6 MB | 0 | 0 | ~320 | 2026-11-17 |
| public.frontend_performance_logs | ~88.9k | 35.9 MB | 28.4 MB | 7.5 MB | ~11.5k | ~10 | ~50 |  |
| public.slow_query_alerts | ~14.3k | 21.0 MB | 18.0 MB | 3.0 MB | ~430 | 0 | ~350 | 2026-11-18 |
| public.index_usage_snapshots | ~49.6k | 15.3 MB | 8.6 MB | 6.7 MB | 0 | 0 | ~1.5k |  |
| public.query_telemetry | ~10k | 13.7 MB | 10.0 MB | 3.7 MB | 0 | 0 | ~780 | 2026-11-18 |
| public.bloat_snapshots | ~21.6k | 5.5 MB | 3.0 MB | 2.5 MB | 0 | 0 | ~560 |  |
| public.login_attempts | ~2.4k | 4.1 MB | 3.0 MB | 1.0 MB | 0 | ~1.6k | ~760 | 2026-11-18 |
| public.performance_alerts | ~4.3k | 3.6 MB | 2.5 MB | 1.1 MB | 9 | 0 | ~1.4k | 2026-11-18 |
| public.integrity_alerts | ~1.9k | 1.8 MB | 1.2 MB | 512.0 KB | 0 | ~4k | ~2.1k |  |
| public.rate_limit_logs | ~1.4k | 760.0 KB | 560.0 KB | 168.0 KB | ~50 | ~30 | ~5.1k |  |
| public.alertas | ~1.8k | 592.0 KB | 416.0 KB | 136.0 KB | 0 | ~212.3k | ~20 |  |
| public.auth_logs | ~1.4k | 560.0 KB | 440.0 KB | 88.0 KB | 0 | ~20 | 0 |  |
| public.contas_pagar | ~20 | 448.0 KB | 24.0 KB | 384.0 KB | ~20 | ~112.1k | ~103.3k |  |
| public.cron_job_logs | ~710 | 448.0 KB | 240.0 KB | 168.0 KB | ~30 | ~20 | ~400 |  |
| public.audit_logs | ~420 | 424.0 KB | 288.0 KB | 104.0 KB | 0 | ~20 | ~1.1k |  |
| public.pg_stat_statements_baseline | 0 | 408.0 KB | 0 B | 384.0 KB | 0 | ~20 | 0 |  |
| public.contas_receber | ~20 | 400.0 KB | 16.0 KB | 352.0 KB | ~30 | ~28.2k | ~379.4k |  |
| public.movimentacoes | ~40 | 216.0 KB | 8.0 KB | 168.0 KB | 4 | ~50 | 0 |  |
| public.partidas_contabeis | ~100 | 208.0 KB | 40.0 KB | 128.0 KB | 0 | ~20 | ~80 | 2026-11-16 |
| public.clientes | ~10 | 192.0 KB | 8.0 KB | 160.0 KB | 0 | ~11.1k | ~1.8k |  |
| public.aliquotas_interestaduais | ~700 | 184.0 KB | 72.0 KB | 80.0 KB | 2 | ~390 | 0 |  |
| public.transacoes_bancarias | ~20 | 184.0 KB | 8.0 KB | 168.0 KB | 0 | ~900 | 0 |  |
| public.lancamentos_contabeis | ~50 | 168.0 KB | 16.0 KB | 112.0 KB | ~20 | ~80 | ~80 |  |
| public.boletos | 6 | 160.0 KB | 8.0 KB | 144.0 KB | 0 | ~8.3k | 0 |  |
| public.fornecedores | 5 | 160.0 KB | 8.0 KB | 144.0 KB | 2 | ~52.7k | 0 |  |
| public.nfe_recebidas | ~30 | 144.0 KB | 16.0 KB | 96.0 KB | 6 | ~90 | ~4k |  |
| public.notas_fiscais | 5 | 144.0 KB | 8.0 KB | 128.0 KB | 0 | ~20 | 0 |  |
| public.aliquotas_iss_municipal | ~30 | 128.0 KB | 8.0 KB | 80.0 KB | 0 | ~390 | 0 |  |
| public.eventos_contabilizacao_log | ~30 | 120.0 KB | 16.0 KB | 64.0 KB | 9 | ~20 | 9 |  |
| public.categorias | 7 | 112.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | ~4.7k |  |
| public.historico_conciliacao_ia | 4 | 112.0 KB | 8.0 KB | 96.0 KB | 0 | ~40 | 0 |  |
| public.itens_lista_iss | ~160 | 112.0 KB | 32.0 KB | 48.0 KB | 0 | ~20 | ~360 |  |
| public.ncms | ~130 | 112.0 KB | 24.0 KB | 48.0 KB | 0 | ~20 | ~370 |  |
| public.protocolos_st_ncms | ~20 | 112.0 KB | 16.0 KB | 64.0 KB | 0 | ~400 | 0 |  |
| public.centros_custo | 8 | 96.0 KB | 8.0 KB | 48.0 KB | 0 | ~69.5k | ~366.3k |  |
| public.creditos_tributarios | ~10 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~570 | 0 |  |
| public.pedidos_compra | 6 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~30 | 0 |  |
| public.plano_contas | ~10 | 96.0 KB | 8.0 KB | 64.0 KB | 0 | ~50 | 0 |  |
| public.protocolos_st_ufs | ~80 | 96.0 KB | 8.0 KB | 48.0 KB | 0 | ~390 | 0 |  |
| public.regua_cobranca_status | ~10 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~40 | 0 |  |
| public.saved_filter_subscriptions | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 2 | ~30 | ~2.8k |  |
| public.transferencias | 6 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~40 | 0 |  |
| public.contas_bancarias | 8 | 88.0 KB | 16.0 KB | 32.0 KB | 3 | ~92.5k | ~54k |  |
| public.faixas_simples_nacional | ~30 | 88.0 KB | 16.0 KB | 32.0 KB | 0 | ~390 | 0 |  |
| public.alertas_tributarios | 6 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~410 | 0 |  |
| public.aliquotas_internas_uf | ~90 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~20 | 2 |  |
| public.bloqueios_duplicidade | 6 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~11k | 0 |  |
| public.cnaes | ~70 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~340 | 0 |  |
| public.conciliacoes | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.contratos | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~50 | 0 |  |
| public.divergencias_conciliacao | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~8.3k | 0 |  |
| public.elisao_creditos_auditoria | 4 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~90 | 0 |  |
| public.estrategias_elisao | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.extrato_bancario | ~20 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.historico_cobranca | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.negativacoes | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.protestos | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 0 |  |
| public.regras_conciliacao | 4 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~600 | 0 |  |
| public.retencao_politicas | ~60 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.solicitacoes_aprovacao | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~102.6k | 0 |  |
| public.user_empresas | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~5.2M | ~251.4k |  |
| public.anomalia_toast_eventos | 0 | 72.0 KB | 8.0 KB | 56.0 KB | 0 | ~30 | 0 |  |
| public.webhooks_log | 0 | 72.0 KB | 8.0 KB | 56.0 KB | ~20 | ~3.3k | 0 |  |
| public.alert_configurations | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | 0 |  |
| public.apuracoes_irpj_csll | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | 0 |  |
| public.apuracoes_tributarias | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~300 | ~60 |  |
| public.budgets | 8 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | ~260 |  |
| public.faturamento_mensal | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~100 | 0 |  |
| public.fechamentos_tributarios | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~70 | 0 |  |
| public.folha_pagamento | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~90 | 0 |  |
| public.formas_pagamento | ~10 | 64.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.geo_blocks | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | 0 |  |
| public.integration_secrets | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~6.2k | 0 |  |
| public.metas_financeiras | 6 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~290 | 0 |  |
| public.oportunidades_elisao | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~90 | 0 |  |
| public.profiles | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~38.1k | ~36.6k |  |
| public.regimes_simulados | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~130 | 0 |  |
| public.regras_roteamento_financeiro | 6 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~36k | 0 |  |
| public.sessoes_conciliacao | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.ufs | ~30 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~380 | 0 |  |
| public.user_filter_presets | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | 0 |  |
| public.execucoes_regua_cobranca | 0 | 56.0 KB | 8.0 KB | 40.0 KB | 0 | ~20 | 0 |  |
| public.regua_cobranca_etapas | 6 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | ~40 | 0 |  |
| public.role_permissions | 1 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | ~14.2k | 0 |  |
| public.api_keys | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.benchmarks_setoriais | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | ~20 |  |
| public.beneficios_fiscais | 9 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.blocked_ips | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~1.3k | 0 |  |
| public.catalogos_fiscais_cargas | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.configuracoes_aprovacao | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~15k | ~3.2k |  |
| public.conformidade_snapshots | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~40 |  |
| public.convites_contador | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~20 | 0 |  |
| public.digest_envios_log | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.dispositivos_conhecidos | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~730 | 0 |  |
| public.elisao_alertas | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~80 | 0 |  |
| public.elisao_regras_creditos | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~250 |  |
| public.elisao_tarefas_acionaveis | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~80 | 0 |  |
| public.empresas | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~376.5k | 0 |  |
| public.estrategias_elisao_catalogo | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~120 |  |
| public.execucoes_cobranca | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.fila_cobrancas | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | 0 |  |
| public.glossario_tributario | ~30 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.health_scores_operacionais | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.historico_analises_preditivas | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.historico_score_saude | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~280 | 0 |  |
| public.incentivos_fiscais | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.itens_pedido_compra | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 0 |  |
| public.notas_fiscais_ocr | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~270 | 0 |  |
| public.operacoes_tributaveis | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~290 | 0 |  |
| public.permissions | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~14.2k | 0 |  |
| public.pix_templates | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.planos_acao | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 4 |  |
| public.protocolos_st | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~7.2k |  |
| public.recomendacoes_metas_ia | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~280 | 0 |  |
| public.regimes_tributarios | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.regras_contabilizacao_automatica | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 8 | ~30 | ~20 |  |
| public.regras_duplicidade | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.regua_cobranca | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 0 |  |
| public.relatorios_tributarios_agendados | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~1.2k | 0 |  |
| public.retencoes_fonte | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.saved_filters | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | ~2.8k |  |
| public.scim_tokens | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | 0 |  |
| public.security_alerts | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.sefaz_dfe_cursor | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~2k | 0 |  |
| public.split_payment_transacoes | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.sso_providers | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~1.6k | 0 |  |
| public.templates_cobranca | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.user_anomalia_preferences | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~42.1k | 0 |  |
| public.user_onboarding_progress | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~14.8k | 0 |  |
| public.user_roles | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~18.2M | 0 |  |
| public.user_sessions | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.vendedores | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~280 | 0 |  |
| public.webhook_simulation_results | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.webhook_simulation_runs | 4 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.acordos_parcelamento | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | 0 |  |
| public.asaas_payment_links | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.cnpja_rate_limit | 0 | 40.0 KB | 8.0 KB | 32.0 KB | ~10 | ~10 | ~20 |  |
| public.convites | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.empresas_certificados | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~240 | 0 |  |
| public.entregas_obrigacoes | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | 1 |  |
| public.feedback_conciliacao_ia | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | 0 |  |
| public.new_device_alerts | 0 | 40.0 KB | 8.0 KB | 24.0 KB | 0 | ~20 | 0 |  |
| public.nfe_eventos | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.notification_history | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.solicitacoes_lgpd | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~290 |  |
| public.sso_user_groups | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.alertas_preditivos | 6 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~280 | 0 |  |
| public.allowed_ips | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~1.3k | 0 |  |
| public.anomalias_detectadas | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~16.7k | 0 |  |
| public.asaas_payments | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.asaas_reconciliation_suggestions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.asaas_transfers | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.auditoria_tributaria | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.bling_webhook_events | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.ci_security_gate_events | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.conciliacoes_parciais | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.darfs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.expert_conversations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.fluxos_aprovacao_niveis | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~330 | 0 |  |
| public.frontend_error_alert_state | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.historico_cobranca_whatsapp | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~85.5k | 0 |  |
| public.historico_cobrancas_boletos | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.ip_whitelist | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.kpis_operacionais | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.logs_conciliacao_retroativa | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.n8n_dispatch_logs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.pagamentos_recorrentes | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.per_dcomp | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.prejuizos_fiscais | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.regime_decision_cache | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~570 |  |
| public.resumos_executivos_semanais | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.scim_setup_checklist | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.sso_role_mappings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.user_active_filters | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.user_passkeys | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.webhook_dlq | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 9 | ~50 | 0 |  |
| public.webhook_events | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 0 |  |
| public.whatsapp_conversas | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.acessos_suspeitos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~50 |  |
| public.acoes_recomendadas | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | 0 |  |
| public.alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.alerts_sent | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.anexos_financeiros | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.anomalia_detection_runs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.aprovacao_comentarios | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.asaas_audit_trail | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.asaas_config | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.asaas_credit_risk_analysis | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.asaas_customers | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.asaas_sync_queue | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.bitrix_field_mappings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_oauth_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_sync_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.bling_sync_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.bling_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.catalogos_tributarios_health_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.custom_field_definitions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.custom_field_values | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.elisao_simulacoes_regime | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.email_verifications | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.evidencias_pacotes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.expert_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.historico_relatorios | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.indices_uso_excecoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.n8n_workflow_configs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.open_finance_consents | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.operacoes_icms | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.organizacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.overlay_rejeicoes_auditoria | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.parcelas_acordo | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.password_reset_requests | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~330 | 0 |  |
| public.password_reset_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.portal_cliente_acessos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.portal_cliente_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.projecoes_reforma | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.push_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~40 |  |
| public.regimes_especiais_empresa | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.relatorios_agendados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.risk_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.scim_operations_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.security_audit_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.simulacao_tributos_detalhados | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.simulacoes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.slo_metrics_diarias | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~110 |  |
| public.sped_contabil_arquivos | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.sso_login_attempts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.sso_sandbox_runs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.tax_audit_trail | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.user_action_audit | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.user_demonstrativo_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.user_devices | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.user_digest_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.verificacoes_conformidade | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~60 | 0 |  |
| public.webauthn_credentials | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.allowed_countries | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~1.3k | 0 |  |
| public.auditoria_financeira | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix24_activities | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix24_stage_mappings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix24_tokens | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.bitrix_webhook_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.cnpja_cache | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.configuracoes_duplicidade | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~130 | 0 |  |
| public.frontend_error_logs_2026_01 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_02 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_03 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_04 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_05 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_06 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_07 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_08 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_09 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_2026_10 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_logs_default | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.frontend_error_silence_digest_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.logs_baixa_automatica | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.mfa_sessions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.organizacao_membros | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.rpc_observability_metrics | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.runtime_error_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.security_settings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.webauthn_challenges | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_cron_job_logs_job_name | public.cron_job_logs | 80.0 KB |
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
| authenticated | ~42.7k | ~2.1M | 49.74 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" WHERE "public"."alertas"."lido" = $1 LIMIT $2 OFFSET $3 ) , pgrst_source_count AS (SELECT $5 FROM "public"."alertas" WHERE "public"."alertas"."li` |
| authenticated | ~41.3k | ~1.3M | 30.56 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" ORDER BY "public"."alertas"."created_at" DESC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_` |
| postgres | ~6.2k | ~1.1M | 171.18 | `SELECT table_schema AS schema, table_name AS "table", column_name AS "column", grantee, string_agg(privilege_type, $2 ORDER BY privilege_type) AS privileges FROM information_schema.column_privileges cp WHERE grantee NOT ` |
| service_role | ~1.1k | ~184.5k | 168.38 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "sql" FROM json_to_record(pgrst_payload.json_data) AS _("sql" text) LIMIT $4) pgrst_body , LATERAL (SELECT` |
| authenticated | ~42.7k | ~176.2k | 4.12 | `WITH pgrst_source AS ( SELECT "public"."alertas".* FROM "public"."alertas" WHERE "public"."alertas"."tipo" = ANY ($1) AND "public"."alertas"."lido" = $2 LIMIT $3 OFFSET $4 ) , pgrst_source_count AS (SELECT $7 FROM "publi` |
| postgres | ~50 | ~156.1k | 2945.09 | `SELECT public.watch_cron_failures($1,$2)` |
| authenticator | ~240 | ~138.5k | 577.00 | `SELECT name FROM pg_timezone_names` |
| authenticated | ~290 | ~118.5k | 405.96 | `WITH pgrst_source AS ( SELECT "public"."vw_edge_health".* FROM "public"."vw_edge_health" LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_total, coalesce(json_agg(_postgr` |
| authenticated | ~26.4k | ~116.3k | 4.41 | `WITH pgrst_source AS ( SELECT "public"."vw_contas_pagar_painel".* FROM "public"."vw_contas_pagar_painel" ORDER BY "public"."vw_contas_pagar_painel"."data_vencimento" ASC LIMIT $1 OFFSET $2 ) SELECT $3::bigint AS total_re` |
| authenticated | ~14.1k | ~110.2k | 7.80 | `WITH pgrst_source AS ( SELECT "public"."contas_pagar".* FROM "public"."contas_pagar" LIMIT $1 OFFSET $2 ) , pgrst_source_count AS (SELECT $3 FROM "public"."contas_pagar") SELECT (SELECT pg_catalog.count(*) FROM pgrst_sou` |
| postgres | ~50 | ~89.1k | 1713.03 | `SELECT jobid, runid, status, start_time, end_time, EXTRACT($2 FROM (end_time - start_time))::numeric(10,2) AS seconds, left(return_message, $3) AS return_message FROM (SELECT *, row_number() OVER (PARTITION BY jobid ORDE` |
| authenticated | ~2k | ~83.3k | 42.16 | `WITH pgrst_source AS ( SELECT "public"."v_sefaz_observability".* FROM "public"."v_sefaz_observability" ORDER BY "public"."v_sefaz_observability"."seconds_since_last" DESC NULLS FIRST LIMIT $1 OFFSET $2 ) SELECT $3::bigin` |
| authenticated | ~11.1k | ~76.6k | 6.89 | `WITH pgrst_source AS (SELECT "pgrst_call".* FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "p_empresa_id", "p_centro_custo_id" FROM json_to_record(pgrst_payload.json_data) AS _("p_empresa_id" uuid, "p_centr` |
| authenticated | ~11.1k | ~76.6k | 6.88 | `WITH pgrst_source AS (SELECT "pgrst_call".* FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "p_empresa_id", "p_centro_custo_id" FROM json_to_record(pgrst_payload.json_data) AS _("p_empresa_id" uuid, "p_centr` |
| authenticated | ~14.3k | ~76.4k | 5.36 | `WITH pgrst_source AS ( SELECT "public"."contas_receber"."id", "public"."contas_receber"."data_vencimento", "public"."contas_receber"."data_recebimento", "public"."contas_receber"."cliente_nome", "public"."contas_receber"` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 21 |
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
      "node": "realtime@2600:1f1c:c90:ad01:2825:4b69:733f:afd",
      "region": "us-west-1",
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
