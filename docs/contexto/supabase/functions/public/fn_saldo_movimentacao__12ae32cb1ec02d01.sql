CREATE OR REPLACE FUNCTION public.fn_saldo_movimentacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mudou boolean;
  v_recontab boolean := false;
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
    -- Estorno/ajuste contábil: o gatilho contábil só reage a INSERT — sem
    -- este passo o valor volta à conta mas a receita/despesa fica
    -- confirmada no razão. A contabilização automática grava origem
    -- 'movimentacao'; 'financeiro_movimentacao' é a origem legada. Só
    -- lançamentos 'confirmado' são estornados ('rascunho' continua
    -- rascunho, 'cancelado' continua cancelado) e a marca no histórico
    -- identifica o que ESTA rotina cancelou — assim a restauração
    -- reconfirma apenas esses, sem promover rascunho incompleto nem
    -- ressuscitar cancelamento manual. Falha aqui nunca bloqueia a
    -- movimentação: vai para eventos_contabilizacao_log.
    BEGIN
      v_mudou := (OLD.valor, OLD.tipo, OLD.data_movimentacao::date, OLD.empresa_id,
                  OLD.conta_pagar_id, OLD.conta_receber_id, OLD.transferencia_id, OLD.origem)
                 IS DISTINCT FROM
                 (NEW.valor, NEW.tipo, NEW.data_movimentacao::date, NEW.empresa_id,
                  NEW.conta_pagar_id, NEW.conta_receber_id, NEW.transferencia_id, NEW.origem);

      IF NEW.deleted_at IS NOT NULL
         AND (OLD.deleted_at IS NULL OR OLD.deleted_at < '2026-10-31 20:51:34.260216+00'::timestamptz) THEN
        UPDATE public.lancamentos_contabeis
           SET status = 'cancelado',
               historico = historico || ' [estornado pela exclusão da movimentação]'
         WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
           AND origem_id = NEW.id
           AND status = 'confirmado';
      ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL AND NOT v_mudou THEN
        UPDATE public.lancamentos_contabeis
           SET status = 'confirmado',
               historico = replace(historico, ' [estornado pela exclusão da movimentação]', '')
         WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
           AND origem_id = NEW.id
           AND status = 'cancelado'
           AND historico LIKE '%[estornado pela exclusão da movimentação]%';
        -- Nada a reconfirmar porque a exclusão veio junto com alteração (a
        -- marca virou de substituição): recontabiliza se TODO lançamento
        -- automático dela foi substituído — rascunho ou cancelamento manual
        -- (sem marca) do contador continuam prevalecendo.
        v_recontab := NOT FOUND
          AND EXISTS (SELECT 1 FROM public.lancamentos_contabeis
                       WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
                         AND origem_id = NEW.id)
          AND NOT EXISTS (SELECT 1 FROM public.lancamentos_contabeis
                           WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
                             AND origem_id = NEW.id
                             AND (status IS DISTINCT FROM 'cancelado'
                                  OR COALESCE(historico, '') NOT LIKE '%[substituído pela alteração da movimentação]%'));
      ELSIF NEW.deleted_at IS NULL AND v_mudou THEN
        -- Origem legada incluida (correcao da #340): os ramos de exclusao ja
        -- estornavam as duas origens; sem isto um lancamento
        -- 'financeiro_movimentacao' seguia confirmado com os valores antigos.
        UPDATE public.lancamentos_contabeis
           SET status = 'cancelado',
               historico = historico || ' [substituído pela alteração da movimentação]'
         WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
           AND origem_id = NEW.id
           AND status = 'confirmado';
        v_recontab := FOUND;
        -- Retentativa (correcao da #340): se a recontabilizacao anterior
        -- devolveu 'sem_regra' ou 'erro', sobrou so lancamento cancelado com a
        -- marca de substituicao e o UPDATE acima nao encontra 'confirmado'.
        -- Sem este ramo a movimentacao ativa ficava fora do balancete para
        -- sempre, mesmo depois de a regra ser corrigida. So reabre quando TODO
        -- lancamento automatico dela foi cancelado por esta rotina: rascunho e
        -- cancelamento manual do contador (sem marca) seguem prevalecendo.
        IF NOT v_recontab THEN
          v_recontab := EXISTS (SELECT 1 FROM public.lancamentos_contabeis
                                 WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
                                   AND origem_id = NEW.id)
            AND NOT EXISTS (SELECT 1 FROM public.lancamentos_contabeis
                             WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
                               AND origem_id = NEW.id
                               AND (status IS DISTINCT FROM 'cancelado'
                                    OR COALESCE(historico, '') NOT LIKE '%[substituído pela alteração da movimentação]%'));
        END IF;
      END IF;

      -- Alterada junto com/depois da exclusão: o lançamento estornado não
      -- reflete mais a movimentação — troca a marca para que a restauração
      -- recontabilize em vez de reconfirmar valores antigos.
      IF v_mudou THEN
        UPDATE public.lancamentos_contabeis
           SET historico = replace(historico, ' [estornado pela exclusão da movimentação]',
                                   ' [substituído pela alteração da movimentação]')
         WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
           AND origem_id = NEW.id
           AND status = 'cancelado'
           AND historico LIKE '%[estornado pela exclusão da movimentação]%';
        v_recontab := v_recontab OR FOUND;
      END IF;

      -- Recontabiliza só quem já tinha lançamento automático substituído
      -- (contabilizar_movimentacao_registro ignora excluída/transferência e
      -- é idempotente sobre lançamento vigente).
      IF v_recontab AND NEW.deleted_at IS NULL THEN
        PERFORM public.contabilizar_movimentacao_registro(NEW);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.eventos_contabilizacao_log
        (empresa_id, tipo_evento, evento, evento_id, status, detalhe)
      VALUES (NEW.empresa_id, 'movimentacao', 'movimentacao.alterada', NEW.id,
              'erro', left(SQLERRM, 500));
    END;
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
    -- Exclusão física: estorna o lançamento ainda vigente (o soft-delete
    -- prévio já o teria cancelado; aí não há 'confirmado' e nada muda).
    BEGIN
      UPDATE public.lancamentos_contabeis
         SET status = 'cancelado',
             historico = historico || ' [estornado pela exclusão da movimentação]'
       WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
         AND origem_id = OLD.id
         AND status = 'confirmado';
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.eventos_contabilizacao_log
        (empresa_id, tipo_evento, evento, evento_id, status, detalhe)
      VALUES (OLD.empresa_id, 'movimentacao', 'movimentacao.excluida', OLD.id,
              'erro', left(SQLERRM, 500));
    END;
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
