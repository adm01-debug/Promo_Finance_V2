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
DECLARE
  r record;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- desfaz o efeito da linha antiga e reaplica o da nova
    IF OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    END IF;
    r := NEW;
  ELSIF TG_OP = 'DELETE' THEN
    r := OLD;
  ELSE
    r := NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id;
    END IF;
    RETURN OLD;
  END IF;

  IF r.tipo = 'entrada' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + r.valor
      WHERE id = r.conta_bancaria_id;
  ELSIF r.tipo = 'saida' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - r.valor
      WHERE id = r.conta_bancaria_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
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

  IF TG_OP = 'INSERT' AND NEW.status = 'realizado' THEN
    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_origem, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor, 'transferencia')
    RETURNING id INTO v_mov_saida_id;

    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_destino, 'entrada', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, v_autor, 'transferencia');

    UPDATE transferencias SET movimentacao_id = v_mov_saida_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status = 'realizado' THEN
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

-- 5) Backfill das transferências 'realizado' históricas: onde o trigger
--    antigo funcionava só a 'saida' foi gravada (destino nunca creditado);
--    onde estava quebrado o par inteiro falta. Insere o lado ausente por
--    transferência — o gatilho de saldo (seção 3) corrige saldo_atual ao
--    inserir. Idempotente pelo NOT EXISTS por (transferencia_id, tipo).
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
     WHERE t.status = ''realizado''
       AND NOT EXISTS (
         SELECT 1 FROM movimentacoes m
         WHERE m.transferencia_id = t.id AND m.tipo = ''saida''
       )',
    v_expr
  );

  INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, origem)
  SELECT t.empresa_id, t.conta_destino_id, 'entrada', t.descricao, t.valor, t.data_transferencia, t.id, 'transferencia'
  FROM transferencias t
  WHERE t.status = 'realizado'
    AND NOT EXISTS (
      SELECT 1 FROM movimentacoes m
      WHERE m.transferencia_id = t.id AND m.tipo = 'entrada'
    );
END $$;

-- 6) Agregações de receita/despesa excluem transferências internas.
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
