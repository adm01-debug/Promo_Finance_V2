DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'mv_performance_alerts_weekly'
      AND indexname  = 'idx_mv_performance_alerts_weekly_pkey'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_mv_performance_alerts_weekly_pkey
             ON public.mv_performance_alerts_weekly (week_start, source, severity)';
  END IF;
END $$;
