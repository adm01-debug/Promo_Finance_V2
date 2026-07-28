CREATE OR REPLACE FUNCTION public.escalate_stale_integrity_alerts(p_age interval DEFAULT interval '24 hours')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count   bigint := 0;
  v_oldest  timestamptz;
  v_domains text[];
  v_samples uuid[];
  v_hour    timestamptz := date_trunc('hour', now());
  v_closed  integer := 0;
BEGIN
  SELECT count(*), min(created_at),
         array_agg(DISTINCT domain),
         (array_agg(id ORDER BY created_at))[1:5]
    INTO v_count, v_oldest, v_domains, v_samples
    FROM public.integrity_alerts
   WHERE resolved_at IS NULL
     AND severity = 'critical'
     AND created_at < now() - p_age;

  IF COALESCE(v_count, 0) = 0 THEN
    UPDATE public.performance_alerts
       SET resolved_at = now(),
           resolved_reason = 'auto: nenhum alerta critico de integridade envelhecido'
     WHERE source = 'cron'
       AND alert_key = 'integrity_stale_critical'
       AND resolved_at IS NULL;
    GET DIAGNOSTICS v_closed = ROW_COUNT;
    RETURN jsonb_build_object('escalated', 0, 'closed', v_closed, 'success', true);
  END IF;

  INSERT INTO public.performance_alerts (
    source, alert_key, alert_hour, severity, reason,
    current_value, sample_count, metadata
  ) VALUES (
    'cron', 'integrity_stale_critical', v_hour, 'critical',
    format('%s alerta(s) critico(s) de integridade abertos ha mais de %s (mais antigo: %s)',
           v_count, p_age::text, to_char(v_oldest, 'DD/MM HH24:MI')),
    v_count, v_count,
    jsonb_build_object(
      'dominios', to_jsonb(v_domains),
      'amostras', to_jsonb(v_samples),
      'mais_antigo', v_oldest,
      'idade_horas', round(EXTRACT(EPOCH FROM (now() - v_oldest)) / 3600.0, 1)
    )
  )
  ON CONFLICT (source, alert_key, alert_hour) DO UPDATE
    SET reason        = EXCLUDED.reason,
        current_value = EXCLUDED.current_value,
        sample_count  = EXCLUDED.sample_count,
        metadata      = EXCLUDED.metadata,
        resolved_at   = NULL,
        resolved_reason = NULL;

  RETURN jsonb_build_object(
    'escalated', v_count, 'closed', 0,
    'oldest', v_oldest, 'domains', to_jsonb(v_domains), 'success', true
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.escalate_stale_integrity_alerts(interval) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.run_integrity_cycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_core   jsonb := '{}'::jsonb;
  v_nfe    jsonb := '{}'::jsonb;
  v_sefaz  jsonb := '{}'::jsonb;
  v_esc    jsonb := '{}'::jsonb;
  v_closed integer := 0;
  v_hour   timestamptz;
BEGIN
  BEGIN
    v_core := public.check_integrity_invariants();
  EXCEPTION WHEN OTHERS THEN
    v_core := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  IF COALESCE((v_core->>'success')::boolean, false) THEN
    v_hour := (v_core->>'alert_hour')::timestamptz;
    v_closed := v_closed + public.close_stale_integrity_alerts(
      v_hour, ARRAY['entrega','screening','financeiro'], interval '0'
    );
  END IF;

  BEGIN
    v_nfe := public.check_nfe_xml_path_invariants();
  EXCEPTION WHEN OTHERS THEN
    v_nfe := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  IF COALESCE((v_nfe->>'success')::boolean, false) THEN
    v_closed := v_closed + public.close_stale_integrity_alerts(
      (v_nfe->>'alert_hour')::timestamptz, ARRAY['nfe'], interval '0'
    );
  END IF;

  BEGIN
    v_sefaz := public.sefaz_run_observability_checks();
    v_closed := v_closed + public.close_stale_integrity_alerts(
      date_trunc('hour', now()), ARRAY['nfe_sefaz'], interval '3 hours'
    );
  EXCEPTION WHEN OTHERS THEN
    v_sefaz := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  -- Escalonamento: alertas criticos esquecidos por mais de 24h viram plantao
  BEGIN
    v_esc := public.escalate_stale_integrity_alerts(interval '24 hours');
  EXCEPTION WHEN OTHERS THEN
    v_esc := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  RETURN COALESCE(v_core, '{}'::jsonb) || jsonb_build_object(
    'nfe_xml', v_nfe,
    'sefaz', v_sefaz,
    'escalonamento', v_esc,
    'alertas_encerrados', v_closed
  );
END;
$function$;