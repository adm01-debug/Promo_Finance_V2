-- Migration 20260903001300
-- PROBLEMA: get_lockout_details foi revogado de anon (001200) para eliminar o oracle de
-- enumeração, mas handleSignIn descartava o erro e continuava para signInWithPassword —
-- bloqueio por lockout ficava sem efeito quando anon não tinha EXECUTE.
-- FIX: criar is_user_locked(email) SECURITY DEFINER que retorna apenas boolean.
-- Retorna FALSE para email inexistente (sem confirmar cadastro), TRUE apenas quando
-- o registro de lockout indica is_locked=true (conta com lockouts anteriores).
-- Expõe zero contadores ou durações; oracle residual mínimo.
-- handleSignIn passa a chamar is_user_locked e exibe mensagem genérica.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_user_locked(_email text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_locked boolean := false;
BEGIN
  SELECT COALESCE(is_locked, false) INTO v_locked
  FROM public.get_lockout_details(_email)
  LIMIT 1;
  RETURN COALESCE(v_locked, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.is_user_locked(text) TO anon, authenticated;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260903001300',
  'add_is_user_locked_function',
  ARRAY[
    'CREATE OR REPLACE FUNCTION public.is_user_locked(_email text) RETURNS boolean SECURITY DEFINER — boolean wrapper sobre get_lockout_details; sem contadores/duração; concedido a anon',
    'GRANT EXECUTE ON FUNCTION public.is_user_locked(text) TO anon, authenticated'
  ]
)
ON CONFLICT (version) DO NOTHING;
