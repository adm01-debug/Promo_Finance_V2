-- E23: Destravar cron-failure-watch (5 falhas em 3 dias)
-- performance_alerts_source_check não incluía 'cron'
ALTER TABLE public.performance_alerts DROP CONSTRAINT IF EXISTS performance_alerts_source_check;
ALTER TABLE public.performance_alerts ADD CONSTRAINT performance_alerts_source_check
  CHECK (source IN ('query_telemetry','pg_stat_statements','cron'));

-- E24: Destravar sefaz-observability-hourly (6 falhas em 3 dias)
-- sefaz_detect_stuck_cursors() usava ARRAY[cnpj]::text[] mas sample_ids é uuid[]
-- Substituída pelo corpo da origem (usa id::uuid de sefaz_dfe_cursor)
CREATE OR REPLACE FUNCTION public.sefaz_detect_stuck_cursors()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hour  timestamptz := date_trunc('hour', now());
  v_count integer := 0;
BEGIN
  WITH stuck AS (
    SELECT
      id, cnpj, ambiente::text AS ambiente, ultima_consulta,
      ultimo_status, circuit_open, retry_count
    FROM public.sefaz_dfe_cursor
    WHERE (ultima_consulta IS NULL OR ultima_consulta < now() - interval '6 hours')
       OR (circuit_open = true AND updated_at < now() - interval '2 hours')
  ),
  agregado AS (
    SELECT
      COALESCE(circuit_open, false)          AS circuito,
      count(*)::bigint                       AS total,
      (array_agg(id ORDER BY ultima_consulta NULLS FIRST))[1:5] AS amostras,
      jsonb_agg(jsonb_build_object(
        'cnpj', cnpj, 'ambiente', ambiente,
        'ultima_consulta', ultima_consulta,
        'ultimo_status', ultimo_status,
        'retry_count', retry_count
      )) AS detalhes
    FROM stuck
    GROUP BY COALESCE(circuit_open, false)
  )
  INSERT INTO public.integrity_alerts
    (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids, metadata)
  SELECT
    'nfe_sefaz',
    CASE WHEN a.circuito THEN 'cursor_circuit_open' ELSE 'cursor_stalled' END,
    CASE WHEN a.circuito THEN 'critical' ELSE 'warning' END,
    v_hour,
    a.total,
    format('%s cursor(es) SEFAZ %s', a.total,
           CASE WHEN a.circuito THEN 'com circuito aberto ha mais de 2h'
                ELSE 'sem consulta ha mais de 6h' END),
    a.amostras,
    jsonb_build_object('circuit_open', a.circuito, 'cursores', a.detalhes)
  FROM agregado a
  ON CONFLICT (domain, invariant, alert_hour) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;
