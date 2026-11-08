CREATE OR REPLACE FUNCTION public.get_frontend_error_groups(p_desde timestamp with time zone DEFAULT (now() - '7 days'::interval), p_severity text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(assinatura text, exemplo_mensagem text, severity text, ocorrencias bigint, usuarios_afetados bigint, urls_distintas bigint, primeira_ocorrencia timestamp with time zone, ultima_ocorrencia timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    left(regexp_replace(
           regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
           '\d+', '<n>', 'g'), 200) AS assinatura,
    (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo_mensagem,
    (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS severity,
    count(*) AS ocorrencias,
    count(DISTINCT fel.user_id) AS usuarios_afetados,
    count(DISTINCT fel.url) AS urls_distintas,
    min(fel.created_at) AS primeira_ocorrencia,
    max(fel.created_at) AS ultima_ocorrencia
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND (p_severity IS NULL OR fel.severity = p_severity)
  GROUP BY 1
  ORDER BY count(*) DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END $function$
