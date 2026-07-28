CREATE OR REPLACE FUNCTION public.close_stale_integrity_alerts(
  p_hour timestamptz,
  p_domains text[],
  p_grace interval DEFAULT interval '0'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_hour IS NULL OR p_domains IS NULL OR array_length(p_domains, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Um alerta representa um sintoma vivo. Se nenhuma rodada dentro da janela
  -- [p_hour - p_grace, ...] reproduziu o invariante, a inconsistencia foi
  -- corrigida: encerra. O limite e INCLUSIVO (>=) — com grace = 0 a propria
  -- rodada corrente conta como reincidencia.
  WITH fechados AS (
    UPDATE public.integrity_alerts a
    SET resolved_at = now(),
        resolved_reason = 'auto: invariante nao reproduzido em ' || p_hour::text
    WHERE a.resolved_at IS NULL
      AND a.domain = ANY (p_domains)
      AND a.alert_hour < (p_hour - p_grace)
      AND NOT EXISTS (
        SELECT 1 FROM public.integrity_alerts b
        WHERE b.domain = a.domain
          AND b.invariant = a.invariant
          AND b.alert_hour >= (p_hour - p_grace)
      )
    RETURNING 1
  )
  SELECT count(*)::int INTO v_count FROM fechados;

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.close_stale_integrity_alerts(timestamptz, text[], interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_stale_integrity_alerts(timestamptz, text[], interval) TO service_role;