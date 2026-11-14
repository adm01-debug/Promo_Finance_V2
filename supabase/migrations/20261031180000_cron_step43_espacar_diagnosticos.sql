-- [STEP 43] Espaçar cron jobs de diagnótico de alta frequência
-- Aplicado diretamente no banco em 2026-10-31.
-- Esta migration registra as alterações para rastreabilidade.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'detect-query-regressions-5min') THEN
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'detect-query-regressions-5min'),
      schedule := '*/30 * * * *'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'capture-slow-queries') THEN
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'capture-slow-queries'),
      schedule := '0 * * * *'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitorar-erros-frontend') THEN
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'monitorar-erros-frontend'),
      schedule := '*/30 * * * *'
    );
  END IF;
END $$;

