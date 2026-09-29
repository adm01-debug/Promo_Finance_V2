-- Shim: remove views antes de 20260518190710
-- que faz CREATE OR REPLACE VIEW mudando colunas (42P16)
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
