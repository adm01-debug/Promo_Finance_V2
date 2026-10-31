-- Migration: 20261031154800_obter_totais_movimentacoes.sql
-- Garante a função de totais usada pela página Movimentações (src/pages/Movimentacoes.tsx).
-- DROP necessário porque a versão anterior tinha signature de retorno diferente
-- (impossível trocar com CREATE OR REPLACE sem o DROP prévio).

DROP FUNCTION IF EXISTS public.obter_totais_movimentacoes(date, date, text, text);

CREATE OR REPLACE FUNCTION public.obter_totais_movimentacoes(
  p_start  date,
  p_end    date,
  p_tipo   text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE(
  total_entradas numeric,
  total_saidas   numeric,
  saldo          numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.valor ELSE 0 END), 0)::numeric                                AS total_entradas,
    COALESCE(SUM(CASE WHEN m.tipo = 'saida'   THEN m.valor ELSE 0 END), 0)::numeric                                AS total_saidas,
    COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.valor WHEN m.tipo = 'saida' THEN -m.valor ELSE 0 END), 0)::numeric AS saldo
  FROM movimentacoes m
  WHERE m.empresa_id IN (
          SELECT eu.empresa_id FROM empresa_usuarios eu WHERE eu.user_id = auth.uid()
        )
    AND m.data_movimentacao::date BETWEEN p_start AND p_end
    AND (p_tipo IS NULL OR p_tipo = 'all' OR m.tipo = p_tipo)
    AND (p_search IS NULL OR p_search = '' OR m.descricao ILIKE '%' || p_search || '%')
    AND m.deleted_at IS NULL;
END;
$fn$;