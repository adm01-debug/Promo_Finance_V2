CREATE OR REPLACE FUNCTION public.gerar_lancamento_contabil_automatico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
    v_lancamento_id uuid;
    v_conta_contabil_id uuid;
    v_conta_bancaria_contabil_id uuid;
    v_empresa_id uuid;
    v_historico text;
BEGIN
    IF NEW.origem = 'transferencia' THEN
        RETURN NEW;
    END IF;

    v_empresa_id := NEW.empresa_id;
    v_historico := 'Lançamento Automático: ' || COALESCE(NEW.descricao, 'Movimentação ' || NEW.id);

    SELECT COALESCE(
        (SELECT plano_conta_id FROM public.categorias WHERE id = (to_jsonb(NEW)->>'categoria_id')::uuid),
        (to_jsonb(NEW)->>'plano_conta_id')::uuid
    ) INTO v_conta_contabil_id;

    SELECT plano_conta_id INTO v_conta_bancaria_contabil_id
    FROM public.contas_bancarias
    WHERE id = NEW.conta_bancaria_id;

    IF v_conta_bancaria_contabil_id IS NULL THEN
        SELECT id INTO v_conta_bancaria_contabil_id
        FROM public.plano_contas
        WHERE empresa_id = v_empresa_id AND (codigo LIKE '1.1.1%' OR descricao ILIKE '%Banco%')
        LIMIT 1;
    END IF;

    INSERT INTO public.lancamentos_contabeis (
        empresa_id,
        data_lancamento,
        historico,
        origem,
        origem_id,
        valor_total,
        status
    ) VALUES (
        v_empresa_id,
        NEW.data_movimentacao,
        v_historico,
        'financeiro_movimentacao',
        NEW.id,
        NEW.valor,
        CASE WHEN v_conta_contabil_id IS NOT NULL AND v_conta_bancaria_contabil_id IS NOT NULL
             THEN 'confirmado' ELSE 'rascunho' END
    ) RETURNING id INTO v_lancamento_id;

    IF NEW.tipo = 'entrada' AND v_conta_contabil_id IS NOT NULL AND v_conta_bancaria_contabil_id IS NOT NULL THEN
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'D', NEW.valor, 'Entrada em conta bancária');
        END IF;
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'C', NEW.valor, 'Receita reconhecida');
        END IF;
    ELSIF NEW.tipo = 'saida' AND v_conta_contabil_id IS NOT NULL AND v_conta_bancaria_contabil_id IS NOT NULL THEN
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'D', NEW.valor, 'Despesa reconhecida');
        END IF;
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'C', NEW.valor, 'Saída de conta bancária');
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
