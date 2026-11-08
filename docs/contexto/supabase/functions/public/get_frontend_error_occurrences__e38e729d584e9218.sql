CREATE OR REPLACE FUNCTION public.get_frontend_error_occurrences(p_assinatura text, p_desde timestamp with time zone DEFAULT (now() - '7 days'::interval), p_limit integer DEFAULT 25)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, severity text, error_message text, error_stack text, url text, user_agent text, user_id uuid, metadata jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT fel.id, fel.created_at, fel.severity, fel.error_message, fel.error_stack,
         fel.url, fel.user_agent, fel.user_id, fel.metadata
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND left(regexp_replace(
              regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
              '\d+', '<n>', 'g'), 200) = p_assinatura
  ORDER BY fel.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 25), 100));
END $function$
