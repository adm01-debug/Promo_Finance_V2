-- Migration 20260903000500
-- PROBLEMA: desfazer_conciliacao(p_conciliacao_id, p_transacao_id, p_user_id)
-- é SECURITY DEFINER e aceita p_user_id como parâmetro mas NUNCA o usa.
-- O DELETE é executado sem verificar se o chamador é dono da conciliação.
-- Qualquer usuário autenticado que conheça o UUID de uma conciliação pode apagá-la.
-- FIX: usar auth.uid() internamente, verificar propriedade (user_id = auth.uid())
-- e empresa_acessivel() antes de deletar.

BEGIN;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
  p_conciliacao_id uuid,
  p_transacao_id   uuid DEFAULT NULL::uuid,
  p_user_id        uuid DEFAULT NULL::uuid  -- mantido por compat; ignorado (usa auth.uid())
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_uid         uuid := (SELECT auth.uid());
  v_user_id     uuid;
  v_empresa_id  uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, empresa_id
    INTO v_user_id, v_empresa_id
    FROM public.conciliacoes
    WHERE id = p_conciliacao_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'conciliacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'forbidden: conciliacao pertence a outro usuário' USING ERRCODE = '42501';
  END IF;

  IF v_empresa_id IS NOT NULL AND NOT public.empresa_acessivel(v_empresa_id) THEN
    RAISE EXCEPTION 'forbidden: empresa inacessível' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.conciliacoes WHERE id = p_conciliacao_id;

  IF p_transacao_id IS NOT NULL THEN
    UPDATE public.transacoes_bancarias SET status = 'pendente' WHERE id = p_transacao_id;
  END IF;
END;
$$;

COMMIT;
