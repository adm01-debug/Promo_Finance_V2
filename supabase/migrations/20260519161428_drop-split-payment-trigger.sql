-- Shim: remove trigger update_split_payment_transacoes_updated_at antes de 20260519161429
-- que tenta CREATE TRIGGER sem IF NOT EXISTS (42710)
-- trigger criado originalmente em 20260106105751
DROP TRIGGER IF EXISTS update_split_payment_transacoes_updated_at ON public.split_payment_transacoes;
