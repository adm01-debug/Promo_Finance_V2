CREATE OR REPLACE FUNCTION public.escalate_stale_integrity_alerts(p_age interval DEFAULT '24:00:00'::interval)
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
$function$
