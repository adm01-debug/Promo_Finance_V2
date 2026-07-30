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
  v_threshold integer := greatest(1, coalesce(p_threshold, 10));
  v_cooldown integer := greatest(0, least(coalesce(p_cooldown_minutes, 60), 10080));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_desde timestamptz := now() - make_interval(mins => greatest(1, least(coalesce(p_window_minutes, 15), 1440)));
BEGIN
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
         AND s.ultimo_alerta_em <= now() - make_interval(mins => v_cooldown)
       )
    ORDER BY g.total DESC
    LIMIT v_limit
  ),
  gravados(sig_gravada, nova) AS (
    INSERT INTO public.frontend_error_alert_state AS st (
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
      alertas_enviados = st.alertas_enviados + 1
    RETURNING st.assinatura, (st.alertas_enviados = 1)
  )
  SELECT e.sig, e.exemplo, e.sev, e.total, e.usuarios, e.urls, e.primeira, e.ultima, gr.nova
  FROM elegiveis e
  JOIN gravados gr ON gr.sig_gravada = e.sig
  ORDER BY e.total DESC;
END
$$;

REVOKE ALL ON FUNCTION public.claim_frontend_error_alerts(integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_frontend_error_alerts(integer, integer, integer, integer) TO service_role;