CREATE OR REPLACE FUNCTION public.delete_cron_job(job_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
DECLARE
  v_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem remover tarefas agendadas';
  END IF;

  SELECT jobname INTO v_name FROM cron.job WHERE jobid = job_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Tarefa agendada % não encontrada', job_id;
  END IF;

  PERFORM cron.unschedule(v_name);
  RETURN true;
END;
$function$
