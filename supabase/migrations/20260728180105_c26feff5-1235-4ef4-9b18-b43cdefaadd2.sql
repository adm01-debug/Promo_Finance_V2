CREATE OR REPLACE FUNCTION public.silenciar_alerta_erro_frontend(
  p_assinatura text,
  p_horas integer DEFAULT 24,
  p_motivo text DEFAULT NULL
)
RETURNS public.frontend_error_alert_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_sig text := left(btrim(coalesce(p_assinatura, '')), 200);
  v_horas integer;
  v_ate timestamptz;
  v_antes jsonb;
  v_row public.frontend_error_alert_state;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  IF v_sig = '' THEN
    RAISE EXCEPTION 'assinatura obrigatoria' USING ERRCODE = '22023';
  END IF;

  -- p_horas <= 0 (ou NULL) reativa os alertas; teto de 30 dias evita silêncio eterno
  v_horas := least(greatest(coalesce(p_horas, 0), 0), 720);
  v_ate := CASE WHEN v_horas = 0 THEN NULL ELSE now() + make_interval(hours => v_horas) END;

  SELECT to_jsonb(s) INTO v_antes
  FROM public.frontend_error_alert_state s
  WHERE s.assinatura = v_sig;

  INSERT INTO public.frontend_error_alert_state AS st (assinatura, silenciado_ate)
  VALUES (v_sig, v_ate)
  ON CONFLICT (assinatura) DO UPDATE SET silenciado_ate = EXCLUDED.silenciado_ate
  RETURNING st.* INTO v_row;

  INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data, details)
  VALUES (
    v_uid,
    (auth.jwt() ->> 'email'),
    CASE WHEN v_ate IS NULL THEN 'unmute_frontend_error_alert' ELSE 'mute_frontend_error_alert' END,
    'frontend_error_alert_state',
    v_sig,
    v_antes,
    to_jsonb(v_row),
    left(coalesce(nullif(btrim(coalesce(p_motivo, '')), ''), 'sem motivo informado'), 500)
  );

  RETURN v_row;
END
$function$;

REVOKE ALL ON FUNCTION public.silenciar_alerta_erro_frontend(text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.silenciar_alerta_erro_frontend(text, integer, text) TO authenticated, service_role;