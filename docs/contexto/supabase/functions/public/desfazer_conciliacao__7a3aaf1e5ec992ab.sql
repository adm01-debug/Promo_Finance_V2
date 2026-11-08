CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    DELETE FROM public.conciliacoes
    WHERE id = p_conciliacao_id;

    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias SET status = 'pendente' WHERE id = p_transacao_id;
    END IF;
END;
$function$
