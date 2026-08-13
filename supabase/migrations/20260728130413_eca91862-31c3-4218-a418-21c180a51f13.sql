-- 1) Tabela de histórico diário
CREATE TABLE IF NOT EXISTS public.catalogos_tributarios_health_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia date NOT NULL,
  criticos integer NOT NULL DEFAULT 0 CHECK (criticos >= 0),
  avisos integer NOT NULL DEFAULT 0 CHECK (avisos >= 0),
  infos integer NOT NULL DEFAULT 0 CHECK (infos >= 0),
  total_invariantes integer NOT NULL DEFAULT 0 CHECK (total_invariantes >= 0),
  saudavel boolean NOT NULL DEFAULT true,
  achados jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalogos_health_history_dia_key UNIQUE (dia)
);

COMMENT ON TABLE public.catalogos_tributarios_health_history IS
  'Série diária das invariantes violadas nos catálogos tributários (UF, NCM, CNAE, Simples, ISS, ST). Alimentada por check_catalogos_tributarios_invariants().';

CREATE INDEX IF NOT EXISTS idx_catalogos_health_history_dia
  ON public.catalogos_tributarios_health_history (dia DESC);

GRANT SELECT ON public.catalogos_tributarios_health_history TO authenticated;
GRANT ALL ON public.catalogos_tributarios_health_history TO service_role;

ALTER TABLE public.catalogos_tributarios_health_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins leem historico saude fiscal"
  ON public.catalogos_tributarios_health_history;
CREATE POLICY "admins leem historico saude fiscal"
  ON public.catalogos_tributarios_health_history
  FOR SELECT
  TO authenticated
  USING ((SELECT public.has_role(auth.uid(), 'admin'::app_role)));

DROP TRIGGER IF EXISTS trg_catalogos_health_history_updated_at
  ON public.catalogos_tributarios_health_history;
CREATE TRIGGER trg_catalogos_health_history_updated_at
  BEFORE UPDATE ON public.catalogos_tributarios_health_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2) A rotina diária passa a persistir o retrato do dia
CREATE OR REPLACE FUNCTION public.check_catalogos_tributarios_invariants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_hour     timestamptz := date_trunc('hour', now());
  v_total    integer := 0;
  v_critical integer := 0;
  v_warning  integer := 0;
  v_info     integer := 0;
  v_achados  jsonb := '[]'::jsonb;
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
    ELSIF r.severidade = 'warning' THEN
      v_warning := v_warning + 1;
    ELSE
      v_info := v_info + 1;
    END IF;

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

  -- Retrato diário (idempotente: várias execuções no mesmo dia atualizam a linha)
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
    'critical', v_critical
  );
END;
$function$;

-- 3) RPC de leitura da série histórica (admin-only)
CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_history(_dias integer DEFAULT 30)
RETURNS TABLE (
  dia date,
  criticos integer,
  avisos integer,
  infos integer,
  total_invariantes integer,
  saudavel boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_dias integer := LEAST(GREATEST(COALESCE(_dias, 30), 1), 365);
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT h.dia, h.criticos, h.avisos, h.infos, h.total_invariantes, h.saudavel
    FROM public.catalogos_tributarios_health_history h
    WHERE h.dia >= current_date - v_dias
    ORDER BY h.dia ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_catalogos_tributarios_history(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_catalogos_tributarios_history(integer) TO authenticated, service_role;