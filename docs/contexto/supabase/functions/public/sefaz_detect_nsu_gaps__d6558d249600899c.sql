CREATE OR REPLACE FUNCTION public.sefaz_detect_nsu_gaps(p_max_gap bigint DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hour  timestamptz := date_trunc('hour', now());
  v_count integer := 0;
BEGIN
  WITH ordered AS (
    SELECT
      id,
      cnpj_destinatario AS cnpj,
      ambiente::text    AS ambiente,
      nsu,
      LAG(nsu) OVER (PARTITION BY cnpj_destinatario, ambiente ORDER BY nsu) AS prev_nsu
    FROM public.nfe_recebidas
    WHERE nsu IS NOT NULL
      AND created_at > now() - interval '7 days'
  ),
  furos AS (
    SELECT id, cnpj, ambiente, nsu, prev_nsu, (nsu - prev_nsu) AS salto
    FROM ordered
    WHERE prev_nsu IS NOT NULL AND (nsu - prev_nsu) > p_max_gap
  ),
  resumo AS (
    SELECT
      count(*)::bigint                                   AS total,
      max(salto)                                         AS max_gap,
      (array_agg(id ORDER BY nsu DESC))[1:5]             AS amostras,
      jsonb_agg(DISTINCT jsonb_build_object('cnpj', cnpj, 'ambiente', ambiente)) AS escopos
    FROM furos
    HAVING count(*) > 0
  )
  INSERT INTO public.integrity_alerts
    (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids, metadata)
  SELECT
    'nfe_sefaz',
    'nsu_gap_detected',
    -- (b) severidade dentro do CHECK
    CASE WHEN r.max_gap > 50 THEN 'critical'
         WHEN r.max_gap > 20 THEN 'warning'
         ELSE 'info' END,
    v_hour,
    r.total,
    format('Detectados %s gaps na sequência NSU nos últimos 7 dias (maior salto = %s, limite = %s)',
           r.total, r.max_gap, p_max_gap),
    r.amostras,                                   -- (a) uuid[] de nfe_recebidas
    jsonb_build_object('max_gap', r.max_gap, 'threshold', p_max_gap, 'escopos', r.escopos)
  FROM resumo r
  ON CONFLICT (domain, invariant, alert_hour) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$
