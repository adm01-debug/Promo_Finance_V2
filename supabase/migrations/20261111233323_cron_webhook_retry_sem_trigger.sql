-- O job `webhook-retry-worker-1min` enviava {"trigger":"cron","limit":50}, mas o
-- RetryBodySchema da function é .strict() e só aceita {limit} → 422
-- VALIDATION_ERROR a cada minuto (120 falhas nas últimas 2h em 11/11/2026) e a
-- fila de reprocessamento de webhooks nunca era consumida. Remove só a chave
-- `trigger`; o resto do comando fica igual. Idempotente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'webhook-retry-worker-1min'
      AND command LIKE '%''trigger'',''cron'',''limit'',50%'
  ) THEN
    PERFORM cron.alter_job(
      (SELECT jobid FROM cron.job WHERE jobname = 'webhook-retry-worker-1min'),
      command := replace(
        (SELECT command FROM cron.job WHERE jobname = 'webhook-retry-worker-1min'),
        'jsonb_build_object(''trigger'',''cron'',''limit'',50)',
        'jsonb_build_object(''limit'',50)'
      )
    );
  END IF;
END $$;
