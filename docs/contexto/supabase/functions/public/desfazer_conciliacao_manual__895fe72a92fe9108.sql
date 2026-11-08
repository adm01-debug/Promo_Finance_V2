CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM public.desfazer_conciliacao_manual(p_transacao_id, auth.uid());
END
$function$
