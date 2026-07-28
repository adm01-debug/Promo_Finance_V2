CREATE OR REPLACE FUNCTION public.close_stale_integrity_alerts(p_hour timestamptz, p_domains text[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  -- Um alerta representa um sintoma vivo. Se a rodada atual (p_hour) não
  -- reproduziu o invariante, a inconsistência foi corrigida: encerra.
  WITH fechados AS (
    UPDATE public.integrity_alerts a
    SET resolved_at = now()
    WHERE a.resolved_at IS NULL
      AND a.domain = ANY (p_domains)
      AND a.alert_hour < p_hour
      AND NOT EXISTS (
        SELECT 1 FROM public.integrity_alerts b
        WHERE b.domain = a.domain
          AND b.invariant = a.invariant
          AND b.alert_hour = p_hour
      )
    RETURNING 1
  )
  SELECT count(*)::int INTO v_count FROM fechados;

  RETURN v_count;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.close_stale_integrity_alerts(timestamptz, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_stale_integrity_alerts(timestamptz, text[]) TO service_role;