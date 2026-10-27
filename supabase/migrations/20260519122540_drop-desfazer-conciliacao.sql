-- Shim: remove desfazer_conciliacao antes de 20260519122543
-- que faz CREATE OR REPLACE renomeando parâmetros (42P13)
-- (função existe com (p_transacao_id UUID, p_user_id UUID); nova sig é (p_conciliacao_id, p_transacao_id))
DROP FUNCTION IF EXISTS public.desfazer_conciliacao(UUID, UUID);
