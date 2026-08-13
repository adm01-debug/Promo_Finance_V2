-- Gate #33: remoção de índices redundantes (duplicatas de constraints únicas)
DROP INDEX IF EXISTS public.idx_catalogos_health_history_dia;
DROP INDEX IF EXISTS public.idx_proj_empresa;
DROP INDEX IF EXISTS public.idx_fechamentos_empresa_periodo;

CREATE OR REPLACE FUNCTION public.gate_33_indices_redundantes()
RETURNS TABLE(tabela text, indice_redundante text, indice_equivalente text, motivo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH idx AS (
    SELECT i.indrelid,
           i.indexrelid,
           i.indisunique,
           i.indisprimary,
           i.indkey::text  AS cols,
           i.indclass::text AS opclass,
           COALESCE(pg_get_expr(i.indexprs, i.indrelid), '') AS expr,
           COALESCE(pg_get_expr(i.indpred,   i.indrelid), '') AS pred,
           c.relname AS idxname,
           t.relname AS tblname
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
  )
  SELECT a.tblname::text,
         a.idxname::text,
         b.idxname::text,
         'mesmas colunas/opclass/predicado de um índice único ou anterior'::text
  FROM idx a
  JOIN idx b
    ON a.indrelid = b.indrelid
   AND a.cols = b.cols
   AND a.opclass = b.opclass
   AND a.expr = b.expr
   AND a.pred = b.pred
   AND a.indexrelid <> b.indexrelid
  WHERE NOT a.indisprimary
    AND NOT a.indisunique
    AND (b.indisunique OR b.indisprimary OR b.indexrelid < a.indexrelid)
$$;

REVOKE ALL ON FUNCTION public.gate_33_indices_redundantes() FROM PUBLIC, anon, authenticated;