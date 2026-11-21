-- scripts/migrate-cron-jobs.sql
-- Recria os 33 cron jobs ativos do projeto de origem no projeto de destino.
-- Fonte: cron.job WHERE active=true de produção (regenerado em 2026-11-21).
--
-- Placeholder substituído por envsubst no wrapper migrate-cron-jobs.sh:
--   PROJECT_REF → ref do projeto destino (usado no host das edges)
--
-- Idempotente: cada job gerenciado é desagendado (se existir) antes de
-- recriar. Jobs do destino fora desta lista são PRESERVADOS (contrato do
-- staging-migrate: nunca desagendar o que não pertence a esta lista).
-- Requer extensão pg_cron.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Recria funcoes resolvedoras com URL do DESTINO (referencias de prod)
-- ---------------------------------------------------------------------------
-- As migrations 20260822115000 e 20260913120000 gravam a URL de PROD no corpo
-- das funcoes SECURITY DEFINER que os crons de HTTP chamam. Em staging isso
-- faz o projeto novo chamar as edges de prod com credenciais locais. Como o
-- Supabase nao expoe o project ref via current_setting, estas definicoes sao
-- recriadas aqui com o ref do projeto destino (placeholder PROJECT_REF).
-- Em prod este script nao roda: as migrations originais continuam corretas.

CREATE OR REPLACE FUNCTION public.invocar_regua_cobranca(p_dry_run boolean DEFAULT false)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net, extensions
AS $$
DECLARE
  v_cron_secret text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret
    INTO v_cron_secret
    FROM vault.decrypted_secrets
   WHERE name = 'regua_cron_secret'
   LIMIT 1;

  IF v_cron_secret IS NULL OR length(v_cron_secret) < 32 THEN
    RAISE EXCEPTION 'Secret regua_cron_secret ausente ou inválido no Vault';
  END IF;

  SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/executar-regua-cobranca',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := jsonb_build_object('dry_run', p_dry_run),
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.invocar_digest_silenciamentos()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/digest-silenciamentos-erro',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', public.segredo_cron('internal_jobs')
    ),
    body := jsonb_build_object('janelaHoras', 168, 'minIntervaloHoras', 144),
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.invocar_digest_conformidade()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/enviar-digest-conformidade',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      -- apikey so atravessa o gateway (verify_jwt=true); quem autoriza de fato
      -- e o x-cron-secret conferido dentro da funcao.
      'apikey', public.chave_anon_vault(),
      'x-cron-secret', public.segredo_cron('conformidade_cron')
    ),
    body := jsonb_build_object('severidadeMinima', 'baixa', 'limite', 300),
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- Helper: unschedule seguro (sem erro se o job não existir)
CREATE OR REPLACE FUNCTION pg_temp.safe_unschedule(p_name text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = p_name) THEN
    PERFORM cron.unschedule(p_name);
  END IF;
END; $$;

-- 1. auditar-acessos-cross-tenant — auditoria de acessos cross-tenant
SELECT pg_temp.safe_unschedule('auditar-acessos-cross-tenant');
SELECT cron.schedule(
  'auditar-acessos-cross-tenant', '10 * * * *',
  $cron$ SELECT public.auditar_acessos_cross_tenant(1); $cron$
);

-- 2. capture-index-usage-daily — snapshot do uso de índices
SELECT pg_temp.safe_unschedule('capture-index-usage-daily');
SELECT cron.schedule(
  'capture-index-usage-daily', '20 4 * * *',
  $cron$ SELECT public.capture_index_usage_snapshot(); $cron$
);

-- 3. capture-slow-queries — captura de queries lentas
SELECT pg_temp.safe_unschedule('capture-slow-queries');
SELECT cron.schedule(
  'capture-slow-queries', '0 * * * *',
  $cron$ SELECT public.capture_slow_queries() $cron$
);

-- 4. cleanup-cron-logs — limpeza de logs do pg_cron
SELECT pg_temp.safe_unschedule('cleanup-cron-logs');
SELECT cron.schedule(
  'cleanup-cron-logs', '0 4 * * 0',
  $cron$ SELECT public.cleanup_old_cron_logs() $cron$
);

-- 5. cleanup-expired-tokens — remoção de tokens expirados
SELECT pg_temp.safe_unschedule('cleanup-expired-tokens');
SELECT cron.schedule(
  'cleanup-expired-tokens', '0 1 * * *',
  $cron$ SELECT public.cleanup_expired_tokens() $cron$
);

