-- Contabilização automática usa a conta contábil da categoria (quando a regra
-- é genérica) e as categorias da empresa 610db558 ganham conta no plano.

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

  -- Idempotência: uma movimentação gera no máximo um lançamento.
  IF EXISTS (SELECT 1 FROM public.lancamentos_contabeis
              WHERE origem = 'movimentacao' AND origem_id = m.id) THEN
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
            v_regra.id, v_lanc, 'sucesso');
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

REVOKE ALL ON FUNCTION public.contabilizar_movimentacao_registro(public.movimentacoes)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.contabilizar_movimentacao()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.contabilizar_movimentacao_registro(NEW);
  RETURN NULL;
END;
$function$;

UPDATE public.categorias c
   SET plano_conta_id = p.id
  FROM (VALUES
    ('Folha de Pagamento',       '4.03.01'),
    ('Fornecedores - Materiais', '4.01.01'),
    ('Impostos e Taxas',         '4.05.01'),
    ('Serviços de Terceiros',    '4.02.01'),
    ('Prestação de Serviços',    '3.01.01'),
    ('Recebimento de Juros',     '3.02.01'),
    ('Vendas de Produtos',       '3.01.01')
  ) AS map(nome, codigo)
  JOIN public.plano_contas p ON p.codigo = map.codigo
 WHERE c.nome = map.nome AND p.empresa_id = c.empresa_id AND c.plano_conta_id IS NULL;
-- (em ambientes sem esse plano de contas o UPDATE simplesmente não casa nenhuma linha)
