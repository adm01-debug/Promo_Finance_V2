CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid DEFAULT NULL::uuid, p_conta_receber_id uuid DEFAULT NULL::uuid, p_ajuste_centavos numeric DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM public.confirmar_conciliacao_manual(
    p_transacao_id,
    auth.uid(),
    p_conta_pagar_id,
    p_conta_receber_id,
    p_ajuste_centavos
  );
END
$function$
