
-- =====================================================
-- MIGRAÇÃO 4: Colunas GENERATED + Triggers Core
-- =====================================================

-- ==================== COLUNAS GENERATED ====================

-- contas_pagar: vencimento (alias de data_vencimento)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS vencimento DATE GENERATED ALWAYS AS (data_vencimento) STORED;

-- contas_pagar: parcela_atual (alias de numero_parcela_atual)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS parcela_atual INTEGER GENERATED ALWAYS AS (numero_parcela_atual) STORED;

-- contas_pagar: valor_final (calculado)
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_final NUMERIC GENERATED ALWAYS AS (COALESCE(valor_original, valor) - COALESCE(valor_desconto, 0) + COALESCE(valor_juros, 0) + COALESCE(valor_multa, 0)) STORED;

-- contas_receber: vencimento (alias)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS vencimento DATE GENERATED ALWAYS AS (data_vencimento) STORED;

-- contas_receber: parcela_atual (alias)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS parcela_atual INTEGER GENERATED ALWAYS AS (numero_parcela_atual) STORED;

-- contas_receber: valor_pago (alias de valor_recebido)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_pago NUMERIC GENERATED ALWAYS AS (COALESCE(valor_recebido, 0)) STORED;

-- contas_receber: valor_final (calculado)
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS valor_final NUMERIC GENERATED ALWAYS AS (COALESCE(valor_original, valor) - COALESCE(valor_desconto, 0) + COALESCE(valor_juros, 0) + COALESCE(valor_multa, 0)) STORED;

-- fornecedores: nome (COALESCE)
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome TEXT GENERATED ALWAYS AS (COALESCE(nome_fantasia, razao_social)) STORED;

-- conciliacoes: diferenca
ALTER TABLE public.conciliacoes ADD COLUMN IF NOT EXISTS diferenca NUMERIC GENERATED ALWAYS AS (saldo_banco - saldo_sistema) STORED;

-- ==================== TRIGGER: Sync Valor CP ====================
CREATE OR REPLACE FUNCTION public.fn_sync_valor_cp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se valor foi definido mas valor_original não, copiar
  IF NEW.valor IS NOT NULL AND NEW.valor_original IS NULL THEN
    NEW.valor_original := NEW.valor;
  END IF;
  -- Se valor_original foi definido mas valor não, copiar
  IF NEW.valor_original IS NOT NULL AND NEW.valor IS NULL THEN
    NEW.valor := NEW.valor_original;
  END IF;
  -- Em UPDATE, sincronizar bidirecionalmente
  IF TG_OP = 'UPDATE' THEN
    IF NEW.valor IS DISTINCT FROM OLD.valor AND NEW.valor_original IS NOT DISTINCT FROM OLD.valor_original THEN
      NEW.valor_original := NEW.valor;
    ELSIF NEW.valor_original IS DISTINCT FROM OLD.valor_original AND NEW.valor IS NOT DISTINCT FROM OLD.valor THEN
      NEW.valor := NEW.valor_original;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_valor_cp
  BEFORE INSERT OR UPDATE ON public.contas_pagar
  FOR EACH ROW EXECUTE FUNCTION fn_sync_valor_cp();

-- ==================== TRIGGER: Sync Valor CR ====================
CREATE OR REPLACE FUNCTION public.fn_sync_valor_cr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.valor IS NOT NULL AND NEW.valor_original IS NULL THEN
    NEW.valor_original := NEW.valor;
  END IF;
  IF NEW.valor_original IS NOT NULL AND NEW.valor IS NULL THEN
    NEW.valor := NEW.valor_original;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.valor IS DISTINCT FROM OLD.valor AND NEW.valor_original IS NOT DISTINCT FROM OLD.valor_original THEN
      NEW.valor_original := NEW.valor;
    ELSIF NEW.valor_original IS DISTINCT FROM OLD.valor_original AND NEW.valor IS NOT DISTINCT FROM OLD.valor THEN
      NEW.valor := NEW.valor_original;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_valor_cr
  BEFORE INSERT OR UPDATE ON public.contas_receber
  FOR EACH ROW EXECUTE FUNCTION fn_sync_valor_cr();

-- ==================== TRIGGER: Saldo (movimentacoes) ====================
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + NEW.valor WHERE id = NEW.conta_bancaria_id;
    ELSIF NEW.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - NEW.valor WHERE id = NEW.conta_bancaria_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - OLD.valor WHERE id = OLD.conta_bancaria_id;
    ELSIF OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + OLD.valor WHERE id = OLD.conta_bancaria_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_saldo_movimentacao
  AFTER INSERT OR DELETE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_saldo_movimentacao();

