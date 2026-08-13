-- Stub ambíguo: colide com get_cron_run_history(text, integer) em chamadas sem argumentos
DROP FUNCTION IF EXISTS public.get_cron_run_history();

CREATE OR REPLACE FUNCTION public.get_cron_run_history(
  p_job_name text DEFAULT NULL::text,
  p_limit integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  runs jsonb;
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 1000);
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar execuções agendadas.';
  END IF;

  SELECT jsonb_agg(t) INTO runs
  FROM (
    SELECT r.jobid, j.jobname, r.runid, r.status,
           r.return_message, r.start_time, r.end_time
    FROM cron.job_run_details r
    JOIN cron.job j ON r.jobid = j.jobid
    WHERE (p_job_name IS NULL OR j.jobname = p_job_name)
    ORDER BY r.start_time DESC
    LIMIT v_limit
  ) t;

  RETURN COALESCE(runs, '[]'::jsonb);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_cron_run_history(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cron_run_history(text, integer) TO authenticated, service_role;

-- get_cron_jobs: deixar de mascarar falhas em lista vazia
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE(
  jobid bigint, schedule text, command text, nodename text, nodeport integer,
  database text, username text, active boolean, jobname text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar automações.';
  END IF;

  RETURN QUERY
  SELECT j.jobid, j.schedule, j.command, j.nodename, j.nodeport,
         j.database, j.username, j.active, j.jobname
  FROM cron.job j
  ORDER BY j.jobname;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_cron_jobs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO authenticated, service_role;