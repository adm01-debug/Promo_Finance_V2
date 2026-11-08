ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conta_pagar_id uuid;
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS conta_receber_id uuid;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_pago numeric;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS data_pagamento date;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_recebido numeric;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS data_recebimento date;

CREATE OR REPLACE FUNCTION public.fn_sync_valor_pago_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC;
  v_valor_conta NUMERIC;
  v_cp_pairs UUID[][];
  v_cr_pairs UUID[][];
  v_pair UUID[];
  v_id UUID;
  v_emp UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_cp_pairs := ARRAY[[OLD.conta_pagar_id, OLD.empresa_id]];
    v_cr_pairs := ARRAY[[OLD.conta_receber_id, OLD.empresa_id]];
  ELSIF TG_OP = 'UPDATE' THEN
    v_cp_pairs := ARRAY[[OLD.conta_pagar_id, OLD.empresa_id], [NEW.conta_pagar_id, NEW.empresa_id]];
    v_cr_pairs := ARRAY[[OLD.conta_receber_id, OLD.empresa_id], [NEW.conta_receber_id, NEW.empresa_id]];
  ELSE
    v_cp_pairs := ARRAY[[NEW.conta_pagar_id, NEW.empresa_id]];
    v_cr_pairs := ARRAY[[NEW.conta_receber_id, NEW.empresa_id]];
  END IF;

  FOREACH v_pair SLICE 1 IN ARRAY v_cp_pairs LOOP
    v_id := v_pair[1];
    v_emp := v_pair[2];
    CONTINUE WHEN v_id IS NULL;
    IF NOT EXISTS (
      SELECT 1 FROM contas_pagar WHERE id = v_id AND empresa_id = v_emp
    ) THEN
      RAISE EXCEPTION 'movimentacao vinculada a conta_pagar de outra empresa (%)', v_emp;
    END IF;

    SELECT COALESCE(SUM(valor), 0) INTO v_total
    FROM movimentacoes WHERE conta_pagar_id = v_id AND deleted_at IS NULL;

    SELECT valor INTO v_valor_conta FROM contas_pagar WHERE id = v_id;

    UPDATE contas_pagar SET
      valor_pago = v_total,
      status = CASE
        WHEN v_total >= v_valor_conta THEN 'pago'
        WHEN v_total > 0 THEN 'parcial'
        ELSE 'pendente'
      END,
      data_pagamento = CASE WHEN v_total >= v_valor_conta THEN CURRENT_DATE ELSE NULL END
    WHERE id = v_id;
  END LOOP;

  FOREACH v_pair SLICE 1 IN ARRAY v_cr_pairs LOOP
    v_id := v_pair[1];
    v_emp := v_pair[2];
    CONTINUE WHEN v_id IS NULL;
    IF NOT EXISTS (
      SELECT 1 FROM contas_receber WHERE id = v_id AND empresa_id = v_emp
    ) THEN
      RAISE EXCEPTION 'movimentacao vinculada a conta_receber de outra empresa (%)', v_emp;
    END IF;

    SELECT COALESCE(SUM(valor), 0) INTO v_total
    FROM movimentacoes WHERE conta_receber_id = v_id AND deleted_at IS NULL;

    SELECT valor INTO v_valor_conta FROM contas_receber WHERE id = v_id;

    UPDATE contas_receber SET
      valor_recebido = v_total,
      status = CASE
        WHEN v_total >= v_valor_conta THEN 'pago'
        WHEN v_total > 0 THEN 'parcial'
        ELSE 'pendente'
      END,
      data_recebimento = CASE WHEN v_total >= v_valor_conta THEN CURRENT_DATE ELSE NULL END
    WHERE id = v_id;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_valor_pago ON public.movimentacoes;
CREATE TRIGGER trg_sync_valor_pago
  AFTER INSERT OR DELETE OR UPDATE OF deleted_at, conta_pagar_id, conta_receber_id
  ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION fn_sync_valor_pago_movimentacao();

DELETE FROM public.partidas_contabeis p
USING public.lancamentos_contabeis l
WHERE p.lancamento_id = l.id
  AND l.origem = 'financeiro_movimentacao'
  AND l.origem_id IS NOT NULL
  AND l.status = 'rascunho'
  AND COALESCE((
        SELECT SUM(CASE WHEN p2.tipo = 'D' THEN p2.valor ELSE -p2.valor END)
        FROM public.partidas_contabeis p2
        WHERE p2.lancamento_id = l.id
      ), 0) <> 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lancamentos_contabeis'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.lancamentos_contabeis ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;
