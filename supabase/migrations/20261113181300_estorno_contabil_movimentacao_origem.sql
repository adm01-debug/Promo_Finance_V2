-- Estorno/ajuste contábil de movimentação excluída ou alterada.
--
-- Causa: a contabilização automática (#316/#317,
-- contabilizar_movimentacao_registro — 20261112024013_contabilizacao_conta_da_categoria.sql)
-- grava lancamentos_contabeis com origem = 'movimentacao', mas o estorno do
-- soft-delete em fn_saldo_movimentacao procura origem = 'financeiro_movimentacao'
-- (20261027120000_transferencias_movimentacao_bilateral.sql:172-187), que não
-- existe em produção. Resultado: excluir (deleted_at ou DELETE) ou alterar
-- valor/tipo/data/conta de origem de uma movimentação devolvia o saldo à conta
-- bancária mas deixava a receita/despesa 'confirmado' no razão (balancete).
-- Além disso, a idempotência de contabilizar_movimentacao_registro contava
-- lançamentos cancelados, e o log de sucesso (uq_eventos_contab_sucesso: 1
-- 'sucesso' por movimentação) faria a recontabilização cair em 'erro'.
--
-- Efeito:
--   * exclusão lógica: cancela o lançamento vigente ('confirmado') das duas
--     origens com a marca ' [estornado pela exclusão da movimentação]';
--     restauração sem alteração reconfirma só os marcados (regra anterior);
--   * DELETE físico: cancela o lançamento vigente com a mesma marca;
--   * alteração de valor/tipo/data/empresa/conta a pagar/receber/transferência/origem
--     em movimentação ativa: cancela o vigente com a marca
--     ' [substituído pela alteração da movimentação]' e recontabiliza com os
--     valores novos; se alterada enquanto excluída, a marca de exclusão vira de
--     substituição (a restauração recontabiliza em vez de reconfirmar o antigo);
--   * só recontabiliza quem já tinha lançamento automático (nada de backfill
--     de movimentações antigas por edição) e nunca sobrepõe cancelamento
--     manual do contador (sem marca);
--   * nunca bloqueia a movimentação: falha contábil vai para
--     eventos_contabilizacao_log (status 'erro'), como na contabilização.
-- fn_balancete já ignora status 'cancelado'.

CREATE OR REPLACE FUNCTION public.contabilizar_movimentacao_registro(m public.movimentacoes)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_categoria uuid;
  v_regra public.regras_contabilizacao_automatica%ROWTYPE;
  v_lanc uuid;
  v_hist text;
  v_conta_cat uuid;
  v_deb uuid;
  v_cred uuid;