-- 6. cleanup-login-attempts — limpeza de tentativas de login antigas
SELECT pg_temp.safe_unschedule('cleanup-login-attempts');
SELECT cron.schedule(
  'cleanup-login-attempts', '30 1 * * *',
  $cron$ SELECT public.cleanup_old_login_attempts() $cron$
);

-- 7. cleanup-rpc-obs-metrics-daily — limpeza de métricas de observabilidade RPC
SELECT pg_temp.safe_unschedule('cleanup-rpc-obs-metrics-daily');
SELECT cron.schedule(
  'cleanup-rpc-obs-metrics-daily', '0 5 * * *',
  $cron$ SELECT public.cleanup_rpc_observability_metrics() $cron$
);

-- 8. cron-failure-watch — vigilância de falhas do pg_cron
SELECT pg_temp.safe_unschedule('cron-failure-watch');
SELECT cron.schedule(
  'cron-failure-watch', '10 * * * *',
  $cron$ SELECT public.watch_cron_failures(90,36); $cron$
);

-- 9. daily-log-cleanup — limpeza diária de logs
SELECT pg_temp.safe_unschedule('daily-log-cleanup');
SELECT cron.schedule(
  'daily-log-cleanup', '0 6 * * *',
  $cron$ SELECT public.run_daily_cleanup() $cron$
);

-- 10. daily-log-retention — retenção de tabelas de log
SELECT pg_temp.safe_unschedule('daily-log-retention');
SELECT cron.schedule(
  'daily-log-retention', '0 3 * * *',
  $cron$ SELECT public.cleanup_log_tables(); $cron$
);

-- 11. detect-query-regressions-5min — detecção de regressões de query
SELECT pg_temp.safe_unschedule('detect-query-regressions-5min');
SELECT cron.schedule(
  'detect-query-regressions-5min', '*/30 * * * *',
  $cron$ SELECT public.detect_query_regressions() $cron$
);

-- 12. digest-silenciamentos-erro — digest semanal de silenciamentos de erro
SELECT pg_temp.safe_unschedule('digest-silenciamentos-erro');
SELECT cron.schedule(
  'digest-silenciamentos-erro', '0 11 * * 1',
  $cron$ SELECT public.invocar_digest_silenciamentos(); $cron$
);

-- 13. enviar-digest-conformidade-diario — digest diário de conformidade
SELECT pg_temp.safe_unschedule('enviar-digest-conformidade-diario');
SELECT cron.schedule(
  'enviar-digest-conformidade-diario', '0 8 * * *',
  $cron$ SELECT 1 $cron$
);

-- 14. enviar-digest-conformidade-horario — digest horário de conformidade
SELECT pg_temp.safe_unschedule('enviar-digest-conformidade-horario');
SELECT cron.schedule(
  'enviar-digest-conformidade-horario', '30 * * * *',
  $cron$ SELECT public.invocar_digest_conformidade(); $cron$
);

-- 15. executar-regua-cobranca-diaria — execução da régua de cobrança
SELECT pg_temp.safe_unschedule('executar-regua-cobranca-diaria');
SELECT cron.schedule(
  'executar-regua-cobranca-diaria', '0 12 * * *',
  $cron$ SELECT public.invocar_regua_cobranca(false); $cron$
);

-- 16. gerar-alertas-vencimento-diario — alerta de contas a vencer
SELECT pg_temp.safe_unschedule('gerar-alertas-vencimento-diario');
SELECT cron.schedule(
  'gerar-alertas-vencimento-diario', '0 8 * * *',
  $cron$ select public.gerar_alertas_vencimento(); $cron$
);

-- 17. gerar-contas-recorrentes-diario — geração de contas recorrentes
SELECT pg_temp.safe_unschedule('gerar-contas-recorrentes-diario');
SELECT cron.schedule(
  'gerar-contas-recorrentes-diario', '35 3 * * *',
  $cron$ select public.gerar_contas_recorrentes(); $cron$
);

