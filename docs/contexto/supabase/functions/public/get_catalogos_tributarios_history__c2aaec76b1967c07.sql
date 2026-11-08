CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_history(_dias integer DEFAULT 30)
 RETURNS TABLE(dia date, criticos integer, avisos integer, infos integer, total_invariantes integer, saudavel boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
$function$
