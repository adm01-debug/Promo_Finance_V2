CREATE OR REPLACE FUNCTION public.check_catalogos_tributarios_invariants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour      timestamptz := date_trunc('hour', now());
  v_total     integer := 0;
  v_critical  integer := 0;
  v_warning   integer := 0;
  v_info      integer := 0;
  v_achados   jsonb := '[]'::jsonb;
  v_failing   text[] := '{}';
  v_resolved  integer := 0;
  v_notified  integer := 0;
  r           RECORD;
BEGIN
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
    ELSIF r.severidade = 'warning' THEN
      v_warning := v_warning + 1;
    ELSE
      v_info := v_info + 1;
    END IF;

    v_failing := v_failing || r.invariante;

    v_achados := v_achados || jsonb_build_object(
      'invariante', r.invariante,
      'severidade', r.severidade,
      'afetados',   r.afetados,
      'detalhe',    r.detalhe
    );

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

  -- Auto-resolução: alertas tributários abertos cuja invariante voltou a passar
  WITH fechados AS (
    UPDATE public.integrity_alerts
       SET resolved_at     = now(),
           resolved_reason = 'auto: invariante voltou a passar na verificação de catálogos'
     WHERE domain = 'tributario'
       AND resolved_at IS NULL
       AND NOT (invariant = ANY (v_failing))
    RETURNING 1
  )
  SELECT count(*)::int INTO v_resolved FROM fechados;

  -- Notificação interna aos administradores (no máximo 1 por dia por admin)
  IF v_critical > 0 THEN
    WITH notificados AS (
      INSERT INTO public.alertas (user_id, tipo, titulo, mensagem, prioridade, acao_url)
      SELECT DISTINCT ur.user_id,
             'catalogo_tributario',
             'Catálogos fiscais com falhas críticas',
             format('%s invariante(s) crítica(s) e %s aviso(s) detectados na verificação de %s.',
                    v_critical, v_warning, to_char(now(), 'DD/MM/YYYY HH24:MI')),
             'critica',
             '/admin/telemetria'
        FROM public.user_roles ur
       WHERE ur.role = 'admin'::app_role
         AND NOT EXISTS (
               SELECT 1 FROM public.alertas a
                WHERE a.user_id = ur.user_id
                  AND a.tipo = 'catalogo_tributario'
                  AND a.created_at >= date_trunc('day', now()))
      RETURNING 1
    )
    SELECT count(*)::int INTO v_notified FROM notificados;
  END IF;

  INSERT INTO public.catalogos_tributarios_health_history
    (dia, criticos, avisos, infos, total_invariantes, saudavel, achados)
  VALUES
    (current_date, v_critical, v_warning, v_info, v_total, v_critical = 0, v_achados)
  ON CONFLICT (dia) DO UPDATE
    SET criticos          = EXCLUDED.criticos,
        avisos            = EXCLUDED.avisos,
        infos             = EXCLUDED.infos,
        total_invariantes = EXCLUDED.total_invariantes,
        saudavel          = EXCLUDED.saudavel,
        achados           = EXCLUDED.achados,
        updated_at        = now();

  RETURN jsonb_build_object(
    'success', true,
    'alert_hour', v_hour,
    'invariants_failed', v_total,
    'critical', v_critical,
    'auto_resolved', v_resolved,
    'admins_notified', v_notified
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_catalogos_tributarios_invariants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_catalogos_tributarios_invariants() TO authenticated, service_role;