-- ==================== TRIGGER: Auto-Sync Valor Pago/Recebido ====================
CREATE OR REPLACE FUNCTION public.fn_sync_valor_pago_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC;
  v_valor_conta NUMERIC;
BEGIN
  -- Atualizar valor_pago em contas_pagar
  IF (TG_OP = 'INSERT' AND NEW.conta_pagar_id IS NOT NULL) OR
     (TG_OP = 'DELETE' AND OLD.conta_pagar_id IS NOT NULL) THEN
    DECLARE
      v_cp_id UUID := COALESCE(NEW.conta_pagar_id, OLD.conta_pagar_id);
    BEGIN
      SELECT COALESCE(SUM(valor), 0) INTO v_total
      FROM movimentacoes WHERE conta_pagar_id = v_cp_id AND deleted_at IS NULL;

      SELECT valor INTO v_valor_conta FROM contas_pagar WHERE id = v_cp_id;

      UPDATE contas_pagar SET
        valor_pago = v_total,
        status = CASE
          WHEN v_total >= v_valor_conta THEN 'pago'::status_pagamento
          WHEN v_total > 0 THEN 'parcial'::status_pagamento
          ELSE 'pendente'::status_pagamento
        END,
        data_pagamento = CASE WHEN v_total >= v_valor_conta THEN CURRENT_DATE ELSE NULL END
      WHERE id = v_cp_id;
    END;
  END IF;

  -- Atualizar valor_recebido em contas_receber
  IF (TG_OP = 'INSERT' AND NEW.conta_receber_id IS NOT NULL) OR
     (TG_OP = 'DELETE' AND OLD.conta_receber_id IS NOT NULL) THEN
    DECLARE
      v_cr_id UUID := COALESCE(NEW.conta_receber_id, OLD.conta_receber_id);
    BEGIN
      SELECT COALESCE(SUM(valor), 0) INTO v_total
      FROM movimentacoes WHERE conta_receber_id = v_cr_id AND deleted_at IS NULL;

      SELECT valor INTO v_valor_conta FROM contas_receber WHERE id = v_cr_id;

      UPDATE contas_receber SET
        valor_recebido = v_total,
        status = CASE
          WHEN v_total >= v_valor_conta THEN 'pago'::status_pagamento
          WHEN v_total > 0 THEN 'parcial'::status_pagamento
          ELSE 'pendente'::status_pagamento
        END,
        data_recebimento = CASE WHEN v_total >= v_valor_conta THEN CURRENT_DATE ELSE NULL END
      WHERE id = v_cr_id;
    END;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_valor_pago
  AFTER INSERT OR DELETE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION fn_sync_valor_pago_movimentacao();

-- ==================== TRIGGER: Transferências → Movimentação ====================
CREATE OR REPLACE FUNCTION public.fn_transferencia_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mov_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'realizado' THEN
    INSERT INTO movimentacoes (empresa_id, conta_bancaria_id, tipo, descricao, valor, data_movimentacao, transferencia_id, created_by, origem)
    VALUES (NEW.empresa_id, NEW.conta_bancaria_id, 'saida', NEW.descricao, NEW.valor, NEW.data_transferencia, NEW.id, NEW.created_by, 'transferencia')
    RETURNING id INTO v_mov_id;

    UPDATE transferencias SET movimentacao_id = v_mov_id WHERE id = NEW.id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelado' AND OLD.status = 'realizado' THEN
    DELETE FROM movimentacoes WHERE transferencia_id = NEW.id;
    UPDATE transferencias SET movimentacao_id = NULL WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transferencia_movimentacao
  AFTER INSERT OR UPDATE ON public.transferencias
  FOR EACH ROW EXECUTE FUNCTION fn_transferencia_movimentacao();

-- ==================== TRIGGER: Auditoria Financeira ====================
CREATE OR REPLACE FUNCTION public.fn_auditoria_financeira()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO auditoria_financeira (tabela, operacao, registro_id, dados_antigos, dados_novos, user_id)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Auditoria nas 6 tabelas core
CREATE TRIGGER trg_auditoria_contas_pagar AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_contas_receber AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_contas_bancarias AFTER INSERT OR UPDATE OR DELETE ON public.contas_bancarias FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_contatos_financeiros AFTER INSERT OR UPDATE OR DELETE ON public.contatos_financeiros FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_movimentacoes AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
CREATE TRIGGER trg_auditoria_transferencias AFTER INSERT OR UPDATE OR DELETE ON public.transferencias FOR EACH ROW EXECUTE FUNCTION fn_auditoria_financeira();
