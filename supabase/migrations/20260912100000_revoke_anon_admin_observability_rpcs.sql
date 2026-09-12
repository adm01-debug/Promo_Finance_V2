-- Corrige uma lacuna de ACL detectada no banco canônico: migrations de
-- reconciliação recriaram estas RPCs SECURITY DEFINER após o revoke global.
-- Ambas preservam uso pelo painel administrativo porque validam `has_role`
-- no corpo, mas não podem ficar visíveis para anon/PUBLIC.
--
-- A migration é idempotente e não altera dados, definição de função ou schema.

DO $$
BEGIN
  IF to_regprocedure('public.get_acessos_suspeitos(integer,boolean)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_acessos_suspeitos(integer, boolean) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.get_acessos_suspeitos(integer, boolean) TO authenticated, service_role;
  END IF;

  IF to_regprocedure('public.get_integrity_alerts(integer,boolean)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_integrity_alerts(integer, boolean) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.get_integrity_alerts(integer, boolean) TO authenticated, service_role;
  END IF;
END;
$$;
