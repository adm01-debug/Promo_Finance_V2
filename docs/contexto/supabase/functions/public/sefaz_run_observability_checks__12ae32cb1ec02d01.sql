CREATE OR REPLACE FUNCTION public.sefaz_run_observability_checks()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE
  v_gaps integer;
  v_stuck integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  v_gaps  := public.sefaz_detect_nsu_gaps(5);
  v_stuck := public.sefaz_detect_stuck_cursors();
  RETURN jsonb_build_object('gaps', v_gaps, 'stuck', v_stuck, 'ran_at', now());
END;
$function$
