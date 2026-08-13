CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achados jsonb;
  v_criticos integer;
  v_avisos integer;
  v_infos integer;
  v_ultima timestamptz;
  v_auto_24h integer;
  v_abertos integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'invariante', invariante,
           'severidade', severidade,
           'afetados', afetados,
           'detalhe', detalhe
         ) ORDER BY
           CASE severidade WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
           invariante), '[]'::jsonb),
         count(*) FILTER (WHERE severidade = 'critical'),
         count(*) FILTER (WHERE severidade = 'warning'),
         count(*) FILTER (WHERE severidade = 'info')
    INTO v_achados, v_criticos, v_avisos, v_infos
  FROM public.validar_catalogos_tributarios();

  SELECT max(alert_hour),
         count(*) FILTER (
           WHERE resolved_at >= now() - interval '24 hours'
             AND coalesce(resolved_reason, '') LIKE 'auto:%'),
         count(*) FILTER (WHERE resolved_at IS NULL)
    INTO v_ultima, v_auto_24h, v_abertos
    FROM public.integrity_alerts
   WHERE domain = 'tributario';

  RETURN jsonb_build_object(
    'gerado_em', now(),
    'ultima_verificacao', v_ultima,
    'criticos', coalesce(v_criticos, 0),
    'avisos', coalesce(v_avisos, 0),
    'infos', coalesce(v_infos, 0),
    'auto_resolvidos_24h', coalesce(v_auto_24h, 0),
    'alertas_abertos', coalesce(v_abertos, 0),
    'saudavel', coalesce(v_criticos, 0) + coalesce(v_avisos, 0) + coalesce(v_infos, 0) = 0,
    'achados', v_achados
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_catalogos_tributarios_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_catalogos_tributarios_health() TO authenticated, service_role;