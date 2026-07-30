-- Sprint Final: Baseline periódico de pg_stat_statements + retenção
-- Objetivo: histórico contínuo para análise de regressão de performance ao longo do tempo

-- 1) Agendar captura semanal do baseline (todo domingo 03:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove job anterior se existir (idempotente)
    PERFORM cron.unschedule('pgss_weekly_baseline')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pgss_weekly_baseline');

    PERFORM cron.schedule(
      'pgss_weekly_baseline',
      '0 3 * * 0',
      $cmd$SELECT public.capture_pg_stat_statements_baseline('weekly_auto_' || to_char(now(),'YYYY_MM_DD'));$cmd$
    );
  END IF;
END $$;

-- 2) Função de retenção do baseline (mantém 90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_pgss_baseline(p_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.pg_stat_statements_baseline
   WHERE captured_at < now() - make_interval(days => GREATEST(p_days, 7));
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_pgss_baseline(integer) FROM anon, authenticated;

-- 3) Agendar retenção mensal (dia 1 às 04:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('pgss_baseline_cleanup')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'pgss_baseline_cleanup');

    PERFORM cron.schedule(
      'pgss_baseline_cleanup',
      '0 4 1 * *',
      $cmd$SELECT public.cleanup_pgss_baseline(90);$cmd$
    );
  END IF;
END $$;

-- 4) Índice para acelerar consultas por label/tempo (se ainda não existir)
CREATE INDEX IF NOT EXISTS idx_pgss_baseline_label_captured
  ON public.pg_stat_statements_baseline (label, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_pgss_baseline_captured_at
  ON public.pg_stat_statements_baseline (captured_at DESC);

-- 5) Captura inicial imediata para termos ponto de partida
SELECT public.capture_pg_stat_statements_baseline('initial_' || to_char(now(),'YYYY_MM_DD_HH24MI'));