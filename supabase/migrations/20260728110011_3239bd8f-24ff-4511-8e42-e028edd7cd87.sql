DO $$
DECLARE
  j record;
BEGIN
  FOR j IN SELECT jobid, jobname FROM cron.job
           WHERE jobname IN ('maintain-monthly-partitions','daily-log-cleanup')
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'maintain-monthly-partitions',
  '10 3 * * *',
  $$SELECT public.maintain_monthly_partitions();$$
);

SELECT cron.schedule(
  'daily-log-cleanup',
  '40 3 * * *',
  $$SELECT public.run_daily_cleanup_with_logging();$$
);