BEGIN
  IF m.deleted_at IS NOT NULL OR m.transferencia_id IS NOT NULL
     OR m.origem = 'transferencia' OR m.empresa_id IS NULL
     OR COALESCE(m.valor, 0) <= 0 THEN
    RETURN 'ignorada';
  END IF;

  -- Idempotência: uma movimentação gera no máximo um lançamento VIGENTE.
  -- Lançamento 'cancelado' (estorno da exclusão ou substituição por
  -- alteração em fn_saldo_movimentacao) não bloqueia a recontabilização.
  IF EXISTS (SELECT 1 FROM public.lancamentos_contabeis
              WHERE origem = 'movimentacao' AND origem_id = m.id
                AND status IS DISTINCT FROM 'cancelado') THEN
    RETURN 'duplicado';
  END IF;

  BEGIN
    SELECT COALESCE(
             (SELECT categoria_id FROM public.contas_pagar   WHERE id = m.conta_pagar_id),
             (SELECT categoria_id FROM public.contas_receber WHERE id = m.conta_receber_id))
      INTO v_categoria;

    -- Regra mais específica primeiro: categoria igual > genérica; tipo
    -- (entrada/saida) igual > sem tipo; depois prioridade.
    SELECT * INTO v_regra
      FROM public.regras_contabilizacao_automatica r
     WHERE r.empresa_id = m.empresa_id AND r.tipo_evento = 'movimentacao' AND r.ativo
       AND (r.categoria_id = v_categoria OR r.categoria_id IS NULL)
       AND (NULLIF(r.condicoes->>'tipo', '') IS NULL OR r.condicoes->>'tipo' = m.tipo)
     ORDER BY (r.categoria_id IS NOT NULL) DESC,
              (NULLIF(r.condicoes->>'tipo', '') IS NOT NULL) DESC,
              r.prioridade ASC NULLS LAST, r.created_at
     LIMIT 1;

    IF NOT FOUND THEN
      INSERT INTO public.eventos_contabilizacao_log
        (empresa_id, tipo_evento, evento, evento_id, status, detalhe)
      VALUES (m.empresa_id, 'movimentacao', 'movimentacao.criada', m.id,
              'sem_regra', 'Nenhuma regra ativa encontrada');
      RETURN 'sem_regra';
    END IF;

    -- Regra genérica + categoria com conta contábil: o lado de resultado usa a
    -- conta da categoria (saída -> débito; entrada -> crédito).
    v_deb := v_regra.conta_debito_id;
    v_cred := v_regra.conta_credito_id;
    IF v_regra.categoria_id IS NULL AND v_categoria IS NOT NULL THEN
      SELECT plano_conta_id INTO v_conta_cat FROM public.categorias WHERE id = v_categoria;
      IF v_conta_cat IS NOT NULL THEN
        IF m.tipo = 'saida' THEN v_deb := v_conta_cat;
        ELSIF m.tipo = 'entrada' THEN v_cred := v_conta_cat;
        END IF;
      END IF;
    END IF;

    v_hist := replace(replace(replace(v_regra.historico_template,
                '{descricao}', COALESCE(m.descricao, '')),
                '{valor}', to_char(m.valor, 'FM999999999990.00')),
                '{data}', m.data_movimentacao::date::text);

    INSERT INTO public.lancamentos_contabeis
      (empresa_id, data_lancamento, historico, origem, origem_id, valor_total, status, created_by)
    VALUES (m.empresa_id, m.data_movimentacao::date, v_hist, 'movimentacao', m.id,
            m.valor, 'confirmado', m.created_by)
    RETURNING id INTO v_lanc;

    INSERT INTO public.partidas_contabeis
      (lancamento_id, empresa_id, conta_contabil_id, tipo, valor, historico_complementar, ordem)
    VALUES
      (v_lanc, m.empresa_id, v_deb,  'debito',  m.valor, v_hist, 1),
      (v_lanc, m.empresa_id, v_cred, 'credito', m.valor, v_hist, 2);

    INSERT INTO public.eventos_contabilizacao_log
      (empresa_id, tipo_evento, evento, evento_id, regra_id, lancamento_id, status)
    VALUES (m.empresa_id, 'movimentacao', 'movimentacao.criada', m.id,
            v_regra.id, v_lanc, 'sucesso')
    -- uq_eventos_contab_sucesso admite 1 'sucesso' por movimentação: na
    -- recontabilização o registro passa a apontar o lançamento vigente.
    ON CONFLICT (tipo_evento, evento_id) WHERE status = 'sucesso'
    DO UPDATE SET lancamento_id = EXCLUDED.lancamento_id,
                  regra_id = EXCLUDED.regra_id,
                  detalhe = 'recontabilizada após alteração/restauração da movimentação';
    RETURN 'sucesso';
  EXCEPTION WHEN OTHERS THEN
    -- Nunca bloquear a movimentação financeira por causa da contabilidade.
    INSERT INTO public.eventos_contabilizacao_log
      (empresa_id, tipo_evento, evento, evento_id, regra_id, status, detalhe)
    VALUES (m.empresa_id, 'movimentacao', 'movimentacao.criada', m.id,
            v_regra.id, 'erro', left(SQLERRM, 500));
    RETURN 'erro';
  END;
