-- Shim: remove confirmar_conciliacao antes de 20260519122543
-- que faz CREATE OR REPLACE renomeando parâmetro -> p_transacao_id (42P13)
DROP FUNCTION IF EXISTS public.confirmar_conciliacao(UUID, UUID, UUID);
