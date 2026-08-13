CREATE OR REPLACE FUNCTION public.run_integrity_cycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_res jsonb;
  v_hour timestamptz;
  v_closed integer := 0;
BEGIN
  v_res := public.check_integrity_invariants();

  -- Só encerra alertas antigos se a rodada realmente aconteceu; caso
  -- contrário (lock concorrente) manteríamos o estado anterior intacto.
  IF COALESCE((v_res->>'success')::boolean, false) THEN
    v_hour := (v_res->>'alert_hour')::timestamptz;
    v_closed := public.close_stale_integrity_alerts(
      v_hour, ARRAY['entrega','screening','financeiro']
    );
  END IF;

  RETURN v_res || jsonb_build_object('alertas_encerrados', v_closed);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.run_integrity_cycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_integrity_cycle() TO service_role;

SELECT cron.alter_job(17, command => 'SELECT public.run_integrity_cycle();');