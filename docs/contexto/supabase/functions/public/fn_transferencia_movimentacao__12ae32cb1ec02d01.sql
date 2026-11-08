CREATE OR REPLACE FUNCTION public.fn_transferencia_movimentacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mov_saida_id UUID;
  v_origem UUID;
  v_destino UUID;
  v_autor UUID;
BEGIN
  v_origem := COALESCE(
    NEW.conta_origem_id,
    (to_jsonb(NEW) ->> 'conta_bancaria_id')::uuid
  );
  v_destino := NEW.conta_destino_id;
  v_autor := COALESCE(
    (to_jsonb(NEW) ->> 'created_by')::uuid,
    (to_jsonb(NEW) ->> 'user_id')::uuid
  );

  IF TG_OP = 'INSERT' AND NEW.status IN ('realizado', 'concluido') THEN
    IF v_origem IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_origem AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
    THEN
      RAISE EXCEPTION 'conta de origem deve pertencer à mesma empresa da transferência';
    END IF;

    IF v_destino IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_destino AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
    THEN
      RAISE EXCEPTION 'conta de destino deve pertencer à mesma empresa da transferência';
    END IF;

    IF auth.uid() IS NOT NULL
       AND to_regprocedure('public.empresa_acessivel(uuid)') IS NOT NULL
       AND NOT public.empresa_acessivel(NEW.empresa_id)
       AND NOT (
         to_regprocedure('public.has_role(uuid,app_role)') IS NOT NULL
         AND public.has_role(auth.uid(), 'admin'::app_role)
       )
    THEN
      RAISE EXCEPTION 'empresa_id deve pertencer a uma empresa acessível ao usuário';
    END IF;

    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_origem, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor,
            CASE WHEN v_destino IS NULL THEN 'transferencia_externa' ELSE 'transferencia' END)
    RETURNING id INTO v_mov_saida_id;

    IF v_destino IS NOT NULL THEN
      INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
      VALUES (NEW.empresa_id, v_destino, 'entrada', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor, 'transferencia');
    END IF;

    UPDATE transferencias SET movimentacao_id = v_mov_saida_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status IN ('realizado', 'concluido') THEN
    UPDATE public.lancamentos_contabeis
       SET status = 'cancelado'
     WHERE origem = 'financeiro_movimentacao'
       AND origem_id IN (
         SELECT id FROM public.movimentacoes WHERE transferencia_id = NEW.id
       )
       AND status IS DISTINCT FROM 'cancelado';
    DELETE FROM movimentacoes WHERE transferencia_id = NEW.id;
    UPDATE transferencias SET movimentacao_id = NULL WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$
