CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid DEFAULT NULL::uuid, p_conta_pagar_id uuid DEFAULT NULL::uuid, p_conta_receber_id uuid DEFAULT NULL::uuid, p_ajuste_centavos numeric DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  UPDATE public.conciliacoes
     SET status = 'confirmado'
   WHERE id = p_conciliacao_id;

  IF p_transacao_id IS NOT NULL THEN
    UPDATE public.transacoes_bancarias
       SET status = 'conciliado',
           conciliada = true,
           data_confirmacao = now(),
           confirmado_por = p_user_id
     WHERE id = p_transacao_id;
  END IF;

  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
       SET status = 'pago',
           data_pagamento = now(),
           valor_pago = valor + p_ajuste_centavos
     WHERE id = p_conta_pagar_id;
  END IF;

  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
       SET status = 'recebido',
           data_recebimento = now(),
           valor_recebido = valor + p_ajuste_centavos
     WHERE id = p_conta_receber_id;
  END IF;
END
$function$
