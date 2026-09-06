-- Migration 20260904000500
-- PROBLEMA: reset_failed_attempts (20260904000300) tem GRANT EXECUTE para authenticated
--   mas nao verifica se o caller eh o proprio usuario. Qualquer sessao autenticada
--   pode passar _email arbitrario e zerar o lockout de outra conta.
-- FIX: recriar funcao com verificacao auth.email() — so permite resetar o proprio counter.
--   Excecao: service_role nao passa por auth.email() e continua tendo acesso irrestrito
--   via SECURITY DEFINER (a funcao roda como owner, e service_role bypassa RLS mas nao
--   a logica interna — portanto o check abaixo bloqueia service_role tambem, o que eh
--   correto para o hook post-login: o hook roda como anon/authenticated, nao service_role).
--   Para chamadas do servidor (N8N, Edge Functions com service_role), use a role postgres
--   diretamente ou adicione um parametro de bypass autenticado separadamente.

BEGIN;

CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_email text := lower(btrim(_email));
  v_caller text := lower(btrim(auth.email()));
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN;
  END IF;

  -- Apenas o proprio usuario pode resetar seu counter.
  -- auth.email() retorna NULL fora de contexto JWT (service_role, postgres direto):
  -- nesses casos bloqueia tambem — use supabase_db_query ou postgres role se necessario.
  IF v_caller IS NULL OR v_caller != v_email THEN
    RAISE EXCEPTION 'permission denied: can only reset own login attempts'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.login_attempts
     SET attempt_count = 0,
         success = true,
         last_attempt_at = now()
   WHERE lower(btrim(email)) = v_email;
END;
$function$;

-- Mantém o GRANT (autenticado precisa chamar no hook post-login),
-- mas agora a função verifica identidade internamente.
GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(text) TO authenticated;

COMMIT;