-- 18. gerar-snapshots-conformidade-mensal — snapshot mensal de conformidade (edge)
--     verify_jwt=true na edge: o gateway exige JWT válido além do
--     x-cron-secret conferido no handler (padrão de invocar_digest_conformidade).
SELECT pg_temp.safe_unschedule('gerar-snapshots-conformidade-mensal');
SELECT cron.schedule(
  'gerar-snapshots-conformidade-mensal', '0 4 5 * *',
  $cron$ SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/gerar-snapshots-conformidade',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', public.chave_anon_vault(),
      'x-cron-secret', (SELECT valor FROM public.integration_secrets WHERE chave = 'conformidade_cron' LIMIT 1)
    ),
    body := jsonb_build_object('meses', 3, 'regime', 'real')
  ) AS request_id; $cron$
);

-- 19. integrity-invariants-hourly — ciclo de integridade
SELECT pg_temp.safe_unschedule('integrity-invariants-hourly');
SELECT cron.schedule(
  'integrity-invariants-hourly', '45 * * * *',
  $cron$ SELECT public.run_integrity_cycle() $cron$
);

-- 20. maintain-monthly-partitions — manutenção de partições mensais
SELECT pg_temp.safe_unschedule('maintain-monthly-partitions');
SELECT cron.schedule(
  'maintain-monthly-partitions', '0 0 1 * *',
  $cron$ SELECT public.maintain_monthly_partitions() $cron$
);

-- 21. marcar-contas-vencidas — marcação de contas vencidas
SELECT pg_temp.safe_unschedule('marcar-contas-vencidas');
SELECT cron.schedule(
  'marcar-contas-vencidas', '5 3 * * *',
  $cron$ SELECT public.marcar_contas_vencidas(); $cron$
);

-- 22. monitor-health-check — healthcheck (edge via http_post)
SELECT pg_temp.safe_unschedule('monitor-health-check');
SELECT cron.schedule(
  'monitor-health-check', '*/30 * * * *',
  $cron$ SELECT net.http_post(
      url     := 'https://${PROJECT_REF}.supabase.co/functions/v1/monitor-health',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', (
          SELECT valor
          FROM integration_secrets
          WHERE chave = 'monitor_health_cron'
          LIMIT 1
        )
      ),
      body    := '{"source":"pg_cron"}'::jsonb
    ); $cron$
);

-- 23. monitor-table-bloat-daily — monitoramento de bloat de tabelas
SELECT pg_temp.safe_unschedule('monitor-table-bloat-daily');
SELECT cron.schedule(
  'monitor-table-bloat-daily', '0 2 * * *',
  $cron$ SELECT public.monitor_table_bloat() $cron$
);

-- 24. monitorar-erros-frontend — monitor de erros do frontend (edge)
SELECT pg_temp.safe_unschedule('monitorar-erros-frontend');
SELECT cron.schedule(
  'monitorar-erros-frontend', '*/30 * * * *',
  $cron$ SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/monitorar-erros-frontend',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (SELECT valor FROM public.integration_secrets WHERE chave = 'internal_jobs' LIMIT 1)),
    body := jsonb_build_object('windowMinutes', 15, 'threshold', 10, 'cooldownMinutes', 60)
  ) AS request_id; $cron$
);

-- 25. pgss-baseline-cleanup — limpeza do baseline do pg_stat_statements
SELECT pg_temp.safe_unschedule('pgss-baseline-cleanup');
SELECT cron.schedule(
  'pgss-baseline-cleanup', '0 23 * * 0',
  $cron$ SELECT public.cleanup_pgss_baseline() $cron$
);

-- 26. pgss-weekly-baseline — baseline semanal do pg_stat_statements
SELECT pg_temp.safe_unschedule('pgss-weekly-baseline');
SELECT cron.schedule(
  'pgss-weekly-baseline', '0 4 * * 0',
  $cron$ SELECT public.compare_pg_stat_baseline(); $cron$
);

-- 27. processar-regua-cobranca-diario — processamento da régua de cobrança
SELECT pg_temp.safe_unschedule('processar-regua-cobranca-diario');
SELECT cron.schedule(
  'processar-regua-cobranca-diario', '0 9 * * *',
  $cron$ select public.processar_regua_cobranca(null, false); $cron$
);

-- 28. recarregar-seeds-fiscais-diario — recarga de seeds fiscais
SELECT pg_temp.safe_unschedule('recarregar-seeds-fiscais-diario');
SELECT cron.schedule(
  'recarregar-seeds-fiscais-diario', '0 0 * * *',
  $cron$ SELECT public.recarregar_seeds_fiscais('cron') $cron$
);