END;
$function$;

-- fn_saldo_movimentacao: mesmo corpo de 20261027120000 (corte legado lido do
-- COMMENT da função, estável entre reaplicações) + bloco contábil acima.
DO $cria_fn_saldo$
DECLARE
  v_corte text;
BEGIN
  SELECT obj_description(to_regprocedure('public.fn_saldo_movimentacao()')::oid, 'pg_proc')
    INTO v_corte;
  IF v_corte IS NULL OR v_corte !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN
    v_corte := statement_timestamp()::text;
  END IF;
  EXECUTE format($f$
CREATE OR REPLACE FUNCTION public.fn_saldo_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $body$
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
    IF (OLD.deleted_at IS NULL OR OLD.deleted_at < %1$L::timestamptz) AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF (OLD.deleted_at IS NULL OR OLD.deleted_at < %1$L::timestamptz) AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    END IF;
    -- reaplica o efeito da versão nova enquanto ela contribuir ao saldo
    IF (NEW.deleted_at IS NULL OR NEW.deleted_at < %1$L::timestamptz) AND NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
        WHERE id = NEW.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
    ELSIF (NEW.deleted_at IS NULL OR NEW.deleted_at < %1$L::timestamptz) AND NEW.tipo = 'saida' THEN
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
         AND (OLD.deleted_at IS NULL OR OLD.deleted_at < %1$L::timestamptz) THEN
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
           AND historico LIKE '%%[estornado pela exclusão da movimentação]%%';
        -- Nada a reconfirmar porque a exclusão veio junto com alteração (a
        -- marca virou de substituição): recontabiliza se TODO lançamento
        -- automático dela foi substituído — rascunho ou cancelamento manual
        -- (sem marca) do contador continuam prevalecendo.
        v_recontab := NOT FOUND
          AND EXISTS (SELECT 1 FROM public.lancamentos_contabeis
                       WHERE origem = 'movimentacao' AND origem_id = NEW.id)
          AND NOT EXISTS (SELECT 1 FROM public.lancamentos_contabeis
                           WHERE origem = 'movimentacao' AND origem_id = NEW.id
                             AND (status IS DISTINCT FROM 'cancelado'
                                  OR COALESCE(historico, '') NOT LIKE '%%[substituído pela alteração da movimentação]%%'));
      ELSIF NEW.deleted_at IS NULL AND v_mudou THEN
        UPDATE public.lancamentos_contabeis
           SET status = 'cancelado',
               historico = historico || ' [substituído pela alteração da movimentação]'
         WHERE origem = 'movimentacao'
           AND origem_id = NEW.id
           AND status = 'confirmado';
        v_recontab := FOUND;
      END IF;

      -- Alterada junto com/depois da exclusão: o lançamento estornado não
      -- reflete mais a movimentação — troca a marca para que a restauração
      -- recontabilize em vez de reconfirmar valores antigos.
      IF v_mudou THEN
        UPDATE public.lancamentos_contabeis
           SET historico = replace(historico, ' [estornado pela exclusão da movimentação]',
                                   ' [substituído pela alteração da movimentação]')
         WHERE origem = 'movimentacao'
           AND origem_id = NEW.id
           AND status = 'cancelado'
           AND historico LIKE '%%[estornado pela exclusão da movimentação]%%';
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
    IF (OLD.deleted_at IS NULL OR OLD.deleted_at < %1$L::timestamptz) AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF (OLD.deleted_at IS NULL OR OLD.deleted_at < %1$L::timestamptz) AND OLD.tipo = 'saida' THEN
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
$body$;
  $f$, v_corte);
  -- persiste o corte para reaplicações futuras
  EXECUTE format('COMMENT ON FUNCTION public.fn_saldo_movimentacao() IS %L', v_corte);
END
$cria_fn_saldo$;
