-- =====================================================================
-- Melhoria #19 — Correção do job sefaz-observability-hourly
-- Descoberto pela vigilância criada em #17/#18: o job falhava a cada
-- hora e NUNCA gerou um alerta. Três defeitos acumulados:
--   (a) sample_ids é uuid[], recebia text[] (chave de acesso / CNPJ);
--   (b) severidades 'high'/'medium' violam o CHECK (info/warning/critical);
--   (c) domain 'nfe_sefaz' não constava no CHECK de domain;
--   (d) ON CONFLICT por (domain, invariant, alert_hour) descartava
--       silenciosamente todas as linhas além da primeira.
-- =====================================================================

-- (c) Domínio fiscal reconhecido.
ALTER TABLE public.integrity_alerts
  DROP CONSTRAINT IF EXISTS integrity_alerts_domain_check;

ALTER TABLE public.integrity_alerts
  ADD CONSTRAINT integrity_alerts_domain_check
  CHECK (domain = ANY (ARRAY['entrega'::text, 'screening'::text, 'financeiro'::text, 'nfe_sefaz'::text]));

-- ---------------------------------------------------------------------
-- Lacunas de NSU: uma linha agregada por hora (todos os CNPJs juntos).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sefaz_detect_nsu_gaps(p_max_gap bigint DEFAULT 5)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- ---------------------------------------------------------------------
-- Cursores travados: agregado por invariante (circuito aberto x parado).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sefaz_detect_stuck_cursors()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    format('%s cursor(es) SEFAZ %s',
           a.total,
           CASE WHEN a.circuito THEN 'com circuito aberto há mais de 2h'
                ELSE 'sem consulta há mais de 6h' END),
    a.amostras,                                   -- (a) uuid[] de sefaz_dfe_cursor
    jsonb_build_object('circuit_open', a.circuito, 'cursores', a.detalhes)
  FROM agregado a
  ON CONFLICT (domain, invariant, alert_hour) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sefaz_detect_nsu_gaps(bigint)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sefaz_detect_stuck_cursors()      FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sefaz_detect_nsu_gaps(bigint)  TO service_role;
GRANT EXECUTE ON FUNCTION public.sefaz_detect_stuck_cursors()   TO service_role;