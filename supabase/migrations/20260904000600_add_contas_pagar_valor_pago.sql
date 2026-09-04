-- Migration 20260904000600
-- PROBLEMA: contas_pagar.valor_pago nao existe no schema base (001_create_tables.sql).
--   vw_fluxo_caixa (20260317001356) referencia essa coluna e falha no replay do CI Preview.
--   A correcao em 20260317000928 resolve o replay from-scratch, mas o Preview incremental
--   nao re-aplica migrations existentes alteradas — so aplica arquivos novos.
--   Esta migration cobre o caminho incremental com IF NOT EXISTS (idempotente no from-scratch).

ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0;

-- Recriar vw_fluxo_caixa agora que valor_pago existe (foi pulada em 20260317001356 no caminho incremental).
-- No replay from-scratch esta migration e no-op para a coluna; o CREATE OR REPLACE e idempotente.
CREATE OR REPLACE VIEW public.vw_fluxo_caixa AS
SELECT d.dia, COALESCE(r.valor,0) AS receitas_previstas, COALESCE(p.valor,0) AS despesas_previstas, COALESCE(r.valor,0)-COALESCE(p.valor,0) AS saldo_dia
FROM generate_series(CURRENT_DATE,CURRENT_DATE+INTERVAL '90 days','1 day') AS d(dia)
LEFT JOIN (SELECT data_vencimento AS dia, SUM(valor-COALESCE(valor_recebido,0)) AS valor FROM contas_receber WHERE status IN ('pendente','parcial') GROUP BY 1) r ON r.dia=d.dia
LEFT JOIN (SELECT data_vencimento AS dia, SUM(valor-COALESCE(valor_pago,0)) AS valor FROM contas_pagar WHERE status IN ('pendente','parcial') GROUP BY 1) p ON p.dia=d.dia;
