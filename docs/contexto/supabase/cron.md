# Cron (pg_cron)

Horários em UTC. Execuções recentes em `cron-runs.md`.

| id | nome | schedule | ativo | database | usuário | comando |
|---|---|---|---|---|---|---|
| 2 | executar-regua-cobranca-diaria | `0 12 * * *` | sim | postgres | postgres | `SELECT public.invocar_regua_cobranca(false);` |
| 3 | capture-slow-queries | `0 * * * *` | sim | postgres | postgres | `SELECT public.capture_slow_queries()` |
| 4 | cleanup-cron-logs | `0 4 * * 0` | sim | postgres | postgres | `SELECT public.cleanup_old_cron_logs()` |
| 5 | cleanup-expired-tokens | `0 1 * * *` | sim | postgres | postgres | `SELECT public.cleanup_expired_tokens()` |
| 6 | cleanup-login-attempts | `30 1 * * *` | sim | postgres | postgres | `SELECT public.cleanup_old_login_attempts()` |
| 7 | cleanup-rpc-obs-metrics-daily | `0 5 * * *` | sim | postgres | postgres | `SELECT public.cleanup_rpc_observability_metrics()` |
| 9 | daily-log-cleanup | `0 6 * * *` | sim | postgres | postgres | `SELECT public.run_daily_cleanup()` |
| 11 | detect-query-regressions-5min | `*/30 * * * *` | sim | postgres | postgres | `SELECT public.detect_query_regressions()` |
| 12 | integrity-invariants-hourly | `45 * * * *` | sim | postgres | postgres | `SELECT public.run_integrity_cycle()` |
| 13 | maintain-monthly-partitions | `0 0 1 * *` | sim | postgres | postgres | `SELECT public.maintain_monthly_partitions()` |
| 14 | monitor-table-bloat-daily | `0 2 * * *` | sim | postgres | postgres | `SELECT public.monitor_table_bloat()` |
| 15 | pgss-baseline-cleanup | `0 23 * * 0` | sim | postgres | postgres | `SELECT public.cleanup_pgss_baseline()` |
| 17 | recarregar-seeds-fiscais-diario | `0 0 * * *` | sim | postgres | postgres | `SELECT public.recarregar_seeds_fiscais('cron')` |
| 18 | refresh-performance-alerts-weekly | `0 1 * * 0` | sim | postgres | postgres | `SELECT public.refresh_performance_alerts_weekly()` |
| 19 | sefaz-observability-hourly | `15 * * * *` | sim | postgres | postgres | `SELECT public.sefaz_run_observability_checks()` |
| 20 | snapshot-table-bloat-daily | `30 2 * * *` | sim | postgres | postgres | `SELECT public.snapshot_table_bloat()` |
| 22 | gerar-alertas-vencimento-diario | `0 8 * * *` | sim | postgres | postgres | `select public.gerar_alertas_vencimento();` |
| 23 | gerar-contas-recorrentes-diario | `35 3 * * *` | sim | postgres | postgres | `select public.gerar_contas_recorrentes();` |
| 24 | processar-regua-cobranca-diario | `0 9 * * *` | sim | postgres | postgres | `select public.processar_regua_cobranca(null, false);` |
| 29 | pgss-weekly-baseline | `0 4 * * 0` | sim | postgres | postgres | `SELECT public.compare_pg_stat_baseline();` |
| 30 | cron-failure-watch | `10 * * * *` | sim | postgres | postgres | `SELECT public.watch_cron_failures(90,36);` |
| 31 | daily-log-retention | `0 3 * * *` | sim | postgres | postgres | `SELECT public.cleanup_log_tables();` |
| 32 | sefaz-dfe-dispatcher-15min | `*/15 * * * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/sefaz-dfe-dispatcher',     headers := jsonb_build_object(       'Content-Type', 'application/json',       'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SEFAZ_CRON_SECRET' LIMIT 1)     ),     body := '{}'::jsonb   );   ` |
| 33 | webhook-retry-worker-1min | `* * * * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/webhook-retry-worker',     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (SELECT valor FROM public.integration_secrets WHERE chave = 'internal_jobs' LIMIT 1)),     body := jsonb_build_object('limit',50)   ) AS request_id;   ` |
| 34 | auditar-acessos-cross-tenant | `10 * * * *` | sim | postgres | postgres | `SELECT public.auditar_acessos_cross_tenant(1);` |
| 35 | capture-index-usage-daily | `20 4 * * *` | sim | postgres | postgres | `SELECT public.capture_index_usage_snapshot();` |
| 36 | monitorar-erros-frontend | `*/30 * * * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/monitorar-erros-frontend',     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (SELECT valor FROM public.integration_secrets WHERE chave = 'internal_jobs' LIMIT 1)),     body := jsonb_build_object('windowMinutes', 15, 'threshold', 10, 'cooldownMinutes', 60)   ) AS request_id;   ` |
| 40 | gerar-snapshots-conformidade-mensal | `0 4 5 * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/gerar-snapshots-conformidade',     headers := jsonb_build_object(       'Content-Type', 'application/json',       'x-cron-secret', (SELECT valor FROM public.integration_secrets WHERE chave = 'conformidade_cron' LIMIT 1)     ),     body := jsonb_build_object('meses', 3, 'regime', 'real')   ) AS request_id;   ` |
| 41 | digest-silenciamentos-erro | `0 11 * * 1` | sim | postgres | postgres | `SELECT public.invocar_digest_silenciamentos();` |
| 42 | enviar-digest-conformidade-horario | `30 * * * *` | sim | postgres | postgres | `SELECT public.invocar_digest_conformidade();` |
