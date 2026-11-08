CREATE OR REPLACE FUNCTION public.get_silenciamentos_expirando(p_horas integer DEFAULT 72)
 RETURNS TABLE(assinatura text, severity text, exemplo_mensagem text, silenciado_ate timestamp with time zone, horas_restantes numeric, ja_expirou boolean, alertas_enviados integer, ocorrencias_no_ultimo_alerta integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_horas integer := least(greatest(coalesce(p_horas, 72), 1), 720);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar silenciamentos.';
  END IF;

  RETURN QUERY
  SELECT
    s.assinatura,
    s.severity,
    s.exemplo_mensagem,
    s.silenciado_ate,
    round(extract(epoch FROM (s.silenciado_ate - now())) / 3600.0, 1)::numeric,
    (s.silenciado_ate <= now()),
    s.alertas_enviados,
    s.ocorrencias_no_ultimo_alerta
  FROM public.frontend_error_alert_state s
  WHERE s.silenciado_ate IS NOT NULL
    AND s.silenciado_ate <= now() + make_interval(hours => v_horas)
    AND s.silenciado_ate >= now() - make_interval(hours => v_horas)
  ORDER BY s.silenciado_ate ASC
  LIMIT 200;
END;
$function$
