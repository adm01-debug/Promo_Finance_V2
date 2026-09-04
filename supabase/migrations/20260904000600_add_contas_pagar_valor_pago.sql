-- Migration 20260904000600
-- PROBLEMA: contas_pagar.valor_pago nao existe no schema base (001_create_tables.sql).
--   vw_fluxo_caixa (20260317001356) referencia essa coluna e falha no replay do CI Preview.
--   A correcao em 20260317000928 resolve o replay from-scratch, mas o Preview incremental
--   nao re-aplica migrations existentes alteradas — so aplica arquivos novos.
--   Esta migration cobre o caminho incremental com IF NOT EXISTS (idempotente no from-scratch).

ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0;
