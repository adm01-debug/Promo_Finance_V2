-- Função para gerar lançamentos contábeis automáticos
CREATE OR REPLACE FUNCTION public.gerar_lancamento_contabil_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_lancamento_id uuid;
    v_conta_contabil_id uuid;
    v_conta_bancaria_contabil_id uuid;
    v_empresa_id uuid;
    v_historico text;
BEGIN
    v_empresa_id := NEW.empresa_id;
    v_historico := 'Lançamento Automático: ' || COALESCE(NEW.descricao, 'Movimentação ' || NEW.id);

    -- 1. Cria o cabeçalho do lançamento contábil
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
        'confirmado'
    ) RETURNING id INTO v_lancamento_id;

    -- 2. Busca a conta contábil vinculada à categoria da movimentação
    -- Se não houver categoria direta, tenta buscar via plano_conta_id da movimentação
    SELECT COALESCE(
        (SELECT plano_conta_id FROM public.categorias WHERE id = NEW.categoria_id),
        NEW.plano_conta_id
    ) INTO v_conta_contabil_id;

    -- 3. Busca a conta contábil vinculada à conta bancária (Ativo Circulante - Disponibilidades)
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

    -- 4. Cria as partidas dobradas (Débito e Crédito)
    IF NEW.tipo = 'entrada' THEN
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
        
    ELSIF NEW.tipo = 'saida' THEN
        -- Saída de dinheiro: Débito na Categoria (Despesa), Crédito no Banco
        -- Partida 1: Débito (D) na Conta de Despesa/Pagar
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'D', NEW.valor, 'Despesa reconhecida');
        END IF;

        -- Partida 2: Crédito (C) no Banco
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'C', NEW.valor, 'Saída de conta bancária');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para Movimentações
DROP TRIGGER IF EXISTS trigger_gerar_contabilidade ON public.movimentacoes;
CREATE TRIGGER trigger_gerar_contabilidade
AFTER INSERT ON public.movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.gerar_lancamento_contabil_automatico();
