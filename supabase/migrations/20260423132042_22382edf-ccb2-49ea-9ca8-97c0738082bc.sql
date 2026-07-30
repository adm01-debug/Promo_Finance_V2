-- Revoga automaticamente assinaturas (saved_filter_subscriptions) cujo dono
-- perdeu acesso ao filtro associado. Acionado quando:
--   1. Um saved_filter é UPDATE/DELETE (ex.: vira privado, troca de empresa,
--      remove um role da lista shared_with_roles, ou é apagado).
--   2. Um vínculo user_empresas é UPDATE/DELETE (ex.: usuário desativado,
--      role do usuário muda de modo a perder cobertura no shared_with_roles).
--
-- Defesa em profundidade: mesmo que a UI demore a recarregar, o backend
-- garante que o realtime não tenha mais subscription a processar para
-- usuários sem permissão. Falhas no cleanup nunca bloqueiam a operação
-- principal.

CREATE OR REPLACE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_filter_id uuid;
  v_user_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'saved_filters' THEN
    -- Em DELETE de filtro, ON DELETE CASCADE já cuida; mantemos por segurança.
    v_filter_id := COALESCE(NEW.id, OLD.id);
    DELETE FROM public.saved_filter_subscriptions s
    WHERE s.saved_filter_id = v_filter_id
      AND NOT public.can_access_saved_filter(s.saved_filter_id, s.user_id);
  ELSIF TG_TABLE_NAME = 'user_empresas' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    -- Limpa todas as assinaturas do usuário em filtros que ele perdeu acesso.
    DELETE FROM public.saved_filter_subscriptions s
    WHERE s.user_id = v_user_id
      AND NOT public.can_access_saved_filter(s.saved_filter_id, s.user_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Cleanup é best-effort: nunca bloqueia o write principal.
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_orphan_subs_on_saved_filter ON public.saved_filters;
CREATE TRIGGER trg_revoke_orphan_subs_on_saved_filter
  AFTER UPDATE OR DELETE ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions();

DROP TRIGGER IF EXISTS trg_revoke_orphan_subs_on_user_empresas ON public.user_empresas;
CREATE TRIGGER trg_revoke_orphan_subs_on_user_empresas
  AFTER UPDATE OR DELETE ON public.user_empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions();

COMMENT ON FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions() IS
'Remove automaticamente assinaturas de filtros salvos que perderam acesso (mudança em shared_with_roles/empresa_id, exclusão do filtro, ou desativação/troca de role do usuário no tenant). Garante que realtime nunca dispare alertas para usuários sem permissão.';