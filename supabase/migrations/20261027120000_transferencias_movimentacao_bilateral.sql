-- Transferências: coluna aditiva + movimentação bilateral sem inflar receita
--
-- Contexto (auditoria TS-02/TS-05/TS-07 + revisão):
-- 1) O schema versionado declara transferencias.conta_bancaria_id, mas o código
--    (TransferenciaDialog, useFinancialOperations) envia conta_origem_id — a
--    coluna foi renomeada em produção fora do git (era Lovable).
-- 2) fn_transferencia_movimentacao referencia NEW.conta_bancaria_id: em bancos
--    já renomeados quebra todo INSERT com status='realizado'; onde funciona,
--    cria só a 'saida' (origem) — o destino nunca recebe a 'entrada' e o saldo
--    não sobe.
-- 3) Retrocompatibilidade (AI_RULES): nada de RENAME — a coluna canônica é
--    ADICIONADA e preenchida a partir da legada quando ela existe; a legada fica
--    para remoção em migration posterior, após migrar os consumidores.
-- 4) Os lançamentos usam origem='transferencia' e as agregações de
--    receita/despesa os excluem — transferência interna movimenta saldo, não é
--    receita nem despesa da empresa.
--
-- Idempotente e defensiva aos dois estados possíveis de produção.

-- 1) Coluna canônica aditiva (o legado conta_bancaria_id permanece — deprecated)
ALTER TABLE public.transferencias
  ADD COLUMN IF NOT EXISTS conta_origem_id UUID REFERENCES public.contas_bancarias(id);

DO $$
BEGIN
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

-- 2) Trigger bilateral: 'saida' na origem + 'entrada' no destino, marcadas
--    origem='transferencia'. trg_saldo_movimentacao move os saldos; o
--    cancelamento (status='cancelado') limpa o par via transferencia_id.
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
BEGIN
  -- conta_origem_id existe sempre pós-migration; o nome legado é lido via
  -- to_jsonb para não quebrar quando a coluna já não existe no banco.
  v_origem := COALESCE(
    NEW.conta_origem_id,
    (to_jsonb(NEW) ->> 'conta_bancaria_id')::uuid
  );
  v_destino := NEW.conta_destino_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'realizado' THEN
    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_origem, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, NEW.created_by, 'transferencia')
    RETURNING id INTO v_mov_saida_id;

    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, v_destino, 'entrada', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, NEW.created_by, 'transferencia');

    UPDATE transferencias SET movimentacao_id = v_mov_saida_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status = 'realizado' THEN
    DELETE FROM movimentacoes WHERE transferencia_id = NEW.id;
    UPDATE transferencias SET movimentacao_id = NULL WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- trg_transferencia_movimentacao já existe (migration 20260317000928) e aponta
-- para esta função — CREATE OR REPLACE basta, sem recriar o trigger.

-- 3) Agregações de receita/despesa excluem transferências internas.
--    Movimentações com origem='transferencia' movimentam saldo entre contas
--    próprias — não são entrada/saída de caixa da empresa.
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
