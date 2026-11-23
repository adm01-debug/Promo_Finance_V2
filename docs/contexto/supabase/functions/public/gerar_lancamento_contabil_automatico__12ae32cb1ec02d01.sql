CREATE OR REPLACE FUNCTION public.gerar_lancamento_contabil_automatico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_lancamento_id uuid;
    v_conta_contabil_id uuid;
    v_conta_bancaria_contabil_id uuid;
    v_empresa_id uuid;
    v_historico text;
BEGIN
    -- Transferência interna não é receita/despesa: sai daqui antes de
    -- criar qualquer lançamento.
    IF NEW.origem = 'transferencia' THEN
        RETURN NEW;
    END IF;

    v_empresa_id := NEW.empresa_id;
    v_historico := 'Lançamento Automático: ' || COALESCE(NEW.descricao, 'Movimentação ' || NEW.id);

    -- 1. Resolve as contrapartidas ANTES do cabeçalho: sem as duas pontas
    -- o lançamento sairia 'confirmado' com uma partida só e desequilibraria
    -- o balancete — sai como 'rascunho' até a conta de despesa existir
    -- (saída externa de transferência não carrega categoria_id).
    -- Busca a conta contábil vinculada à categoria da movimentação
    -- Se não houver categoria direta, tenta buscar via plano_conta_id da movimentação
    -- to_jsonb: categoria_id/plano_conta_id existem no schema versionado mas
    -- não no canônico de prod (types.ts) — sem a leitura defensiva qualquer
    -- INSERT em movimentacoes quebraria com "record NEW has no field" num
    -- banco onde essas colunas nunca existiram.
    SELECT COALESCE(
        (SELECT plano_conta_id FROM public.categorias WHERE id = (to_jsonb(NEW)->>'categoria_id')::uuid),
        (to_jsonb(NEW)->>'plano_conta_id')::uuid
    ) INTO v_conta_contabil_id;

    -- Busca a conta contábil vinculada à conta bancária (Ativo Circulante - Disponibilidades)
    SELECT plano_conta_id INTO v_conta_bancaria_contabil_id
    FROM public.contas_bancarias
    WHERE id = NEW.conta_bancaria_id;

    -- Se não encontrar conta bancária vinculada, usa uma conta padrão de 'Caixa/Bancos' se existir
    IF v_conta_bancaria_contabil_id IS NULL THEN
        SELECT id INTO v_conta_bancaria_contabil_id
        FROM public.plano_contas
        WHERE empresa_id = v_empresa_id AND (codigo LIKE '1.1.1%' OR descricao ILIKE '%Banco%')
        LIMIT 1;
    END IF;

    -- 2. Cria o cabeçalho — 'rascunho' quando falta contrapartida (partida
    -- única não é lançamento balanceado e não pode confirmar no razão).
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

    -- 4. Cria as partidas dobradas (Débito e Crédito) — só quando as duas
    -- contrapartidas foram resolvidas (lançamento 'confirmado'). Um
    -- 'rascunho' com partida única entra nos demonstrativos (que somam
    -- partidas_contabeis sem filtrar status) e desequilibra o balanço.
    IF NEW.tipo = 'entrada' AND v_conta_contabil_id IS NOT NULL AND v_conta_bancaria_contabil_id IS NOT NULL THEN
        -- Entrada de dinheiro: Débito no Banco, Crédito na Categoria (Receita)
        -- Partida 1: Débito (D) no Banco
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'D', NEW.valor, 'Entrada em conta bancária');
        END IF;

        -- Partida 2: Crédito (C) na Conta de Receita/Recebível
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'C', NEW.valor, 'Receita reconhecida');
        END IF;

    ELSIF NEW.tipo = 'saida' AND v_conta_contabil_id IS NOT NULL AND v_conta_bancaria_contabil_id IS NOT NULL THEN
        -- Saída de dinheiro: Débito na Categoria (Despesa), Crédito no Banco
        -- Partida 1: Débito (D) na Conta de Despesa/Pagar
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'D', NEW.valor, 'Despesa reconhecida');
        END IF;

        -- Partida 2: Crédito (C) no Banco
        -- Correção sobre o corpo original: creditava a categoria, D e C
        -- ficavam na mesma conta e o razão bancário nunca caía.
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'C', NEW.valor, 'Saída de conta bancária');
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
