CREATE OR REPLACE FUNCTION public.claim_frontend_error_alerts(p_window_minutes integer DEFAULT 15, p_threshold integer DEFAULT 10, p_cooldown_minutes integer DEFAULT 60, p_limit integer DEFAULT 20)
 RETURNS TABLE(assinatura text, exemplo_mensagem text, severity text, ocorrencias bigint, usuarios_afetados bigint, urls_distintas bigint, primeira_ocorrencia timestamp with time zone, ultima_ocorrencia timestamp with time zone, is_nova boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_threshold integer := greatest(1, coalesce(p_threshold, 10));
  v_cooldown integer := greatest(0, least(coalesce(p_cooldown_minutes, 60), 10080));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_desde timestamptz := now() - make_interval(
    mins => greatest(1, least(coalesce(p_window_minutes, 15), 1440))
  );
  v_colunas_insert text;
  v_valores_insert text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  -- O banco canônico ainda exige a coluna legada `signature`; o replay limpo
  -- não a possui. Os dois fragmentos abaixo são constantes escolhidas apenas
  -- pelo catálogo, sem interpolação de entrada do usuário.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'frontend_error_alert_state'
      AND c.column_name = 'signature'
  ) THEN
    v_colunas_insert :=
      'signature, assinatura, severity, exemplo_mensagem, primeiro_alerta_em, '
      'ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados';
    v_valores_insert :=
      'e.sig, e.sig, e.sev, left(e.exemplo, 2000), now(), now(), e.total, 1';
  ELSE
    v_colunas_insert :=
      'assinatura, severity, exemplo_mensagem, primeiro_alerta_em, '
      'ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados';
    v_valores_insert :=
      'e.sig, e.sev, left(e.exemplo, 2000), now(), now(), e.total, 1';
  END IF;

  RETURN QUERY EXECUTE format($claim_sql$
  WITH grupos AS (
    SELECT public.fe_error_signature(fel.error_message) AS sig,
           (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo,
           (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS sev,
           count(*) AS total,
           count(DISTINCT fel.user_id) AS usuarios,
           count(DISTINCT fel.url) AS urls,
           min(fel.created_at) AS primeira,
           max(fel.created_at) AS ultima
    FROM public.frontend_error_logs fel
    WHERE fel.created_at >= $1
    GROUP BY 1
    HAVING count(*) >= $2
  ),
  elegiveis AS (
    SELECT g.*
    FROM grupos g
    LEFT JOIN public.frontend_error_alert_state s ON s.assinatura = g.sig
    WHERE s.assinatura IS NULL
       OR (
         coalesce(s.silenciado_ate, '-infinity'::timestamptz) < now()
         AND s.ultimo_alerta_em <= now() - make_interval(mins => $3)
       )
    ORDER BY g.total DESC
    LIMIT $4
  ),
  gravados(sig_gravada, nova) AS (
    INSERT INTO public.frontend_error_alert_state AS st (%s)
    SELECT %s
    FROM elegiveis e
    ON CONFLICT (assinatura) DO UPDATE
       SET severity = EXCLUDED.severity,
           exemplo_mensagem = EXCLUDED.exemplo_mensagem,
           ultimo_alerta_em = now(),
           ocorrencias_no_ultimo_alerta = EXCLUDED.ocorrencias_no_ultimo_alerta,
           alertas_enviados = st.alertas_enviados + 1
    RETURNING st.assinatura, (st.alertas_enviados = 1)
  )
  SELECT e.sig, e.exemplo, e.sev, e.total, e.usuarios, e.urls,
         e.primeira, e.ultima, gr.nova
  FROM elegiveis e
  JOIN gravados gr ON gr.sig_gravada = e.sig
  ORDER BY e.total DESC
  $claim_sql$, v_colunas_insert, v_valores_insert)
  USING v_desde, v_threshold, v_cooldown, v_limit;
END
$function$