-- 29. refresh-performance-alerts-weekly — alertas de performance semanais
SELECT pg_temp.safe_unschedule('refresh-performance-alerts-weekly');
SELECT cron.schedule(
  'refresh-performance-alerts-weekly', '0 1 * * 0',
  $cron$ SELECT public.refresh_performance_alerts_weekly() $cron$
);

-- 30. sefaz-dfe-dispatcher-15min — dispatch DFe SEFAZ (edge)
SELECT pg_temp.safe_unschedule('sefaz-dfe-dispatcher-15min');
SELECT cron.schedule(
  'sefaz-dfe-dispatcher-15min', '*/15 * * * *',
  $cron$ SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/sefaz-dfe-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SEFAZ_CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  ); $cron$
);

-- 31. sefaz-observability-hourly — checagens de observabilidade SEFAZ
SELECT pg_temp.safe_unschedule('sefaz-observability-hourly');
SELECT cron.schedule(
  'sefaz-observability-hourly', '15 * * * *',
  $cron$ SELECT public.sefaz_run_observability_checks() $cron$
);

-- 32. snapshot-table-bloat-daily — snapshot de bloat de tabelas
SELECT pg_temp.safe_unschedule('snapshot-table-bloat-daily');
SELECT cron.schedule(
  'snapshot-table-bloat-daily', '30 2 * * *',
  $cron$ SELECT public.snapshot_table_bloat() $cron$
);

-- 33. webhook-retry-worker-1min — retry de webhooks (edge)
SELECT pg_temp.safe_unschedule('webhook-retry-worker-1min');
SELECT cron.schedule(
  'webhook-retry-worker-1min', '* * * * *',
  $cron$ SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/webhook-retry-worker',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (SELECT valor FROM public.integration_secrets WHERE chave = 'internal_jobs' LIMIT 1)),
    body := jsonb_build_object('limit',50)
  ) AS request_id; $cron$
);

COMMIT;

-- Validação inline: todos os 33 names presentes e ativos
DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM cron.job
   WHERE active = true
     AND jobname IN ('auditar-acessos-cross-tenant', 'capture-index-usage-daily', 'capture-slow-queries', 'cleanup-cron-logs', 'cleanup-expired-tokens', 'cleanup-login-attempts', 'cleanup-rpc-obs-metrics-daily', 'cron-failure-watch', 'daily-log-cleanup', 'daily-log-retention', 'detect-query-regressions-5min', 'digest-silenciamentos-erro', 'enviar-digest-conformidade-diario', 'enviar-digest-conformidade-horario', 'executar-regua-cobranca-diaria', 'gerar-alertas-vencimento-diario', 'gerar-contas-recorrentes-diario', 'gerar-snapshots-conformidade-mensal', 'integrity-invariants-hourly', 'maintain-monthly-partitions', 'marcar-contas-vencidas', 'monitor-health-check', 'monitor-table-bloat-daily', 'monitorar-erros-frontend', 'pgss-baseline-cleanup', 'pgss-weekly-baseline', 'processar-regua-cobranca-diario', 'recarregar-seeds-fiscais-diario', 'refresh-performance-alerts-weekly', 'sefaz-dfe-dispatcher-15min', 'sefaz-observability-hourly', 'snapshot-table-bloat-daily', 'webhook-retry-worker-1min');
  IF v_count <> 33 THEN
    RAISE EXCEPTION 'Esperado 33 jobs registrados, encontrado %', v_count;
  END IF;
  RAISE NOTICE '✅ 33 cron jobs registrados com sucesso.';
END $$;
-- 99. Provisiona anon_key no vault do destino (idempotente) quando presente.
\getenv anon_key ANON_KEY
\if :{?anon_key}
  \if :vault_schema
    \if :vault_has
      SELECT vault.update_secret(
        (SELECT id FROM vault.decrypted_secrets WHERE name = 'anon_key' LIMIT 1),
        :'anon_key', 'anon_key', 'Anon key do projeto destino (migrate-cron-jobs)');
    \else
      SELECT vault.create_secret(
        :'anon_key', 'anon_key', 'Anon key do projeto destino (migrate-cron-jobs)');
    \endif
  \else
    \echo 'WARN: schema vault ausente no destino — anon_key não provisionado'
  \endif
\else
  \echo 'WARN: ANON_KEY ausente no ambiente — anon_key do vault não provisionado'
\endif
