-- Os cards de Entradas/Saídas/Saldo em Movimentações somavam o array já
-- carregado no cliente (`useMovimentacoes`, safety cap de 5000 linhas) — em
-- empresas com mais movimentações que o cap no período, os totais mostrados
-- ficam errados. Move a soma para o banco, sobre o período inteiro,
-- respeitando a mesma RLS por empresa da tabela.
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
    AND data_movimentacao >= p_start
    AND data_movimentacao <= p_end
    AND (p_tipo IS NULL OR p_tipo = 'all' OR tipo = p_tipo)
    AND (p_search IS NULL OR p_search = '' OR descricao ILIKE '%' || p_search || '%');
$$;

COMMENT ON FUNCTION obter_totais_movimentacoes IS
  'Agregação server-side dos totais de Movimentações (Entradas/Saídas/Saldo) — evita que os cards fiquem errados quando o período tem mais linhas do que o safety cap do fetch client-side. SECURITY INVOKER: respeita a RLS de movimentacoes por empresa.'