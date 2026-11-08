CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_user_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric, p_metadados jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_linhas integer;
BEGIN
  PERFORM public.confirmar_conciliacao_manual(
    p_transacao_id,
    p_user_id,
    p_conta_pagar_id,
    p_conta_receber_id,
    COALESCE(p_ajuste_centavos, 0)
  );

  IF p_metadados IS NULL OR p_metadados = '{}'::jsonb THEN
    RETURN;
  END IF;

  UPDATE public.transacoes_bancarias
     SET regra_id = COALESCE((p_metadados ->> 'regra_id')::uuid, regra_id),
         compensacao_valor = COALESCE(
           (p_metadados ->> 'compensacao_valor')::numeric, compensacao_valor
         ),
         compensacao_motivo = COALESCE(
           p_metadados ->> 'compensacao_motivo', compensacao_motivo
         ),
         compensacao_classificacao = COALESCE(
           p_metadados ->> 'compensacao_classificacao', compensacao_classificacao
         ),
         compensacao_regra = COALESCE(
           p_metadados ->> 'compensacao_regra', compensacao_regra
         ),
         compensacao_evidencia_url = COALESCE(
           p_metadados ->> 'compensacao_evidencia_url', compensacao_evidencia_url
         )
   WHERE id = p_transacao_id;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> 1 THEN
    RAISE EXCEPTION 'transacao_nao_atualizada' USING ERRCODE = 'P0002';
  END IF;
END
$function$
