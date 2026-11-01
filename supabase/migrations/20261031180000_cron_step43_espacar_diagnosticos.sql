-- [STEP 43] Espaçar cron jobs de diagnótico de alta frequência
-- Aplicado diretamente no banco em 2026-10-31.
-- Esta migration registra as alterações para rastreabilidade.

-- detect-query-regressions: */5 → */30 min (~8.650 chamadas/semana → ~1.440)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'detect-query-regressions-5min'),
  schedule := '*/30 * * * *'
);

-- capture-slow-queries: */15 → horário (~2.884 → ~168 chamadas/semana)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'capture-slow-queries'),
  schedule := '0 * * * *'
);

-- monitorar-erros-frontend: */15 → */30 min (~2.920 → ~1.440 chamadas/semana)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'monitorar-erros-frontend'),
  schedule := '*/30 * * * *'
);
