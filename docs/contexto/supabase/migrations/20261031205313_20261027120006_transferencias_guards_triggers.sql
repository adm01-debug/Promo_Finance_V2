DROP FUNCTION IF EXISTS obter_totais_movimentacoes(date, date, text, text);

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
  'Agregação server-side dos totais de Movimentações (Entradas/Saídas/Saldo). Exclui origem=transferencia: transferências internas movimentam saldo, não são receita/despesa. origem=transferencia_externa é contada normalmente (saída real a favorecido externo). SECURITY INVOKER: respeita a RLS de movimentacoes por empresa.';

CREATE OR REPLACE FUNCTION public.fn_movimentacao_origem_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'UPDATE' AND OLD.transferencia_id IS NOT NULL THEN
      NEW.origem := OLD.origem;
      NEW.transferencia_id := OLD.transferencia_id;
    ELSIF TG_OP IN ('INSERT', 'UPDATE') AND NEW.transferencia_id IS NOT NULL THEN
      NEW.transferencia_id := NULL;
    END IF;
    IF NEW.origem IN ('transferencia', 'transferencia_externa')
       AND (TG_OP = 'INSERT' OR OLD.transferencia_id IS NULL) THEN
      NEW.origem := 'manual';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_movimentacao_origem_guard ON public.movimentacoes;
CREATE TRIGGER trg_movimentacao_origem_guard
  BEFORE INSERT OR UPDATE OF origem, transferencia_id ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_movimentacao_origem_guard();

CREATE OR REPLACE FUNCTION public.fn_lancamento_estorno_marker()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND current_user IN ('authenticated', 'anon')
     AND position('[estornado pela exclusão da movimentação]' in NEW.historico) > 0
  THEN
    NEW.historico := replace(NEW.historico, ' [estornado pela exclusão da movimentação]', '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lancamento_estorno_marker ON public.lancamentos_contabeis;
CREATE TRIGGER trg_lancamento_estorno_marker
  BEFORE UPDATE OF status ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.fn_lancamento_estorno_marker();
