CREATE OR REPLACE FUNCTION public.check_nfe_xml_path_invariants()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_hour TIMESTAMPTZ := date_trunc('hour', now());
  v_layout INTEGER := 0;
  v_mismatch INTEGER := 0;
BEGIN
  -- Contagem TOTAL (sem LIMIT) + amostra limitada a 20 ids. O LIMIT 500
  -- anterior truncava affected_count e mascarava a real dimensão do problema.
  WITH q AS (
    SELECT id FROM public.nfe_recebidas
    WHERE xml_completo = true
      AND (
        xml_path IS NULL
        OR xml_path !~ ('^' || empresa_id::text || '/[0-9]{44}\.xml$')
      )
  ), ct AS (
    SELECT COUNT(*)::bigint AS c,
           (SELECT array_agg(id) FROM (SELECT id FROM q LIMIT 20) s) AS ids
    FROM q
  )
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'nfe','xml_path_layout',
    CASE WHEN c >= 10 THEN 'critical' WHEN c >= 1 THEN 'warning' ELSE 'info' END,
    v_hour, c,
    format('%s NF-e com xml_completo=true e xml_path fora do padrão {empresa_id}/{chave44}.xml', c),
    COALESCE(ids, '{}'::uuid[])
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count,
        severity = EXCLUDED.severity,
        reason = EXCLUDED.reason,
        sample_ids = EXCLUDED.sample_ids,
        updated_at = now();
  GET DIAGNOSTICS v_layout = ROW_COUNT;

  WITH q AS (
    SELECT id FROM public.nfe_recebidas
    WHERE xml_path IS NOT NULL
      AND split_part(xml_path, '/', 1) <> empresa_id::text
  ), ct AS (
    SELECT COUNT(*)::bigint AS c,
           (SELECT array_agg(id) FROM (SELECT id FROM q LIMIT 20) s) AS ids
    FROM q
  )
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'nfe','xml_path_empresa_mismatch','critical',
    v_hour, c,
    format('%s NF-e com xml_path apontando para empresa diferente', c),
    COALESCE(ids, '{}'::uuid[])
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count,
        reason = EXCLUDED.reason,
        sample_ids = EXCLUDED.sample_ids,
        updated_at = now();
  GET DIAGNOSTICS v_mismatch = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'layout_alerts', v_layout,
    'mismatch_alerts', v_mismatch,
    'alert_hour', v_hour
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.check_nfe_xml_path_invariants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_nfe_xml_path_invariants() TO service_role;

-- Passa a rodar junto do ciclo horário de integridade, com auto-encerramento.
CREATE OR REPLACE FUNCTION public.run_integrity_cycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_res jsonb;
  v_nfe jsonb;
  v_hour timestamptz;
  v_closed integer := 0;
BEGIN
  v_res := public.check_integrity_invariants();
  v_nfe := public.check_nfe_xml_path_invariants();

  IF COALESCE((v_res->>'success')::boolean, false) THEN
    v_hour := (v_res->>'alert_hour')::timestamptz;
    v_closed := public.close_stale_integrity_alerts(
      v_hour, ARRAY['entrega','screening','financeiro','nfe']
    );
  END IF;

  RETURN v_res || jsonb_build_object(
    'nfe_xml', v_nfe,
    'alertas_encerrados', v_closed
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.run_integrity_cycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_integrity_cycle() TO service_role;