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
  -- leituras defensivas via to_jsonb: funcionam com ou sem as colunas
  -- legadas/renomeadas no banco de destino.
  v_origem := COALESCE(
    NEW.conta_origem_id,
    (to_jsonb(NEW) ->> 'conta_bancaria_id')::uuid
  );
  v_destino := NEW.conta_destino_id;
  v_autor := COALESCE(
    (to_jsonb(NEW) ->> 'created_by')::uuid,
    (to_jsonb(NEW) ->> 'user_id')::uuid
  );

  -- 'concluido' cobre o estado de drift do schema alternativo.
  IF TG_OP = 'INSERT' AND NEW.status IN ('realizado', 'concluido') THEN
    -- Defesa cross-tenant: a policy de INSERT em transferencias valida só o
    -- papel do usuário; sem esta checagem um cliente poderia apontar
    -- conta_origem_id/conta_destino_id de OUTRA empresa e o gatilho
    -- SECURITY DEFINER mexeria no saldo dela ignorando a RLS.
    IF v_origem IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_origem AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
    THEN
      RAISE EXCEPTION 'conta de origem deve pertencer à mesma empresa da transferência';
    END IF;

    -- Saídas externas (pix/ted/boleto_pagamento) usam favorecido externo e
    -- deixam conta_destino_id NULL — a tabela os representa com destino
    -- opcional. O destino interno só é validado quando informado;
    -- exigi-lo abortaria toda transferência externa, que antes criava
    -- apenas a movimentação de saída.
    IF v_destino IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_destino AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
    THEN
      RAISE EXCEPTION 'conta de destino deve pertencer à mesma empresa da transferência';
    END IF;

    -- Defesa cross-tenant 2: o próprio empresa_id é forjável — a policy de
    -- INSERT valida só papel. Quando a chamada é de usuário autenticado
    -- (PostgREST), exige que a empresa seja acessível a ele OU que ele seja
    -- admin global (mesma exceção da policy "Empresa-based access" de
    -- transferencias). Service role / migrations (auth.uid() IS NULL) não
    -- passam por essa porta e seguem livres.
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

    -- destino NULL = saída para favorecido externo: marcador próprio para
    -- não sumir dos totais nem do razão (ver seção 5).
    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_origem, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor,
            CASE WHEN v_destino IS NULL THEN 'transferencia_externa' ELSE 'transferencia' END)
    RETURNING id INTO v_mov_saida_id;

    -- Destino interno ausente = saída externa (pix/ted/boleto_pagamento):
    -- só a saída é gravada, como no regime anterior.
    IF v_destino IS NOT NULL THEN
      INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
      VALUES (NEW.empresa_id, v_destino, 'entrada', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor, 'transferencia');
    END IF;

    UPDATE transferencias SET movimentacao_id = v_mov_saida_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status IN ('realizado', 'concluido') THEN
    -- Estorna o lançamento da saída externa ANTES de remover a movimentação:
    -- lancamentos_contabeis referencia a movimentação por origem_id sem FK
    -- em cascata e o gatilho contábil só reage a INSERT — sem este passo a
    -- despesa e o crédito bancário ficariam confirmados no razão após o
    -- cancelamento.
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
