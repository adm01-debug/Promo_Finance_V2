-- Transferências: normalização aditiva do drift + movimentação bilateral
--
-- Contexto (auditoria TS-02/TS-05/TS-07 + Devin Review + Codex):
-- 1) O types.ts canônico mostra que em produção `movimentacoes` tem apenas
--    (id, empresa_id, tipo, descricao, valor, data_movimentacao, created_at,
--    deleted_at) — SEM conta_bancaria_id, origem, transferencia_id, created_by.
--    `transferencias` usa user_id/conta_origem_id, sem created_by/movimentacao_id.
-- 2) O trigger versionado fn_transferencia_movimentacao referencia colunas que
--    não existem nesse schema real e criava só a 'saida': o saldo do destino
--    nunca subia; em prod já renomeado, quebraria todo INSERT 'realizado'.
-- 3) Esta migration NORMALIZA de forma aditiva (AI_RULES: nada de RENAME/DROP
--    de coluna): acrescenta as colunas que o fluxo precisa, recria funções e
--    triggers com corpo conhecido — o resultado é determinístico em qualquer
--    um dos estados de drift possíveis.
-- 4) Os lançamentos usam origem='transferencia' e as agregações os excluem —
--    transferência interna movimenta saldo, não é receita nem despesa.
--
-- Idempotente: pode rodar em schema já normalizado sem efeito colateral.

-- 1) transferencias: colunas canônicas aditivas
ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS conta_origem_id UUID REFERENCES public.contas_bancarias(id);
ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS movimentacao_id UUID;

DO $$
BEGIN
  -- backfill a partir do nome legado quando ele ainda existe no banco
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_bancaria_id'
  ) THEN
    UPDATE public.transferencias
      SET conta_origem_id = conta_bancaria_id
      WHERE conta_origem_id IS NULL;
  END IF;
END $$;

-- 2) movimentacoes: colunas que o fluxo de transferência precisa
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS transferencia_id UUID;
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.movimentacoes
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';

-- 2a) Schema versionado cria created_by NOT NULL em contas_pagar/
--     contas_receber/notas_fiscais; o schema real de prod usa user_id e não
--     tem created_by. O frontend envia só user_id — num banco de replay a
--     restrição derrubaria todo INSERT. Normaliza: relaxa o NOT NULL onde
--     a coluna legada existir e dá DEFAULT auth.uid() para preservar a
--     autoria exibida pelas views (em prod é no-op).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contas_pagar'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.contas_pagar ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.contas_pagar ALTER COLUMN created_by SET DEFAULT auth.uid();
    -- preenche a coluna legada com o autor real quando o insert vier com user_id
    UPDATE public.contas_pagar SET created_by = user_id
      WHERE created_by IS NULL AND user_id IS NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contas_receber'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.contas_receber ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.contas_receber ALTER COLUMN created_by SET DEFAULT auth.uid();
    UPDATE public.contas_receber SET created_by = user_id
      WHERE created_by IS NULL AND user_id IS NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notas_fiscais'
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.notas_fiscais ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.notas_fiscais ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;

-- 3) Saldo: normaliza o gatilho que move contas_bancarias.saldo_atual.
--    DROP + CREATE garante corpo conhecido em qualquer estado de prod
--    (se uma versão quebrada existia, passa a funcionar; se estava OK,
--    fica equivalente). INSERT/UPDATE/DELETE mantêm o saldo consistente —
--    o cancelamento de transferência remove o par de movimentações, então
--    DELETE precisa reverter o efeito.
CREATE OR REPLACE FUNCTION public.fn_saldo_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só linhas ativas (deleted_at IS NULL) movem saldo: exclusão lógica
  -- (useDeleteMovimentacao preenche deleted_at) equivale a estorno.
  IF TG_OP = 'UPDATE' THEN
    -- reverte o efeito da versão anterior (se estava ativa)
    IF OLD.deleted_at IS NULL AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.deleted_at IS NULL AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    END IF;
    -- reaplica o efeito da versão nova (se ativa)
    IF NEW.deleted_at IS NULL AND NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
        WHERE id = NEW.conta_bancaria_id;
    ELSIF NEW.deleted_at IS NULL AND NEW.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
        WHERE id = NEW.conta_bancaria_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- reversão só se a linha deletada estava ativa (evita dupla reversão
    -- no hard-delete de uma linha já soft-deleted)
    IF OLD.deleted_at IS NULL AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.deleted_at IS NULL AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    END IF;
    RETURN OLD;
  END IF;

  -- INSERT
  IF NEW.deleted_at IS NULL AND NEW.tipo = 'entrada' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
      WHERE id = NEW.conta_bancaria_id;
  ELSIF NEW.deleted_at IS NULL AND NEW.tipo = 'saida' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
      WHERE id = NEW.conta_bancaria_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saldo_movimentacao ON public.movimentacoes;
CREATE TRIGGER trg_saldo_movimentacao
  AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_saldo_movimentacao();

