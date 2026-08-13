
-- ============ FASE 6: Observabilidade e Alertas de Gap NSU ============

-- 1) Detector de gaps de NSU em nfe_recebidas
CREATE OR REPLACE FUNCTION public.sefaz_detect_nsu_gaps(p_max_gap bigint DEFAULT 5)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour timestamptz := date_trunc('hour', now());
  v_count integer := 0;
BEGIN
  WITH ordered AS (
    SELECT
      cnpj_destinatario AS cnpj,
      ambiente,
      nsu,
      LAG(nsu) OVER (PARTITION BY cnpj_destinatario, ambiente ORDER BY nsu) AS prev_nsu,
      chave_acesso
    FROM public.nfe_recebidas
    WHERE nsu IS NOT NULL
      AND created_at > now() - interval '7 days'
  ),
  gaps AS (
    SELECT cnpj, ambiente::text AS ambiente,
           SUM(CASE WHEN prev_nsu IS NOT NULL AND (nsu - prev_nsu) > p_max_gap THEN 1 ELSE 0 END) AS gap_count,
           MAX(nsu - COALESCE(prev_nsu, nsu)) AS max_gap,
           (ARRAY_AGG(chave_acesso ORDER BY nsu DESC))[1:5] AS samples
    FROM ordered
    GROUP BY cnpj, ambiente
    HAVING SUM(CASE WHEN prev_nsu IS NOT NULL AND (nsu - prev_nsu) > p_max_gap THEN 1 ELSE 0 END) > 0
  )
  INSERT INTO public.integrity_alerts(domain, invariant, severity, alert_hour, affected_count, reason, sample_ids, metadata)
  SELECT
    'nfe_sefaz',
    'nsu_gap_detected',
    CASE WHEN max_gap > 50 THEN 'critical' WHEN max_gap > 20 THEN 'high' ELSE 'medium' END,
    v_hour,
    gap_count,
    format('Detectados %s gaps na sequência NSU (max gap = %s) para CNPJ %s / %s',
           gap_count, max_gap, cnpj, ambiente),
    samples,
    jsonb_build_object('cnpj', cnpj, 'ambiente', ambiente, 'max_gap', max_gap, 'threshold', p_max_gap)
  FROM gaps
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sefaz_detect_nsu_gaps(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sefaz_detect_nsu_gaps(bigint) TO service_role;

-- 2) Detector de cursores presos / circuit breaker aberto por muito tempo
CREATE OR REPLACE FUNCTION public.sefaz_detect_stuck_cursors()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour timestamptz := date_trunc('hour', now());
  v_count integer := 0;
BEGIN
  WITH stuck AS (
    SELECT cnpj, ambiente::text AS ambiente, ultima_consulta, ultimo_status, circuit_open, retry_count
    FROM public.sefaz_dfe_cursor
    WHERE (ultima_consulta IS NULL OR ultima_consulta < now() - interval '6 hours')
       OR (circuit_open = true AND updated_at < now() - interval '2 hours')
  )
  INSERT INTO public.integrity_alerts(domain, invariant, severity, alert_hour, affected_count, reason, sample_ids, metadata)
  SELECT
    'nfe_sefaz',
    CASE WHEN circuit_open THEN 'cursor_circuit_open' ELSE 'cursor_stalled' END,
    CASE WHEN circuit_open THEN 'high' ELSE 'medium' END,
    v_hour,
    1,
    format('Cursor SEFAZ %s (%s) sem progresso — status=%s circuito=%s retries=%s',
           cnpj, ambiente, COALESCE(ultimo_status,'n/a'), circuit_open, retry_count),
    ARRAY[cnpj]::text[],
    jsonb_build_object('cnpj', cnpj, 'ambiente', ambiente,
                       'ultima_consulta', ultima_consulta,
                       'ultimo_status', ultimo_status,
                       'circuit_open', circuit_open,
                       'retry_count', retry_count)
  FROM stuck
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sefaz_detect_stuck_cursors() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sefaz_detect_stuck_cursors() TO service_role;

-- 3) Consolidador chamado pelo cron
CREATE OR REPLACE FUNCTION public.sefaz_run_observability_checks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gaps integer;
  v_stuck integer;
BEGIN
  v_gaps  := public.sefaz_detect_nsu_gaps(5);
  v_stuck := public.sefaz_detect_stuck_cursors();
  RETURN jsonb_build_object('gaps', v_gaps, 'stuck', v_stuck, 'ran_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.sefaz_run_observability_checks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sefaz_run_observability_checks() TO service_role;

-- 4) View consolidada de observabilidade (SECURITY INVOKER)
CREATE OR REPLACE VIEW public.v_sefaz_observability
WITH (security_invoker = true)
AS
SELECT
  c.cnpj,
  c.ambiente,
  c.ultimo_nsu,
  c.max_nsu,
  c.ultima_consulta,
  c.ultimo_status,
  c.circuit_open,
  c.retry_count,
  c.next_run_at,
  EXTRACT(EPOCH FROM (now() - c.ultima_consulta))::int AS seconds_since_last,
  COALESCE(n.nfe_24h, 0)         AS nfe_24h,
  COALESCE(n.nfe_7d, 0)          AS nfe_7d,
  COALESCE(a.open_alerts, 0)     AS open_alerts
FROM public.sefaz_dfe_cursor c
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') AS nfe_24h,
    COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')   AS nfe_7d
  FROM public.nfe_recebidas r
  WHERE r.cnpj_destinatario = c.cnpj AND r.ambiente = c.ambiente
) n ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS open_alerts
  FROM public.integrity_alerts ia
  WHERE ia.domain = 'nfe_sefaz'
    AND ia.resolved_at IS NULL
    AND (ia.metadata->>'cnpj') = c.cnpj
) a ON true;

GRANT SELECT ON public.v_sefaz_observability TO authenticated, service_role;

-- 5) Cron horário (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('sefaz-observability-hourly')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sefaz-observability-hourly');

    PERFORM cron.schedule(
      'sefaz-observability-hourly',
      '5 * * * *',
      $cron$ SELECT public.sefaz_run_observability_checks(); $cron$
    );
  END IF;
END $$;
