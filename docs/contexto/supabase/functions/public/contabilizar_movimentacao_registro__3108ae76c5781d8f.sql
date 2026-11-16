CREATE OR REPLACE FUNCTION public.contabilizar_movimentacao_registro(m movimentacoes)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
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
  -- A origem legada entra aqui (correcao da #340): um lancamento
  -- 'financeiro_movimentacao' ainda vigente tambem impede um segundo
  -- lancamento para a mesma movimentacao.
  IF EXISTS (SELECT 1 FROM public.lancamentos_contabeis
              WHERE origem IN ('movimentacao', 'financeiro_movimentacao')
                AND origem_id = m.id
                AND status IS DISTINCT FROM 'cancelado') THEN
    RETURN 'duplicado';
  END IF;

  BEGIN
    -- Escopo por empresa (correcao da #340): sem o filtro, mover a
    -- movimentacao para outra empresa mantendo conta_pagar_id/conta_receber_id
    -- copiava a categoria -- e logo o plano_conta_id -- do tenant anterior para
    -- uma partida declarada na empresa nova. trg_sync_valor_pago nao dispara
    -- nesse UPDATE (seu UPDATE OF nao inclui empresa_id nem conta_bancaria_id),
    -- portanto o vinculo cruzado chega aqui intacto.
    SELECT COALESCE(
             (SELECT categoria_id FROM public.contas_pagar
               WHERE id = m.conta_pagar_id AND empresa_id = m.empresa_id),
             (SELECT categoria_id FROM public.contas_receber
               WHERE id = m.conta_receber_id AND empresa_id = m.empresa_id))
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
      SELECT plano_conta_id INTO v_conta_cat FROM public.categorias
        WHERE id = v_categoria AND empresa_id = m.empresa_id;
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
    -- empresa_id e created_at tambem (correcao da #340): sem empresa_id o log
    -- guardava a empresa ANTIGA junto dos identificadores contabeis da NOVA, e
    -- eventos_contab_select autoriza leitura por empresa_acessivel(empresa_id)
    -- -- usuarios do tenant anterior enxergariam lancamento_id/regra_id do
    -- tenant novo, e o sucesso nao apareceria para a empresa de destino. Sem
    -- created_at a recontabilizacao herdava a data do primeiro sucesso e podia
    -- nao entrar nos 50 registros mais recentes de useContabilizacaoQueries.
    DO UPDATE SET empresa_id = EXCLUDED.empresa_id,
                  lancamento_id = EXCLUDED.lancamento_id,
                  regra_id = EXCLUDED.regra_id,
                  created_at = now(),
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
$function$
