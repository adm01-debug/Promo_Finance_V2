CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_empresa uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cb.empresa_id
    INTO v_empresa
  FROM public.transacoes_bancarias tb
  JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
  WHERE tb.id = p_transacao_id;

  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'transacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_empresas ue
    WHERE ue.user_id = v_uid
      AND ue.empresa_id = v_empresa
      AND ue.ativo IS TRUE
  ) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transacoes_bancarias
     SET status = 'pendente',
         conciliada = false,
         data_confirmacao = NULL,
         confirmado_por = NULL
   WHERE id = p_transacao_id;

  UPDATE public.contas_receber
     SET transacao_conciliada_id = NULL,
         status = CASE
           WHEN data_vencimento < now()::date THEN 'vencido'
           ELSE 'pendente'
         END,
         updated_at = now()
   WHERE transacao_conciliada_id = p_transacao_id;
END
$function$
