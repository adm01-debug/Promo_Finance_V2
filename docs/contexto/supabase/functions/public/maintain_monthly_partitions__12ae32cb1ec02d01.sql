CREATE OR REPLACE FUNCTION public.maintain_monthly_partitions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_audit int;
  v_fe int;
BEGIN
  v_audit := public.ensure_monthly_partitions('audit_logs', 0, 3);
  v_fe := public.ensure_monthly_partitions('frontend_error_logs', 0, 3);
  RETURN jsonb_build_object(
    'audit_logs_created', v_audit,
    'frontend_error_logs_created', v_fe,
    'executed_at', now()
  );
END;
$function$
