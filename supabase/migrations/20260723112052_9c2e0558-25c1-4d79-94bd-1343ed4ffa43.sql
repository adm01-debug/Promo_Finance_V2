
CREATE OR REPLACE FUNCTION public.check_nfe_xml_path_invariants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $fn$
DECLARE
  v_hour TIMESTAMPTZ := date_trunc('hour', now());
  v_layout INTEGER := 0;
  v_mismatch INTEGER := 0;
BEGIN
  WITH q AS (
    SELECT id FROM public.nfe_recebidas
    WHERE xml_completo = true
      AND (
        xml_path IS NULL
        OR xml_path !~ ('^' || empresa_id::text || '/[0-9]{44}\.xml$')
      )
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'nfe','xml_path_layout',
    CASE WHEN c >= 10 THEN 'critical' WHEN c >= 1 THEN 'warning' ELSE 'info' END,
    v_hour, c,
    format('%s NF-e com xml_completo=true e xml_path fora do padrão {empresa_id}/{chave44}.xml', c),
    COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count,
        severity = EXCLUDED.severity,
        reason = EXCLUDED.reason,
        sample_ids = EXCLUDED.sample_ids;
  GET DIAGNOSTICS v_layout = ROW_COUNT;

  WITH q AS (
    SELECT id FROM public.nfe_recebidas
    WHERE xml_path IS NOT NULL
      AND split_part(xml_path, '/', 1) <> empresa_id::text
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'nfe','xml_path_empresa_mismatch','critical',
    v_hour, c,
    format('%s NF-e com xml_path apontando para empresa diferente', c),
    COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count,
        reason = EXCLUDED.reason,
        sample_ids = EXCLUDED.sample_ids;
  GET DIAGNOSTICS v_mismatch = ROW_COUNT;

  RETURN jsonb_build_object(
    'layout_alerts', v_layout,
    'mismatch_alerts', v_mismatch,
    'alert_hour', v_hour
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.check_nfe_xml_path_invariants() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_nfe_xml_path_invariants() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_nfe_xml_path_invariants() TO service_role;
