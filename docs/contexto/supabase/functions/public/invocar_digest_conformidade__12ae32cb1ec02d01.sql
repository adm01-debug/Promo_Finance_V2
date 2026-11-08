CREATE OR REPLACE FUNCTION public.invocar_digest_conformidade()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/enviar-digest-conformidade',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', public.chave_anon_vault(),
      'x-cron-secret', public.segredo_cron('conformidade_cron')
    ),
    body := jsonb_build_object('severidadeMinima', 'baixa', 'limite', 300),
    timeout_milliseconds := 30000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$function$
