CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
  p_transacao_id uuid, 
  p_conta_pagar_id uuid DEFAULT NULL::uuid, 
  p_conta_receber_id uuid DEFAULT NULL::uuid,
  p_ajuste_centavos numeric DEFAULT 0
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_valor_transacao numeric;
BEGIN
  -- Obter valor da transação
  SELECT ABS(valor) INTO v_valor_transacao FROM public.transacoes_bancarias WHERE id = p_transacao_id;

  -- Atualizar a transação bancária como conciliada
  UPDATE public.transacoes_bancarias
  SET 
    conciliada = true,
    conciliada_em = now(),
    conciliada_por = auth.uid(),
    conta_pagar_id = COALESCE(p_conta_pagar_id, conta_pagar_id),
    conta_receber_id = COALESCE(p_conta_receber_id, conta_receber_id),
    valor_conciliado = v_valor_transacao
  WHERE id = p_transacao_id;

  -- Se vinculado a conta a pagar, atualizar status e registrar ajuste
  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
    SET 
      status = 'pago', 
      data_pagamento = CURRENT_DATE,
      -- Se p_ajuste_centavos for positivo, é juros. Se negativo, desconto.
      juros = CASE WHEN p_ajuste_centavos > 0 THEN juros + p_ajuste_centavos ELSE juros END,
      desconto = CASE WHEN p_ajuste_centavos < 0 THEN desconto + ABS(p_ajuste_centavos) ELSE desconto END
    WHERE id = p_conta_pagar_id;
  END IF;

  -- Se vinculado a conta a receber, atualizar status e registrar ajuste
  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
    SET 
      status = 'pago', 
      data_recebimento = CURRENT_DATE,
      juros = CASE WHEN p_ajuste_centavos > 0 THEN juros + p_ajuste_centavos ELSE juros END,
      desconto = CASE WHEN p_ajuste_centavos < 0 THEN desconto + ABS(p_ajuste_centavos) ELSE desconto END
    WHERE id = p_conta_receber_id;
  END IF;
END;
$function$;