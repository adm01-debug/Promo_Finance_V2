-- Gap #24: alerta proativo de assinaturas de erro no frontend

-- 1) Normalizador imutável de assinatura (reutilizável)
CREATE OR REPLACE FUNCTION public.fe_error_signature(p_message text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT left(
    regexp_replace(
      regexp_replace(coalesce(p_message, ''), '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
      '\d+', '<n>', 'g'), 200)
$$;

-- 2) Estado de alertas por assinatura (idempotência / cooldown)
CREATE TABLE IF NOT EXISTS public.frontend_error_alert_state (
  assinatura text PRIMARY KEY,
  severity text NOT NULL DEFAULT 'error',
  exemplo_mensagem text,
  primeiro_alerta_em timestamptz NOT NULL DEFAULT now(),
  ultimo_alerta_em timestamptz NOT NULL DEFAULT now(),
  ocorrencias_no_ultimo_alerta integer NOT NULL DEFAULT 0,
  alertas_enviados integer NOT NULL DEFAULT 0,
  silenciado_ate timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fe_alert_state_severity_chk CHECK (severity IN ('error','warning','critical')),
  CONSTRAINT fe_alert_state_bounds_chk CHECK (
    length(assinatura) <= 200
    AND length(coalesce(exemplo_mensagem,'')) <= 2000
    AND ocorrencias_no_ultimo_alerta >= 0
    AND alertas_enviados >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_fe_alert_state_ultimo ON public.frontend_error_alert_state (ultimo_alerta_em DESC);

REVOKE ALL ON public.frontend_error_alert_state FROM anon, authenticated;
GRANT SELECT ON public.frontend_error_alert_state TO authenticated;
GRANT ALL ON public.frontend_error_alert_state TO service_role;

ALTER TABLE public.frontend_error_alert_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fe_alert_state_admin_select" ON public.frontend_error_alert_state;
CREATE POLICY "fe_alert_state_admin_select"
  ON public.frontend_error_alert_state FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_fe_alert_state_updated_at ON public.frontend_error_alert_state;
CREATE TRIGGER trg_fe_alert_state_updated_at
  BEFORE UPDATE ON public.frontend_error_alert_state
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3) Claim atômico: detecta picos e registra o alerta na mesma transação
CREATE OR REPLACE FUNCTION public.claim_frontend_error_alerts(
  p_window_minutes integer DEFAULT 15,
  p_threshold integer DEFAULT 10,
  p_cooldown_minutes integer DEFAULT 60,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  assinatura text,
  exemplo_mensagem text,
  severity text,
  ocorrencias bigint,
  usuarios_afetados bigint,
  urls_distintas bigint,
  primeira_ocorrencia timestamptz,
  ultima_ocorrencia timestamptz,
  is_nova boolean
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window integer := greatest(1, least(coalesce(p_window_minutes, 15), 1440));
  v_threshold integer := greatest(1, coalesce(p_threshold, 10));
  v_cooldown integer := greatest(0, least(coalesce(p_cooldown_minutes, 60), 10080));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_desde timestamptz := now() - make_interval(mins => greatest(1, least(coalesce(p_window_minutes, 15), 1440)));
BEGIN
  -- service_role (auth.uid() nulo em contexto de job) ou admin autenticado
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH grupos AS (
    SELECT
      public.fe_error_signature(fel.error_message) AS sig,
      (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo,
      (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS sev,
      count(*) AS total,
      count(DISTINCT fel.user_id) AS usuarios,
      count(DISTINCT fel.url) AS urls,
      min(fel.created_at) AS primeira,
      max(fel.created_at) AS ultima
    FROM public.frontend_error_logs fel
    WHERE fel.created_at >= v_desde
    GROUP BY 1
    HAVING count(*) >= v_threshold
  ),
  elegiveis AS (
    SELECT g.*
    FROM grupos g
    LEFT JOIN public.frontend_error_alert_state s ON s.assinatura = g.sig
    WHERE s.assinatura IS NULL
       OR (
         coalesce(s.silenciado_ate, '-infinity'::timestamptz) < now()
         AND s.ultimo_alerta_em < now() - make_interval(mins => v_cooldown)
       )
    ORDER BY g.total DESC
    LIMIT v_limit
  ),
  gravados AS (
    INSERT INTO public.frontend_error_alert_state AS s (
      assinatura, severity, exemplo_mensagem, primeiro_alerta_em,
      ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados
    )
    SELECT e.sig, e.sev, left(e.exemplo, 2000), now(), now(), e.total, 1
    FROM elegiveis e
    ON CONFLICT (assinatura) DO UPDATE SET
      severity = EXCLUDED.severity,
      exemplo_mensagem = EXCLUDED.exemplo_mensagem,
      ultimo_alerta_em = now(),
      ocorrencias_no_ultimo_alerta = EXCLUDED.ocorrencias_no_ultimo_alerta,
      alertas_enviados = s.alertas_enviados + 1
    RETURNING s.assinatura, (s.alertas_enviados = 1) AS nova
  )
  SELECT e.sig, e.exemplo, e.sev, e.total, e.usuarios, e.urls, e.primeira, e.ultima, gr.nova
  FROM elegiveis e
  JOIN gravados gr ON gr.assinatura = e.sig
  ORDER BY e.total DESC;
END
$$;

REVOKE ALL ON FUNCTION public.claim_frontend_error_alerts(integer, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_frontend_error_alerts(integer, integer, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.fe_error_signature(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fe_error_signature(text) TO authenticated, service_role;