-- RPC para histórico de execuções de cron jobs (admin-only)
CREATE OR REPLACE FUNCTION public.get_cron_run_history(p_job_name text DEFAULT NULL, p_limit integer DEFAULT 20)
RETURNS TABLE(
  jobid bigint,
  jobname text,
  runid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar histórico de cron jobs';
  END IF;

  RETURN QUERY
  SELECT
    j.jobid,
    j.jobname,
    d.runid,
    d.job_pid,
    d.database,
    d.username,
    d.command,
    d.status,
    d.return_message,
    d.start_time,
    d.end_time
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
  WHERE (p_job_name IS NULL OR j.jobname = p_job_name)
  ORDER BY d.start_time DESC
  LIMIT p_limit;
END;
$$;