-- 4) Trigger bilateral de transferência: 'saida' na origem + 'entrada' no
--    destino, marcadas origem='transferencia'; trg_saldo_movimentacao move
--    os saldos. Cancelamento (status='cancelado') remove o par — o gatilho
--    de saldo reverte os efeitos automaticamente.
CREATE OR REPLACE FUNCTION public.fn_transferencia_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    IF v_origem IS NULL OR v_destino IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_origem AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
       OR NOT EXISTS (
         SELECT 1 FROM contas_bancarias cb
         WHERE cb.id = v_destino AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
       )
    THEN
      RAISE EXCEPTION 'contas de origem/destino devem pertencer à mesma empresa da transferência';
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

    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_origem, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor, 'transferencia')
    RETURNING id INTO v_mov_saida_id;

    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_destino, 'entrada', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor, 'transferencia');

    UPDATE transferencias SET movimentacao_id = v_mov_saida_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status IN ('realizado', 'concluido') THEN
    DELETE FROM movimentacoes WHERE transferencia_id = NEW.id;
    UPDATE transferencias SET movimentacao_id = NULL WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transferencia_movimentacao ON public.transferencias;
CREATE TRIGGER trg_transferencia_movimentacao
  AFTER INSERT OR UPDATE ON public.transferencias
  FOR EACH ROW EXECUTE FUNCTION public.fn_transferencia_movimentacao();

-- 5) Backfill das transferências concluídas históricas: onde o trigger
--    antigo funcionava só a 'saida' foi gravada (destino nunca creditado);
--    onde estava quebrado o par inteiro falta. Insere o lado ausente por
--    transferência — o gatilho de saldo (seção 3) corrige saldo_atual ao
--    inserir. Idempotente pelo NOT EXISTS por (transferencia_id, tipo).
--    Cobre 'realizado' (CHECK canônico) e 'concluido' (estado de drift do
--    schema alternativo, onde a UI gravava esse status).
--    NOTA: se em prod existirem movimentações de transferência sem
--    transferencia_id que já afetaram o saldo, conferir antes de aplicar —
--    não há evidência inequívoca de pertencimento para adotá-las sem risco
--    de confundir movimentações manuais coincidentes.
DO $$
DECLARE
  v_expr text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_bancaria_id'
  ) THEN
    v_expr := 'COALESCE(t.conta_origem_id, t.conta_bancaria_id)';
  ELSE
    v_expr := 't.conta_origem_id';
  END IF;

  EXECUTE format(
    'INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, origem)
     SELECT t.empresa_id, %s, ''saida'', t.descricao, t.valor, t.data_transferencia, t.id, ''transferencia''
     FROM transferencias t
     WHERE t.status IN (''realizado'', ''concluido'')
       AND NOT EXISTS (
         SELECT 1 FROM movimentacoes m
         WHERE m.transferencia_id = t.id AND m.tipo = ''saida''
           -- linha excluída não conta como efeito aplicado: se o par foi
           -- estornado mas a transferência segue ''realizado'', recria
           AND m.deleted_at IS NULL
       )',
    v_expr
  );

  INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, origem)
  SELECT t.empresa_id, t.conta_destino_id, 'entrada', t.descricao, t.valor, t.data_transferencia, t.id, 'transferencia'
  FROM transferencias t
  WHERE t.status IN ('realizado', 'concluido')
    AND NOT EXISTS (
      SELECT 1 FROM movimentacoes m
      WHERE m.transferencia_id = t.id AND m.tipo = 'entrada'
        AND m.deleted_at IS NULL
    );
END $$;

-- 6) Lançamento contábil automático: exclui origem='transferencia' — o par
--    bilateral movimenta saldo entre bancos da mesma empresa, não é receita
--    nem despesa; sem a guarda cada transferência geraria D+C espúrios.
--    A função é recriada com o mesmo corpo da migration original +
--    early return; se o gatilho trigger_gerar_contabilidade existir no
--    banco, passa a usar este corpo.
CREATE OR REPLACE FUNCTION public.gerar_lancamento_contabil_automatico()
RETURNS TRIGGER AS $$
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

-- 7) Agregações de receita/despesa excluem transferências internas.
CREATE OR REPLACE FUNCTION obter_totais_movimentacoes(
  p_start date,
  p_end date,
  p_tipo text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (total_entradas numeric, total_saidas numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS total_entradas,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS total_saidas
  FROM movimentacoes
  WHERE deleted_at IS NULL
    AND origem IS DISTINCT FROM 'transferencia'
    AND data_movimentacao >= p_start
    AND data_movimentacao <= p_end
    AND (p_tipo IS NULL OR p_tipo = 'all' OR tipo = p_tipo)
    AND (p_search IS NULL OR p_search = '' OR descricao ILIKE '%' || p_search || '%');
$$;

COMMENT ON FUNCTION obter_totais_movimentacoes IS
  'Agregação server-side dos totais de Movimentações (Entradas/Saídas/Saldo). Exclui origem=transferencia: transferências internas movimentam saldo, não são receita/despesa. SECURITY INVOKER: respeita a RLS de movimentacoes por empresa.';
