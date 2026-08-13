-- 1) Guarda de administrador na rotina de invariantes dos catálogos tributários
CREATE OR REPLACE FUNCTION public.check_catalogos_tributarios_invariants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_hour     timestamptz := date_trunc('hour', now());
  v_total    integer := 0;
  v_critical integer := 0;
  r          RECORD;
BEGIN
  -- Execução permitida para jobs internos (sem JWT) ou administradores autenticados
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin'
      USING ERRCODE = '42501';
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtext('check_catalogos_tributarios_invariants')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  FOR r IN SELECT * FROM public.validar_catalogos_tributarios() LOOP
    v_total := v_total + 1;
    IF r.severidade = 'critical' THEN
      v_critical := v_critical + 1;
    END IF;

    RAISE WARNING 'catalogo_tributario[%] % — % ocorrência(s): %',
      r.severidade, r.invariante, r.afetados, r.detalhe;

    INSERT INTO public.integrity_alerts
      (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
    VALUES
      ('tributario', r.invariante, r.severidade, v_hour, r.afetados, r.detalhe, '{}')
    ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
      SET affected_count = EXCLUDED.affected_count,
          severity       = EXCLUDED.severity,
          reason         = EXCLUDED.reason;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'alert_hour', v_hour,
    'invariants_failed', v_total,
    'critical', v_critical
  );
END;
$function$;

-- 2) RPC de leitura para o painel (somente admin)
CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_achados jsonb;
  v_criticos integer;
  v_avisos integer;
  v_infos integer;
  v_ultima timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'invariante', invariante,
           'severidade', severidade,
           'afetados', afetados,
           'detalhe', detalhe
         ) ORDER BY
           CASE severidade WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
           invariante), '[]'::jsonb),
         count(*) FILTER (WHERE severidade = 'critical'),
         count(*) FILTER (WHERE severidade = 'warning'),
         count(*) FILTER (WHERE severidade = 'info')
    INTO v_achados, v_criticos, v_avisos, v_infos
  FROM public.validar_catalogos_tributarios();

  SELECT max(alert_hour) INTO v_ultima
    FROM public.integrity_alerts
   WHERE domain = 'tributario';

  RETURN jsonb_build_object(
    'gerado_em', now(),
    'ultima_verificacao', v_ultima,
    'criticos', coalesce(v_criticos, 0),
    'avisos', coalesce(v_avisos, 0),
    'infos', coalesce(v_infos, 0),
    'saudavel', coalesce(v_criticos, 0) + coalesce(v_avisos, 0) + coalesce(v_infos, 0) = 0,
    'achados', v_achados
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_catalogos_tributarios_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_catalogos_tributarios_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalogos_tributarios_health() TO service_role;

REVOKE ALL ON FUNCTION public.validar_catalogos_tributarios() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validar_catalogos_tributarios() TO service_role;