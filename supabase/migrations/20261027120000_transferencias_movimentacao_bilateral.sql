-- Transferências: movimentação bilateral + alinhamento de coluna (drift)
--
-- Contexto (auditoria TS-05/TS-02/TS-07): o schema versionado declara
-- transferencias.conta_bancaria_id, mas o código (TransferenciaDialog,
-- useFinancialOperations) envia conta_origem_id — a coluna foi renomeada
-- em produção fora do git (era Lovable). O trigger fn_transferencia_movimentacao
-- referencia NEW.conta_bancaria_id: em bancos já renomeados ele quebra todo
-- INSERT com status='realizado'; em bancos ainda não renomeados ele cria apenas
-- a movimentação de 'saida' (origem) — nunca a 'entrada' (destino), então o
-- saldo do destino não sobe (trg_saldo_movimentacao só reage a entrada/saida
-- em movimentacoes).
--
-- Esta migration é defensiva: cobre os dois estados possíveis de produção e é
-- idempotente.

-- 1) Alinha a coluna: se o banco ainda tem conta_bancaria_id e não tem
--    conta_origem_id, renomeia. Se já tem conta_origem_id, não faz nada.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_bancaria_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transferencias'
      AND column_name = 'conta_origem_id'
  ) THEN
    ALTER TABLE public.transferencias RENAME COLUMN conta_bancaria_id TO conta_origem_id;
  END IF;
END $$;

-- 2) Recria o trigger com a coluna canônica e o par bilateral de movimentações:
--    'saida' na origem + 'entrada' no destino. O DELETE por transferencia_id no
--    cancelamento já limpa as duas linhas.
CREATE OR REPLACE FUNCTION public.fn_transferencia_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mov_saida_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'realizado' THEN
    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, NEW.conta_origem_id, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, NEW.created_by, 'transferencia')
    RETURNING id INTO v_mov_saida_id;

    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, NEW.conta_destino_id, 'entrada', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, NEW.created_by, 'transferencia');

    UPDATE transferencias SET movimentacao_id = v_mov_saida_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status = 'realizado' THEN
    DELETE FROM movimentacoes WHERE transferencia_id = NEW.id;
    UPDATE transferencias SET movimentacao_id = NULL WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- O trigger trg_transferencia_movimentacao já existe (migration 20260317000928)
-- e aponta para esta função — CREATE OR REPLACE basta, sem recriar o trigger.
