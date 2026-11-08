CREATE OR REPLACE FUNCTION private.empresa_da_entidade_financeira(_tipo text, _entidade uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _tipo IN ('contas_pagar', 'conta_pagar') THEN
      (SELECT cp.empresa_id FROM public.contas_pagar cp WHERE cp.id = _entidade)
    WHEN _tipo IN ('contas_receber', 'conta_receber') THEN
      (SELECT cr.empresa_id FROM public.contas_receber cr WHERE cr.id = _entidade)
    WHEN _tipo IN ('movimentacoes', 'movimentacao') THEN
      (SELECT mv.empresa_id FROM public.movimentacoes mv WHERE mv.id = _entidade)
  END;
$function$
