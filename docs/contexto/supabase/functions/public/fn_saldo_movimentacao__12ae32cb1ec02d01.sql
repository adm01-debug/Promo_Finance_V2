CREATE OR REPLACE FUNCTION public.fn_saldo_movimentacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- conta_bancaria_id é forjável via PostgREST (a policy de movimentacoes
  -- valida só o empresa_id da própria linha) e este gatilho é SECURITY
  -- DEFINER: sem esta rejeição, uma movimentação apontando para conta de
  -- OUTRO tenant passaria a constar nos totais e no lançamento contábil
  -- sem ter movido saldo algum (o UPDATE escopado abaixo só afetaria 0
  -- linhas). Abortar a escrita é o único comportamento consistente.
  -- IS NOT DISTINCT FROM preserva o par NULL↔NULL de dados legados.
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE')
     AND NEW.conta_bancaria_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM contas_bancarias cb
       WHERE cb.id = NEW.conta_bancaria_id
         AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
     )
  THEN
    RAISE EXCEPTION 'conta_bancaria_id deve pertencer à mesma empresa da movimentação';
  END IF;

  -- Só linhas ativas (deleted_at IS NULL) movem saldo: exclusão lógica
  -- (useDeleteMovimentacao preenche deleted_at) equivale a estorno.
  IF TG_OP = 'UPDATE' THEN
    -- reverte o efeito da versão anterior quando ela contribuía ao saldo:
    -- ativa (deleted_at NULL) OU soft-deletada antes do corte (o gatilho
    -- anterior não observava UPDATE de deleted_at, logo o efeito segue no
    -- saldo — restaurar uma linha legada sem esta reversão o duplicaria).
    IF (OLD.deleted_at IS NULL OR OLD.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF (OLD.deleted_at IS NULL OR OLD.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    END IF;
    -- reaplica o efeito da versão nova enquanto ela contribuir ao saldo
    IF (NEW.deleted_at IS NULL OR NEW.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) AND NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
        WHERE id = NEW.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
    ELSIF (NEW.deleted_at IS NULL OR NEW.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) AND NEW.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
        WHERE id = NEW.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
    END IF;
    -- Estorno contábil do soft-delete: o gatilho contábil só reage a
    -- INSERT — sem este passo o valor volta à conta mas a receita/despesa
    -- fica confirmada no razão. Só lançamentos 'confirmado' são estornados
    -- ('rascunho' continua rascunho, 'cancelado' continua cancelado) e a
    -- marca no histórico identifica o que ESTA transição cancelou —
    -- assim a restauração reconfirma apenas esses, sem promover rascunho
    -- incompleto nem ressuscitar cancelamento anterior.
    IF NEW.deleted_at IS NOT NULL
       AND (OLD.deleted_at IS NULL OR OLD.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) THEN
      UPDATE public.lancamentos_contabeis
         SET status = 'cancelado',
             historico = historico || ' [estornado pela exclusão da movimentação]'
       WHERE origem = 'financeiro_movimentacao'
         AND origem_id = NEW.id
         AND status = 'confirmado';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE public.lancamentos_contabeis
         SET status = 'confirmado',
             historico = replace(historico, ' [estornado pela exclusão da movimentação]', '')
       WHERE origem = 'financeiro_movimentacao'
         AND origem_id = NEW.id
         AND status = 'cancelado'
         AND historico LIKE '%[estornado pela exclusão da movimentação]%';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- Reversão quando a linha estava ativa OU quando o soft-delete é mais
    -- antigo que este gatilho (o literal embutido = instante da migration): o regime
    -- anterior não observava UPDATE de deleted_at, então essas linhas
    -- nunca estornaram o efeito — sem a reversão o débito ficaria preso
    -- para sempre (p.ex. cancelamento de transferência que remove o par).
    IF (OLD.deleted_at IS NULL OR OLD.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF (OLD.deleted_at IS NULL OR OLD.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    END IF;
    RETURN OLD;
  END IF;

  -- INSERT
  IF NEW.deleted_at IS NULL AND NEW.tipo = 'entrada' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
      WHERE id = NEW.conta_bancaria_id
        AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
  ELSIF NEW.deleted_at IS NULL AND NEW.tipo = 'saida' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
      WHERE id = NEW.conta_bancaria_id
        AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$function$
