CREATE OR REPLACE FUNCTION public.get_cron_jobs()
 RETURNS TABLE(jobid bigint, schedule text, command text, nodename text, nodeport integer, database text, username text, active boolean, jobname text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Verifica se o usuário é admin
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar automações.';
  END IF;

  -- Retorna da tabela cron.job
  RETURN QUERY SELECT * FROM cron.job;
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$function$
