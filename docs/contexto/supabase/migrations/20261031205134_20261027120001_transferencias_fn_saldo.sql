DO $cria_fn_saldo$
DECLARE
  v_corte text;
BEGIN
  SELECT obj_description(to_regprocedure('public.fn_saldo_movimentacao()')::oid, 'pg_proc')
    INTO v_corte;
  IF v_corte IS NULL OR v_corte !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN
    v_corte := statement_timestamp()::text;
  END IF;
  EXECUTE format($f$
CREATE OR REPLACE FUNCTION public.fn_saldo_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $body$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE')
     AND NEW.conta_bancaria_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM contas_bancarias cb
       WHERE cb.id = NEW.conta_bancaria_id
         AND cb.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
     )
  THEN
    RAISE EXCEPTION 'conta_bancaria_id deve pertencer à mesma empresa da movimentação';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (OLD.deleted_at IS NULL OR OLD.deleted_at < %L::timestamptz) AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF (OLD.deleted_at IS NULL OR OLD.deleted_at < %L::timestamptz) AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    END IF;
    IF (NEW.deleted_at IS NULL OR NEW.deleted_at < %L::timestamptz) AND NEW.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
        WHERE id = NEW.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
    ELSIF (NEW.deleted_at IS NULL OR NEW.deleted_at < %L::timestamptz) AND NEW.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
        WHERE id = NEW.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
    END IF;
    IF NEW.deleted_at IS NOT NULL
       AND (OLD.deleted_at IS NULL OR OLD.deleted_at < %L::timestamptz) THEN
      UPDATE public.lancamentos_contabeis
         SET status = 'cancelado',
             historico = historico || ' [estornado pela exclusão da movimentação]'
       WHERE origem = 'financeiro_movimentacao'
         AND origem_id = NEW.id
         AND status = 'confirmado';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE public.lancamentos_contabeis
         SET status = 'confirmado',
             historico = replace(historico, ' [estornado pela exclusão da movimentação]', '')
       WHERE origem = 'financeiro_movimentacao'
         AND origem_id = NEW.id
         AND status = 'cancelado'
         AND historico LIKE '%%[estornado pela exclusão da movimentação]%%';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF (OLD.deleted_at IS NULL OR OLD.deleted_at < %L::timestamptz) AND OLD.tipo = 'entrada' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    ELSIF (OLD.deleted_at IS NULL OR OLD.deleted_at < %L::timestamptz) AND OLD.tipo = 'saida' THEN
      UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + OLD.valor
        WHERE id = OLD.conta_bancaria_id
          AND empresa_id IS NOT DISTINCT FROM OLD.empresa_id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.deleted_at IS NULL AND NEW.tipo = 'entrada' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) + NEW.valor
      WHERE id = NEW.conta_bancaria_id
        AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
  ELSIF NEW.deleted_at IS NULL AND NEW.tipo = 'saida' THEN
    UPDATE contas_bancarias SET saldo_atual = COALESCE(saldo_atual, 0) - NEW.valor
      WHERE id = NEW.conta_bancaria_id
        AND empresa_id IS NOT DISTINCT FROM NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$body$;
  $f$, v_corte, v_corte, v_corte, v_corte, v_corte, v_corte, v_corte);
  EXECUTE format('COMMENT ON FUNCTION public.fn_saldo_movimentacao() IS %L', v_corte);
END
$cria_fn_saldo$;

DROP TRIGGER IF EXISTS trg_saldo_movimentacao ON public.movimentacoes;
CREATE TRIGGER trg_saldo_movimentacao
  AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_saldo_movimentacao();
