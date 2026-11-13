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
$function$
