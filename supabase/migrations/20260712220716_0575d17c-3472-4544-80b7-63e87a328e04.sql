CREATE INDEX IF NOT EXISTS idx_pgss_baseline_created_at
  ON public.pg_stat_statements_baseline (created_at DESC);